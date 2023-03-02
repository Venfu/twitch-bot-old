var websocket = require("ws");
var request = require("request");
var vDataBase = require("../db/index.js");
var vQueue = require("../events/index.js");
var vCommands = require("../commands/index.js");
var vColorize = require("../colorize/index.js");

const URL_EVENTS_SUBSCRIPTION =
  "https://api.twitch.tv/helix/eventsub/subscriptions";

const URL_WEBSOCKET = "wss://eventsub-beta.wss.twitch.tv/ws";
// const URL_WEBSOCKET = "ws://localhost:8080/eventsub"; // mock

module.exports = {
  sessionID: "",
  init: () => {
    return new Promise((done, rej) => {
      if (module.exports.sessionID) {
        return rej(new Error("Ws already initialized"));
      }

      const ws = new websocket(URL_WEBSOCKET);

      ws.on("message", (data) => {
        data = JSON.parse(data);
        if (data.metadata.message_type === "session_welcome") {
          module.exports.sessionID = data.payload.session.id;
          done();
        }

        // RAID
        if (
          data.metadata.message_type === "notification" &&
          data.metadata.subscription_type === "channel.raid"
        ) {
          var messageEvent = `Accueillons chaleureusement ${vColorize.randomize(
            data.payload.event.from_broadcaster_user_name
          )} et ses <strong>${vColorize.apply(
            data.payload.event.viewers,
            "ff0000"
          )}</strong> Viewers !`;
          var messageChat = `Merci pour le raid ${data.payload.event.from_broadcaster_user_name} ❤️❤️❤️`;

          vQueue.enqueue(
            new vQueue.Model(
              "raid",
              messageEvent,
              vColorize.getRandomColor(),
              data.payload.event.from_broadcaster_user_name
            )
          );
          vCommands.sendText(messageChat);
        }

        // FOLLOW
        if (
          data.metadata.message_type === "notification" &&
          data.metadata.subscription_type === "channel.follow"
        ) {
          vDataBase
            .get(`followers?from_id=${data.payload.event.user_id}`)
            .then((user) => {
              user = JSON.parse(user);
              if (user.length) return;
              var messageChat = `Merci pour le follow ${data.payload.event.user_name} ❤️❤️❤️`;
              var messageEvent = `Merci pour le follow ${vColorize.randomize(
                data.payload.event.user_name
              )} ❤️❤️❤️`;
              vQueue.enqueue(
                new vQueue.Model(
                  "follow",
                  messageEvent,
                  vColorize.getRandomColor(),
                  data.payload.event.user_name
                )
              );
              vCommands.sendText(messageChat);
              vDataBase.post("followers", {
                from_id: data.payload.event.user_id,
                from_login: data.payload.event.user_login,
                from_name: data.payload.event.user_name,
                to_id: data.payload.event.broadcaster_user_id,
                to_login: data.payload.event.broadcaster_user_login,
                to_name: data.payload.event.broadcaster_user_name,
                followed_at: data.payload.event.followed_at,
                id: 0,
              });
            });
        }
      });
    });
  },
  subscribeToFollowEvent: (clientID, accessToken, userID) => {
    var postData = {
      type: "channel.follow",
      version: "2",
      condition: { broadcaster_user_id: userID, moderator_user_id: userID },
      transport: {
        method: "websocket",
        session_id: module.exports.sessionID,
      },
    };
    var clientServerOptions = {
      uri: URL_EVENTS_SUBSCRIPTION,
      body: JSON.stringify(postData),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": clientID,
      },
    };
    request(clientServerOptions, function (error, response) {
      console.log("Subscribe to Follow Events", response.body);
      return;
    });
  },
  subscribeToRaidEvent: (clientID, accessToken, userID) => {
    var postData = {
      type: "channel.raid",
      version: "1",
      condition: {
        to_broadcaster_user_id: userID,
      },
      transport: {
        method: "websocket",
        session_id: module.exports.sessionID,
      },
    };
    var clientServerOptions = {
      uri: URL_EVENTS_SUBSCRIPTION,
      body: JSON.stringify(postData),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": clientID,
      },
    };
    request(clientServerOptions, function (error, response) {
      console.log("Subscribe to Raid Events", response.body);
      return;
    });
  },
  subscribeToSubEvent: (clientID, accessToken, userID) => {},
};
