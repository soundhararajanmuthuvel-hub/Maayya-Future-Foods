import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Render PostgreSQL connection string
const DATABASE_URL = process.env.DATABASE_URL || '';

// Create connection pool with Render SSL configuration
export const pool = new Pool({
  connectionString: DATABASE_URL || undefined,
  ssl: DATABASE_URL && !DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export async function testDbConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
  if (!DATABASE_URL) {
    return {
      connected: false,
      error: 'DATABASE_URL is not configured in Render environment variables.',
    };
  }

  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT version();');
      return {
        connected: true,
        version: res.rows[0]?.version || 'PostgreSQL connected',
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || 'Failed to connect to PostgreSQL database.',
    };
  }
}

/**
 * Initializes and executes schema migrations for Maayya Future Foods tables.
 */
export async function initDbSchema(): Promise<void> {
  if (!DATABASE_URL) {
    console.warn('PostgreSQL: DATABASE_URL not set. In-memory / mock storage active until configured.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Brands Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo_url TEXT,
        category VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        description TEXT,
        contact_details TEXT,
        is_initial BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Company Info Table (Single Row)
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_info (
        id VARCHAR(32) PRIMARY KEY DEFAULT 'primary',
        name VARCHAR(255) NOT NULL,
        trade_name VARCHAR(255),
        distributor_title VARCHAR(255),
        logo_url TEXT,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(100),
        gstin VARCHAR(50),
        fssai VARCHAR(50),
        state_code VARCHAR(50),
        financial_year VARCHAR(50),
        invoice_prefix VARCHAR(50),
        pos_prefix VARCHAR(50),
        bank_name VARCHAR(100),
        account_number VARCHAR(100),
        ifsc_code VARCHAR(50),
        upi_id VARCHAR(100),
        whatsapp_reminder_template TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Products & Batches Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        hsn_code VARCHAR(50) NOT NULL,
        mrp NUMERIC(12, 2) NOT NULL DEFAULT 0,
        purchase_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
        wholesale_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
        retail_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
        gst_rate INT NOT NULL DEFAULT 5,
        current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
        min_stock_alert NUMERIC(12, 2) NOT NULL DEFAULT 5,
        reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 10,
        batches JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
      CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
    `);

    // 4. Suppliers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(100),
        gstin VARCHAR(50),
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        address TEXT,
        payment_terms_days INT DEFAULT 30,
        opening_balance NUMERIC(12, 2) DEFAULT 0,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'Active',
        outstanding_payable NUMERIC(12, 2) DEFAULT 0,
        total_purchases NUMERIC(12, 2) DEFAULT 0,
        amount_paid NUMERIC(12, 2) DEFAULT 0,
        lead_time_days INT DEFAULT 3,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Retail Shops (Customers) Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS retail_shops (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        shop_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255),
        phone VARCHAR(50),
        gstin VARCHAR(50),
        address TEXT,
        route_area VARCHAR(255),
        credit_limit NUMERIC(12, 2) DEFAULT 10000,
        outstanding_amount NUMERIC(12, 2) DEFAULT 0,
        credit_days INT DEFAULT 15,
        overdue_amount NUMERIC(12, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Active',
        last_billed_date VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_shops_route ON retail_shops(route_area);
    `);

    // 6. Invoices & Invoice Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(64) PRIMARY KEY,
        invoice_number VARCHAR(64) UNIQUE NOT NULL,
        date VARCHAR(50) NOT NULL,
        due_date VARCHAR(50) NOT NULL,
        shop_id VARCHAR(64) REFERENCES retail_shops(id) ON DELETE SET NULL,
        shop_name VARCHAR(255) NOT NULL,
        shop_address TEXT,
        shop_gstin VARCHAR(50),
        type VARCHAR(50) NOT NULL,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
        tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        cgst NUMERIC(12, 2) NOT NULL DEFAULT 0,
        sgst NUMERIC(12, 2) NOT NULL DEFAULT 0,
        igst NUMERIC(12, 2) NOT NULL DEFAULT 0,
        discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
        payment_mode VARCHAR(50) NOT NULL DEFAULT 'Cash',
        cancellation_reason TEXT,
        cancelled_at TIMESTAMPTZ,
        cancelled_by VARCHAR(100),
        notes TEXT,
        brand_logos JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_invoices_shop_id ON invoices(shop_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
    `);

    // 7. Purchases Bills Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(64) PRIMARY KEY,
        bill_number VARCHAR(64) UNIQUE NOT NULL,
        supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE SET NULL,
        supplier_name VARCHAR(255) NOT NULL,
        supplier_gstin VARCHAR(50),
        bill_date VARCHAR(50) NOT NULL,
        received_date VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Posted',
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
        tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_bill_number ON purchases(bill_number);
    `);

    // 8. Stock Adjustments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id VARCHAR(64) PRIMARY KEY,
        date VARCHAR(50) NOT NULL,
        product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        brand VARCHAR(255) NOT NULL,
        batch_number VARCHAR(100),
        type VARCHAR(100) NOT NULL,
        action VARCHAR(20) NOT NULL,
        qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
        total_loss NUMERIC(12, 2) NOT NULL DEFAULT 0,
        remarks TEXT,
        recorded_by VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 9. Expenses Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(64) PRIMARY KEY,
        voucher_no VARCHAR(64) UNIQUE NOT NULL,
        date VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        payment_mode VARCHAR(50) NOT NULL,
        paid_to VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        reference_no VARCHAR(100),
        approved_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    `);

    // 10. Shop Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shop_payments (
        id VARCHAR(64) PRIMARY KEY,
        receipt_no VARCHAR(64) UNIQUE NOT NULL,
        date VARCHAR(50) NOT NULL,
        shop_id VARCHAR(64) REFERENCES retail_shops(id) ON DELETE SET NULL,
        shop_name VARCHAR(255) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        mode VARCHAR(50) NOT NULL,
        reference_no VARCHAR(100),
        allocated_invoices JSONB DEFAULT '[]'::jsonb,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 11. Supplier Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_payments (
        id VARCHAR(64) PRIMARY KEY,
        voucher_no VARCHAR(64) UNIQUE NOT NULL,
        date VARCHAR(50) NOT NULL,
        supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE SET NULL,
        supplier_name VARCHAR(255) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        mode VARCHAR(50) NOT NULL,
        reference_no VARCHAR(100),
        bill_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 12. Daily Cash Closing Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_cash (
        date VARCHAR(50) PRIMARY KEY,
        opening_cash NUMERIC(12, 2) DEFAULT 0,
        cash_sales NUMERIC(12, 2) DEFAULT 0,
        cash_collections_from_shops NUMERIC(12, 2) DEFAULT 0,
        cash_expenses NUMERIC(12, 2) DEFAULT 0,
        owner_withdrawals NUMERIC(12, 2) DEFAULT 0,
        expected_cash_in_drawer NUMERIC(12, 2) DEFAULT 0,
        physical_count_cash NUMERIC(12, 2) DEFAULT 0,
        variance NUMERIC(12, 2) DEFAULT 0,
        is_closed BOOLEAN DEFAULT FALSE,
        closed_by VARCHAR(100),
        closing_notes TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 13. Audit Log Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        timestamp VARCHAR(50) NOT NULL,
        action VARCHAR(255) NOT NULL,
        module VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL,
        details TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 14. Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        timestamp VARCHAR(50) NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        target_screen VARCHAR(50),
        target_id VARCHAR(64),
        severity VARCHAR(20) DEFAULT 'info',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 15. Push Subscriptions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint TEXT PRIMARY KEY,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        device_info VARCHAR(255),
        subscribed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Seed Initial Brands if table is empty
    const brandCountRes = await client.query('SELECT COUNT(*) as count FROM brands;');
    if (parseInt(brandCountRes.rows[0]?.count, 10) === 0) {
      await client.query(`
        INSERT INTO brands (id, name, logo_url, category, status, description, is_initial)
        VALUES 
          ('brand-heritage', 'Heritage Milk', '/assets/brands/heritage-milk-logo.png', 'Dairy & Fresh Milk', 'Active', 'Heritage Foods - Pasteurized Toned Milk, Fresh Curd, Malai Paneer & Cow Ghee', TRUE),
          ('brand-hangyo', 'Hangyo Ice Cream', '/assets/brands/hangyo-ice-cream-logo.png', 'Ice Cream & Desserts', 'Active', 'Hangyo Ice Cream - Cones, Luxury Tubs, Kulfi & Sticks', TRUE)
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    // Seed Initial Company Info if empty
    const companyCountRes = await client.query('SELECT COUNT(*) as count FROM company_info;');
    if (parseInt(companyCountRes.rows[0]?.count, 10) === 0) {
      await client.query(`
        INSERT INTO company_info (id, name, trade_name, distributor_title, city, state_code)
        VALUES ('primary', 'Maayya Future Foods', 'Maayya Future Foods', 'Cold-Chain Wholesale & Retail Distributor', 'Kumbakonam', '33 (Tamil Nadu)')
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    await client.query('COMMIT');
    console.log('PostgreSQL schema migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PostgreSQL schema migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}
