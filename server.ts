import express from 'express';
import webpush from 'web-push';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool, testDbConnection, initDbSchema } from './db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for Vercel production frontend and local development
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// VAPID configuration for Web Push
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BKp4aK0SDXmNQVfYHml9Wf8JtWzvAXw5VGqsKbW809egLXtn1cjhDEXhnso1fvUipWecrI6sYZ_-kxUe7hYiTaU';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'WT7RTzas1NfuIuwriLAaFsZz9UDhxN-WGx_DndW9fZk';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@maayyafoods.com';

const isVapidConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (isVapidConfigured) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (err) {
    console.error('Error initializing webpush VAPID details:', err);
  }
}

// In-memory fallback subscriptions store if DB not yet connected
interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo?: string;
  subscribedAt: string;
}
let memorySubscriptions: PushSubscriptionRecord[] = [];

// ==========================================
// 1. Health & Database Status
// ==========================================
app.get('/api/health', async (_req, res) => {
  const dbStatus = await testDbConnection();
  res.json({
    status: 'ok',
    service: 'Maayya Future Foods Backend',
    developer: 'MSR Solutions',
    timestamp: new Date().toISOString(),
    owner: 'Kalai',
    terminalDesk: 'TERMINAL-01 (Main POS)',
    database: {
      connected: dbStatus.connected,
      configured: Boolean(process.env.DATABASE_URL),
      version: dbStatus.version || null,
      error: dbStatus.error ? 'Database connection pending or unreachable' : null,
    },
  });
});

// ==========================================
// 2. Web Push Notification Engine
// ==========================================
app.get('/api/push/vapid-public-key', (_req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    res.status(500).json({
      error: 'VAPID public key is not configured on the Render backend server.',
      configured: false,
    });
    return;
  }
  res.json({
    publicKey: VAPID_PUBLIC_KEY,
    configured: true,
  });
});

app.get('/api/push/status', async (_req, res) => {
  let activeCount = memorySubscriptions.length;
  if (process.env.DATABASE_URL) {
    try {
      const dbRes = await pool.query('SELECT COUNT(*) as count FROM push_subscriptions;');
      activeCount = parseInt(dbRes.rows[0]?.count || '0', 10);
    } catch (_) {}
  }

  res.json({
    activeSubscriptions: activeCount,
    vapidConfigured: isVapidConfigured,
    subject: VAPID_SUBJECT,
    backendStatus: 'healthy',
  });
});

app.post('/api/push/subscribe', async (req, res) => {
  const { subscription, deviceInfo } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    res.status(400).json({ error: 'Invalid push subscription object provided.' });
    return;
  }

  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys.p256dh;
  const auth = subscription.keys.auth;
  const devInfo = deviceInfo || 'Mobile/Desktop Browser';

  if (process.env.DATABASE_URL) {
    try {
      await pool.query(
        `INSERT INTO push_subscriptions (endpoint, p256dh, auth, device_info, subscribed_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (endpoint) DO UPDATE
         SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, device_info = EXCLUDED.device_info, subscribed_at = NOW();`,
        [endpoint, p256dh, auth, devInfo]
      );
    } catch (dbErr) {
      console.warn('Could not persist subscription to PostgreSQL, using memory:', dbErr);
    }
  }

  memorySubscriptions = memorySubscriptions.filter((s) => s.endpoint !== endpoint);
  memorySubscriptions.push({
    ...subscription,
    deviceInfo: devInfo,
    subscribedAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Subscription successfully registered on backend.',
  });
});

app.post('/api/push/unsubscribe', async (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    if (process.env.DATABASE_URL) {
      try {
        await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1;', [endpoint]);
      } catch (_) {}
    }
    memorySubscriptions = memorySubscriptions.filter((s) => s.endpoint !== endpoint);
  }
  res.json({ success: true });
});

app.post('/api/push/send-test', async (req, res) => {
  const { title, body, url, tag, category, preferences } = req.body || {};

  if (category && preferences && preferences[category] === false) {
    res.status(200).json({
      success: false,
      suppressed: true,
      message: `Push notification suppressed: '${category}' alerts are disabled in user preferences.`,
      delivered: 0,
    });
    return;
  }

  const payload = JSON.stringify({
    title: title || 'Maayya Future Foods Alert',
    body: body || 'Test push notification delivered successfully from MSR Solutions engine.',
    url: url || '/',
    tag: tag || 'maayya-test-alert',
  });

  let targetSubs: PushSubscriptionRecord[] = [];
  if (process.env.DATABASE_URL) {
    try {
      const dbSubs = await pool.query('SELECT endpoint, p256dh, auth FROM push_subscriptions;');
      targetSubs = dbSubs.rows.map((r: any) => ({
        endpoint: r.endpoint,
        keys: { p256dh: r.p256dh, auth: r.auth },
        subscribedAt: '',
      }));
    } catch (_) {}
  }
  if (targetSubs.length === 0) {
    targetSubs = memorySubscriptions;
  }

  if (targetSubs.length === 0) {
    res.status(200).json({
      success: false,
      message: 'No active device push subscriptions registered yet. Please click "Enable Browser Push" on your device first.',
      delivered: 0,
      total: 0,
    });
    return;
  }

  let deliveredCount = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of targetSubs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload
      );
      deliveredCount++;
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        expiredEndpoints.push(sub.endpoint);
      }
    }
  }

  if (expiredEndpoints.length > 0 && process.env.DATABASE_URL) {
    try {
      await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ANY($1);', [expiredEndpoints]);
    } catch (_) {}
    memorySubscriptions = memorySubscriptions.filter((s) => !expiredEndpoints.includes(s.endpoint));
  }

  res.json({
    success: true,
    delivered: deliveredCount,
    total: targetSubs.length,
    message: `Push notification delivered to ${deliveredCount} registered device(s).`,
  });
});

// ==========================================
// 3. Security PIN Verification Engine
// ==========================================
const OWNER_SECURITY_PIN = process.env.OWNER_SECURITY_PIN || '1911';
const PIN_SALT = process.env.PIN_SALT || 'maayya-future-foods-msr-2026';
const HASHED_OWNER_PIN = crypto
  .createHash('sha256')
  .update(`${OWNER_SECURITY_PIN}:${PIN_SALT}`)
  .digest('hex');

interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
}
const pinRateLimitMap = new Map<string, RateLimitRecord>();

app.post('/api/auth/verify-pin', (req, res) => {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'anonymous';
  const now = Date.now();

  const clientLimit = pinRateLimitMap.get(ip) || { attempts: 0, blockedUntil: 0 };

  if (clientLimit.blockedUntil > now) {
    const remainingSecs = Math.ceil((clientLimit.blockedUntil - now) / 1000);
    res.status(429).json({
      success: false,
      error: `Too many failed attempts. Security terminal locked. Please wait ${remainingSecs} seconds.`,
      blockedSeconds: remainingSecs,
    });
    return;
  }

  const { pin } = req.body || {};
  if (!pin || typeof pin !== 'string') {
    res.status(400).json({ success: false, error: 'PIN must be a valid non-empty string.' });
    return;
  }

  const submittedHash = crypto
    .createHash('sha256')
    .update(`${pin.trim()}:${PIN_SALT}`)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(submittedHash, 'utf8'),
    Buffer.from(HASHED_OWNER_PIN, 'utf8')
  );

  if (isValid) {
    pinRateLimitMap.delete(ip);
    res.json({
      success: true,
      message: 'Security PIN verified successfully. Workspace unlocked.',
      owner: 'Kalai',
      role: 'Owner',
      terminalDesk: 'TERMINAL-01 (Main POS)',
    });
    return;
  }

  clientLimit.attempts += 1;
  if (clientLimit.attempts >= 5) {
    clientLimit.blockedUntil = now + 60 * 1000;
    pinRateLimitMap.set(ip, clientLimit);
    res.status(429).json({
      success: false,
      error: 'Security alert: 5 consecutive failed attempts. Terminal locked for 60 seconds.',
      blockedSeconds: 60,
    });
    return;
  }

  pinRateLimitMap.set(ip, clientLimit);
  res.status(401).json({
    success: false,
    error: `Incorrect Security PIN. (${5 - clientLimit.attempts} attempt(s) remaining)`,
  });
});

app.get('/api/auth/pin-status', (_req, res) => {
  res.json({
    required: true,
    owner: 'Kalai',
    terminalDesk: 'TERMINAL-01 (Main POS)',
    status: 'active',
  });
});

// ==========================================
// 4. PostgreSQL Complete Workspace Bootstrap / Load
// ==========================================
app.get('/api/workspace/bootstrap', async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({
      success: false,
      error: 'Render PostgreSQL database connection is not configured in Render backend environment.',
    });
    return;
  }

  try {
    const [
      brandsRes,
      companyRes,
      productsRes,
      suppliersRes,
      shopsRes,
      invoicesRes,
      purchasesRes,
      stockAdjRes,
      expensesRes,
      shopPaymentsRes,
      supplierPaymentsRes,
      dailyCashRes,
      auditLogsRes,
      notificationsRes,
    ] = await Promise.all([
      pool.query('SELECT * FROM brands ORDER BY is_initial DESC, name ASC;'),
      pool.query('SELECT * FROM company_info LIMIT 1;'),
      pool.query('SELECT * FROM products ORDER BY name ASC;'),
      pool.query('SELECT * FROM suppliers ORDER BY name ASC;'),
      pool.query('SELECT * FROM retail_shops ORDER BY shop_name ASC;'),
      pool.query('SELECT * FROM invoices ORDER BY date DESC, id DESC;'),
      pool.query('SELECT * FROM purchases ORDER BY bill_date DESC, id DESC;'),
      pool.query('SELECT * FROM stock_adjustments ORDER BY date DESC;'),
      pool.query('SELECT * FROM expenses ORDER BY date DESC, id DESC;'),
      pool.query('SELECT * FROM shop_payments ORDER BY date DESC;'),
      pool.query('SELECT * FROM supplier_payments ORDER BY date DESC;'),
      pool.query('SELECT * FROM daily_cash ORDER BY date DESC LIMIT 30;'),
      pool.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100;'),
      pool.query('SELECT * FROM notifications ORDER BY id DESC LIMIT 50;'),
    ]);

    // Format products
    const products = productsRes.rows.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      brand: r.brand,
      category: r.category,
      unit: r.unit,
      hsnCode: r.hsn_code,
      mrp: parseFloat(r.mrp),
      purchaseRate: parseFloat(r.purchase_rate),
      wholesaleRate: parseFloat(r.wholesale_rate),
      retailRate: parseFloat(r.retail_rate),
      gstRate: r.gst_rate,
      currentStock: parseFloat(r.current_stock),
      minStockAlert: parseFloat(r.min_stock_alert),
      reorderLevel: parseFloat(r.reorder_level),
      batches: r.batches || [],
      isActive: r.is_active,
    }));

    // Format suppliers
    const suppliers = suppliersRes.rows.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      contactPerson: r.contact_person,
      phone: r.phone,
      email: r.email,
      gstin: r.gstin,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
      address: r.address,
      paymentTermsDays: r.payment_terms_days,
      openingBalance: parseFloat(r.opening_balance || '0'),
      notes: r.notes,
      status: r.status,
      outstandingPayable: parseFloat(r.outstanding_payable || '0'),
      totalPurchases: parseFloat(r.total_purchases || '0'),
      amountPaid: parseFloat(r.amount_paid || '0'),
      leadTimeDays: r.lead_time_days,
    }));

    // Format shops
    const shops = shopsRes.rows.map((r: any) => ({
      id: r.id,
      code: r.code,
      shopName: r.shop_name,
      ownerName: r.owner_name,
      phone: r.phone,
      gstin: r.gstin,
      address: r.address,
      routeArea: r.route_area,
      creditLimit: parseFloat(r.credit_limit || '0'),
      outstandingAmount: parseFloat(r.outstanding_amount || '0'),
      creditDays: r.credit_days,
      overdueAmount: parseFloat(r.overdue_amount || '0'),
      status: r.status,
      lastBilledDate: r.last_billed_date,
    }));

    // Format invoices
    const invoices = invoicesRes.rows.map((r: any) => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      date: r.date,
      dueDate: r.due_date,
      shopId: r.shop_id,
      shopName: r.shop_name,
      shopAddress: r.shop_address,
      shopGstin: r.shop_gstin,
      type: r.type,
      items: r.items || [],
      subtotal: parseFloat(r.subtotal),
      taxAmount: parseFloat(r.tax_amount),
      cgst: parseFloat(r.cgst),
      sgst: parseFloat(r.sgst),
      igst: parseFloat(r.igst),
      discountAmount: parseFloat(r.discount_amount),
      grandTotal: parseFloat(r.grand_total),
      paidAmount: parseFloat(r.paid_amount),
      balanceAmount: parseFloat(r.balance_amount),
      paymentStatus: r.payment_status,
      paymentMode: r.payment_mode,
      cancellationReason: r.cancellation_reason,
      cancelledAt: r.cancelled_at,
      cancelledBy: r.cancelled_by,
      notes: r.notes,
      brandLogos: r.brand_logos || [],
    }));

    // Format purchases
    const purchases = purchasesRes.rows.map((r: any) => ({
      id: r.id,
      billNumber: r.bill_number,
      supplierId: r.supplier_id,
      supplierName: r.supplier_name,
      supplierGstin: r.supplier_gstin,
      billDate: r.bill_date,
      receivedDate: r.received_date,
      status: r.status,
      items: r.items || [],
      subtotal: parseFloat(r.subtotal),
      taxAmount: parseFloat(r.tax_amount),
      grandTotal: parseFloat(r.grand_total),
      paidAmount: parseFloat(r.paid_amount),
      balanceAmount: parseFloat(r.balance_amount),
      paymentStatus: r.payment_status,
      remarks: r.remarks,
    }));

    // Format stock adjustments
    const stockAdjustments = stockAdjRes.rows.map((r: any) => ({
      id: r.id,
      date: r.date,
      productId: r.product_id,
      productName: r.product_name,
      brand: r.brand,
      batchNumber: r.batch_number,
      type: r.type,
      action: r.action,
      qty: parseFloat(r.qty),
      unit: r.unit,
      unitCost: parseFloat(r.unit_cost),
      totalLoss: parseFloat(r.total_loss),
      remarks: r.remarks,
      recordedBy: r.recorded_by,
    }));

    // Format expenses
    const expenses = expensesRes.rows.map((r: any) => ({
      id: r.id,
      voucherNo: r.voucher_no,
      date: r.date,
      category: r.category,
      amount: parseFloat(r.amount),
      paymentMode: r.payment_mode,
      paidTo: r.paid_to,
      description: r.description,
      referenceNo: r.reference_no,
      approvedBy: r.approved_by,
    }));

    // Format shop payments
    const shopPayments = shopPaymentsRes.rows.map((r: any) => ({
      id: r.id,
      receiptNo: r.receipt_no,
      date: r.date,
      shopId: r.shop_id,
      shopName: r.shop_name,
      amount: parseFloat(r.amount),
      mode: r.mode,
      referenceNo: r.reference_no,
      allocatedInvoices: r.allocated_invoices || [],
      notes: r.notes,
    }));

    // Format supplier payments
    const supplierPayments = supplierPaymentsRes.rows.map((r: any) => ({
      id: r.id,
      voucherNo: r.voucher_no,
      date: r.date,
      supplierId: r.supplier_id,
      supplierName: r.supplier_name,
      amount: parseFloat(r.amount),
      mode: r.mode,
      referenceNo: r.reference_no,
      billNumber: r.bill_number,
      notes: r.notes,
    }));

    // Format daily cash
    const dailyCashList = dailyCashRes.rows.map((r: any) => ({
      date: r.date,
      openingCash: parseFloat(r.opening_cash || '0'),
      cashSales: parseFloat(r.cash_sales || '0'),
      cashCollectionsFromShops: parseFloat(r.cash_collections_from_shops || '0'),
      cashExpenses: parseFloat(r.cash_expenses || '0'),
      ownerWithdrawals: parseFloat(r.owner_withdrawals || '0'),
      expectedCashInDrawer: parseFloat(r.expected_cash_in_drawer || '0'),
      physicalCountCash: parseFloat(r.physical_count_cash || '0'),
      variance: parseFloat(r.variance || '0'),
      isClosed: r.is_closed,
      closedBy: r.closed_by,
      closingNotes: r.closing_notes,
    }));

    // Format audit logs
    const auditLogs = auditLogsRes.rows.map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      action: r.action,
      module: r.module,
      user: r.username,
      details: r.details,
    }));

    // Format notifications
    const notifications = notificationsRes.rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      timestamp: r.timestamp,
      read: r.read,
      targetScreen: r.target_screen,
      targetId: r.target_id,
      severity: r.severity,
    }));

    // Format Brands
    const brands = brandsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      logoUrl: r.logo_url,
      category: r.category,
      status: r.status,
      description: r.description,
      contactDetails: r.contact_details,
      isInitial: r.is_initial,
    }));

    // Format Company Info
    const rawComp = companyRes.rows[0];
    const companyInfo = rawComp
      ? {
          name: rawComp.name,
          tradeName: rawComp.trade_name,
          distributorTitle: rawComp.distributor_title,
          logoUrl: rawComp.logo_url,
          address: rawComp.address || '',
          city: rawComp.city || 'Kumbakonam',
          state: rawComp.state,
          pincode: rawComp.pincode,
          phone: rawComp.phone || '',
          email: rawComp.email || '',
          gstin: rawComp.gstin,
          fssai: rawComp.fssai,
          stateCode: rawComp.state_code || '33 (Tamil Nadu)',
          financialYear: rawComp.financial_year,
          invoicePrefix: rawComp.invoice_prefix,
          posPrefix: rawComp.pos_prefix,
          bankName: rawComp.bank_name,
          accountNumber: rawComp.account_number,
          ifscCode: rawComp.ifsc_code,
          upiId: rawComp.upi_id,
          whatsappReminderTemplate: rawComp.whatsapp_reminder_template,
        }
      : null;

    res.json({
      success: true,
      source: 'render_postgresql',
      data: {
        products,
        suppliers,
        shops,
        invoices,
        purchases,
        stockAdjustments,
        expenses,
        shopPayments,
        supplierPayments,
        dailyCash: dailyCashList[0] || null,
        auditLogs,
        notifications,
        brands,
        companyInfo,
      },
    });
  } catch (err: any) {
    console.error('Failed to bootstrap workspace from PostgreSQL:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to query database.',
    });
  }
});

// ==========================================
// 5. Products CRUD
// ==========================================
app.post('/api/products', async (req, res) => {
  const p = req.body;
  if (!p || !p.id || !p.code || !p.name) {
    res.status(400).json({ success: false, error: 'Product id, code, and name are required.' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO products (
        id, code, name, brand, category, unit, hsn_code,
        mrp, purchase_rate, wholesale_rate, retail_rate,
        gst_rate, current_stock, min_stock_alert, reorder_level,
        batches, is_active, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW())
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        category = EXCLUDED.category,
        unit = EXCLUDED.unit,
        hsn_code = EXCLUDED.hsn_code,
        mrp = EXCLUDED.mrp,
        purchase_rate = EXCLUDED.purchase_rate,
        wholesale_rate = EXCLUDED.wholesale_rate,
        retail_rate = EXCLUDED.retail_rate,
        gst_rate = EXCLUDED.gst_rate,
        current_stock = EXCLUDED.current_stock,
        min_stock_alert = EXCLUDED.min_stock_alert,
        reorder_level = EXCLUDED.reorder_level,
        batches = EXCLUDED.batches,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();`,
      [
        p.id,
        p.code,
        p.name,
        p.brand,
        p.category,
        p.unit,
        p.hsnCode,
        p.mrp,
        p.purchaseRate,
        p.wholesaleRate,
        p.retailRate,
        p.gstRate,
        p.currentStock,
        p.minStockAlert,
        p.reorderLevel,
        JSON.stringify(p.batches || []),
        p.isActive ?? true,
      ]
    );

    res.json({ success: true, message: 'Product saved to PostgreSQL.' });
  } catch (err: any) {
    console.error('Error saving product to PostgreSQL:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, error: 'Product ID is required.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if product exists
    const prodRes = await client.query('SELECT id, name, code FROM products WHERE id = $1;', [id]);
    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: 'Product not found.' });
      return;
    }
    const product = prodRes.rows[0];

    // 2. Check if product is referenced in any invoices
    const invRes = await client.query(
      `SELECT id, invoice_number FROM invoices WHERE items::text LIKE $1 LIMIT 5;`,
      [`%"productId":"${id}"%`]
    );

    // 3. Check if product is referenced in any purchase bills
    const purRes = await client.query(
      `SELECT id, bill_number FROM purchases WHERE items::text LIKE $1 LIMIT 5;`,
      [`%"productId":"${id}"%`]
    );

    // If product has transaction history, safeguard financial integrity by archiving / deactivating
    if (invRes.rows.length > 0 || purRes.rows.length > 0) {
      await client.query(
        'UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1;',
        [id]
      );
      await client.query('COMMIT');
      res.json({
        success: true,
        archived: true,
        message: `Product "${product.name}" has ${invRes.rows.length} invoice(s) or purchase(s) on record. It has been safely deactivated & archived to preserve historical financial records.`,
      });
      return;
    }

    // 4. If completely unreferenced, perform clean deletion
    await client.query('DELETE FROM stock_adjustments WHERE product_id = $1;', [id]);
    await client.query('DELETE FROM products WHERE id = $1;', [id]);
    await client.query('COMMIT');

    res.json({
      success: true,
      archived: false,
      message: `Product "${product.name}" (${product.code}) permanently deleted from PostgreSQL.`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error deleting product from PostgreSQL:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  } finally {
    client.release();
  }
});

app.post('/api/products/batch-delete', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, error: 'IDs array is required for batch delete.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let deletedCount = 0;
    let skippedCount = 0;
    const skippedNames: string[] = [];

    for (const id of ids) {
      const prodRes = await client.query('SELECT id, name FROM products WHERE id = $1;', [id]);
      if (prodRes.rows.length === 0) continue;
      const product = prodRes.rows[0];

      // Check transaction dependency
      const invRes = await client.query(
        `SELECT id FROM invoices WHERE items::text LIKE $1 LIMIT 1;`,
        [`%"productId":"${id}"%`]
      );
      const purRes = await client.query(
        `SELECT id FROM purchases WHERE items::text LIKE $1 LIMIT 1;`,
        [`%"productId":"${id}"%`]
      );

      if (invRes.rows.length > 0 || purRes.rows.length > 0) {
        // Safe archive
        await client.query('UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1;', [id]);
        skippedCount++;
        skippedNames.push(`${product.name} (Archived due to transaction history)`);
      } else {
        await client.query('DELETE FROM stock_adjustments WHERE product_id = $1;', [id]);
        await client.query('DELETE FROM products WHERE id = $1;', [id]);
        deletedCount++;
      }
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      deletedCount,
      skippedCount,
      skipped: skippedNames,
      message: `Processed ${ids.length} products: ${deletedCount} deleted, ${skippedCount} archived.`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err?.message || 'Database error during batch delete' });
  } finally {
    client.release();
  }
});

// ==========================================
// 6. Retail Shops (Customers) CRUD
// ==========================================
app.post('/api/shops', async (req, res) => {
  const s = req.body;
  if (!s || !s.id || !s.shopName) {
    res.status(400).json({ success: false, error: 'Shop id and name are required.' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO retail_shops (
        id, code, shop_name, owner_name, phone, gstin, address,
        route_area, credit_limit, outstanding_amount, credit_days,
        overdue_amount, status, last_billed_date, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        shop_name = EXCLUDED.shop_name,
        owner_name = EXCLUDED.owner_name,
        phone = EXCLUDED.phone,
        gstin = EXCLUDED.gstin,
        address = EXCLUDED.address,
        route_area = EXCLUDED.route_area,
        credit_limit = EXCLUDED.credit_limit,
        outstanding_amount = EXCLUDED.outstanding_amount,
        credit_days = EXCLUDED.credit_days,
        overdue_amount = EXCLUDED.overdue_amount,
        status = EXCLUDED.status,
        last_billed_date = EXCLUDED.last_billed_date,
        updated_at = NOW();`,
      [
        s.id,
        s.code,
        s.shopName,
        s.ownerName || '',
        s.phone || '',
        s.gstin || '',
        s.address || '',
        s.routeArea || '',
        s.creditLimit || 0,
        s.outstandingAmount || 0,
        s.creditDays || 15,
        s.overdueAmount || 0,
        s.status || 'Active',
        s.lastBilledDate || null,
      ]
    );

    res.json({ success: true, message: 'Shop saved to PostgreSQL.' });
  } catch (err: any) {
    console.error('Error saving shop to PostgreSQL:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  }
});

app.delete('/api/shops/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, error: 'Shop ID is required.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const shopRes = await client.query('SELECT id, shop_name, outstanding_amount FROM retail_shops WHERE id = $1;', [id]);
    if (shopRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: 'Retail shop not found.' });
      return;
    }
    const shop = shopRes.rows[0];

    // Check outstanding balance
    if (parseFloat(shop.outstanding_amount || '0') > 0) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        error: `Cannot delete "${shop.shop_name}" while an outstanding balance of ₹${parseFloat(shop.outstanding_amount).toLocaleString('en-IN')} remains. Collect or write off dues first.`,
      });
      return;
    }

    // Check if shop has linked invoices or payments
    const invRes = await client.query('SELECT id FROM invoices WHERE shop_id = $1 LIMIT 1;', [id]);
    const payRes = await client.query('SELECT id FROM shop_payments WHERE shop_id = $1 LIMIT 1;', [id]);

    if (invRes.rows.length > 0 || payRes.rows.length > 0) {
      // Archive/Block instead of deleting historical financial link
      await client.query("UPDATE retail_shops SET status = 'Blocked', updated_at = NOW() WHERE id = $1;", [id]);
      await client.query('COMMIT');
      res.json({
        success: true,
        archived: true,
        message: `"${shop.shop_name}" has past invoices/payments on record. It has been deactivated & blocked from new billing to preserve audit history.`,
      });
      return;
    }

    // Clean delete if no transaction history
    await client.query('DELETE FROM retail_shops WHERE id = $1;', [id]);
    await client.query('COMMIT');

    res.json({
      success: true,
      archived: false,
      message: `Retail shop "${shop.shop_name}" deleted from PostgreSQL database.`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error deleting shop from PostgreSQL:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  } finally {
    client.release();
  }
});

// ==========================================
// 7. Suppliers CRUD
// ==========================================
app.post('/api/suppliers', async (req, res) => {
  const sup = req.body;
  if (!sup || !sup.id || !sup.name) {
    res.status(400).json({ success: false, error: 'Supplier id and name are required.' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO suppliers (
        id, code, name, contact_person, phone, email, gstin,
        city, state, pincode, address, payment_terms_days, opening_balance,
        notes, status, outstanding_payable, total_purchases, amount_paid,
        lead_time_days, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW())
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        contact_person = EXCLUDED.contact_person,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        gstin = EXCLUDED.gstin,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        pincode = EXCLUDED.pincode,
        address = EXCLUDED.address,
        payment_terms_days = EXCLUDED.payment_terms_days,
        opening_balance = EXCLUDED.opening_balance,
        notes = EXCLUDED.notes,
        status = EXCLUDED.status,
        outstanding_payable = EXCLUDED.outstanding_payable,
        total_purchases = EXCLUDED.total_purchases,
        amount_paid = EXCLUDED.amount_paid,
        lead_time_days = EXCLUDED.lead_time_days,
        updated_at = NOW();`,
      [
        sup.id,
        sup.code,
        sup.name,
        sup.contactPerson || '',
        sup.phone || '',
        sup.email || '',
        sup.gstin || '',
        sup.city || '',
        sup.state || '',
        sup.pincode || '',
        sup.address || '',
        sup.paymentTermsDays || 30,
        sup.openingBalance || 0,
        sup.notes || '',
        sup.status || 'Active',
        sup.outstandingPayable || 0,
        sup.totalPurchases || 0,
        sup.amountPaid || 0,
        sup.leadTimeDays || 3,
      ]
    );

    res.json({ success: true, message: 'Supplier saved to PostgreSQL.' });
  } catch (err: any) {
    console.error('Error saving supplier to PostgreSQL:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, error: 'Supplier ID is required.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const supRes = await client.query('SELECT id, name, outstanding_payable FROM suppliers WHERE id = $1;', [id]);
    if (supRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: 'Supplier not found.' });
      return;
    }
    const supplier = supRes.rows[0];

    // Check outstanding payable
    if (parseFloat(supplier.outstanding_payable || '0') > 0) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        error: `Cannot delete supplier "${supplier.name}" while an outstanding payable of ₹${parseFloat(supplier.outstanding_payable).toLocaleString('en-IN')} remains. Settle dues first.`,
      });
      return;
    }

    // Check if supplier has linked purchases or payments
    const purRes = await client.query('SELECT id FROM purchases WHERE supplier_id = $1 LIMIT 1;', [id]);
    const payRes = await client.query('SELECT id FROM supplier_payments WHERE supplier_id = $1 LIMIT 1;', [id]);

    if (purRes.rows.length > 0 || payRes.rows.length > 0) {
      await client.query("UPDATE suppliers SET status = 'Inactive', updated_at = NOW() WHERE id = $1;", [id]);
      await client.query('COMMIT');
      res.json({
        success: true,
        archived: true,
        message: `"${supplier.name}" has purchase history on record. It has been marked Inactive to preserve financial ledgers.`,
      });
      return;
    }

    await client.query('DELETE FROM suppliers WHERE id = $1;', [id]);
    await client.query('COMMIT');

    res.json({
      success: true,
      archived: false,
      message: `Supplier "${supplier.name}" permanently deleted from PostgreSQL.`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error deleting supplier from PostgreSQL:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  } finally {
    client.release();
  }
});

// ==========================================
// 8. Invoices with Full Atomic Transaction
// ==========================================
app.post('/api/invoices', async (req, res) => {
  const inv = req.body;
  if (!inv || !inv.id || !inv.invoiceNumber || !inv.items || !Array.isArray(inv.items)) {
    res.status(400).json({ success: false, error: 'Invalid invoice payload.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert Invoice Record
    await client.query(
      `INSERT INTO invoices (
        id, invoice_number, date, due_date, shop_id, shop_name,
        shop_address, shop_gstin, type, items, subtotal, tax_amount,
        cgst, sgst, igst, discount_amount, grand_total, paid_amount,
        balance_amount, payment_status, payment_mode, notes, brand_logos
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      ON CONFLICT (id) DO UPDATE SET
        paid_amount = EXCLUDED.paid_amount,
        balance_amount = EXCLUDED.balance_amount,
        payment_status = EXCLUDED.payment_status;`,
      [
        inv.id,
        inv.invoiceNumber,
        inv.date,
        inv.dueDate,
        inv.shopId || null,
        inv.shopName,
        inv.shopAddress || null,
        inv.shopGstin || null,
        inv.type,
        JSON.stringify(inv.items),
        inv.subtotal,
        inv.taxAmount,
        inv.cgst,
        inv.sgst,
        inv.igst,
        inv.discountAmount || 0,
        inv.grandTotal,
        inv.paidAmount,
        inv.balanceAmount,
        inv.paymentStatus,
        inv.paymentMode,
        inv.notes || '',
        JSON.stringify(inv.brandLogos || []),
      ]
    );

    // 2. Atomically Deduct Product Stock & Batch Quantities
    for (const item of inv.items) {
      if (item.productId && item.qty > 0) {
        // Fetch current product row with row-level lock
        const prodRes = await client.query('SELECT current_stock, batches FROM products WHERE id = $1 FOR UPDATE;', [
          item.productId,
        ]);
        if (prodRes.rows.length > 0) {
          const currentStock = parseFloat(prodRes.rows[0].current_stock || '0');
          const newStock = Math.max(0, currentStock - item.qty);
          let batches = prodRes.rows[0].batches || [];

          if (Array.isArray(batches) && item.batchNumber) {
            batches = batches.map((b: any) =>
              b.batchNumber === item.batchNumber
                ? { ...b, quantity: Math.max(0, parseFloat(b.quantity || '0') - item.qty) }
                : b
            );
          }

          await client.query('UPDATE products SET current_stock = $1, batches = $2 WHERE id = $3;', [
            newStock,
            JSON.stringify(batches),
            item.productId,
          ]);
        }
      }
    }

    // 3. If credit sale, update shop outstanding balance
    if (inv.shopId && inv.balanceAmount > 0) {
      await client.query(
        `UPDATE retail_shops 
         SET outstanding_amount = outstanding_amount + $1,
             last_billed_date = $2
         WHERE id = $3;`,
        [inv.balanceAmount, inv.date, inv.shopId]
      );
    }

    // 4. If cash direct sale, increment daily cash
    if (inv.paymentMode === 'Cash' && inv.paidAmount > 0) {
      await client.query(
        `INSERT INTO daily_cash (date, cash_sales, expected_cash_in_drawer, physical_count_cash)
         VALUES ($1, $2, $2, $2)
         ON CONFLICT (date) DO UPDATE
         SET cash_sales = daily_cash.cash_sales + EXCLUDED.cash_sales,
             expected_cash_in_drawer = daily_cash.expected_cash_in_drawer + EXCLUDED.cash_sales,
             physical_count_cash = daily_cash.physical_count_cash + EXCLUDED.cash_sales;`,
        [inv.date, inv.paidAmount]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Invoice and stock atomic transaction completed in PostgreSQL.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Invoice creation transaction failed:', err);
    res.status(500).json({ success: false, error: err?.message || 'Transaction error' });
  } finally {
    client.release();
  }
});

app.post('/api/invoices/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!id) {
    res.status(400).json({ success: false, error: 'Invoice ID is required.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch invoice
    const invRes = await client.query('SELECT * FROM invoices WHERE id = $1 FOR UPDATE;', [id]);
    if (invRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: 'Invoice not found.' });
      return;
    }
    const inv = invRes.rows[0];

    if (inv.payment_status === 'Cancelled') {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: 'Invoice is already cancelled.' });
      return;
    }

    // 2. Return inventory to stock and batch allocations
    const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
    for (const item of items) {
      if (item.productId && item.qty > 0) {
        const prodRes = await client.query('SELECT current_stock, batches FROM products WHERE id = $1 FOR UPDATE;', [
          item.productId,
        ]);
        if (prodRes.rows.length > 0) {
          const currentStock = parseFloat(prodRes.rows[0].current_stock || '0');
          const newStock = currentStock + parseFloat(item.qty);
          let batches = prodRes.rows[0].batches || [];

          if (Array.isArray(batches) && item.batchNumber) {
            batches = batches.map((b: any) =>
              b.batchNumber === item.batchNumber
                ? { ...b, quantity: parseFloat(b.quantity || '0') + parseFloat(item.qty) }
                : b
            );
          }

          await client.query('UPDATE products SET current_stock = $1, batches = $2 WHERE id = $3;', [
            newStock,
            JSON.stringify(batches),
            item.productId,
          ]);
        }
      }
    }

    // 3. Reverse shop outstanding if balance was unpaid
    const balanceAmount = parseFloat(inv.balance_amount || '0');
    if (inv.shop_id && balanceAmount > 0) {
      await client.query(
        `UPDATE retail_shops
         SET outstanding_amount = GREATEST(0, outstanding_amount - $1)
         WHERE id = $2;`,
        [balanceAmount, inv.shop_id]
      );
    }

    // 4. Reverse cash drawer if it was a cash sale
    const paidAmount = parseFloat(inv.paid_amount || '0');
    if (inv.payment_mode === 'Cash' && paidAmount > 0) {
      await client.query(
        `INSERT INTO daily_cash (date, cash_sales, expected_cash_in_drawer, physical_count_cash)
         VALUES ($1, -$2, -$2, -$2)
         ON CONFLICT (date) DO UPDATE
         SET cash_sales = daily_cash.cash_sales - EXCLUDED.cash_sales,
             expected_cash_in_drawer = daily_cash.expected_cash_in_drawer - EXCLUDED.cash_sales,
             physical_count_cash = daily_cash.physical_count_cash - EXCLUDED.cash_sales;`,
        [inv.date, paidAmount]
      );
    }

    // 5. Update invoice status to Cancelled with reason and timestamp
    await client.query(
      `UPDATE invoices
       SET payment_status = 'Cancelled',
           cancellation_reason = $1,
           cancelled_at = NOW(),
           cancelled_by = 'Owner / Authorized Desk'
       WHERE id = $2;`,
      [reason || 'Voided by authorized manager', id]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Invoice ${inv.invoice_number} voided and reversed. Stock returned to cold storage.`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Invoice cancellation error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  } finally {
    client.release();
  }
});

// ==========================================
// 9. Purchases Bills (GRN) with Stock Addition
// ==========================================
app.post('/api/purchases', async (req, res) => {
  const pb = req.body;
  const autoPost = req.query.autoPost === 'true';

  if (!pb || !pb.id || !pb.billNumber) {
    res.status(400).json({ success: false, error: 'Invalid purchase bill payload.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO purchases (
        id, bill_number, supplier_id, supplier_name, supplier_gstin,
        bill_date, received_date, status, items, subtotal, tax_amount,
        grand_total, paid_amount, balance_amount, payment_status, remarks
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        paid_amount = EXCLUDED.paid_amount,
        balance_amount = EXCLUDED.balance_amount;`,
      [
        pb.id,
        pb.billNumber,
        pb.supplierId || null,
        pb.supplierName,
        pb.supplierGstin || null,
        pb.billDate,
        pb.receivedDate,
        pb.status,
        JSON.stringify(pb.items || []),
        pb.subtotal,
        pb.taxAmount,
        pb.grandTotal,
        pb.paidAmount,
        pb.balanceAmount,
        pb.paymentStatus,
        pb.remarks || '',
      ]
    );

    // If posted, add inward stock to products & batches
    if (autoPost || pb.status === 'Posted') {
      for (const item of pb.items || []) {
        if (item.productId && item.qty > 0) {
          const prodRes = await client.query('SELECT current_stock, batches FROM products WHERE id = $1 FOR UPDATE;', [
            item.productId,
          ]);
          if (prodRes.rows.length > 0) {
            const currentStock = parseFloat(prodRes.rows[0].current_stock || '0');
            const newStock = currentStock + parseFloat(item.qty);
            let batches = prodRes.rows[0].batches || [];

            const existingBatchIndex = batches.findIndex((b: any) => b.batchNumber === item.batchNumber);
            if (existingBatchIndex >= 0) {
              batches[existingBatchIndex].quantity += parseFloat(item.qty);
            } else {
              batches.push({
                batchNumber: item.batchNumber || `B-${Date.now().toString().slice(-4)}`,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
                quantity: parseFloat(item.qty),
                costRate: parseFloat(item.costRate || '0'),
                daysToExpiry: 90,
              });
            }

            await client.query('UPDATE products SET current_stock = $1, batches = $2 WHERE id = $3;', [
              newStock,
              JSON.stringify(batches),
              item.productId,
            ]);
          }
        }
      }

      // If balance unpaid, update supplier payable
      if (pb.supplierId && pb.balanceAmount > 0) {
        await client.query(
          `UPDATE suppliers 
           SET outstanding_payable = outstanding_payable + $1,
               total_purchases = total_purchases + $2
           WHERE id = $3;`,
          [pb.balanceAmount, pb.grandTotal, pb.supplierId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Purchase bill committed to PostgreSQL.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Purchase bill transaction error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  } finally {
    client.release();
  }
});

// ==========================================
// 10. Expenses CRUD
// ==========================================
app.post('/api/expenses', async (req, res) => {
  const exp = req.body;
  if (!exp || !exp.id || !exp.amount) {
    res.status(400).json({ success: false, error: 'Invalid expense record.' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO expenses (id, voucher_no, date, category, amount, payment_mode, paid_to, description, reference_no, approved_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         category = EXCLUDED.category,
         amount = EXCLUDED.amount,
         paid_to = EXCLUDED.paid_to,
         description = EXCLUDED.description;`,
      [
        exp.id,
        exp.voucherNo,
        exp.date,
        exp.category,
        exp.amount,
        exp.paymentMode,
        exp.paidTo,
        exp.description,
        exp.referenceNo || null,
        exp.approvedBy || 'Owner',
      ]
    );

    // If cash expense, reflect in daily cash
    if (exp.paymentMode === 'Cash') {
      await pool.query(
        `INSERT INTO daily_cash (date, cash_expenses, expected_cash_in_drawer, physical_count_cash)
         VALUES ($1, $2, -$2, -$2)
         ON CONFLICT (date) DO UPDATE
         SET cash_expenses = daily_cash.cash_expenses + EXCLUDED.cash_expenses,
             expected_cash_in_drawer = daily_cash.expected_cash_in_drawer - EXCLUDED.cash_expenses,
             physical_count_cash = daily_cash.physical_count_cash - EXCLUDED.cash_expenses;`,
        [exp.date, exp.amount]
      );
    }

    res.json({ success: true, message: 'Expense recorded in PostgreSQL.' });
  } catch (err: any) {
    console.error('Expense error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, error: 'Expense ID is required.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const expRes = await client.query('SELECT * FROM expenses WHERE id = $1 FOR UPDATE;', [id]);
    if (expRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: 'Expense voucher not found.' });
      return;
    }
    const exp = expRes.rows[0];

    // If it was a cash expense, reverse cash in daily cash record
    if (exp.payment_mode === 'Cash') {
      const amt = parseFloat(exp.amount || '0');
      await client.query(
        `INSERT INTO daily_cash (date, cash_expenses, expected_cash_in_drawer, physical_count_cash)
         VALUES ($1, -$2, $2, $2)
         ON CONFLICT (date) DO UPDATE
         SET cash_expenses = GREATEST(0, daily_cash.cash_expenses - EXCLUDED.cash_expenses),
             expected_cash_in_drawer = daily_cash.expected_cash_in_drawer + EXCLUDED.cash_expenses,
             physical_count_cash = daily_cash.physical_count_cash + EXCLUDED.cash_expenses;`,
        [exp.date, amt]
      );
    }

    await client.query('DELETE FROM expenses WHERE id = $1;', [id]);
    await client.query('COMMIT');

    res.json({ success: true, message: `Expense voucher ${exp.voucher_no} removed from PostgreSQL.` });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error deleting expense:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  } finally {
    client.release();
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notifications WHERE id = $1;', [id]);
    res.json({ success: true, message: 'Notification removed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  }
});

// ==========================================
// 11. Customer Payments (Shop Collection)
// ==========================================
app.post('/api/payments/shop', async (req, res) => {
  const p = req.body;
  if (!p || !p.id || !p.shopId || !p.amount) {
    res.status(400).json({ success: false, error: 'Invalid payment record.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO shop_payments (id, receipt_no, date, shop_id, shop_name, amount, mode, reference_no, allocated_invoices, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO NOTHING;`,
      [
        p.id,
        p.receiptNo,
        p.date,
        p.shopId,
        p.shopName,
        p.amount,
        p.mode,
        p.referenceNo || null,
        JSON.stringify(p.allocatedInvoices || []),
        p.notes || '',
      ]
    );

    // Reduce shop outstanding
    await client.query(
      `UPDATE retail_shops
       SET outstanding_amount = GREATEST(0, outstanding_amount - $1)
       WHERE id = $2;`,
      [p.amount, p.shopId]
    );

    // If cash collection, add to daily cash
    if (p.mode === 'Cash') {
      await client.query(
        `INSERT INTO daily_cash (date, cash_collections_from_shops, expected_cash_in_drawer, physical_count_cash)
         VALUES ($1, $2, $2, $2)
         ON CONFLICT (date) DO UPDATE
         SET cash_collections_from_shops = daily_cash.cash_collections_from_shops + EXCLUDED.cash_collections_from_shops,
             expected_cash_in_drawer = daily_cash.expected_cash_in_drawer + EXCLUDED.cash_collections_from_shops,
             physical_count_cash = daily_cash.physical_count_cash + EXCLUDED.cash_collections_from_shops;`,
        [p.date, p.amount]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Shop payment saved and ledger updated in PostgreSQL.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Shop payment error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  } finally {
    client.release();
  }
});

// ==========================================
// 12. Brands CRUD
// ==========================================
app.post('/api/brands', async (req, res) => {
  const b = req.body;
  if (!b || !b.id || !b.name) {
    res.status(400).json({ success: false, error: 'Brand id and name are required.' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO brands (id, name, logo_url, category, status, description, contact_details, is_initial, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         logo_url = EXCLUDED.logo_url,
         category = EXCLUDED.category,
         status = EXCLUDED.status,
         description = EXCLUDED.description,
         contact_details = EXCLUDED.contact_details,
         updated_at = NOW();`,
      [
        b.id,
        b.name,
        b.logoUrl || '',
        b.category,
        b.status || 'Active',
        b.description || '',
        b.contactDetails || '',
        b.isInitial ?? false,
      ]
    );

    res.json({ success: true, message: 'Brand saved to PostgreSQL.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  }
});

app.delete('/api/brands/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM brands WHERE id = $1 AND is_initial = FALSE;', [id]);
    res.json({ success: true, message: 'Brand deleted from PostgreSQL.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  }
});

// ==========================================
// 13. Company Info Update
// ==========================================
app.post('/api/company', async (req, res) => {
  const c = req.body;
  try {
    await pool.query(
      `INSERT INTO company_info (
        id, name, trade_name, distributor_title, logo_url, address,
        city, state, pincode, phone, email, gstin, fssai, state_code,
        financial_year, invoice_prefix, pos_prefix, bank_name,
        account_number, ifsc_code, upi_id, whatsapp_reminder_template, updated_at
      ) VALUES ('primary',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        trade_name = EXCLUDED.trade_name,
        distributor_title = EXCLUDED.distributor_title,
        logo_url = EXCLUDED.logo_url,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        pincode = EXCLUDED.pincode,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        gstin = EXCLUDED.gstin,
        fssai = EXCLUDED.fssai,
        state_code = EXCLUDED.state_code,
        financial_year = EXCLUDED.financial_year,
        invoice_prefix = EXCLUDED.invoice_prefix,
        pos_prefix = EXCLUDED.pos_prefix,
        bank_name = EXCLUDED.bank_name,
        account_number = EXCLUDED.account_number,
        ifsc_code = EXCLUDED.ifsc_code,
        upi_id = EXCLUDED.upi_id,
        whatsapp_reminder_template = EXCLUDED.whatsapp_reminder_template,
        updated_at = NOW();`,
      [
        c.name || 'Maayya Future Foods',
        c.tradeName,
        c.distributorTitle,
        c.logoUrl,
        c.address || '',
        c.city || 'Kumbakonam',
        c.state,
        c.pincode,
        c.phone || '',
        c.email || '',
        c.gstin,
        c.fssai,
        c.stateCode || '33 (Tamil Nadu)',
        c.financialYear,
        c.invoicePrefix,
        c.posPrefix,
        c.bankName,
        c.accountNumber,
        c.ifscCode,
        c.upiId,
        c.whatsappReminderTemplate,
      ]
    );

    res.json({ success: true, message: 'Company settings saved to PostgreSQL.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Database error' });
  }
});

// ==========================================
// 14. Real Database Backup & Restore Endpoints
// ==========================================
app.get('/api/database/backup', async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: 'PostgreSQL database not configured.' });
    return;
  }

  try {
    const [
      products,
      suppliers,
      shops,
      invoices,
      purchases,
      expenses,
      shopPayments,
      supplierPayments,
      brands,
      company,
    ] = await Promise.all([
      pool.query('SELECT * FROM products;'),
      pool.query('SELECT * FROM suppliers;'),
      pool.query('SELECT * FROM retail_shops;'),
      pool.query('SELECT * FROM invoices;'),
      pool.query('SELECT * FROM purchases;'),
      pool.query('SELECT * FROM expenses;'),
      pool.query('SELECT * FROM shop_payments;'),
      pool.query('SELECT * FROM supplier_payments;'),
      pool.query('SELECT * FROM brands;'),
      pool.query('SELECT * FROM company_info;'),
    ]);

    const backupData = {
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      client: 'Maayya Future Foods',
      developer: 'MSR Solutions',
      database: 'Render PostgreSQL',
      tables: {
        products: products.rows,
        suppliers: suppliers.rows,
        retailShops: shops.rows,
        invoices: invoices.rows,
        purchases: purchases.rows,
        expenses: expenses.rows,
        shopPayments: shopPayments.rows,
        supplierPayments: supplierPayments.rows,
        brands: brands.rows,
        companyInfo: company.rows[0] || null,
      },
    };

    res.setHeader('Content-Disposition', `attachment; filename=maayya_pg_backup_${new Date().toISOString().substring(0, 10)}.json`);
    res.json(backupData);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Backup generation failed.' });
  }
});

// ==========================================
// Server Initialization
// ==========================================
async function startServer() {
  try {
    // Attempt automatic schema migration on startup
    await initDbSchema();
  } catch (err) {
    console.error('Initial DB schema sync warning:', err);
  }

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maayya Future Foods backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
