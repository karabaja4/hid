const print = (colorCode, label, text) => {
  if (text) {
    console.log(`[\x1b[${colorCode}m${label}\x1b[0m] %s`, text);
  }
};

const info = (text) => print(94, 'INFO', text);
const success = (text) => print(32, 'SUCCESS', text);
const error = (text) => print(91, 'ERROR', text);
const bash = (text) => print(35, 'BASH', text);

const fatal = (text) => {
  error(text);
  process.exit(1);
};

module.exports = {
  info,
  success,
  error,
  bash,
  fatal
};
