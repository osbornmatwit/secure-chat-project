import crypto from 'node:crypto';
let { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});
let ciphertext = crypto.publicEncrypt(publicKey, new TextEncoder().encode('test'));
// console.log(ciphertext);
console.log(crypto.privateDecrypt(privateKey, ciphertext).toString())
// crypto.createCipheriv(crypto.)
// console.log(saveKeyPair(publicKey, privateKey))

/**
 * RSA keypair
 * @param {KeyObject} publicKey Public key
 * @param {KeyObject} privateKey Private key
 */
function saveKeyPair(publicKey, privateKey) {
  let pubExport = publicKey.export({
    type: 'spki',
    format: 'pem'
  });

  let privExport = privateKey.export({
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: 'top secret'
  })

  return [pubExport, privExport];
}

import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

ws.on('message', (data) => {
  data.toString();
});


ws.on('open', () => {
  ws.send('test client message');
});

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