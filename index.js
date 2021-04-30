require('dotenv').config();
/////////////////////////////////////////////////////////////////////////
const express = require('express'), app = express();

const faker = require('faker')
const bodyParser = require('body-parser')
/////////////////////////////////////////////////////////////////////////

const path = require('path');
const passport = require('passport');

const Database = require('./database');

/////////////////////////////////////////////////////////////////////////

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs')     // Setamos que nossa engine será o ejs
app.use(bodyParser.urlencoded({extended: true}))  // Com essa configuração, vamos conseguir parsear o corpo das requisições


/////////////////////////////////////////////////////////////////////////

var DiscordStrategy = require('passport-discord').Strategy;
 
var scopes = ['identify', 'email', 'guilds'];
 
passport.use(new DiscordStrategy({
    clientID: process.env.CASTLE_CLIENT_ID,
    clientSecret: process.env.CASTLE_CLIENT_SECRET,
    callbackURL: process.env.CASTLE_CALLBACK_URI,
    scope: scopes
},
function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ discordId: profile.id }, function(err, user) {
        return cb(err, user);
    });
}));

/////////////////////////////////////////////////////////////////////////

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), function(req, res) {
    res.redirect('/logged') // Successful auth
});

app.get("/logged", async (req, res) => {
  console.dir(req);
  res.json(req.query);
});

/////////////////////////////////////////////////////////////////////////

app.get('/:uid/dashboard', async (req, res) => {
    const userId = req.params['uid'];

    const chars = await Database('chars');
    var char = await chars.get(userId);
    char = char.value;

    var attrsTotal = 0;

    if (char.attrs) {char.attrs.map(data => {
        attrsTotal += parseFloat(data.value);
    })}

    char.attrsTotal = attrsTotal;

    console.dir(char);

    var initials = [];
    if (char && char.name) {char.name.split(" ").map(n => {
        initials.push(n[0]);
    });
    initials = initials.join("");}

    if (!char.initials && initials[0]) char.initials = initials;

    if (!char.avatar) char.avatar = `https://dummyimage.com/256/000/fff&text=${initials}`;

    res.render('dashboard', char);
});

app.post('/:uid/dashboard', async (req, res) => {
    const userId = req.params['uid'];

    const chars = await Database('chars');
    var char = await chars.get(userId);
    char = char.value;
    const anteriorCharValue = char;


    const body = req && req.body;
    console.dir(body);

    var attrs = [];
    if (char.attrs) {char.attrs.map(data => {
        var dataName = `status_${data.name}`;

        var dataValue = parseFloat(body[dataName]);

        attrs.push({name: data.name, value: dataValue});
    });

    char.attrs = attrs;}
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
    if (anteriorCharValue != char) chars.set(char.id, char);

    res.render('dashboard', char);
});

/////////////////////////////////////////////////////////////////////////

app.listen(3000, () => {
    console.log(`App iniciado na porta 3000.`);
});