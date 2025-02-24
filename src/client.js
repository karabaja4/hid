const readline = require('node:readline');
const WebSocket = require('ws');
const keys = require('./keys');
const log = require('./log');

let ws = null;

const sendSequence = async (keyName, ctrl, shift, alt) => {
  const keySequence = keys.getKeySequence(keyName, ctrl, shift, alt);
  if (keySequence) {
    ws.send(keySequence); // release sequence will be handled by the server
  } else {
    log.error(`No sequence mapping for: ${keyName}`)
  }
};

const doKeypress = async (keyInfo) => {
  if (keyInfo) {
    // on bash for windows
    // ctrl+f9 comes with keyInfo.name undefined and sequence \x1b[20^
    // ctrl+f10 comes with keyInfo.name undefined and sequence \x1b[21^
    if (keyInfo.name === 'undefined') {
      if (keyInfo.sequence === '\x1b[20^') {
        keyInfo.name = 'f9';
        keyInfo.ctrl = true;
      }
      if (keyInfo.sequence === '\x1b[21^') {
        keyInfo.name = 'f10';
        keyInfo.ctrl = true;
      }
    }
    const keyName = keyInfo.name || keyInfo.sequence;
    const ctrl = keyInfo.ctrl;
    const shift =  keyInfo.shift;
    const alt = keyInfo.meta && (keyName !== 'escape'); // for some reason escape comes with alt pressed
    // exit on ctrl-c
    if ((keyName?.toLowerCase() === 'c') && (ctrl === true)) {
      log.info('Bye.');
      process.exit(0);
    }
    const message = (ctrl ? 'CTRL+' : '') + (shift ? 'SHIFT+' : '') + (alt ? 'ALT+' : '') + keyName
    log.info(`Key pressed: '${message}'`);
    try {
      await sendSequence(keyName, ctrl, shift, alt);
    } catch (err) {
      log.error(err?.message);
    }
  }
};

const initReadKeys = () => {
  // manual typing from stdin
  // check if we already setup keypress on stdin
  if (process.stdin.listenerCount('keypress') === 0) {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.setRawMode != null) {
      process.stdin.setRawMode(true);
    }
    process.stdin.on('keypress', async (str, keyInfo) => {
      await doKeypress(keyInfo);
    });
    log.info('Capturing key presses.');
  }
};

const serverMessageHandler = (message) => {
  const prefix = `(\x1b[32mSERVER\x1b[0m):`;
  try {
    const parsed = JSON.parse(message);
    if (['info', 'error'].includes(parsed.type) && parsed.text) {
      return log[parsed.type](`${prefix} ${parsed.text}`)
    }
    if (parsed.type === 'ready') {
      log.info(`${prefix} Ready to receive input.`);
      return initReadKeys();
    }
    throw new Error('Unknown server message type.');
  } catch (err) {
    log.error(`Error parsing server message: ${message}`);
  }
};

const initWs = () => {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket('ws://localhost:50001');
    socket.on('open', () => {
      log.info('Connected to server.');
      resolve(socket);
    });
    socket.on('message', (message) => {
      serverMessageHandler(message);
    });
    socket.on('close', () => {
      log.info('Disconnected from server.');
      process.exit(1);
    });
    socket.on('error', (err) => {
      log.error(`WebSocket error: ${err?.code}`);
      reject(err);
    });
  });
};

const initHid = async () => {
  // try to send backspace
  // if it's successful in writing the sequence it will send a ready event
  // which will setup a keypress handler
  // if it fails writing the sequence, it will initiate a hid.sh restart
  // if hid.sh exits with 0, it will send a ready event
  // if the next sequence fails, it will again initiate a hid.sh restart
  // but now since multiple events can be sent (because of multiple keypresses)
  // there is a lock on hid.sh spawn method
  // after every hid.sh exit 0, a ready event is sent
  // but keypress handlers are initialized only once
  await sendSequence('backspace');
};

const main = async () => {
  log.info('Client started.');
  ws = await initWs();
  await initHid();
};

main();
