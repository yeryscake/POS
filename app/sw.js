const CACHE = 'yeryscake-pos-v1';
const ASSETS = [
  './yeryscake-pos-v2.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fresh = fetch(e.request).then(res=>{
        if(res.ok) caches.open(CACHE).then(c=>c.put(e.request, res.clone()));
        return res;
      }).catch(()=>cached);
      return cached || fresh;
    })
  );
});
