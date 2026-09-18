const CACHE_NAME='ceylonry-pos-app-shell-v13';
const PUBLIC_SHELL=['/app/','/app/index.html','/manifest.webmanifest','/pos-system/pos-system.html','/assets/pos-modern.css','/assets/appwrite-firebase-compat.js','/assets/platform.js','/assets/pos-industry-tools.js','/assets/icons/ceylonry-192.png','/assets/icons/ceylonry-192-maskable.png','/assets/icons/ceylonry-512.png','/assets/icons/ceylonry-512-maskable.png'];
const EXTERNAL_ASSETS=['/assets/appwrite-sdk.js','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'];

self.addEventListener('install',function(event){event.waitUntil(caches.open(CACHE_NAME).then(function(cache){return cache.addAll(PUBLIC_SHELL)}));self.skipWaiting()});
self.addEventListener('activate',function(event){event.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(key){return key!==CACHE_NAME}).map(function(key){return caches.delete(key)}))}));self.clients.claim()});
self.addEventListener('fetch',function(event){
  if(event.request.method!=='GET')return;
  var url=new URL(event.request.url);
  if(EXTERNAL_ASSETS.includes(url.href)){
    event.respondWith(caches.match(event.request).then(function(cached){
      var refreshed=fetch(event.request).then(function(response){if(response&&response.ok){var copy=response.clone();caches.open(CACHE_NAME).then(function(cache){cache.put(event.request,copy)})}return response});
      if(cached){event.waitUntil(refreshed.catch(function(){}));return cached}
      return refreshed
    }));
    return
  }
  if(url.origin!==location.origin)return;
  var publicAsset=PUBLIC_SHELL.includes(url.pathname)||url.pathname==='/app';
  if(!publicAsset)return;
  var request=url.pathname==='/pos-system/pos-system.html'?new Request(event.request,{cache:'no-store'}):event.request;
  event.respondWith(fetch(request).then(function(response){if(response&&response.ok){var copy=response.clone();caches.open(CACHE_NAME).then(function(cache){cache.put(event.request,copy)})}return response}).catch(function(){return caches.match(event.request).then(function(response){return response||caches.match('/app/index.html')})}));
});
