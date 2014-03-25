/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var express         = require('express');
var passport        = require('passport');
var OAuth2Strategy  = require('passport-oauth2');
var request         = require('request');

var gitterHost    = process.env.HOST || 'https://gitter.im';
var port          = process.env.PORT || 7000;

// Client OAuth configuration
var clientId      = process.env.GITTER_KEY;
var clientSecret  = process.env.GITTER_SECRET;

var app = express();

// Middlewares
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static( __dirname + '/public'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// Passport Configuration

passport.use(new OAuth2Strategy({
    authorizationURL:   gitterHost + '/login/oauth/authorize',
    tokenURL:           gitterHost + '/login/oauth/token',
    clientID:           clientId,
    clientSecret:       clientSecret,
    callbackURL:        '/login/callback',
    passReqToCallback:  true
  },
  function(req, accessToken, refreshToken, profile, done) {

    req.session.token = accessToken;

    // Request User details using the obtained token

    var options = {
     url: gitterHost + '/api/v1/user',
     headers: {
       'Authorization': 'Bearer ' + accessToken
     }
    };

    request(options, function (error, _res, body) {
      if (_res.statusCode == 200) {
        var user = JSON.parse(body)[0];
        return done(null, user);
      } else {
        return done(error);
      }
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user));
});

passport.deserializeUser(function (user, done) {
  done(null, JSON.parse(user));
});

app.get('/login', 
  passport.authenticate('oauth2')
);

app.get('/login/callback', 
  passport.authenticate('oauth2', {
    successRedirect: '/',
    failureRedirect: '/'
  })
);

app.get('/logout', function(req,res) {
  req.session.destroy();
  res.redirect('/');
});

app.get('/', function(req, res) {
  res.render('home', {user: req.user, token: req.session.token, clientId: clientId});
});

app.listen(port);
console.log('Demo app running at http://localhost:' + port);
