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
var imagePicker = document.querySelector('#image-picker');
var captureButton = document.querySelector('#capture-btn');
var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');
var picture;
var locationFetched;

locationBtn.addEventListener('click' , function(event) {

  locationBtn.style.display = 'none';
  locationLoader.style.display= 'inline';

    navigator.geolocation.getCurrentPosition(function(position) {
      locationFetched = { lat : position.coords.latitude.valueOf(), lng:position.coords.longitude.valueOf()};
      locationInput.value = 'In PCMC';
      document.querySelector('#manual-location').classList.add('is-focused');
      locationBtn.style.display = 'inline';
      locationLoader.style.display= 'none';
    } ,
    function(err) {
       locationBtn.style.display = 'inline';
       locationLoader.style.display= 'none';
       alert("Error while fetching locatin please enter manually!!");
    },
    {
      timeout:7000
    });
});


function initialiseLocation() {
  if( !('geolocation' in navigator )){
    locationBtn.style.display = 'none';
  }
}

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
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change' , function(event) {
  picture = event.target.files[0];
})


function openCreatePostModal() {
  // createPostArea.style.display = 'block';
  // setTimeout(function() {
    createPostArea.style.transform = 'translateY(0)';
    initialiseMedia();
    initialiseLocation();
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
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
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
  var postData = new FormData();
  var id = new Date().toISOString();
  postData.append('id',id);
  postData.append('title' , titleInput.value);
  postData.append('location' , locationInput.value);
  postData.append('file' , picture , id + '.png');
  postData.append('rawLocationLat' , locationFetched.lat);
  postData.append('rawLocationLng' , locationFetched.lng);

  fetch('https://us-central1-pwagram-e77c1.cloudfunctions.net/storePostData',{
    method:'POST',
    body:postData
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
          picture : picture,
          rawLocationLat:locationFetched.lat,
          rawLocationLng:locationFetched.lng
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