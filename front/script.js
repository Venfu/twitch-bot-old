var animationTag = document.getElementById("animation");
var lastFollow = document.getElementById("overlay-lastFollow");
// var lastCmd = document.getElementById("overlay-lastCmd");
var lastAnnounce = document.getElementById("overlay-lastAnnounce");
var category = "";

var displayEvent = () => {
  fetch("/events", {
    headers: {
      Accept: "application/json",
    },
  })
    .then((resp) => resp.text())
    .then((data) => {
      data = JSON.parse(data);

      if (!data.type) {
        // no event.type
        animationTag.innerHTML = "";
        setTimeout(displayEvent, 500);
        return;
      } else if (data.type && data.type.match(/^cmd-/gim)) {
        // lastCmd.innerHTML = `<span style="color: ${data.color};">${data.from}</span> : ${data.message}`;
        setTimeout(displayEvent, 500);
        return;
      } else {
        // play animation
        setTimeout(displayEvent, 10000);
        fetch(`/animations/${category}/${data.animation || "none"}/page.html`)
          .then((resp) => resp.text())
          .then((page) => {
            animationTag.innerHTML = page;

            if (data.sound && data.sound !== "0") {
              var audio = new Audio(
                `/animations/${category}/sounds/${data.sound}.mp3`
              );
              audio.play();
            }
            sendAlert(data);

            if (data.type === "announce") {
              lastAnnounce.innerHTML = `<span style="color: ${data.color};">${data.from}</span> : ${data.plainTextMessage}`;
            } else if (data.type === "follow") {
              lastFollow.innerHTML = `<span style="color: ${data.color};">${data.from}</span>`;
            }
          });
        return;
      }
    });
};

var sendAlert = (data) => {
  var vCustomEvent = new CustomEvent("event", { detail: data });
  document.dispatchEvent(vCustomEvent);
};

var setTheme = (game) => {
  return new Promise((res, rej) => {
    category = game;
    style = document.createElement("style");
    style.appendChild(
      document.createTextNode(` @font-face { font-family: "${game}"; src: url("/animations/${game}/fonts/primary.ttf");}
    * {font-family: "${game}"}`)
    );
    document.head.appendChild(style);
    res(game);
  });
};

var initOverlay = () => {
  fetch("/init/overlay", {
    headers: {
      Accept: "application/json",
    },
  })
    .then((resp) => resp.text())
    .then((data) => {
      data = JSON.parse(data);
      if (data.lastFollow) {
        lastFollow.innerHTML = `<span style="color: ${data.color};">${data.lastFollow}</span>`
      } else {
        setTimeout(() => initOverlay(), 1000);
      }
    });
};

// Run
initOverlay();
setTheme("splatoon").then(() => displayEvent());
