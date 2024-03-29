//! standalone functions, usually for interacting with crypto api in consistent manner (keep algorithms the same etc)
const MODULUS_LENGTH = 4096;

/// Functions for importing and exporting keys to and from strings
export function exportKeyPair(data, passphrase) {
  let passphrase = passphrase || '';
  return {
    publicKey: exportPublicKey(data.publicKey),
    privateKey: exportPrivateKey(data.privateKey, passphrase)
  };
}

export function importKeyPair(data, passphrase) {
  let passphrase = passphrase || '';
  return {
    publicKey: importPublicKey(data.publicKey),
    privateKey: importPrivateKey(data.privateKey, passphrase)
  };
}

export function exportPrivateKey(key, passphrase) {
  let passphrase = passphrase || '';
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


// Generate RSA key pair
export function createKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: MODULUS_LENGTH
  });
}

/// Handle message encryption
export function decryptMessage(data, decryptKey) {
  // message: { identity, message, signature}
  let message = crypto.privateDecrypt(decryptKey, data.messageData);
  let verified = crypto.verify(null, ptext, data.identity, data.signature);

  return {
    message,
    verified,
    identity: data.identity
  };
}

// signedMessage type, has identity, data, signature
export function verifyMessage(signedMessage) {
  return crypto.verify(null, signedMessage.data, signedMessage.identity, signedMessage.signature);
}
