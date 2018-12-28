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
 
workboxSW.precache([]);

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