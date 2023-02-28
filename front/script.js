var body = document.querySelectorAll("body")[0];

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
        body.innerHTML = "";
        setTimeout(displayEvent, 500);
        return;
      }

      setTimeout(displayEvent, 10000);
      fetch("/animations/squid/page.html")
        .then((resp) => resp.text())
        .then((page) => {
          body.innerHTML = page;
          var vCustomEvent = new CustomEvent("event", { detail: data });
          document.dispatchEvent(vCustomEvent);
        });
    });
};

displayEvent();
