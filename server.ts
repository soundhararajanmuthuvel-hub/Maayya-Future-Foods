import express from 'express';
import webpush from 'web-push';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Enable CORS for Vercel production frontend and local development
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow all origins or specify deployed Vercel domains
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

// In-memory subscriptions store
interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo?: string;
  subscribedAt: string;
}

let subscriptions: PushSubscriptionRecord[] = [];

// API endpoints for Web Push
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

app.post('/api/push/subscribe', (req, res) => {
  const { subscription, deviceInfo } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    res.status(400).json({ error: 'Invalid push subscription object provided.' });
    return;
  }

  // Deduplicate by endpoint
  subscriptions = subscriptions.filter((s) => s.endpoint !== subscription.endpoint);
  subscriptions.push({
    ...subscription,
    deviceInfo: deviceInfo || 'Mobile/Desktop Browser',
    subscribedAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Subscription successfully registered on backend.',
    count: subscriptions.length,
  });
});

app.post('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
  }
  res.json({ success: true, count: subscriptions.length });
});

app.post('/api/push/send-test', async (req, res) => {
  const { title, body, url, tag, category, preferences } = req.body || {};

  // If a category was supplied and preferences are provided, verify category is enabled
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

  if (subscriptions.length === 0) {
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

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      deliveredCount++;
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      } else {
        console.error('Webpush delivery failed for endpoint:', err.message || err);
      }
    }
  }

  if (expiredEndpoints.length > 0) {
    subscriptions = subscriptions.filter((s) => !expiredEndpoints.includes(s.endpoint));
  }

  if (deliveredCount === 0 && subscriptions.length > 0) {
    res.status(200).json({
      success: false,
      delivered: 0,
      total: subscriptions.length,
      message: 'Push notification failed to reach client endpoints. Subscriptions may have expired.',
    });
    return;
  }

  res.json({
    success: true,
    delivered: deliveredCount,
    total: subscriptions.length,
    message: `Push notification delivered to ${deliveredCount} registered device(s).`,
  });
});

app.get('/api/push/status', (_req, res) => {
  res.json({
    activeSubscriptions: subscriptions.length,
    vapidConfigured: isVapidConfigured,
    subject: VAPID_SUBJECT,
    backendStatus: 'healthy',
  });
});

// ==========================================
// Mandatory Security PIN Verification Engine
// ==========================================
// Stored securely on Render backend (environment variable or default 1911)
const OWNER_SECURITY_PIN = process.env.OWNER_SECURITY_PIN || '1911';
// Salted SHA-256 hash calculation for constant-time comparison
const PIN_SALT = process.env.PIN_SALT || 'maayya-future-foods-msr-2026';
const HASHED_OWNER_PIN = crypto
  .createHash('sha256')
  .update(`${OWNER_SECURITY_PIN}:${PIN_SALT}`)
  .digest('hex');

// In-memory rate limiting against brute force
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

  // Check if IP is currently blocked
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

  // Hash submitted pin with salt
  const submittedHash = crypto
    .createHash('sha256')
    .update(`${pin.trim()}:${PIN_SALT}`)
    .digest('hex');

  // Constant-time comparison
  const isValid = crypto.timingSafeEqual(
    Buffer.from(submittedHash, 'utf8'),
    Buffer.from(HASHED_OWNER_PIN, 'utf8')
  );

  if (isValid) {
    // Reset rate limiter on success
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

  // Handle failed attempt
  clientLimit.attempts += 1;
  if (clientLimit.attempts >= 5) {
    clientLimit.blockedUntil = now + 60 * 1000; // 60 seconds lockout
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

// Vite middleware in dev or static serving in production
async function startServer() {
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
