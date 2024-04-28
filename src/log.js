const print = (label, colorCode, text) => {
  if (text) {
    console.log(`[\x1b[${colorCode}m${label}\x1b[0m] %s`, text);
  }
};

const info = (text) => print('INFO', 94, text);
const success = (text) => print('SUCCESS', 32, text);
const error = (text) => print('ERROR', 91, text);
const bash = (text) => print('BASH', 35, text);

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