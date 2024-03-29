import crypto from 'node:crypto';
import util from './util.js';
import mTypes from './messageTypes.js';

let { publicKey, privateKey } = util.createKeyPair();

import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

let chatKeys = {

};
// nick to data object
let requests = {}

ws.on('open', () => {
  registerIdentity();
});

// Send public key and signature to verify that you own this keypair
function registerIdentity() {
  let keyText = util.exportPublicKey(publicKey);
  util.send(ws, {
    type: mTypes.PUBLIC_KEY,
    key: keyText,
    signature: crypto.sign(null, keyText, privateKey).toString('base64'),
  });
}

// create room when first to join, initialize encryption
function initRoom() {
  chatKeys = util.createKeyPair();
  let textKeys = util.exportKeyPair(chatKeys);
  // encrypt so that
  let encryptedPair = crypto.publicEncrypt(publicKey, JSON.stringify(textKeys.privateKey));
  util.send(ws, {
    type: mTypes.ROOM_INIT,
    // publicKey: textKeys.publicKey,
    keys: encryptedPair.toString('base64')
  })
}

function acceptRequest(nick) {
  let request = requests[nick];
  delete requests[nick];
  let textKeys = util.exportKeyPair(chatKeys);
  let encryptedPair = crypto.publicEncrypt(util.importPublicKey(request.publicKey), JSON.stringify(textKeys)).toString('base64');
  util.send(ws, {
    type: mTypes.REQUEST_ACCEPTED,
    keys: encryptedPair,
    identity: request.publicKey,
    fp: request.fp
  });
}

function roomJoined(data) {
  let encryptedPair = Buffer.from(data.keys, 'base64');
  let keyText = crypto.privateDecrypt(privateKey, encryptedPair);
  chatKeys = util.importKeyPair(JSON.parse(keyText));
}

ws.on('message', (data) => {
  data = JSON.parse(data.toString());
  console.log(data);
  switch (data.type) {
    case mTypes.ENCRYPTED_MESSAGE:
      return handleEncryptedMessage(data);
    case mTypes.ROOM_INIT_REQUEST:
      initRoom();
      return;
    case mTypes.JOIN_REQUEST:
      requests[data.nick] = data;
      printRequest(data.nick);
      // TODO TEST ONLY REMOVE
      acceptRequest(data.nick);
      sendEncryptedMessage('hi there ' + data.nick, privateKey, publicKey);
      return;
    case mTypes.REQUEST_ACCEPTED:
      roomJoined(data);
      return;
  }
});


function sendEncryptedMessage(message, encryptKey, signKey) {
  let ctext = crypto.publicEncrypt(encryptKey, message).toString('base64');
  let signature = crypto.sign(undefined, message, signKey).toString('base64');

  util.send(ws, {
    identity: util.exportPublicKey(publicKey),
    messageData: ctext,
    signature,
  });
}

function handleEncryptedMessage(data) {
  let messBuf = Buffer.from(data.messageData, 'base64');
  let plainBuf = crypto.privateDecrypt(chatKeys.privateKey, messBuf).toString();
  let identity = Buffer.from(data.identity, 'base64');
  let nick = util.createNickFromKey(identity);
  let signature = Buffer.from(data.signature, 'base64');
  if (!crypto.verify(null, plainBuf, identity, signature)) {
    addChatLine('WARN', 'Following message signature does not match public key')
  }
  addChatLine(nick, plainBuf);
}

ws.on('close', quit);

function quit() {
  process.exit(0);
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

/// functions for modifying ui

function addChatLine(name, message) {
  let newText = `\n${name}: ${message}`;
  chatLog.setText(chatLog.text() + newText);
}

function printRequest(nickname) {
  addChatLine('SYSTEM', `User '${nickname}' wants to join. To accept type '/accept ${nickname}'`);
}