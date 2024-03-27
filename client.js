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

import readline from 'node:readline';
const rl = readline.createInterface(process.stdin, process.stdout);

rl.question('test question?', (answer) => {
  ws.send(answer);
});