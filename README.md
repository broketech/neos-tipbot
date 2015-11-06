neos-tipbot
===========
Broketech: This is a tipbot I gutted for my use, not to be confused with Infernoman's tipbot. Nothing is really cleaned up, and some original code is simply commented for reference.

Tip anyone on twitter with NeosCoin currently. For security and lower server demands there is no crypto currency node on the server. All the blockchain information is collected from an external explorer. All withdrawal requests are downloaded and handled on a separate system. Another benefit is that there is no fee for tips.

###Dependencies
1. MongoDB
2. Node.js
3. neoscoind


###Install
```
git clone https://github.com/tipsjcx/neos-tipbot.git
cd neos-tipbot
npm install
Enter your twitter api tokens in twitterbot.js
node app.js&
then run 'node reseed.js' to initialize user addresses
```

###TODO
1. Make currency configuration modular (centrally configured)
2. Make explorer configuration modular (centrally configured)
3. Direct messages for privacy
4. Timestamps on everything in database
5. Clean up
```
