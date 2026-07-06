const CACHE = 'yeryscake-pos-v2';
const ASSETS = [
  './yeryscake-pos-v2.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];
// El documento principal siempre se pide primero a la red: así cada
// actualización se ve de inmediato con conexión, y solo cae al caché
// (última versión vista) cuando no hay internet.
const NETWORK_FIRST = ['./yeryscake-pos-v2.html', './'];

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
  const url = new URL(e.request.url);
  const isNetworkFirst = e.request.mode==='navigate' || NETWORK_FIRST.some(p=>url.pathname.endsWith(p.replace('./','/')));

  if(isNetworkFirst){
    e.respondWith(
      fetch(e.request).then(res=>{
        if(res.ok) caches.open(CACHE).then(c=>c.put(e.request, res.clone()));
        return res;
      }).catch(()=>caches.match(e.request))
    );
    return;
  }

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
