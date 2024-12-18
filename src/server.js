const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');

const WebSocket = require('ws');

const log = require('./log');
const keys = require('./keys');

const spawnProcess = async (command, args) => {
  const options = { stdio: ['ignore', 'inherit', 'inherit'] };
  const spawned = cp.spawn(command, args, options);
  const exitCode = await new Promise((resolve) => {
    spawned.on('close', resolve);
  });
  return exitCode;
};

let restartLocked = false;
const restartHid = async (dispatcher) => {
  if (restartLocked) {
    return -1;
  }
  restartLocked = true;
  const options = {
    command: 'doas',
    args: ['/bin/sh', path.join(__dirname, '../config/hid.sh')]
  };
  dispatcher.info(`Spawning: '${options.command} ${options.args.join(' ')}'`, true);
  const exitCode = await spawnProcess(options.command, options.args);
  dispatcher.info(`Spawn exited with ${exitCode}`, true);
  restartLocked = false; 
  return exitCode;
};

const messageDispatcher = (client) => {
  return {
    info: (text, echo) => {
      if (echo) {
        log.info(text);
      }
      client.send(JSON.stringify({
        type: 'info',
        text: text
      }));
    },
    error: (text, echo) => {
      if (echo) {
        log.error(text);
      }
      client.send(JSON.stringify({
        type: 'error',
        text: text
      }));
    },
    ready: () => {
      client.send(JSON.stringify({
        type: 'ready'
      }));
    }
  }
};

const server = () => {
  
  const hidPath = '/dev/hidg0';
  const port = 50001;
  const releaseSequence = keys.getReleaseSequence();
  
  const wss = new WebSocket.Server({
    port: port,
    maxPayload: 1024
  });
  
  log.info(`Server listening on ${port}.`);
  
  wss.on('connection', (client, req) => {
    
    log.info(`Client ${req?.socket?.remoteAddress || 'unknown'} connected.`);
    
    const dispatcher = messageDispatcher(client);
    dispatcher.info('Hi.');
    
    let successWriteCount = 0;
    
    client.on('message', async (sequence) => {
      try {
        await fs.promises.writeFile(hidPath, sequence);
        await fs.promises.writeFile(hidPath, releaseSequence);
        dispatcher.info(`Sequence accepted (${successWriteCount}): ${sequence.toString('hex')}`, true);
        if (successWriteCount === 0) {
          dispatcher.ready();
        }
        successWriteCount++;
      } catch (err) {
        dispatcher.error(err?.message, true);
        if (successWriteCount === 0) {
          const exitCode = await restartHid(dispatcher);
          if (exitCode < 0) {
            dispatcher.error('hid.sh is locked.', true);
          } else if (exitCode === 0) {
            // if error occurs again after keypress, there is a lock in restartHid()
            dispatcher.ready();
          } else {
            dispatcher.error('Unable to process sequence, something is wrong with hid interface.', true);
          }
        }
      }
    });
    
    client.on('close', () => {
      log.info('Client disconnected.');
    });
    
  });
};

server();
