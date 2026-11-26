// Recoverable class audio shares the main memory database, including its
// owner deletion, backup, restore epoch and atomic transaction guarantees.
(function(root){
"use strict";
const DRAFT="class-recorder-draft",PART="class-recorder-part",MAX_BYTES=128*1024*1024,LEASE_MS=15000;
const ram=new Map(),store=()=>root.ROBOTITO_STORE;
const key=id=>"class-audio-draft:"+id,partKey=(id,seq)=>"class-audio-part:"+id+":"+String(seq).padStart(8,"0");
const read=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
function check(row,owner,token){
 if(!row||row.owner!==owner||row.source!==DRAFT)throw Error("Recording not found in this history");
 if(token&&row.data.writerToken!==token)throw Error("Recording writer changed");
 return row;
}
async function begin(metadata){
 const {id,owner,writerToken}=metadata;
 if(!id||!owner||!writerToken)throw Error("Recording identity required");
 const row=store().normalizeRecord({id:key(id),type:"audios",owner,source:DRAFT,timestamp:metadata.startedAt,
  subject:metadata.subject,topic:metadata.topic,data:{...metadata,chunkCount:0,committedBytes:0,lastChunkAt:metadata.startedAt,status:"recording",leaseUntil:Date.now()+LEASE_MS}});
 if(store().isEphemeral(owner)){if(ram.has(id))throw Error("Duplicate recording");ram.set(id,{row,parts:[]});return;}
 await store().withTransaction(["records"],"readwrite",async tx=>{tx.objectStore("records").add(row);});
}
async function append(id,owner,token,seq,blob,at=Date.now()){
 if(!(blob instanceof Blob)||!blob.size||!Number.isSafeInteger(seq)||seq<0)throw Error("Invalid recording chunk");
 const advance=row=>{
  check(row,owner,token);
  if(row.data.status!=="recording"||seq!==row.data.chunkCount)throw Error("Recording interrupted or chunk out of order");
  if(row.data.committedBytes+blob.size>MAX_BYTES)throw Error("Recording size limit reached");
  return {...row,version:row.version+1,data:{...row.data,chunkCount:seq+1,committedBytes:row.data.committedBytes+blob.size,lastChunkAt:at,leaseUntil:Date.now()+LEASE_MS}};
 };
 if(store().isEphemeral(owner)){
  const entry=ram.get(id),next=advance(entry?.row);entry.parts.push(blob);entry.row=next;return;
 }
 const bytes=await blob.arrayBuffer(),partId=partKey(id,seq);
 await store().withTransaction(["records","blobs"],"readwrite",async tx=>{
  const records=tx.objectStore("records"),next=advance(await read(records.get(key(id))));
  records.add(store().normalizeRecord({id:partId,type:"audios",owner,source:PART,blobId:partId,relatedIds:[key(id)],timestamp:at,data:{recordingId:id,seq,size:blob.size}}));
  tx.objectStore("blobs").add({id:partId,blobBytes:bytes,mimeType:blob.type,owner,type:"class-audio-part",recordId:partId,updatedAt:at});
  records.put(next);
 });
}
async function modify(id,owner,token,action){
 if(store().isEphemeral(owner)){
  const entry=ram.get(id),row=check(entry?.row,owner,token);entry.row={...row,version:row.version+1,data:action(row.data)};return entry.row;
 }
 return store().withTransaction(["records"],"readwrite",async tx=>{
  const records=tx.objectStore("records"),row=check(await read(records.get(key(id))),owner,token),next={...row,version:row.version+1,data:action(row.data)};
  records.put(next);return next;
 });
}
const touch=(id,owner,token)=>modify(id,owner,token,data=>{
 if(data.status!=="recording")throw Error("Recording stopped");return {...data,leaseUntil:Date.now()+LEASE_MS};
});
const seal=(id,owner,token,{complete=false,endedAt=Date.now(),reason="interrupted"}={})=>modify(id,owner,token,data=>({...data,status:"interrupted",leaseUntil:0,complete,endedAt,reason:complete?null:reason}));
async function list(owner){
 if(store().isEphemeral(owner))return [...ram.values()].filter(entry=>entry.row.owner===owner).map(entry=>({...entry.row.data,version:entry.row.version}));
 return (await store().queryRecords({type:"audios",owner,limit:Infinity})).filter(row=>row.source===DRAFT).map(row=>({...row.data,owner:row.owner,version:row.version}));
}
async function claim(id,owner){
 const token=crypto.randomUUID();
 await modify(id,owner,null,data=>{
  if(data.leaseUntil>Date.now())throw Error("Recording is still active in another tab");
  return {...data,writerToken:token,status:"interrupted",complete:false,reason:data.reason||"recovered-after-interruption",leaseUntil:Date.now()+LEASE_MS};
 });return token;
}
async function finish(id,owner,token){
 let manifest,parts;
 if(store().isEphemeral(owner)){
  const entry=ram.get(id);manifest=check(entry?.row,owner,token);parts=entry.parts.slice();
 }else{
  manifest=check(await store().getRecord(key(id)),owner,token);
  const rows=(await store().queryRecords({type:"audios",owner,limit:Infinity})).filter(row=>row.source===PART&&row.data.recordingId===id).sort((a,b)=>a.data.seq-b.data.seq);
  if(rows.some((row,index)=>row.data.seq!==index))throw Error("Recording has missing chunks");
  parts=[];
  for(const row of rows){const blob=await store().getBlob(row.blobId);if(!blob||blob.size!==row.data.size)throw Error("Recording chunk missing or damaged");parts.push(blob);}
 }
 const data=manifest.data;
 if(data.status!=="interrupted"||!parts.length||parts.length!==data.chunkCount||parts.reduce((sum,blob)=>sum+blob.size,0)!==data.committedBytes)throw Error("Recording is incomplete or empty");
 const blob=new Blob(parts,{type:data.mimeType||parts[0].type||"audio/webm"}),endedAt=data.complete?data.endedAt:data.lastChunkAt;
 const record={id,owner,sessionId:data.sessionId,subject:manifest.subject,topic:manifest.topic,
  startedAt:data.startedAt,endedAt,durationMs:Math.max(0,endedAt-data.startedAt),mimeType:blob.type,size:blob.size,
  complete:data.complete===true,recoveryReason:data.complete?null:data.reason||"interrupted",transcriptFrom:data.startedAt,transcriptTo:endedAt,createdAt:Date.now()};
 const recordId="class-audio:"+id,row=store().normalizeRecord({id:recordId,type:"audios",owner,source:"class-recorder",timestamp:data.startedAt,subject:record.subject,topic:record.topic,blobId:recordId,data:record});
 if(store().isEphemeral(owner)){
  await store().putRecordWithBlob(row,blob,{type:"class-audio"});ram.delete(id);return {...record,blob};
 }
 const bytes=await blob.arrayBuffer();
 await store().withTransaction(["records","blobs"],"readwrite",async tx=>{
  const records=tx.objectStore("records"),current=check(await read(records.get(key(id))),owner,token);
  if(current.version!==manifest.version)throw Error("Recording changed while assembling; retry");
  if(await read(records.get(recordId)))throw Error("Recording already exists");
  const blobs=tx.objectStore("blobs");
  records.add(row);blobs.add({id:recordId,blobBytes:bytes,mimeType:blob.type,owner,type:"class-audio",recordId,updatedAt:Date.now()});
  for(let seq=0;seq<data.chunkCount;seq++){records.delete(partKey(id,seq));blobs.delete(partKey(id,seq));}
  records.delete(key(id));
 });return {...record,blob};
}
async function discard(id,owner,token){
 if(store().isEphemeral(owner)){check(ram.get(id)?.row,owner,token);ram.delete(id);return;}
 await store().withTransaction(["records","blobs","state"],"readwrite",async tx=>{
  const records=tx.objectStore("records"),row=check(await read(records.get(key(id))),owner,token);
  if(!token&&row.data.leaseUntil>Date.now())throw Error("Recording is still active");
  for(let seq=0;seq<row.data.chunkCount;seq++){records.delete(partKey(id,seq));tx.objectStore("blobs").delete(partKey(id,seq));}
  records.delete(key(id));tx.objectStore("state").delete("robotito.restore.undo.v1");
 });
}
root.ROBOTITO_CLASS_JOURNAL={begin,append,touch,seal,list,claim,finish,discard,maxBytes:MAX_BYTES};
})(window);
