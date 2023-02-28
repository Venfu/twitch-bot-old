colors = ["00ffcc", "ff00ff", "0066ff", "66ff33", "ff0066"];
module.exports = {
  apply: (message, color) => {
    if (color.match(/^\#/gim)) color = color.substr(1);
    return `<span style="color: #${color};">${message}</span>`;
  },
  randomize: (message) => {
    return `<span style="color: #${
      colors[Math.floor(Math.random() * colors.length)]
    };">${message}</span>`;
  },
};
