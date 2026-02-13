import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

export async function isPushSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getPushPermission(): Promise<NotificationPermission> {
  return Notification.permission;
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!await isPushSupported()) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.register('/sw.js') as any;
    await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription && VAPID_PUBLIC_KEY) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    if (!subscription) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');
    if (!key || !auth) return false;

    const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
    const authKey = btoa(String.fromCharCode(...new Uint8Array(auth)));

    await supabase.from('push_subscriptions' as any).upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: p256dh,
      auth: authKey,
    }, { onConflict: 'user_id,endpoint' });

    return true;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration() as any;
    const subscription = await registration?.pushManager?.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase.from('push_subscriptions' as any) as any).delete().eq('user_id', user.id);
      }
    }
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
  }
}
