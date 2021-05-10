require('dotenv').config();
/////////////////////////////////////////////////////////////////////////
const axios = require('axios').default;
const Discord = require('discord.js'), client = new Discord.Client();

const SETTINGS = {
  LOGS_CHANNEL_ID: '840698451205685270',
  LOGS_PATH: '/logs',
  ROOT_PATH: 'https://abbycastle.mkishereoficial.repl.co',
  MAIN_COLOR: '#ffd700'
}
client.config = SETTINGS;
client.LOGS = [];


function addLogToChannel(data) {
  const channel = client.channels.cache.get(client.config.LOGS_CHANNEL_ID);

  if (data === "init") {
    const embed = new Discord.MessageEmbed()
      .setTitle("Relatórios")
      .setDescription("Site iniciado!")
      .setTimestamp()
      .setColor(client.config.MAIN_COLOR);

    channel.send(embed).then(msg => {
      if (true) setTimeout(() => {msg.delete()}, 3000);
    });
  } else if (data && data['title'] && data['body']) {
    const createdAt = new Date();
    data.createdAt = createdAt.getTime();
    const embed = new Discord.MessageEmbed()
      .setTitle(data.title)
      .setDescription(data.body)
      .setTimestamp()
      .setColor(client.config.MAIN_COLOR);

    channel.send(embed);
    return {data, logs: client.LOGS};
  }
}
/////////////////////////////////////////////////////////////////////////

client.on('ready', () => {
  console.log(`[BOT]`, `Iniciei-me como "${client.user.tag}"!`);
  addLogToChannel('init');
});

/////////////////////////////////////////////////////////////////////////

async function LOGSGET (req, res) {
  const {onSite, onBot} = req.query;

  if (onSite && onBot) {
    console.log(onSite);
    client.LOGS.push(onSite);
    addLogToChannel(JSON.parse(onBot));

    return res.json({logs: client.LOGS, onBot});
  } else {
    res.render('logs', {logs: client.LOGS});
  }
}

async function LOGSPOST (req, res) {
  res.json({tag: client.user.tag, logs: client.LOGS});
}

/////////////////////////////////////////////////////////////////////////

module.exports = (app = require('express')()) => {
  client.login(process.env.CASTLE_TOKEN);

  async function addLog(onSite = null, onBot = null) {
    var returned = {};
    if (onSite && onBot) {
      if (onBot.title) onBot = JSON.stringify(onBot);
      await axios({method: 'GET', url: `${client.config.ROOT_PATH}${client.config.LOGS_PATH}?onSite=${onSite}&onBot=${onBot}`}).catch(console.error).then((r) => {
        returned = r.data;
      });
    } else if (onSite) {
      await axios({method: 'GET', url: `${client.config.ROOT_PATH}${client.config.LOGS_PATH}?onSite=${onSite}`}).catch(console.error).then((r) => {
        returned['logs'] = r.data;
      });
    }

    return returned;
  }

  return {client, LOGSGET, LOGSPOST, LOGSPATH: client.config.LOGS_PATH, log: addLog};
}

process.on('beforeExit', () => {
  client.destroy();
});