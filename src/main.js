const fs = require('node:fs');
const readline = require('node:readline');
const path = require('node:path');
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

const keys = require('./keys');
const log = require('./log');

log.success('Hi.');

const hidPath = '/dev/hidg0';

const init = async () => {
  try {
    const releaseSequence = keys.getReleaseSequence();
    if (releaseSequence) {
      await fs.promises.writeFile(hidPath, releaseSequence);
    }
  } catch (e) {
    if (e.code === 'ESHUTDOWN') {
      // ESHUTDOWN: cannot send after transport endpoint shutdown, write
      log.info('ESHUTDOWN detected, reconnecting...');
      const scriptPath = path.join(__dirname, '../camera/hid.sh');
      const output = await exec(`sudo /usr/bin/bash ${scriptPath}`);
      log.info(output?.stdout?.trim());
    }
  }
};

const send = async (data) => {
  try {
    await fs.promises.writeFile(hidPath, data);
  } catch (e) {
    log.error(`Error writing to ${hidPath}: ${e.message}`);
  }
};

const writeSequence = async (keyInfo) => {
  if (keyInfo) {
    const keyName = keyInfo.name || keyInfo.sequence;
    const ctrl = keyInfo.ctrl;
    const shift =  keyInfo.shift;
    const alt = keyInfo.meta && (keyName !== 'escape'); // for some reason escape comes with alt pressed
    // exit on ctrl-c
    if ((keyName?.toLowerCase() === 'c') && (ctrl === true)) {
      log.success('Bye.');
      process.exit(0);
    }
    const message = (ctrl ? 'CTRL+' : '') + (shift ? 'SHIFT+' : '') + (alt ? 'ALT+' : '') + keyName
    log.info(`Key pressed: '${message}'`);
    const keySequence = keys.getKeySequence(keyName, ctrl, shift, alt);
    const releaseSequence = keys.getReleaseSequence();
    if (keySequence && releaseSequence) {
      await send(keySequence);
      await send(releaseSequence);
    } else {
      log.error(`No sequence mapping for: ${keyName}`);
    }
  }
};

const main = async () => {
  await init();
  // manual typing from stdin
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.setRawMode != null) {
    process.stdin.setRawMode(true);
  }
  process.stdin.on('keypress', async (str, keyInfo) => {
    await writeSequence(keyInfo);
  });
};

main();