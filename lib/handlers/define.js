var util = require('../util');
var unirest = require('unirest');

module.exports = function(config, irc, bot, db, from, to, message) {
    if (config.urbandictionary && config.urbandictionary.API_KEY) {
        if(bot.isDefineRequest(message)) {
            var define = bot.parseDefineRequest(message);
            var word = define.word;
            unirest.get("https://mashape-community-urban-dictionary.p.mashape.com/define?term=" + encodeURIComponent(word))
            .header("X-Mashape-Key", config.urbandictionary.API_KEY)
            .header("Accept", "text/plain")
            .end(function (result) {
                if (result.body.list && result.body.list[0]) {
                    irc.say(to, word + ' is ' + result.body.list[0].definition);
                } else {
                    irc.say(to, word + ' is not defined');
                }
            });
        } 
    }
};
