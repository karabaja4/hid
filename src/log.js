const info = (text) => {
  if (text) {
    console.log('[\x1b[94mINFO\x1b[0m] %s', text);
  }
};

const success = (text) => {
  if (text) {
    console.log('[\x1b[92mSUCCESS\x1b[0m] %s', text);
  }
};

const error = (text) => {
  if (text) {
    console.log('[\x1b[91mERROR\x1b[0m] %s', text);
  }
};

const fatal = (text) => {
  error(text);
  process.exit(1);
};

module.exports = {
  info,
  success,
  error,
  fatal
};