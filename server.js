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

let onlineUsers = 0;

// let chatPublicKey;

let nickToKey = {};

let connections = {
  // publicKey fingerprint: websocket
}

let sockets = [];

let wss = new WebSocketServer({
  port: 8080,
});
console.log('server started');

wss.on('connection', (ws) => {
  ws.data = {};
  sockets.push(ws);
  ws.on('close', () => {
    console.log('%s: disconnecting', ws.data.nick);

    // remove from sockets array
    removeFromArray(sockets, ws);

    delete connections[ws.data.fp];
    if (pendingUsers.includes(ws.data.fp)) {
      removeFromArray(pendingUsers, ws.data.fp);
    }

    if (acceptedUsers.includes(ws.data.fp)) {
      // if authorized user, decrease online user count
      onlineUsers -= 1;
      console.log('%d active users', onlineUsers);
      if (onlineUsers <= 0) {
        console.log('no more authorized users, resetting server');
        // if all authorized users have left, reset server, since no one can join when there are new authorized users.
        acceptedUsers = [];
        pendingUsers = [];
        sockets.forEach((ws) => ws.close());
        chatKeys = [];
        nickToKey = {};
        messages = [];
      }
    }
  })
  ws.on('message', (data) => {
    data = JSON.parse(data);
    onMessage(ws, data);
  });
});

function onMessage(ws, data) {
  if (typeof data.type !== 'string') {
    console.warn('data.type must be a string on packets');
    console.warn(data);
    return;
  }

  console.log(data.type);

  if (data.type === mTypes.PUBLIC_KEY) {
    let key = data.key
    let fp = util.fingerprintPublic(key);
    console.log('public key registration. fingerprint: %s', fp);
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
    console.log('%s: verified public key against signature', nick);
    ws.data.fp = fp;
    ws.data.nick = nick;
    ws.data.identity = identity;

    nickToKey[nick] = key;
    connections[fp] = ws;

    if (acceptedUsers.length === 0) {
      // no one has joined, auto accept them, ask client to initialize chat encryption
      console.log('no users online, request initialization from user %s', nick);
      acceptedUsers.push(fp);
      util.send(ws, {
        type: mTypes.ROOM_INIT_REQUEST
      });
    } else if (acceptedUsers.includes(fp)) {
      console.log('%s: previously authorized, rejoining');
      util.send(ws, {
        type: mTypes.REJOINED
      });
      onlineUsers += 1;
    } else {
      requestEntry(ws);
    }
  } else if (data.type === mTypes.ROOM_INIT && acceptedUsers.includes(ws.data.fp)) {
    console.log('chat encryption initialized');
    chatKeys[ws.data.fp] = data.key
    onlineUsers += 1
  } else if (data.type === mTypes.ENCRYPTED_MESSAGE && acceptedUsers.includes(ws.data.fp)) {
    console.log('message sent by %s', ws.data.nick);
    messages.push(data.messageData);
    for (let ows of sockets) {
      if (ws !== ows && acceptedUsers.includes(ows.data.fp)) {
        util.send(ows, data);
      }
    }

  } else if (data.type === mTypes.REQUEST_ACCEPTED) {
    if (!pendingUsers.includes(data.fp) || connections[data.fp] == undefined) {
      return;
    }
    console.log('%s: join request accepted', data.nick);
    util.send(connections[data.fp], data);
    chatKeys[data.fp] = data.key;
    acceptedUsers.push(data.fp);
    removeFromArray(pendingUsers, data.fp);
    onlineUsers += 1;
    console.log('%d users online', onlineUsers);
    for (let fp of acceptedUsers) {
      util.send(connections[fp], {
        type: mTypes.JOINED,
        nick: data.nick
      });
    }
  } else if (data.type === mTypes.CHAT_LOG) {
    console.log('sending encrypted chat log to %s', ws.data.nick);
    util.send(ws, {
      type: mTypes.CHAT_LOG,
      messages: JSON.stringify(messages)
    });
  }
}

function requestEntry(ws) {
  console.log('%s: requesting access', ws.data.nick);
  pendingUsers.push(ws.data.fp);
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

