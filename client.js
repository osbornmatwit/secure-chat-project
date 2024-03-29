import crypto, { KeyObject } from 'node:crypto';
import util from './util';

let { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});
let ciphertext = crypto.publicEncrypt(publicKey, new TextEncoder().encode('test'));
// console.log(ciphertext);
console.log(crypto.privateDecrypt(privateKey, ciphertext).toString())
// console.log(saveKeyPair(publicKey, privateKey))


import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

let room = {
  name: 'coolRoom',
  // keypair
  keyPair: ''
}

let lastRoomRequest = {};

function roomRequest(data) {

}

function acceptRequest() {
  let request = lastRoomRequest;
  room.keyPair
}

function sendRequest(roomName) {

}

function createRoom(name) {
  room = {
    name,
    keyPair: crypto.generateKeyPairSync('rsa',)
  };

  let data = {
    name,
    users: []
  }
}

ws.on('open', () => {
  ws.send({ type: 'publicKey', key: publicKey });
  ws.send({ type: 'createRoom' })
});


ws.on('message', (data) => {
  let data = JSON.parse(data.toString());
  console.log(data);
  switch (data.type) {
    case 'encryptedMessage':
      return handleEncryptedMessage(data);
    case 'roomSwitch':
      let decrypted = decryptMessage(data, privateKey);
      room = decrypted.message
      return;
    case 'roomRequest':
      return roomRequest;
  }
});


function sendEncryptedMessage(message, encryptKey, signKey) {
  let ctext = crypto.publicEncrypt(encryptKey, message).toString('base64');
  let signature = crypto.sign(undefined, message, signKey).toString('base64');

  ws.send({
    identity: userPk,
    messageData: ctext,
    signature,
  });
}

function handleEncryptedMessage(data) {


}

import { Direction, QBoxLayout, QLabel, QLineEdit, QMainWindow, QWidget } from '@nodegui/nodegui';

const win = new QMainWindow();
win.setWindowTitle('Secure Chat');

const centralWidget = new QWidget();

const rootLayout = new QBoxLayout(Direction.TopToBottom);

centralWidget.setObjectName('myroot');
centralWidget.setLayout(rootLayout);

const chatLog = new QLabel();
chatLog.setObjectName('chatlog');
chatLog.setText('Cool person: Wow so cool!\nGood Person: so amazing!');

function addChatLine(name, message) {
  let newText = `\n${name}: ${message}`;
  chatLog.setText(chatLog.text() + newText);
}

const chatInput = new QLineEdit();
chatInput.setObjectName('chatinput');
chatInput.addEventListener('returnPressed', () => {
  // todo call text processing function instead
  let value = chatInput.text();
  console.log(value);
  addChatLine('Cool Name', value);
  chatInput.clear();
})

rootLayout.addWidget(chatLog);
rootLayout.addWidget(chatInput);

win.setCentralWidget(centralWidget);
win.setStyleSheet(
  `
  #myroot {
    background-color: #009688;
    height: '100%';
    align-items: 'center';
    justify-content: 'center';
  }
  #mylabel {
    font-size: 16px;
    font-weight: bold;
    padding: 1;
  }
  `
);

win.show();

// add win to global object to prevent garbage collection
global.win = win;