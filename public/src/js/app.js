
var deferredPrompt;
var enableNotificationButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayNotification() {
  var options = {
    body:'Subscribed to notification is done!!', /// Shown as body of notification
    icon:'/src/images/icons/app-icon-96x96.png', /// icon which comes with notification
    image:'/src/images/sf-boat.jpg', /// images are shown in notification
    dir:'ltr', /// control the text direction
    lang:'en-US', /// support language code in BCP -47 standards
    vibrate:[100,50,200], /// vibrate phone for 100ms then pause for 50ms then again vibrate for 200ms
    badge:'/src/images/icons/app-icon-96x96.png',  // this will show up in the notification toolbar in b/w color in android
    tag:'custom-notification', /// It will not allow to stack notification with same tag on top of each other
    renotify:true, /// If tag is set then this will allow to renotify user about new notification
    actions:[
      {
        action:'confirm' , title:'Ok' , icon:'/src/images/icons/app-icon-96x96.png'
      },
      {
        action:'cancel' , title: 'Cancel'
      }
    ]
  }
  // new Notification("Subscribed sucessfully!",options);

  if('serviceWorker' in navigator) {
    navigator.serviceWorker
    .ready
    .then(function(sw) {
      sw.showNotification("Subscribed sucessfully! (SW)",options);
    });  
  }
}

function configurePushNotification() {
  if(!('serviceWorker' in navigator)) {
    return;
  }

  var reg;

  navigator.serviceWorker.ready
    .then(function(swreg) {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    }).then(function(sub) {
      console.log({sub});
       if(sub === null) {
         console.log("Coming here!!!");
          var vapidPublicKey  = 'BFv13pwdEHJ32WQthpx2xhPeI4hc3CN_P3_A-KY_V3nXmiX93rmNVXn0354_cTRIvgd2iD1O13zr2D1bAs2G2mc';
          var convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
          return reg.pushManager.subscribe({
              userVisibleOnly : true,
              applicationServerKey: convertedVapidKey
          });
       }
       else {
         console.log("Already subscribed!!");
        //  return sub;
       }
    }).then(function(newSub) {
       console.log({newSub});
        return fetch('https://pwagram-e77c1.firebaseio.com/subscription.json' , {
            method:'POST',
            headers:{
              'Content-Type' : 'application/json',
              'Accept' : 'application/json'
            },
            body:JSON.stringify(newSub)
        });      
    })
    .then(function(res) {
      if(res.ok) {
        displayNotification();
      }
    })
    .catch(function(err) {
      console.log({err});
    });

}

function askForNotificationPermission() {
  Notification.requestPermission(function(result) {
    console.log({result});
    if(result !== 'granted') {
      console.log('Permission to show notifications not granted!!');
    }
    else {
      configurePushNotification();
    }
  });
}

if("Notification" in window && 'serviceWorker' in navigator) {
  for(var eNBtn of enableNotificationButtons) {
    eNBtn.style.display = 'inline-block';
    eNBtn.addEventListener('click',askForNotificationPermission);
  }
}