var functions = require('firebase-functions');

var admin = require('firebase-admin');

var cors = require('cors')({origin:true});

var serviceAccount = require("./pwagram-fbKey.json");

var webpush = require('web-push');

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
            webpush.setVapidDetails('mailto:supran@email.com',
            'BFv13pwdEHJ32WQthpx2xhPeI4hc3CN_P3_A-KY_V3nXmiX93rmNVXn0354_cTRIvgd2iD1O13zr2D1bAs2G2mc',
            'opbTbnipRww2G3wbdlsAI-BxxacGDAh0rLcYMMwSQ-M');
           
            return admin.database().ref('subscription').once('value');
        })
        .then(function(subscriptions) {
            subscriptions.forEach(function(sub) {
                var pushConfig = {
                    endpoint: sub.val().endpoint,
                    keys: {
                        auth: sub.val().keys.auth,
                        p256dh:sub.val().keys.p256dh
                    }
                };
                webpush.sendNotification(pushConfig,JSON.stringify({
                    title: 'New Post',
                    content: 'New Push Post Sucess!!'
                }))
                .catch(function(pushError) {
                    console.log({pushError});
                });
            });
            response.status(201).json({message:'Data stored',id:data.id});
        })
        .catch(function(err) {
            console.log({err});
            response.status(500).json({error:err});
        })
    });
    
});
