importScripts('workbox-sw.prod.v2.1.3.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(/.*(?:googleapis|gstatic)\.com.*$/,workboxSW.strategies
.staleWhileRevalidate({
    cacheName:'google-fonts',
    cacheExpiration:{
        maxEntries:3,
        maxAgeSeconds:60*60*24*30
    }
}));

workboxSW.router.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',workboxSW.strategies
.staleWhileRevalidate({
    cacheName:'material-css'
}));

workboxSW.router.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/,workboxSW.strategies
.staleWhileRevalidate({
    cacheName:'post-images'
}));

workboxSW.router.registerRoute('https://pwagram-e77c1.firebaseio.com/posts.json',
function(args) {
    return fetch(args.event.request)
    .then(function (res) {
      var clonedRes = res.clone();
      clearAllData('posts')
        .then(function () {
          return clonedRes.json();
        })
        .then(function (data) {
          for (var key in data) {
            writeData('posts', data[key])
          }
        });
      return res;
    });
});

workboxSW.router.registerRoute(function(routeData) {
    return routeData.event.request.headers.get('accept').includes('text/html');
} , function(args) {
    return caches.match(args.event.request)
    .then(function (response) {
      if (response) {
        return response;
      } else {
        return fetch(args.event.request)
          .then(function (res) {
            return caches.open('dynamic')
              .then(function (cache) {
                // trimCache(CACHE_DYNAMIC_NAME, 3);
                cache.put(args.event.request.url, res.clone());
                return res;
              })
          })
          .catch(function (err) {
            return caches.match('/offline.html')
              .then(function (res) {
                return res;
              });
          });
      }
    })
})
 
workboxSW.precache([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "fd48136656e4e3192e3a1e6214e6a965"
  },
  {
    "url": "manifest.json",
    "revision": "d11c7965f5cfba711c8e74afa6c703d7"
  },
  {
    "url": "offline.html",
    "revision": "45352e71a80a5c75d25e226e7330871b"
  },
  {
    "url": "service-worker.js",
    "revision": "6f80cd57848b2500cf5ba1618fdd14ad"
  },
  {
    "url": "src/css/app.css",
    "revision": "f27b4d5a6a99f7b6ed6d06f6583b73fa"
  },
  {
    "url": "src/css/feed.css",
    "revision": "94687a6dc8bd7dc7a50aeffa0ac69c79"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "6757ed25861ae869e0f622e89c0fe98c"
  },
  {
    "url": "src/js/feed.js",
    "revision": "dcca4d0e5dde99e1d820fd0845227f1f"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/utility.js",
    "revision": "4853a87685922cdf08b8bc5ed3f6f85e"
  },
  {
    "url": "sw-base.js",
    "revision": "f0f1d5b8f85f6e8ee4231af46988c964"
  },
  {
    "url": "sw.js",
    "revision": "9a1557bc3e20200b3bbbe2b52f320880"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "a9890beda9e5f17e4c68f42324217941"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);

self.addEventListener('sync' , function(event) {
  console.log("Inside sync listener",event);
  if(event.tag === "sync-new-post") {
    event.waitUntil(
      readAllData("sync-posts").then(function(posts) {
        for(var dt of posts) {

          var postData = new FormData();
          postData.append('id',dt.id);
          postData.append('title' , dt.title);
          postData.append('location' , dt.location);
          postData.append('file' , dt.picture , dt.id + '.png');
          postData.append('rawLocationLat' , dt.rawLocationLat);
          postData.append('rawLocationLng' , dt.rawLocationLng);

          fetch('https://us-central1-pwagram-e77c1.cloudfunctions.net/storePostData',{
            method:'POST',
            body:postData
          }).then(function(res) {
            console.log({ res });
            if(res.ok) {
              console.log("Data sent!!");
              res.json().then(function(responseData) {
                deleteItemFromData("sync-posts",responseData.id);
              });
              
            }
          })
        }
        
      })
    )
  }
});

self.addEventListener('notificationclick' , function(event) {
  var notification = event.notification;

  event.waitUntil(
    clients.matchAll()
      .then(function(cl) {
         var client = cl.find(function(c){
           return c.visibilityState === 'visible';
         });

         if(client !== undefined) {
           client.navigate(notification.data.url);
         }
         else {
           client.openWindow(notification.data.url);
         }
         notification.close();
      })
  );


})

self.addEventListener('notificationclose', function(event) {
  console.log('Notification is closed!!',event);
});

self.addEventListener('push' , function(event) {

  var data = { title : 'Default Title' , content : 'Default Contents' , openUrl : '/'};

  if(event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body : data.content,
    data : {
      url : data.openUrl
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title , options)
  );
});