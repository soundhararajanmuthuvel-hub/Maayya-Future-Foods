import { buildApiUrl, getApiBaseUrl } from './apiClient';

export interface VerifyPinResult {
  success: boolean;
  message?: string;
  error?: string;
  blockedSeconds?: number;
  owner?: string;
  role?: string;
  terminalDesk?: string;
  source?: 'render_backend' | 'vercel_api' | 'local_server';
}

/**
 * Safely extracts a human-readable string message from an unknown error or response payload.
 * Prevents raw objects from ever propagating to React component state / JSX children (React Error #31).
 */
export function extractSafeErrorMessage(err: unknown, fallback = 'Verification error occurred.'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const record = err as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.detail === 'string') return record.detail;
    try {
      return JSON.stringify(err);
    } catch {
      return fallback;
    }
  }
  return String(err);
}

/**
 * Validates Security PIN via the Render backend (`/api/auth/verify-pin`).
 * Falls back to Vercel Serverless Function `/api/auth/verify-pin` only if Render is temporarily unreachable.
 *
 * Security:
 * - Never returns or hardcodes PIN in public frontend code.
 * - Enforces server-side validation and rate limiting.
 */
export async function verifySecurityPinWithBackend(pin: string): Promise<VerifyPinResult> {
  const trimmedPin = typeof pin === 'string' ? pin.trim() : '';

  if (!trimmedPin) {
    return {
      success: false,
      error: 'Please enter your Security PIN.',
    };
  }

  // Candidate endpoints ordered by priority:
  // 1. Centralized Render Backend API URL
  // 2. Local/Vercel serverless relative URL (/api/auth/verify-pin)
  const primaryEndpoint = buildApiUrl('/api/auth/verify-pin');
  const fallbackEndpoint = '/api/auth/verify-pin';

  const endpointsToTry = Array.from(new Set([primaryEndpoint, fallbackEndpoint]));

  let lastError = '';
  let isRateLimited = false;
  let remainingBlockedSecs: number | undefined;

  for (const endpoint of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ pin: trimmedPin }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      let data: any = null;
      if (isJson) {
        try {
          data = await response.json();
        } catch (_) {}
      }

      // Successful verification
      if (response.ok && data && data.success) {
        return {
          success: true,
          message: extractSafeErrorMessage(data.message, 'PIN verified successfully.'),
          owner: typeof data.owner === 'string' ? data.owner : 'Kalai',
          role: typeof data.role === 'string' ? data.role : 'Owner',
          terminalDesk: typeof data.terminalDesk === 'string' ? data.terminalDesk : 'TERMINAL-01 (Main POS)',
          source: endpoint.startsWith('http') ? 'render_backend' : 'vercel_api',
        };
      }

      // Rate-limited (429)
      if (response.status === 429) {
        isRateLimited = true;
        remainingBlockedSecs = typeof data?.blockedSeconds === 'number' ? data.blockedSeconds : 60;
        lastError = extractSafeErrorMessage(
          data?.error,
          `Too many failed attempts. Terminal locked for ${remainingBlockedSecs} seconds.`
        );
        break; // Do not try fallback if rate-limited
      }

      // Incorrect PIN (401)
      if (response.status === 401 && data && data.error) {
        return {
          success: false,
          error: extractSafeErrorMessage(data.error, 'Incorrect Security PIN. Access denied.'),
          source: endpoint.startsWith('http') ? 'render_backend' : 'vercel_api',
        };
      }

      // 405 Method Not Allowed
      if (response.status === 405) {
        console.warn(`Endpoint ${endpoint} returned HTTP 405. Trying fallback route...`);
        lastError = 'Authentication service method error (HTTP 405).';
        continue;
      }

      // 404 Route Not Found
      if (response.status === 404) {
        console.warn(`Endpoint ${endpoint} returned HTTP 404. Trying fallback route...`);
        lastError = 'Authentication service route not found (HTTP 404).';
        continue;
      }

      // Generic error with response data
      if (data && data.error) {
        return {
          success: false,
          error: extractSafeErrorMessage(data.error, 'Verification failed. Please try again.'),
        };
      }
    } catch (networkError: any) {
      console.warn(`Failed to connect to ${endpoint}:`, networkError?.message || networkError);
      lastError = 'Unable to reach backend authentication server. Check network connection.';
    }
  }

  if (isRateLimited) {
    return {
      success: false,
      error: lastError || 'Security terminal temporarily locked. Please wait.',
      blockedSeconds: remainingBlockedSecs,
    };
  }

  return {
    success: false,
    error: lastError || 'Security PIN verification failed. Please try again.',
  };
}
