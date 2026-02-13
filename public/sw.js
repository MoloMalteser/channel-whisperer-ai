// Service Worker for Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Social Tracker';
  const options = {
    body: data.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.url || '/',
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});
