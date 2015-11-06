// Copyright © 2014 tipsjcx
// butchery provided by broketech 2014

var Twit = require('twit')
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('127.0.0.1:27017/neostipper');

// Constructor
function twitterbot(bs) {
   var T = new Twit({
    consumer_key:         '',
    consumer_secret:      '',
    access_token:         '',
    access_token_secret:  ''
  });

   var config = {nick: "NEOSTipbot"};
   
   // get a stream of everything sendt to the bot
   var stream = T.stream('statuses/filter', { track: config.nick})
   
   stream.on('tweet', function (tweet) {      
      var arr = tweet.text.split(" ");
      if (arr[0] != "@"+config.nick) return;
      if ((arr[1] == "deposit")||(arr[1] == "Deposit")||(arr[1] == "address")||(arr[1] == "Address")) handleDeposit(tweet.user.screen_name, bs, T);
      if ((arr[1] == "register")||(arr[1] == "Register")) handleRegister(tweet.user.screen_name, bs, T);
      if (((arr[1] == "tip")||(arr[1] == "Tip")) && (arr.length > 4)) handleTip(tweet.user.screen_name, arr[2], arr[3], arr[4], bs, T);
      if ((arr[1] == "balance")||(arr[1] == "Balance")) handleBalance(tweet.user.screen_name, bs, T);
      if ((arr[1] == "withdraw")&&(arr[3] == "neos")) handleWithdraw(tweet.user.screen_name, arr[4], arr[2] , bs, T);
      if ((arr[1] == "reconcile")&&(tweet.user.screen_name == "YOURTWITTERHANDLEBOTADMIN")) handleReconcile(tweet.user.screen_name, arr[2], bs, T);
   }); 
}

var handleReconcile = function(from, subject, bs, T) {
    db.get('users').findOne({"twitter":subject},{},function(err,data){
      if (err) return;
      if (!data) return;
      console.log("Reconcile attempt! "+from+" is operator");
      bs.reconciletest(subject, function(status) {
        T.post('statuses/update', { status: "@"+from+" "+status}, function(err, data, response) {});
      });
    });
}


      

var handleWithdraw = function(from, to, quantity, bs, T) {
    db.get('users').findOne({"twitter":from},{},function(err,data){
        if (err) return;
        if (!data) return;
        console.log("Withdraw " + quantity + " from " + data.addr + " to " + to + "");
        bs.withdraw(data.addr, quantity, to, .01, function(status) { // fee is '0.1', adjust to taste. to help prevent under runs.
           T.post('statuses/update', { status: "@"+from+" "+status}, function(err, data, response) {}); 
        });
    });   
}

var handleBalance = function(from, bs, T) {
   console.log(from);
   db.get('users').findOne({"twitter":from},{},function(err,data){
      console.log(data);
      if (err) return;
      if (!data) return;
        bs.getBalance(data.addr, function(balance) {  
          T.post('statuses/update', { status: "@"+from+" Your balance is " + balance.NEOS +" NEOS " }, function(err, data, response) {}); 
      });
      
   });
}

// @tipbotname tip @tipped_party 100 
var handleTip = function(from, to, neos, asset, bs, T) {
   if (to == from) return; // don't tip your self
   if (asset != "neos") return;
   to = to.substring(1); // cut away the @
   console.log("Looking for " +to );
   handleValidate( to, T, function(vdata) {
     console.log("???vdata: "+vdata);
     if (!vdata) return;
     setTimeout(function(){
        db.get('users').findOne({"twitter":vdata},{},function(err,tdata){
          if (err) return;
          if (!tdata) return;
          console.log("tdata space");
        db.get('users').findOne({"twitter":from},{},function(err,fdata){
          if (err) return;
          if (!fdata) return;
          console.log("fdata space");
          console.log(fdata.addr + " is tipping " + tdata.addr );
          bs.send(fdata.addr, tdata.addr, "NEOS", neos , function(status) {
              T.post('statuses/update', { status: "@"+from+" "+status }, function(err, data, response) {});
              db.close();
            
          });
        });
        });
     }, 2000);
  });
};

var handleDeposit = function(from, bs, T) {
   console.log("Address query from: "+from);
   db.get('users').findOne({"twitter":from},{},function(err,data){
     if (!data) {
       handleRegister( from, bs, T);
       return;
     };
     
     if (err) return;
     console.log(data);
     T.post('statuses/update', { status: "@"+from+" your NEOS address is "+ data.addr }, function(err, data, response) {});
      
   });
};

var handleValidate = function(to, T, cb) {
  db.get('users').findOne({"twitter":to},{},function(err,mdata){
    if (err) return;
    if (!mdata) {
       T.get('users/show', { screen_name: to }, function(err, sdata, response){
         if (err) return;
         if (!sdata.screen_name) return;
         db.get('users').findOne({"twitter":sdata.screen_name},{},function(err,mdata){
           if (err) return;
           if (!mdata){
              handleRegister( sdata.screen_name, bs, T);
              console.log("Debug: Unregistered User, To: "+to+", screen_name: "+sdata.screen_name);
              cb(sdata.screen_name);
           };
           if (mdata) {
           if (mdata.twitter == sdata.screen_name){ cb(mdata.twitter);
           };
           };
         });
      });
    } else {
    if (mdata.twitter == to) {
      cb(to);
    };
    };
  });
};

var handleRegister = function(from, bitcoinNode, T) {
  db.get('users').findOne({"twitter":from},{},function(err,data){ // Check that this user is not in the DB
      if (data) return;
      bs.getNewAddress(function(addr)   // get new address
      {
            if (err) return console.log(err); 
            db.get('users').update({addr: addr}, {$set:{twitter: from}},{}, function(err, result) { // update the address line with user info    
               if (err) return console.log(err); 
               T.post('statuses/update', { status: "@"+from+" your new NEOS address is "+ addr }, function(err, data, response) {});
            });
     });
  });
};

// export the class
module.exports = twitterbot;
