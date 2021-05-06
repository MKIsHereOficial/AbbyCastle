require('dotenv').config();
/////////////////////////////////////////////////////////////////////////
const express = require('express'), app = express();

const faker = require('faker')
const bodyParser = require('body-parser')
/////////////////////////////////////////////////////////////////////////

const random = require('random');

const path = require('path');
const passport = require('passport');

const Database = require('./database');

const {fetchUser, fetchURL} = require('./utils');

/////////////////////////////////////////////////////////////////////////

const firebaseConfig = {
  apiKey: "AIzaSyD8E9hZV0D_zgQJZu9oB92a17oFWvaNU5g",
  authDomain: "abbythebot-b5876.firebaseapp.com",
  databaseURL: "https://abbythebot-b5876-default-rtdb.firebaseio.com",
  projectId: "abbythebot-b5876",
  storageBucket: "abbythebot-b5876.appspot.com",
  messagingSenderId: "133999644329",
  appId: "1:133999644329:web:6084802693094f06b7e3b8",
  measurementId: "G-TSWWF4GD3Y"
};

var firebase = require('firebase/app');
require('firebase/storage');

firebase.initializeApp(firebaseConfig);

const storage = firebase.storage();

/////////////////////////////////////////////////////////////////////////

app.set('view engine', 'ejs')     // Setamos que nossa engine será o ejs
app.use(bodyParser.urlencoded({extended: true}))  // Com essa configuração, vamos conseguir parsear o corpo das requisições
app.use(express.json());

app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(require('cookie-parser')());
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

/////////////////////////////////////////////////////////////////////////

var DiscordStrategy = require('passport-discord').Strategy;
 
var scopes = ['identify', 'email', 'guilds'];
 
passport.use(new DiscordStrategy({
    clientID: process.env.CASTLE_CLIENT_ID,
    clientSecret: process.env.CASTLE_CLIENT_SECRET,
    callbackURL: process.env.CASTLE_CALLBACK_URI,
    scope: scopes
},
async function(accessToken, refreshToken, profile, done) {
    const user = {id: profile.id};
  
    var user_cache = {};

    passport.serializeUser(function(user, next) {
      let id = user.id;
      user_cache[id] = user;
      next(null, id);
    });

    passport.deserializeUser(function(id, next) {
      next(null, user_cache[id]);
    });

    done(null, user);
}));

/////////////////////////////////////////////////////////////////////////

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/logged', passport.authenticate('discord', {
    failureRedirect: '/',
    session: false
}), async function(req, res) {
    const accessToken = req.query['code'] || false;

    var user;
    if (accessToken) {
      user = req.user;
    }
    res.render(`utils/redirect`, {url: `https://abbycastle.mkishereoficial.repl.co/${user.id}/dashboard`}) // Successful auth
});

app.get('/', async (req, res) => {
  if (req.user) {
    console.dir(req.user);
    return res.render('utils/redirect', {url: `https://abbycastle.mkishereoficial.repl.co/${req.user.id}/dashboard`})
  }
  res.render('index');
});


/////////////////////////////////////////////////////////////////////////

app.get('/:uid/dashboard', async (req, res) => {
    const userId = req.params['uid'];

    const chars = await Database('chars');
    var char = await chars.exists(userId);

    var baseChar = await chars.get("base");
    baseChar = baseChar.value;
    //console.dir(baseChar);
    baseChar = JSON.stringify(baseChar);
    if (!char || !char.exists) return res.render("errors/withoutChar", {id: userId, baseChar });

    char = char.value;

    var attrsTotal = 0;

    if (char.attrs) {char.attrs.map(data => {
        attrsTotal += parseFloat(data.value);
    })}

    char.attrsTotal = attrsTotal;

    //console.log(char);


    var initials = [];
    if (char && char.name) {char.name.split(" ").map(n => {
        initials.push(n[0]);
    });
    initials = initials.join("");}

    if (!char.initials && initials[0]) char.initials = initials;

    if (!char.avatar || char.avatar === `https://dummyimage.com/256/000/fff&text=${initials}`) {
        char.avatar = `https://dummyimage.com/256/000/fff&text=${initials}`;

        var avatar = `https://firebasestorage.googleapis.com/v0/b/abbythebot-b5876.appspot.com/o/avatars%2F${char.id}.txt?alt=media&token=75d800d3-fe15-4f39-894b-5333126dd696`;
        
        avatar = await fetchURL(avatar);
        
        
        if (avatar.err) return console.error(avatar);

        if (avatar.data) {
          avatar = avatar.data;
          char.avatar = avatar;
        }
      };

    char.hp.max = parseInt((char.attrs.find(a => a.name === "Tamanho").value + char.attrs.find(a => a.name === "Constituição").value) / 2) || 0;
    char.sanity.max = parseInt(char.attrs.find(a => a.name === "Poder").value * 5);

    res.render('dashboard', {char, randomInt: random.float});
});

app.post('/:uid/dashboard', async (req, res) => {

    res.setHeader("Access-Control-Allow-Origin", "*");

    const userId = req.params['uid'];

    const chars = await Database('chars');
    var char = await chars.get(userId);
    char = char.value;
    const anteriorCharValue = char;


    const body = req && req.body;

    var attrs = [];
    if (char.attrs && body['status_Força']) {
      char.attrs.map(data => {
        var dataName = `status_${data.name}`;

        var dataValue = parseFloat(body[dataName]);

        attrs.push({name: data.name, value: dataValue});
      });

      char.attrs = attrs;
    } 
    if (body['progress_hp']) {
      char.hp.value = parseInt(body['progress_hp']);
    } 
    if (body['progress_san']) {
      char.sanity.value = parseInt(body['progress_san']);
    }
    var attrsTotal = 0;

    if (char.attrs) {char.attrs.map(data => {
        attrsTotal += parseFloat(data.value);
    })}

    char.attrsTotal = attrsTotal;

    var initials = [];
    if (char && char.name) {char.name.split(" ").map(n => {
        initials.push(n[0]);
    });
    initials = initials.join("");}

    if (!char.initials && initials[0]) char.initials = initials;
    if (!char.avatar) char.avatar = `https://dummyimage.com/256/000/fff&text=${initials}`;
    //if (anteriorCharValue != char) await chars.set(userId, char);
    
    char.hp.max = parseInt((char.attrs.find(a => a.name === "Tamanho").value + char.attrs.find(a => a.name === "Constituição").value) / 2) || 0;
    char.sanity.max = parseInt(char.attrs.find(a => a.name === "Poder").value * 5);
    
    char = await chars.set(userId, char);
    char = char.value;

    //console.log(char);

    res.render('dashboard', {char, randomInt: random.float});
});

/////////////////////////////////////////////////////////////////////////

app.listen(3000, () => {
    console.log(`App iniciado na porta 3000.`);
});