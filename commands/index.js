var request = require("request");
var vDataBase = require("../db/index.js");

var vQueue = require("../events/index.js");
var vColorize = require("../colorize/index.js");

module.exports = {
  initialized: false,
  client: null,
  init: (username, accessToken, channel) => {
    if (module.exports.initialized) return;

    const tmi = require("tmi.js");
    // Define configuration options
    const opts = {
      identity: {
        username: username,
        password: `oauth:${accessToken}`,
      },
      channels: [channel],
    };

    // Create a client with our options
    module.exports.client = new tmi.client(opts);

    // Register our event handlers (defined below)
    module.exports.client.on("message", onMessageHandler);
    module.exports.client.on("connected", onConnectedHandler);

    // Connect to Twitch:
    module.exports.client.connect();
    module.exports.channel = channel;
    module.exports.initialized = true;
  },
  sendText: (text) => {
    module.exports.client.say(`#${module.exports.channel}`, text);
  },
};

// Called every time a message comes in
function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  } // Ignore messages from the bot

  ///////////////////
  // TEST EVENTS
  ///////////////////
  // vQueue.enqueue({
  //   type: "test",
  //   message: vColorize.apply(msg.trim(), context.color),
  // });
  ///////////////////
  // /TEST EVENTS
  ///////////////////

  // Remove whitespace from chat message
  const commandName = msg.trim();

  // Commons commands
  if (commandName === "!cmd") {
    module.exports.client.say(target, cmd());
  }

  if (commandName.match(/^\!dé( [0-9]*)?$/gim)) {
    module.exports.client.say(target, rollDice(commandName.substr(4)));
    vQueue.enqueue(
      new vQueue.Model(
        "cmd-de",
        rollDice(commandName.substr(4)),
        context.color || vColorize.getRandomColor(),
        context["display-name"],
        "",
        0,
        0
      )
    );
  }

  if (commandName.match(/^\!hug( \@?[A-z1-9_]*)?$/gim)) {
    module.exports.client.say(
      target,
      hug(context["display-name"], commandName.substr(5))
    );
    vQueue.enqueue(
      new vQueue.Model(
        "cmd-hug",
        hug(context["display-name"], commandName.substr(5)),
        context.color || vColorize.getRandomColor(),
        context["display-name"],
        commandName.substr(5),
        0,
        0
      )
    );
  }

  if (commandName === "!ca") {
    module.exports.client.say(target, ca());
    vQueue.enqueue(
      new vQueue.Model(
        "cmd-ca",
        ca(),
        context.color || vColorize.getRandomColor(),
        context["display-name"],
        "",
        0,
        0
      )
    );
  }

  if (commandName.match(/^!clip( [0-9]{1,2})?/gim)) {
    vDataBase.get("self").then((self) => {
      self = JSON.parse(self);
      request(
        {
          uri: `https://api.twitch.tv/helix/clips?broadcaster_id=${self.data[0].id}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + self.accessToken,
            "Client-ID": self.clientId,
          },
        },
        (err, resp, data) => {
          if (err) console.log("Erreur création Clip");
          else {
            data = JSON.parse(data);
            if (data.status && data.status === 404) return;
            module.exports.client.say(target, data.data[0].edit_url);
          }
        }
      );
    });
  }

  if (context.mod || (context.badges && context.badges.broadcaster === "1")) {
    // Moderator commands
    if (commandName.match(/^\!\!/gim)) {
      vQueue.enqueue(
        new vQueue.Model(
          "announce",
          `🔔🔔 Annonce de ${
            context.color
              ? vColorize.apply(context["display-name"], context.color)
              : vColorize.randomize(context["display-name"])
          } : ${vColorize.randomize(commandName.substr(2))} 🔔🔔`,
          context.color || vColorize.getRandomColor(),
          context["display-name"],
          null,
          1,
          1,
          commandName.substr(2)
        )
      );
    }
  }
}

// COMMANDS
function cmd() {
  return `Liste des commandes : 
    !dé <nombre> 🎲 
    !ca 🌐 
    !hug @ 🤗 
    !clip 🔴 `;
}

// DE
function rollDice(sides) {
  if (!sides) sides = 6;
  return `Vous avez obtenu un ${
    Math.floor(Math.random() * sides) + 1
  } (sur ${sides})`;
}

// CODE AMI
function ca() {
  return "Code ami : SW-1007-3695-2904";
}

// HUG
function hug(from, to) {
  if (!to) to = "tous les viewers de la chaine";
  if (to.match(/^\@.*/gim)) to = to.substr(1);
  return `${from} envoie un gros câlin à ${to} ! 🤗🤗🤗`;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
