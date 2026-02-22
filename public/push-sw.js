// Push notification service worker
self.addEventListener('push', (event) => {
  let data = { title: 'মিল হিসাব', body: '' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: data,
    actions: [
      { action: 'open', title: 'খুলুন' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );

  // Notify foreground if app is open
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PUSH_RECEIVED',
        title: data.title,
        body: data.body || data.message || '',
      });
    });
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});
