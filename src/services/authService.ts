import { getApiBaseUrl } from './notificationService';

export interface VerifyPinResult {
  success: boolean;
  message?: string;
  error?: string;
  blockedSeconds?: number;
  owner?: string;
  role?: string;
  terminalDesk?: string;
  source?: 'render_backend' | 'vercel_api' | 'offline_terminal';
  isFatal?: boolean;
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
 * Validates Security PIN via:
 * 1. Configured Render backend (`VITE_BACKEND_URL/api/auth/verify-pin` if set)
 * 2. Vercel Serverless API (`/api/auth/verify-pin`)
 *
 * Robust Error Handling:
 * - Handles 405 (Method Not Allowed), 404 (Not Found), 500, network outage, and non-JSON responses.
 * - Safely extracts JSON without crashing on HTML response bodies.
 * - Enforces correct PIN check (1911) with no hardcoded frontend success bypass.
 */
export async function verifySecurityPinWithBackend(pin: string): Promise<VerifyPinResult> {
  const trimmedPin = typeof pin === 'string' ? pin.trim() : '';

  if (!trimmedPin) {
    return {
      success: false,
      error: 'Please enter your Security PIN.',
    };
  }

  // Determine target API endpoints to attempt:
  // First, if VITE_BACKEND_URL or VITE_API_BASE_URL is specified, try the Render backend.
  // Next, try the local/relative `/api/auth/verify-pin` endpoint (serviced by server.ts or Vercel Serverless Function).
  const configuredBaseUrl = getApiBaseUrl();
  const candidateEndpoints: string[] = [];

  if (configuredBaseUrl) {
    candidateEndpoints.push(`${configuredBaseUrl}/api/auth/verify-pin`);
  }
  candidateEndpoints.push('/api/auth/verify-pin');

  // De-duplicate endpoints
  const endpointsToTry = Array.from(new Set(candidateEndpoints));

  let lastError = '';
  let isRateLimited = false;
  let remainingBlockedSecs: number | undefined;

  for (const endpoint of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

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
        } catch (_) {
          // Handled below
        }
      }

      // Handle successful validation
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

      // Handle Rate Limiting (429)
      if (response.status === 429) {
        isRateLimited = true;
        remainingBlockedSecs = typeof data?.blockedSeconds === 'number' ? data.blockedSeconds : 60;
        lastError = extractSafeErrorMessage(
          data?.error,
          `Too many failed attempts. Terminal locked for ${remainingBlockedSecs} seconds.`
        );
        break; // Stop trying other endpoints if rate-limited
      }

      // Handle Wrong PIN (401)
      if (response.status === 401 && data && data.error) {
        return {
          success: false,
          error: extractSafeErrorMessage(data.error, 'Incorrect Security PIN. Access denied.'),
          source: endpoint.startsWith('http') ? 'render_backend' : 'vercel_api',
        };
      }

      // Handle 405 Method Not Allowed
      if (response.status === 405) {
        console.warn(`Endpoint ${endpoint} returned HTTP 405 (Method Not Allowed).`);
        lastError = 'Authentication service method error (HTTP 405). Trying alternative route...';
        continue;
      }

      // Handle 404 Not Found (e.g. backend route unmounted or Render down)
      if (response.status === 404) {
        console.warn(`Endpoint ${endpoint} returned HTTP 404.`);
        lastError = 'Authentication service route not found (HTTP 404). Trying alternative route...';
        continue;
      }

      // Non-JSON or other HTTP errors
      if (!isJson) {
        console.warn(`Endpoint ${endpoint} returned non-JSON HTTP ${response.status}.`);
        lastError = `Server returned invalid response (HTTP ${response.status}).`;
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
      lastError = 'Unable to reach authentication server. Check network connection.';
    }
  }

  // If rate-limited across all attempts
  if (isRateLimited) {
    return {
      success: false,
      error: lastError || 'Security terminal temporarily locked. Please wait.',
      blockedSeconds: remainingBlockedSecs,
    };
  }

  // If both endpoints failed due to network / 405 / 404
  return {
    success: false,
    error: lastError || 'Security PIN verification failed. Please try again or check backend service status.',
  };
}
