if(window.navigator.serviceWorker)  {
    navigator.serviceWorker.register("/sw.js").then(function() {
        console.log("Service worker is registered!!");
    });
}