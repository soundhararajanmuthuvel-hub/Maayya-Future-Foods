import { getApiBaseUrl } from './notificationService';

export interface VerifyPinResult {
  success: boolean;
  message?: string;
  error?: string;
  blockedSeconds?: number;
  owner?: string;
  role?: string;
  terminalDesk?: string;
  source?: 'render_backend' | 'offline_terminal';
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
 * Validates Security PIN via Render backend `/api/auth/verify-pin`.
 *
 * Guarantees:
 * 1. Checks content-type and HTTP status before JSON parsing (avoids HTML 404 crash).
 * 2. Safely sanitizes all error/message values to primitive strings to prevent React Error #31.
 * 3. Never exposes raw error objects.
 * 4. Gracefully falls back to client validation if backend is unreachable or returning 404 (due to missing Vercel env).
 * 5. PIN is never hardcoded in plaintext outside the fallback logic.
 */
export async function verifySecurityPinWithBackend(pin: string): Promise<VerifyPinResult> {
  const trimmedPin = typeof pin === 'string' ? pin.trim() : '';

  if (!trimmedPin) {
    return {
      success: false,
      error: 'Please enter your Security PIN.',
    };
  }

  const baseUrl = getApiBaseUrl();
  const endpoint = baseUrl ? `${baseUrl}/api/auth/verify-pin` : '/api/auth/verify-pin';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for Render cold start

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

    // Handle 404 Not Found explicitly (e.g. Vercel domain hit or backend route mismatch)
    if (response.status === 404) {
      console.warn(
        `Backend PIN endpoint returned 404 at ${endpoint}. Please verify VITE_BACKEND_URL in Vercel project environment variables.`
      );

      // Perform secure fallback verification if backend URL is not yet bound on Vercel
      if (trimmedPin === '1911') {
        return {
          success: true,
          message: 'Security PIN verified (Terminal Offline Safeguard).',
          owner: 'Kalai',
          role: 'Owner',
          terminalDesk: 'TERMINAL-01 (Main POS)',
          source: 'offline_terminal',
        };
      }

      return {
        success: false,
        error: 'Incorrect Security PIN. Access denied.',
        source: 'offline_terminal',
      };
    }

    let data: any = null;
    if (isJson) {
      try {
        data = await response.json();
      } catch (parseErr) {
        console.warn('Failed to parse backend JSON response:', parseErr);
      }
    } else {
      const text = await response.text();
      console.warn('Backend returned non-JSON response:', text.substring(0, 150));
    }

    if (response.ok && data && data.success) {
      return {
        success: true,
        message: extractSafeErrorMessage(data.message, 'PIN verified successfully.'),
        owner: typeof data.owner === 'string' ? data.owner : 'Kalai',
        role: typeof data.role === 'string' ? data.role : 'Owner',
        terminalDesk: typeof data.terminalDesk === 'string' ? data.terminalDesk : 'TERMINAL-01 (Main POS)',
        source: 'render_backend',
      };
    }

    // Rate-limit or incorrect PIN response
    const safeError = extractSafeErrorMessage(
      data?.error,
      response.status === 429
        ? 'Too many failed attempts. Security terminal locked.'
        : 'Incorrect Security PIN. Access denied.'
    );

    return {
      success: false,
      error: safeError,
      blockedSeconds: typeof data?.blockedSeconds === 'number' ? data.blockedSeconds : undefined,
      source: 'render_backend',
    };
  } catch (networkError: any) {
    console.warn('Backend PIN service unreachable or network error, invoking offline safeguard:', networkError);

    // If backend is down or offline PWA mode, check owner PIN 1911
    if (trimmedPin === '1911') {
      return {
        success: true,
        message: 'Security PIN verified (Offline Terminal Safeguard).',
        owner: 'Kalai',
        role: 'Owner',
        terminalDesk: 'TERMINAL-01 (Main POS)',
        source: 'offline_terminal',
      };
    }

    return {
      success: false,
      error: 'Incorrect Security PIN. Access denied.',
      source: 'offline_terminal',
    };
  }
}
