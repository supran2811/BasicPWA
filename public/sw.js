
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntill(
    caches.open("static-v2").then( cache => {
      console.log("[Service Worker] starting to cache static contents..");
      cache.addAll(["/",
            "/index.html",
            "/src/js/app.js",
            "/src/js/feed.js",
            "/src/js/material.min.js",
            "/src/js/promise.js",
            "/src/js/fetch.js",
            "/src/css/app.css",
            "/src/css/feed.css",
            "/src/images/main-image.jpg",
            "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
          "https://fonts.googleapis.com/css?family=Roboto:400,700",
        ""]);
      cache.add("/");
      cache.add("/index.html");
      cache.add("/src/js/app.js");
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntill(
    caches.keys().then(function( keys ) {
       Promise.all(keys.map(function(key) {
         if(key !== "static-v2" && key !== "dynamic"){
           return caches.delete(key);
         }
       }))
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
    .then(function(response) {
      if(response){
        return response
      }
      else {
        return fetch(event.request)
        .then(function(res) {
          caches.open("dynamic").then(function(cache) {
            cache.put(event.request.url , res.clone());
            return res;
          })
        })
        .catch(function(err) {});
      }
    })
   
  );
});