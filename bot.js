var irc = require('irc');
var Bot = require('./lib/bot').Bot;
var util = require('./lib/util');
var _ = require('lodash');
var requireDir = require('require-dir');
var handlers = requireDir('./lib/handlers');
var nsfwHandlers = requireDir('./lib/nsfw_handlers');
var db = require('./models');

if (process.env.AEROBOT_CONFIG) {
    var config = JSON.parse(process.env.AEROBOT_CONFIG);
} else {
    var config = {
        irc:{
            host:'irc.freenode.net',
            nick:'aerobot_qmx',
            channels: ['#aerobot-test']
        }
    };
}

if (!config.nsfwChannels) {
    config.nsfwChannels = []
}

if (process.env.UD_API_KEY) {
    if (!config.urbandictionary) {
        config.urbandictionary = {};
    }
    config.urbandictionary.API_KEY = process.env.UD_API_KEY;
}

var ircConnection  = new irc.Client(config.irc.host, config.irc.nick, {
    channels: config.irc.channels
});

var bot = new Bot(config.irc.nick);

ircConnection.addListener('message', function (from, to, message) {
    for (var handler in handlers) {
        handlers[handler](config, ircConnection, bot, db, from, to, message);
    }
    if (config.nsfwChannels.includes(to)) {
        for (var handler in nsfwHandlers) {
            nsfwHandlers[handler](config, ircConnection, bot, db, from, to, message);
        }
    }
});
