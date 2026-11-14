// P07: optional, browser-only authenticated backup encryption. No network,
// password storage, external crypto libraries, biometric processing or cloud.
(function(root){
"use strict";
const FORMAT="robotito-encrypted-backup",SCHEMA=1,ITERATIONS=310000;
const MAX_PLAIN_BYTES=32*1024*1024,MAX_ENCRYPTED_BYTES=48*1024*1024;
const AAD=new TextEncoder().encode("robotito-encrypted-backup|schema=1|PBKDF2-SHA256|310000|AES-256-GCM");
function requireCrypto(){
 const api=root.crypto;
 if(!api?.getRandomValues||!api.subtle?.deriveKey||!api.subtle?.encrypt||!api.subtle?.decrypt)
  throw new Error("Secure Web Crypto is unavailable");
 return api;
}
function checkPassword(password){
 if(typeof password!=="string"||password.length<12||password.length>256)
  throw new TypeError("A backup password of 12–256 characters is required");
 return password;
}
function bytesToBase64(bytes){
 const pieces=[];
 for(let i=0;i<bytes.length;i+=8192)
  pieces.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
 return btoa(pieces.join(""));
}
function base64ToBytes(input,maxBytes){
 if(typeof input!=="string"||input.length===0||
    input.length>Math.ceil(maxBytes/3)*4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input))
  throw new TypeError("Invalid encrypted backup encoding");
 const raw=atob(input);
 if(raw.length>maxBytes)throw new TypeError("Encrypted backup too large");
 const bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 return bytes;
}
async function derive(password,salt){
 const crypto=requireCrypto();
 const passBytes=new TextEncoder().encode(checkPassword(password));
 const material=await crypto.subtle.importKey("raw",passBytes,"PBKDF2",false,["deriveKey"]);
 passBytes.fill(0);
 return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:ITERATIONS,hash:"SHA-256"},
  material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function encrypt(backup,password){
 const crypto=requireCrypto();
 if(root.ROBOTITO_STORE?.validateBackup)root.ROBOTITO_STORE.validateBackup(backup);
 const plain=new TextEncoder().encode(JSON.stringify(backup));
 if(plain.length>MAX_PLAIN_BYTES)throw new Error("Backup exceeds safe limit");
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await derive(password,salt);
 let ciphertext;
 try{
  ciphertext=new Uint8Array(await crypto.subtle.encrypt(
   {name:"AES-GCM",iv,additionalData:AAD,tagLength:128},key,plain));
 }finally{plain.fill(0);}
 return {format:FORMAT,schema:SCHEMA,kdf:"PBKDF2-SHA256",iterations:ITERATIONS,
  cipher:"AES-256-GCM",salt:bytesToBase64(salt),iv:bytesToBase64(iv),
  ciphertext:bytesToBase64(ciphertext)};
}
function isEncrypted(backup){return !!backup&&backup.format===FORMAT;}
async function decrypt(envelope,password){
 const crypto=requireCrypto();
 if(!isEncrypted(envelope)||envelope.schema!==SCHEMA||
    envelope.kdf!=="PBKDF2-SHA256"||envelope.iterations!==ITERATIONS||
    envelope.cipher!=="AES-256-GCM")throw new TypeError("Unsupported encrypted backup");
 const salt=base64ToBytes(envelope.salt,16),iv=base64ToBytes(envelope.iv,12);
 if(salt.length!==16||iv.length!==12)throw new TypeError("Invalid encryption parameters");
 const bytes=base64ToBytes(envelope.ciphertext,MAX_ENCRYPTED_BYTES);
 if(bytes.length<16||bytes.length>MAX_PLAIN_BYTES+16)
  throw new TypeError("Invalid encrypted payload length");
 const key=await derive(password,salt);
 let plain;
 try{
  plain=new Uint8Array(await crypto.subtle.decrypt(
   {name:"AES-GCM",iv,additionalData:AAD,tagLength:128},key,bytes));
 }catch{
  throw new Error("Password incorrect or encrypted backup changed");
 }
 try{
  return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(plain));
 }finally{plain.fill(0);}
}
root.ROBOTITO_BACKUP_CRYPTO={encrypt,decrypt,isEncrypted,maxEncryptedFileBytes:MAX_ENCRYPTED_BYTES,
 format:FORMAT,schema:SCHEMA};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_BACKUP_CRYPTO;
})(typeof window!=="undefined"?window:globalThis);
