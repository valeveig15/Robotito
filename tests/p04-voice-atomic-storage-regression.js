"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const storeSource=fs.readFileSync(path.join(__dirname,"..","robotito-store.js"),"utf8");
const voiceSource=fs.readFileSync(path.join(__dirname,"..","voice-system.js"),"utf8");
const begin=storeSource.indexOf("async function putRecordWithBlob(");
const end=storeSource.indexOf("async function getBlob(",begin);
assert.ok(begin>=0&&end>begin);
let count=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);count++;};
(async()=>{
 const blob=new Blob([new Uint8Array(128)],{type:"audio/webm"});
 for(const fail of [false,true]){
  const writes=[],db={transaction:(stores,mode)=>{
   eq(stores,["records","blobs"],"One transaction for audio and consent");
   eq(mode,"readwrite","Atomic transaction writable");
   return {objectStore:name=>({put:row=>writes.push([name,row])})};
  }};
  const put=new Function("Blob","normalizeRecord","serial","openDb","complete",
   storeSource.slice(begin,end)+"return putRecordWithBlob;")(
    Blob,row=>row,(_key,task)=>task(),async()=>db,
    ()=>fail?Promise.reject(Error("Aborted")):Promise.resolve());
  try{await put({id:"voice-profile-local",owner:"local",blobId:"voice-sample-local"},blob,{type:"audio"});}
  catch(e){if(!fail)throw e;eq(e.message,"Aborted","Transaction failure rejects");}
  eq(writes.length,2,"Both writes staged in same transaction");
  eq(writes.map(x=>x[0]),["blobs","records"],"Blob and metadata");
  eq(writes[0][1].recordId,writes[1][1].id,"Linked record ID");
  eq([...new Uint8Array(writes[0][1].blobBytes)],[...new Uint8Array(await blob.arrayBuffer())],"Portable storage preserves exact audio bytes");
  eq(writes[0][1].mimeType,blob.type,"Portable storage preserves MIME type");
 }
 // Older installations stored native Blob objects. The public read API must
 // support both representations without losing MIME type or audio bytes.
 let stored;
 const readEnd=storeSource.indexOf("// Removes legacy blobs",end);
 const read=new Function("openDb","request","Blob","ArrayBuffer",
  storeSource.slice(end,readEnd)+"return getBlob;")(
   async()=>({transaction:()=>({objectStore:()=>({get:()=>stored})})}),
   async row=>row,Blob,ArrayBuffer);
 for(const oldFormat of [true,false]){
  stored=oldFormat?{blob}:{blobBytes:await blob.arrayBuffer(),mimeType:blob.type};
  const loaded=await read("existing-audio");
  eq(loaded instanceof Blob,true,"Public read still returns Blob");
  eq(loaded.type,blob.type,"Old and new formats retain audio type");
  eq([...new Uint8Array(await loaded.arrayBuffer())],[...new Uint8Array(await blob.arrayBuffer())],"Old and new audio bytes survive reading");
 }
 const actions=[],root={ROBOTITO_STORE:{
  putRecordWithBlob:(row,audio,options)=>{actions.push({row,audio,options});return Promise.resolve(row);},
  deleteRecord:id=>{actions.push({deleted:id});return Promise.resolve(true);},
  deleteBlob:id=>{actions.push({deletedBlob:id});return Promise.resolve(true);}
 }};
 const mod={exports:{}};
 new Function("window","module","Blob",voiceSource)(root,mod,Blob);
 await mod.exports.saveProfileFromRecording(blob,{subject:"self"});
 eq(actions[0].row.blobId,"voice-sample-local","Audio metadata linked");
 eq(actions[0].audio.size,128,"Audio bytes passed atomically");
 eq(actions[0].options.type,"audio","Correct blob type");
 await mod.exports.deleteProfile();
 eq(actions[1].deleted,"voice-profile-local","Deletion cascades through linked record");
 eq(actions[2].deletedBlob,"voice-sample-local","Remove old orphaned voice blob too");
 let denied=false;try{await mod.exports.saveProfileFromRecording(blob,
  {subject:"other",explicitConsent:false,consentLabel:"Other"});}catch{denied=true;}
 eq(denied,true,"Third-party consent required");
 eq(actions.length,3,"Denied recording never writes");
 console.log("P04 atomic voice storage:",count,"checks");
})().catch(e=>{console.error(e);process.exitCode=1;});
