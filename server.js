'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var webpush = require('web-push');
var app = express();

const vapidKeys = {
  publicKey: 'BEIncnp9ZzatTv04uwdwkjhPzhi4tJjsaZ7LaXWSUBy_-Aa9H_KDW1DoYVDDS6bdPeVHGdb0lbZK-ty3SdHUB-s',
  privateKey: 'cfR9gWwAoPgIIkI3lAaqaa26DG0VomL_tkYO8GwZgUE'
};

webpush.setVapidDetails('mailto:694542338@qq.com', vapidKeys.publicKey, vapidKeys.privateKey);

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//To server static assests in root dir
app.use(express.static(__dirname));

//To allow cross origin request
app.use(function(req, res, next) {
  // 看看会不会有cache
  //res.header('Cache-Control', 'must-revalidate, max-age=' + 2419200);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

//To server index.html page
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.post('/send_notification', function(req, res) {
  if (!req.body) {
    res.status(400);
  }
  console.log(req.body)
  var pushSubscription = req.body
  webpush.sendNotification(pushSubscription, 'Your Push Payload Text');
  // setInterval(function(){
  //   webpush.sendNotification(pushSubscription, 'Your Push Payload Text');
  // },1000)
});

app.post('/send_sync_query', function(req, res) {
  console.log(req.body)
  console.log(req.body)
  res.send({data: 'sync res'})
});

app.post('/query_page_a_content', function(req, res) {
  console.log(req.body)
  console.log(req.body)
  res.send({
    data: {
      content: 'content from server',
      origin: 'pageAaaaaaa'
    }
  })
});

app.listen(process.env.PORT || 3002, function() {
  console.log('Local Server : http://localhost:3002');
});
