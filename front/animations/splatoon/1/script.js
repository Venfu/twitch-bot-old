// thx for the job ! https://codepen.io/imjames/pen/aRKyow
var index = 0;

document.addEventListener("event", (e) => {
  if (!document.querySelectorAll(".squid")[0]) return;
  
  document.getElementById("message").innerHTML = `${e.detail.message}`;

  var numberOfSquids = 5;
  var leftPosition = 15;


  for (var i = 1; i <= numberOfSquids; i++) {
    var squid = document.querySelectorAll(".squid")[0].cloneNode(true);
    squid.style.left = leftPosition * i + "%";
    squid.style.animationDelay = i * 0.15 + "s";
    document.querySelectorAll(".background")[0].appendChild(squid);
  }
});
