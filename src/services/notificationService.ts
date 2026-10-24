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
        message: 'Notification permission was denied or dismissed.',
      };
    }

    // Wait for service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Fetch VAPID public key from backend
    const keyResponse = await fetch('/api/push/vapid-public-key');
    if (!keyResponse.ok) {
      throw new Error('Failed to retrieve VAPID public key from backend.');
    }
    const { publicKey } = await keyResponse.json();

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
    const subscribeResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceInfo: `${navigator.platform} (${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'})`,
      }),
    });

    if (!subscribeResponse.ok) {
      throw new Error('Failed to register subscription with server.');
    }

    return {
      success: true,
      message: 'Subscribed to push notifications successfully!',
    };
  } catch (error: any) {
    console.error('Push subscription error:', error);
    return {
      success: false,
      message: error?.message || 'Failed to subscribe to push notifications.',
    };
  }
}

export async function sendTestPushNotification(title?: string, body?: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/push/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || 'Maayya Future Foods Alert',
        body: body || 'Real Web Push test delivered to your registered mobile/desktop device.',
        url: '/',
        tag: 'maayya-test-alert',
      }),
    });

    const data = await response.json();
    return {
      success: data.success,
      message: data.message || 'Push notification dispatched.',
    };
  } catch (error: any) {
    console.error('Test push error:', error);
    return {
      success: false,
      message: error?.message || 'Failed to dispatch test push notification.',
    };
  }
}
