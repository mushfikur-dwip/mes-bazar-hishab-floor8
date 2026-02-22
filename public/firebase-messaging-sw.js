/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBfp-Ydv4CkkJnt099BPt6uYyDWQIPT5UY",
  authDomain: "meal-4d2bd.firebaseapp.com",
  projectId: "meal-4d2bd",
  storageBucket: "meal-4d2bd.firebasestorage.app",
  messagingSenderId: "642495202763",
  appId: "1:642495202763:web:dc8abc521a5d2fe2f9a24e",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Meal Hisab';
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  };
  self.registration.showNotification(title, options);
});
