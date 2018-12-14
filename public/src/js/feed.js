var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var imagePickerArea = document.querySelector('#pick-image');
var captureButton = document.querySelector('#capture-btn');

function initialiseMedia() {
  if(!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }
  if(!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function(constraint) {
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if(!getUserMedia) {
        return Promise.reject(new Error("Get user media does not exist!"));
      }
      
      return new Promise(function(resolve,reject) {
        getUserMedia.call(navigator , constraint , resolve , reject);
      });
    }
  }

  navigator.mediaDevices.getUserMedia({video:true})
  .then(function(stream) {
    videoPlayer.srcObject = stream;
    videoPlayer.style.display = 'block';
    captureButton.style.display = 'block';
  })
  .catch(function(error) {
    imagePickerArea.style.display = 'block';
  })
}

captureButton.addEventListener('click' , function(e) {
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'block';
  captureButton.style.display = 'none';

  var context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer , 0 , 0, canvas.width , videoPlayer.videoHeight / (videoPlayer.videoWidth/canvas.width) );
  videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
    track.stop();
  });
})

function openCreatePostModal() {
  // createPostArea.style.display = 'block';
  // setTimeout(function() {
    createPostArea.style.transform = 'translateY(0)';
    initialiseMedia();
  // }, 1);
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(function(registrations) {
  //       for (var i = 0; i < registrations.length; i++) {
  //         registrations[i].unregister();
  //       }
  //     })
  // }
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
  videoPlayer.style.display = 'none';
  imagePickerArea.style.display = 'none';
  canvasElement.style.display = 'none';
  captureButton.style.display = 'none';
  // createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// Currently not in use, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
  console.log('clicked');
  if ('caches' in window) {
    caches.open('user-requested')
      .then(function(cache) {
        cache.add('https://httpbin.org/get');
        cache.add('/src/images/sf-boat.jpg');
      });
  }
}

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

var url = 'https://pwagram-e77c1.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    console.log('From web', data);
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ('indexedDB' in window) {
  readAllData('posts')
    .then(function(data) {
      if (!networkDataReceived) {
        console.log('From cache', data);
        updateUI(data);
      }
    });
}

function sendData() {
  fetch('https://us-central1-pwagram-e77c1.cloudfunctions.net/storePostData',{
    method:'POST',
    headers:{
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body:JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: "XXXX"
    })
  }).then(function() {
    console.log("Data sent!!");
  })
}

form.addEventListener('submit', function(event) {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }

  closeCreatePostModal();

  if("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
      .then(function(sw) {
        var post = {
          id : new Date().toISOString(),
          title: titleInput.value,
          location:locationInput.value,
          image:"XXX"
        };

        writeData("sync-posts" , post)
          .then(function() {
            return sw.sync.register("sync-new-post");
          })
          .then(function() {
            var snackbarContainer =  document.querySelector("#confirmation-toast");
            var data = {message : "Your post was saved for syncing!"};
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          });

      })
  }
  else {
    sendData();
  }

});