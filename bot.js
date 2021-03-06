var irc = require('irc');
var Bot = require('./lib/bot').Bot;
var util = require('./lib/util');
var redis = require('redis');

if (process.env.REDIS_URL) {
    var redisURL = require('url').parse(process.env.REDIS_URL);
    var client = redis.createClient(redisURL.port, redisURL.hostname);
    client.auth(redisURL.auth.split(":")[1]);
} else {
    var client = redis.createClient();
}

if (process.env.AEROBOT_CONFIG) {
    var config = JSON.parse(process.env.AEROBOT_CONFIG);
} else {
    var config = {
        irc:{
            host:'irc.freenode.net',
            nick:'aerobot33',
            channels: ['#aerobot-test']
        }
    };
}

var ircConnection  = new irc.Client(config.irc.host, config.irc.nick, {
    channels: config.irc.channels
});

var bot = new Bot(config.irc.nick);

ircConnection.addListener('message', function (from, to, message) {
    if(bot.isStatusMessage(message)) {
        var key = "aerobot:status:" + config.irc.host + ":" + util.normalizeChannelName(to) + ":" + from;
        client.hset(key, new Date().toISOString(), bot.normalizeMessage(message), function (err, reply){
            ircConnection.say(to, from + ': recorded your slacking at <dashboard link coming soon>');
        });
    } else if(bot.isFactoidStoreRequest(message)) {
        var key = "aerobot:factoid:" + config.irc.host + ":" + util.normalizeChannelName(to);
        var request = bot.parseFactoidStoreRequest(message);
        client.hset(key, request.key, request.value, function (err, reply) {
            ircConnection.say(to, from + ': kk');
        });
    } else if(bot.isFactoidRemovalRequest(message)) {
        var key = "aerobot:factoid:" + config.irc.host + ":" + util.normalizeChannelName(to);
        var request = bot.parseFactoidRemovalRequest(message);
        client.hdel(key, request, function (err, reply) {
            ircConnection.say(to, from + ': never heard of it!');
        });
    } else if(bot.isFactoidRetrievalRequest(message)) {
        var key = "aerobot:factoid:" + config.irc.host + ":" + util.normalizeChannelName(to);
        var request = bot.parseFactoidRetrievalRequest(message);
        client.hget(key, request, function (err, reply) {
            if(reply) {
                ircConnection.say(to, from + ': ' + reply);
            } else {
                ircConnection.say(to, from + ': wat?');
            }
        });
    } else if(bot.isKarmaRequest(message)) {
        var key = "aerobot:karma:" + config.irc.host + ":" + util.normalizeChannelName(to);
        var request = bot.parseKarmaRequest(message);
        client.hincrby(key, request.user, request.direction, function (err, reply) {
            var actionText = request.direction === 1 ? 'gained' : 'lost';
            ircConnection.say(to, request.user + ' ' + actionText + ' a level! (Karma: ' + reply + ')');
        });
    }
});