/**
 * Returns the backend API base URL for Render deployment or local development.
 * Vercel frontend connects to Render backend via VITE_BACKEND_URL or VITE_API_BASE_URL.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const envUrl =
    (import.meta as any).env?.VITE_BACKEND_URL ||
    (import.meta as any).env?.VITE_API_BASE_URL ||
    '';
  return envUrl ? envUrl.replace(/\/+$/, '') : '';
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface NotificationPreferences {
  overdueAlerts: boolean;
  creditLimitAlerts: boolean;
  stockExpiryAlerts: boolean;
  dailyClosingAlert: boolean;
  backupStatusAlert: boolean;
  pushNotificationsEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  overdueAlerts: true,
  creditLimitAlerts: true,
  stockExpiryAlerts: true,
  dailyClosingAlert: true,
  backupStatusAlert: true,
  pushNotificationsEnabled: false,
};

export async function isPushNotificationSupported(): Promise<boolean> {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser.');
  }
  return await Notification.requestPermission();
}

export interface BackendVapidStatus {
  configured: boolean;
  reachable: boolean;
  activeSubscriptions?: number;
  message?: string;
}

/**
 * Checks if the Render backend VAPID push engine is active and reachable
 */
export async function fetchBackendVapidStatus(): Promise<BackendVapidStatus> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/push/status`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return {
        configured: false,
        reachable: false,
        message: `Backend returned HTTP status ${res.status}`,
      };
    }
    const data = await res.json();
    return {
      configured: Boolean(data.vapidConfigured),
      reachable: true,
      activeSubscriptions: data.activeSubscriptions || 0,
    };
  } catch (err: any) {
    return {
      configured: false,
      reachable: false,
      message: err?.message || 'Unable to reach backend VAPID engine.',
    };
  }
}

/**
 * Checks if the current browser already has an active push subscription
 */
export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator)) return null;
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('Error reading existing push subscription:', err);
    return null;
  }
}

export async function subscribeToPushNotifications(): Promise<{ success: boolean; message: string }> {
  try {
    const supported = await isPushNotificationSupported();
    if (!supported) {
      return {
        success: false,
        message: 'Push notifications are not supported in this browser.',
      };
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'Notification permission was denied or dismissed by user.',
      };
    }

    // Wait for service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Fetch VAPID public key from backend (using baseUrl for Render backend)
    const baseUrl = getApiBaseUrl();
    const keyUrl = `${baseUrl}/api/push/vapid-public-key`;
    
    let keyResponse: Response;
    try {
      keyResponse = await fetch(keyUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    } catch (networkError: any) {
      throw new Error(
        `Failed to connect to backend server at ${keyUrl}. Please verify Render backend is running and CORS is configured.`
      );
    }

    if (!keyResponse.ok) {
      let errorMsg = 'Failed to retrieve VAPID public key from backend.';
      try {
        const errJson = await keyResponse.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const { publicKey } = await keyResponse.json();
    if (!publicKey) {
      throw new Error('Backend returned an empty VAPID public key.');
    }

    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Subscribe with pushManager
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // Post to backend
    const subscribeResponse = await fetch(`${baseUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceInfo: `${navigator.platform || 'Device'} (${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'})`,
      }),
    });

    if (!subscribeResponse.ok) {
      throw new Error('Failed to register subscription with backend server.');
    }

    return {
      success: true,
      message: 'Browser push notifications successfully registered with backend!',
    };
  } catch (error: any) {
    console.error('Push subscription error:', error);
    return {
      success: false,
      message: error?.message || 'Failed to subscribe to push notifications.',
    };
  }
}

export async function sendTestPushNotification(
  title?: string,
  body?: string,
  category?: keyof NotificationPreferences,
  preferences?: NotificationPreferences
): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/push/send-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || 'Maayya Future Foods Alert',
        body: body || 'Real Web Push test delivered to your registered mobile/desktop device.',
        url: '/',
        tag: 'maayya-test-alert',
        category,
        preferences,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Backend dispatch failed with HTTP status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: data.success,
      message: data.message || 'Push notification dispatched.',
    };
  } catch (error: any) {
    console.error('Test push error:', error);
    return {
      success: false,
      message: error?.message || 'Failed to dispatch test push notification. Check backend connectivity.',
    };
  }
}
