import { WebSocketServer } from 'ws';

import crypto from 'node:crypto';

import util, { removeFromArray } from './util.js';
import mTypes from './messageTypes.js';

// list of publicKey fingerprints
let acceptedUsers = [];
// list of publicKey fingerprints
let pendingUsers = [];
// list of chat keypair encrypted with each users public key
let chatKeys = {
  // public key fingerprint: encrypted key pair
};
// list of encrypted messages
let messages = [];

// let chatPublicKey;

let nickToKey = {};

let connections = {
  // publicKey fingerprint: websocket
}

let sockets = [];

let wss = new WebSocketServer({
  port: 8080,
});

wss.on('connection', (ws) => {
  ws.data = {};
  sockets.push(ws);
  ws.on('close', () => {
    // remove from sockets array
    removeFromArray(sockets, ws)

    delete connections[ws.data.fp];
    if (pendingUsers.includes(ws.data.fp)) {
      removeFromArray(pendingUsers, ws.data.fp);
    }
  })
  ws.on('message', (data) => {
    data = JSON.parse(data);
    onMessage(ws, data);
  });
});

function sendOther(self, data) {
  for (let ws of sockets) {
    if (self !== ws) {
      util.send(ws, data);
    }
  }
}

function onMessage(ws, data) {
  if (typeof data.type !== 'string') {
    console.warn('data.type must be a string on packets');
    console.warn(data);
    return;
  }

  console.log(data);

  if (data.type === mTypes.PUBLIC_KEY) {
    let key = data.key
    let fp = util.fingerprintPublic(key);
    let nick = util.createNickFromKey(key);
    let identity = util.importPublicKey(key);
    let signature = Buffer.from(data.signature, 'base64');
    // check if signature is signed version of public key fingerprint
    let verified = crypto.verify(null, key, identity, signature);
    if (!verified) {
      util.send(ws, {
        type: mTypes.ERROR,
        message: 'invalid signature on public key'
      });
      ws.close();
      return;
    }
    ws.data.fp = fp;
    ws.data.nick = nick;
    ws.data.identity = identity;

    nickToKey[nick] = key;
    connections[fp] = ws;

    if (acceptedUsers.length === 0) {
      // no one has joined, auto accept them, ask client to initialize chat encryption
      acceptedUsers.push(fp);
      util.send(ws, {
        type: mTypes.ROOM_INIT_REQUEST
      });
    } else if (acceptedUsers.includes(fp)) {
      util.send(ws, {
        type: mTypes.REJOINED
      })
    } else {
      requestEntry(ws);
    }
  } else if (data.type === mTypes.ROOM_INIT && acceptedUsers.includes(ws.data.fp)) {
    // chatPublicKey = data.publicKey
    chatKeys[ws.data.fp] = data.key
  } else if (data.type === mTypes.ENCRYPTED_MESSAGE && acceptedUsers.includes(ws.data.fp)) {
    messages.push(data.messageData);
    sendOther(ws, data);
  } else if (data.type === mTypes.REQUEST_ACCEPTED) {
    if (!pendingUsers.includes(data.fp)) {
      return;
    }
    connections[data.fp].send(data);
    chatKeys[data.fp] = data.key;
    acceptedUsers.push(data.fp);
    removeFromArray(pendingUsers, data.fp);
    for (let fp of acceptedUsers) {
      connections[fp].send({
        type: mTypes.JOINED,
        nick: data.nick
      })
    }
  }
}

function requestEntry(ws) {
  for (let ows of sockets) {
    if (acceptedUsers.includes(ows.data.fp)) {
      util.send(ows, {
        type: mTypes.JOIN_REQUEST,
        nick: ws.data.nick,
        fp: ws.data.fp,
        publicKey: util.exportPublicKey(ws.data.identity)
      });
    }
  }
}

