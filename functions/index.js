var functions = require('firebase-functions');

var admin = require('firebase-admin');

var cors = require('cors')({origin:true});

var serviceAccount = require("./pwagram-fbKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-e77c1.firebaseio.com"
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.storePostData = functions.https.onRequest(function(request, response) {
    cors(request,response,function() {
        const data = request.body;
        admin.database().ref('posts').push({
            id:data.id, 
            title:data['title'] , 
            location:data['location'] ,
            image:data['image']
        }).then(function(){
            response.status(201).json({message:'Data stored',id:data.id});
        })
        .catch(function(err) {
            response.status(500).json({error:err});
        })
    });
    
});
