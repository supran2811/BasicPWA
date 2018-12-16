var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin:true});
var serviceAccount = require("./pwagram-fbKey.json");
var webpush = require('web-push');

var fs = require('fs');
var path = require('path');

var Busboy = require('busboy');
var UUID = require('uuid-v4');
var os = require('os');

var gcConfig = {
    projectId: 'pwagram-e77c1',
    keyFilename:'pwagram-fbKey.json'
}

var gcs = require('@google-cloud/storage')(gcConfig);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-e77c1.firebaseio.com"
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.storePostData = functions.https.onRequest(function(request, response) {
    cors(request,response,function() {
        var busboy = new Busboy({headers:request.headers});
        var upload;
        var fields = {}
        var uuid = UUID();

        busboy.on('file' , function(fieldname , file , filename , encoding , mimetype) {
            var filePath = path.join(os.tmpdir(),filename);
            upload = {file:filePath , type : mimetype};
            file.pipe(fs.createWriteStream(filePath));
        });

        busboy.on('field' , function(fieldname,val,filename,encoding , mimetype) {
            fields[fieldname] = val;
        });

        busboy.on('finish' , function() {
            var bucket = gcs.bucket('pwagram-e77c1.appspot.com');
            bucket.upload(
                upload.file , 
                {
                    uploadType : 'media',
                    metadata : {
                        metadata : {
                            contentType : upload.type,
                            firebaseStorageDownloadTokens:uuid
                        }
                    }
                },
                function(err , uploadedFile) {
                    if(!err) {
                        const data = fields;
                        admin.database().ref('posts').push({
                            id:data.id, 
                            title:data['title'] , 
                            location:data['location'] ,
                            image: "https://firebasestorage.googleapis.com/v0/b/" +
                            bucket.name +
                            "/o/" +
                            encodeURIComponent(uploadedFile.name) +
                            "?alt=media&token=" +
                            uuid,
                            rawLocation: {
                                lat: data['rawLocationLat'],
                                lng: data['rawLocationLng']
                            }
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
                                    content: 'New Push Post Sucess!!',
                                    openUrl:'/help'
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
                    }
                    else {
                        console.log("Error while uplaoding ", err);
                    }
                }
            )
        });

        busboy.end(request.rawBody);
        
    });
    
});
