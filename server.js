import { WebSocketServer } from 'ws';
import WebSocket from 'ws';

import crypto from 'node:crypto';

let rooms = {
  1234: {
    // list of public keys
    users: [],
    // publicKey to encrypted version of message key
    keyList: {},
    // list of encrypted messages
    messages: []
  }
};

let connections = {
  // publicKey: websocket
}

let sockets = [];

let wss = new WebSocketServer({
  port: 8080,
})

wss.on('connection', (ws) => {
  sockets.push(ws);
  ws.on('message', (data) => {
    onMessage(ws, data);
  });
});

function onMessage(ws, data) {
  for (let ows of sockets) {
    if (ows !== ws) {
      ows.send(data);
    }
  }
}

