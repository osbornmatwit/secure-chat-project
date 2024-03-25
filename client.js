import crypto from 'node:crypto';
let { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});
let ciphertext = crypto.publicEncrypt(publicKey, 'test');
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

import io from 'socket.io-client';

const ws = io('https://localhost:8080');
ws.on('encryptedMessage', console.log);
ws.connect();

ws.emit('encryptedMessage', { ciphertext, room: 1234, user: publicKey });
while (true) { }
ws.close();