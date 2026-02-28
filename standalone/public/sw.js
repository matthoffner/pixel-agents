// Minimal service worker — required for PWA installability.
// No caching strategy since this is a local dev tool with WebSocket state.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
