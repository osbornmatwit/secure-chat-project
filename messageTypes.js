export default {
  // request to join from new user
  JOIN_REQUEST: 'joinRequest',
  // accepting request, holds chat keys
  REQUEST_ACCEPTED: 'requestAccepted',
  // encrypted chat message
  ENCRYPTED_MESSAGE: 'encryptedMessage',
  // first message sent from client, registering their public key with the servrer
  PUBLIC_KEY: 'publicKey',
  // client is first to join, needs to initialize chat keys
  ROOM_INIT_REQUEST: 'roomInitRequest',
  // first user to join sends 
  ROOM_INIT: 'roomInit',
  // error, usually followed by closing connection
  ERROR: 'error',
  // new user joined, announcement
  JOINED: 'joined',
  // you previously joined this server and are authorized,
  // if you want keys or chat log, send those requests
  REJOINED: 'rejoined',
  // send chat keys to client, or requesting from server
  CHAT_KEY: 'chatKey',
  // send encrypted log of chats, or requesting from server
  CHAT_LOG: 'chatLog'
}