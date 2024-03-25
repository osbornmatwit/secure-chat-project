import { Server, Socket } from 'socket.io';
import { createServer } from 'node:http';

const server = createServer();
const io = new Server(server);

let rooms = {
  1234: { users: [], }
};

let connections = {
  // publicKey: websocket
}



io.on('connection', (ws) => {
  // initialize
  console.log('test');

  ws.on('login', (data) => {
    connections[data.publicKey] = ws;

  })

  ws.on('error', console.error);

  ws.on('message', (data) => {
    console.log('recieved: %s', data);
  });

  ws.on('encryptedMessage', (data) => {
    for (let [pk, ows] of Object.entries(connections)) {
      if (pk != data.publicKey) {
        ows.emit('encryptedMessage', data);
      }
    }

    console.log('recieved: %s', data.ciphertext);
  })
});

server.listen(8080);