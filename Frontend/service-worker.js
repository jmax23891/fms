'use strict';

const CACHE_NAME = 'sfs-static-shell-v4';
const STATIC_SHELL = [
  './', './index.html', './manifest.json', './assets/css/styles.css',
  './assets/js/core.js', './assets/js/auth.js', './assets/js/student.js',
  './assets/js/teacher.js', './assets/js/admin.js', './assets/js/profile.js',
  './assets/icons/icon.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './student/dashboard.html', './student/give-feedback.html', './student/history.html',
  './teacher/dashboard.html', './teacher/inbox.html',
  './admin/dashboard.html', './admin/analytics.html', './admin/feedback.html', './admin/accounts.html', './admin/tags.html',
  './profile.html'
];
const STATIC_PATHS = new Set(STATIC_SHELL.map(path => new URL(path, self.location.href).pathname));
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (STATIC_PATHS.has(url.pathname)) {
    event.respondWith(fetch(request).then(response => { if (response.ok) { const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)); } return response; }).catch(() => caches.match(request)));
    return;
  }
  if (request.mode === 'navigate') event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
});
