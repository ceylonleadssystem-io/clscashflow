const CACHE_NAME='ceylonry-pos-app-shell-v2';
const PUBLIC_SHELL=['/app/','/app/index.html','/manifest.webmanifest','/pos-system/pos-system.html','/assets/supabase-firebase-compat.js','/assets/platform.js','/assets/pos-industry-tools.js','/assets/icons/ceylonry-192.png','/assets/icons/ceylonry-192-maskable.png','/assets/icons/ceylonry-512.png','/assets/icons/ceylonry-512-maskable.png'];

self.addEventListener('install',function(event){event.waitUntil(caches.open(CACHE_NAME).then(function(cache){return cache.addAll(PUBLIC_SHELL)}));self.skipWaiting()});
self.addEventListener('activate',function(event){event.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(key){return key!==CACHE_NAME}).map(function(key){return caches.delete(key)}))}));self.clients.claim()});
self.addEventListener('fetch',function(event){
  if(event.request.method!=='GET')return;
  var url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  var publicAsset=PUBLIC_SHELL.includes(url.pathname)||url.pathname==='/app';
  if(!publicAsset)return;
  event.respondWith(fetch(event.request).then(function(response){if(response&&response.ok){var copy=response.clone();caches.open(CACHE_NAME).then(function(cache){cache.put(event.request,copy)})}return response}).catch(function(){return caches.match(event.request).then(function(response){return response||caches.match('/app/index.html')})}));
});
