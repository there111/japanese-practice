const CACHE = 'jv-v4'
const FILES = [
  '.',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/learn.js',
  'js/examples.js',
  'js/conjugation.js',
  'manifest.json',
  'data/n1_verbs.json',
  'data/n2_verbs.json',
  'data/n3_verbs.json',
  'data/n4_verbs.json',
  'data/n5_verbs.json',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})
