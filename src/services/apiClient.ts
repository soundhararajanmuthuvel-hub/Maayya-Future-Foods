/**
 * Centralized API Client & Backend Connection
 * Maayya Future Foods — Smart Business Manager
 * Developed by MSR Solutions
 */

// Official Production Render Backend URL
export const DEFAULT_PRODUCTION_BACKEND_URL = 'https://maayya-future-foods.onrender.com';

/**
 * Returns the backend API base URL.
 * Precedence:
 * 1. import.meta.env.VITE_API_URL
 * 2. import.meta.env.VITE_BACKEND_URL
 * 3. import.meta.env.VITE_API_BASE_URL
 * 4. Production fallback: https://maayya-future-foods.onrender.com (when running on Vercel / non-localhost)
 * 5. Localhost fallback: '' (uses current origin / relative URL in local dev)
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const envUrl =
    (import.meta as any).env?.VITE_API_URL ||
    (import.meta as any).env?.VITE_BACKEND_URL ||
    (import.meta as any).env?.VITE_API_BASE_URL ||
    '';

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If running in production (e.g. maayya-future-foods.vercel.app or non-localhost)
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.hostname &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return DEFAULT_PRODUCTION_BACKEND_URL;
  }

  return '';
}

/**
 * Builds a standardized API URL for any route, handling trailing slashes cleanly.
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}

export interface BackendHealthResponse {
  status: string;
  service?: string;
  developer?: string;
  timestamp?: string;
  owner?: string;
  terminalDesk?: string;
}

/**
 * Probes the backend /api/health endpoint
 */
export async function checkBackendHealth(): Promise<{ isHealthy: boolean; data?: BackendHealthResponse; error?: string }> {
  const url = buildApiUrl('/api/health');
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { isHealthy: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data = await res.json();
    return { isHealthy: data?.status === 'ok' || data?.backendStatus === 'healthy', data };
  } catch (err: any) {
    return { isHealthy: false, error: err?.message || 'Failed to reach backend health endpoint.' };
  }
}
