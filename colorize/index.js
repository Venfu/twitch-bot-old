colors = ["00ffcc", "ff00ff", "0066ff", "66ff33", "ff0066"];
module.exports = {
  apply: (message, color) => {
    if (color.match(/^\#/gim)) color = color.substr(1);
    return `<strong style="color: #${color};">${message}</strong>`;
  },
  randomize: (message) => {
    return `<strong style="color: #${
      colors[Math.floor(Math.random() * colors.length)]
    };">${message}</strong>`;
  },
};
