import { WebSocketServer } from 'ws';
import WebSocket from 'ws';

let rooms = {
  1234: { users: [], }
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

