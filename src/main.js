const fs = require('node:fs');
const readline = require('node:readline');
const path = require('node:path');
const cp = require('child_process');

const keys = require('./keys');
const log = require('./log');

const hidPath = '/dev/hidg0';

const spawnProcess = async (command, args) => {
  log.info(`Spawning: '${command} ${args.join(' ')}'`);
  const options = { stdio: ['ignore', 'inherit', 'inherit'] };
  const spawned = cp.spawn(command, args, options);
  const exitCode = await new Promise((resolve) => {
    spawned.on('close', resolve);
  });
  return exitCode;
};

const init = async () => {
  try {
    await writeSequence('backspace');
  } catch (err) {
    log.info(err?.message);
    const scriptPath = path.join(__dirname, '../config/hid.sh');
    const exitCode = await spawnProcess('doas', ['/bin/sh', scriptPath]);
    if (exitCode) {
      throw new Error(`Failed with ${exitCode}`);
    } else {
      log.success(`Spawn exited with ${exitCode}`);
    }
  }
  log.success('Initialization complete.');
};

const writeSequence = async (keyName, ctrl, shift, alt) => {
  const keySequence = keys.getKeySequence(keyName, ctrl, shift, alt);
  const releaseSequence = keys.getReleaseSequence();
  if (keySequence && releaseSequence) {
    await fs.promises.writeFile(hidPath, keySequence);
    await fs.promises.writeFile(hidPath, releaseSequence);
  } else {
    throw new Error(`No sequence mapping for: ${keyName}`)
  }
};

const doKeypress = async (keyInfo) => {
  if (keyInfo) {
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
      await writeSequence(keyName, ctrl, shift, alt);
    } catch (err) {
      log.error(err?.message);
    }
  }
};

const main = async () => {
  log.info('Hi.');
  await init();
  // manual typing from stdin
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.setRawMode != null) {
    process.stdin.setRawMode(true);
  }
  process.stdin.on('keypress', async (str, keyInfo) => {
    await doKeypress(keyInfo);
  });
};

main();
