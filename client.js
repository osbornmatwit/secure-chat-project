import crypto from 'node:crypto';
import util from './util.js';
import mTypes from './messageTypes.js';

import WebSocket from 'ws';

let { publicKey, privateKey } = util.createKeyPair();

const ws = new WebSocket('ws://localhost:8080');

// symetric key (buffer of random 32 bytes)
let chatKey;

// nick to data object
let requests = {}

// nickname, currently first 6 characters of fingerprint of public key
let nick = util.createNickFromKey(publicKey);

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
  chatKey = util.createKey();
  // encrypt 
  let encryptedKey = crypto.publicEncrypt(publicKey, chatKey);
  util.send(ws, {
    type: mTypes.ROOM_INIT,
    // key: chatKey
    keys: encryptedKey.toString('base64')
  })
}

function acceptRequest(nick) {
  let request = requests[nick];
  delete requests[nick];
  util.send(ws, {
    type: mTypes.REQUEST_ACCEPTED,
    key: crypto.publicEncrypt(request.publicKey, chatKey).toString('base64'),
    identity: request.publicKey,
    fp: request.fp,
    nick,
  });
}

function roomJoined(data) {
  let encryptedKey = Buffer.from(data.key, 'base64');
  chatKey = crypto.privateDecrypt(privateKey, encryptedKey);
}

ws.on('message', (data) => {
  data = JSON.parse(data.toString());
  // console.log(data);
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
      sendEncryptedMessage('hi there ' + data.nick);
      return;
    case mTypes.REQUEST_ACCEPTED:
      roomJoined(data);
      return;
  }
});


function sendEncryptedMessage(message) {

  let encryptedMessage = util.encryptMessage(chatKey, message);
  let signature = crypto.sign(null, message, privateKey).toString('base64');

  util.send(ws, {
    type: mTypes.ENCRYPTED_MESSAGE,
    identity: util.exportPublicKey(publicKey),
    messageData: encryptedMessage,
    signature,
  });
}

function handleEncryptedMessage(data) {
  let { ciphertext, iv } = data.messageData;
  let plainBuf = util.decryptMessage(chatKey, iv, ciphertext);
  let nick = util.createNickFromKey(data.identity);
  let signature = Buffer.from(data.signature, 'base64');
  if (!crypto.verify(null, plainBuf, data.identity, signature)) {
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
  addChatLine(nick + ' (self)', value);
  if (chatKey == undefined) {
    centralWidget.setInlineStyle('background-color: #AA1111;')
    return;
  }
  sendEncryptedMessage(value);
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