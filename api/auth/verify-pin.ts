import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

interface CustomRequest extends IncomingMessage {
  body?: any;
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
}

// Owner Security PIN and salt
const OWNER_SECURITY_PIN = process.env.OWNER_SECURITY_PIN || '1911';
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
const rateLimitMap = new Map<string, RateLimitRecord>();

function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.write(JSON.stringify(data));
  res.end();
}

export default async function handler(req: CustomRequest, res: ServerResponse): Promise<void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, {
      success: false,
      error: `Method ${req.method} Not Allowed. Expected POST.`,
    });
    return;
  }

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.socket && req.socket.remoteAddress) ||
    'anonymous';
  const now = Date.now();

  const clientLimit = rateLimitMap.get(ip) || { attempts: 0, blockedUntil: 0 };

  // Check if IP is currently rate-limited
  if (clientLimit.blockedUntil > now) {
    const remainingSecs = Math.ceil((clientLimit.blockedUntil - now) / 1000);
    sendJson(res, 429, {
      success: false,
      error: `Too many failed attempts. Security terminal locked. Please wait ${remainingSecs} seconds.`,
      blockedSeconds: remainingSecs,
    });
    return;
  }

  // Parse body if not already parsed by Vercel
  let body = req.body;
  if (!body && typeof req.read === 'function') {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req as any) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawText = Buffer.concat(chunks).toString('utf8');
      if (rawText) {
        body = JSON.parse(rawText);
      }
    } catch (_) {
      // Body parse error handled below
    }
  }

  const { pin } = body || {};

  if (!pin || typeof pin !== 'string') {
    sendJson(res, 400, {
      success: false,
      error: 'Security PIN must be provided as a non-empty string.',
    });
    return;
  }

  // Hash submitted PIN
  const submittedHash = crypto
    .createHash('sha256')
    .update(`${pin.trim()}:${PIN_SALT}`)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(submittedHash, 'utf8'),
    Buffer.from(HASHED_OWNER_PIN, 'utf8')
  );

  if (isValid) {
    rateLimitMap.delete(ip);
    sendJson(res, 200, {
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
    rateLimitMap.set(ip, clientLimit);
    sendJson(res, 429, {
      success: false,
      error: 'Security alert: 5 consecutive failed attempts. Terminal locked for 60 seconds.',
      blockedSeconds: 60,
    });
    return;
  }

  rateLimitMap.set(ip, clientLimit);
  sendJson(res, 401, {
    success: false,
    error: `Incorrect Security PIN. (${5 - clientLimit.attempts} attempt(s) remaining)`,
  });
}
