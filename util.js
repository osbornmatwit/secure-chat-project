//! standalone functions, usually for interacting with crypto api in consistent manner (keep algorithms the same etc)
import crypto, { KeyObject } from 'node:crypto';

const MODULUS_LENGTH = 4096;

/// Functions for importing and exporting keys to and from strings
export function exportKeyPair(data, passphrase) {
  passphrase = passphrase || '';
  return {
    publicKey: exportPublicKey(data.publicKey),
    privateKey: exportPrivateKey(data.privateKey, passphrase)
  };
}

export function importKeyPair(data, passphrase) {
  passphrase = passphrase || '';
  return {
    publicKey: importPublicKey(data.publicKey),
    privateKey: importPrivateKey(data.privateKey, passphrase)
  };
}

export function exportPrivateKey(key, passphrase) {
  passphrase = passphrase || '';
  return key.export({
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase
  });
}

export function exportPublicKey(key) {
  return key.export({
    type: 'spki',
    format: 'pem'
  });
}

export function importPrivateKey(key, passphrase) {
  return crypto.createPrivateKey({
    key,
    passphrase
  });
}

export function importPublicKey(key) {
  return crypto.createPublicKey(key);
}

export function fingerprintPublic(key) {
  if (key instanceof KeyObject) {
    key = exportPublicKey(key);
  }
  return crypto.createHash('sha512').update(key).digest('hex');
}


// Generate RSA key pair
export function createKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: MODULUS_LENGTH
  });
}

/// Handle message encryption
export function decryptMessage(data, decryptKey, identity) {
  // message: { identity, message, signature}
  let message = crypto.privateDecrypt(decryptKey, data.messageData);
  let verified = crypto.verify(null, message, identity, data.signature);

  return {
    message,
    verified,
    identity,
  };
}

// takes exported public key, and creates a nickname from it using fingerprint and slice
export function createNickFromKey(publicKey) {
  return fingerprintPublic(publicKey).slice(0, 6);
}

export function removeFromArray(array, item) {
  let index = array.indexOf(item);
  if (index > -1) {
    array.splice(index, 1);
  }
}

export function send(ws, data) {
  ws.send(JSON.stringify(data));
}


export * as default from './util.js'; 