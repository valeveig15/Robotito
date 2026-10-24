// Robotito durable storage v3. The legacy key/value store remains readable.
// Typed records and binary objects share ONE IndexedDB database; localStorage is
// only a migration input and a small preference mirror.
(function(root){
"use strict";
const DB_NAME="robotito-data-v2", VERSION=3;
const HEAVY=new Set(["robotito.classLines.v1","robotito.classSummaries.v1","robotito.academicMaterials.v1","robotito.memories.v2"]);
const TYPES=new Set(["people","conversations","preferences","memories","classes","subjects","topics","audios","transcripts","pdfs","notes","exercises","books","recommendations","tasks","rules","birthdays"]);
const LEGACY_TYPE={"robotito.classLines.v1":"transcripts","robotito.classSummaries.v1":"classes","robotito.academicMaterials.v1":"notes","robotito.memories.v2":"memories"};
const queues=new Map();
let dbPromise=null;
function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("IndexedDB request failed"));});}
function complete(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("IndexedDB transaction failed"));tx.onabort=()=>reject(tx.error||new Error("IndexedDB transaction aborted"));});}
function openDb(){
 if(dbPromise)return dbPromise;
 if(typeof indexedDB==="undefined")return Promise.reject(new Error("IndexedDB unavailable"));
 dbPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,VERSION);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains("state"))db.createObjectStore("state",{keyPath:"key"});
   if(!db.objectStoreNames.contains("records")){
    const s=db.createObjectStore("records",{keyPath:"id"});
    s.createIndex("byType","type");
    s.createIndex("byOwner","owner");
    s.createIndex("byDate","timestamp");
    s.createIndex("byTypeOwner",["type","owner"]);
   }
   if(!db.objectStoreNames.contains("blobs"))db.createObjectStore("blobs",{keyPath:"id"});
   if(!db.objectStoreNames.contains("migrations"))db.createObjectStore("migrations",{keyPath:"id"});
  };
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();dbPromise=null;};resolve(db);};
  req.onerror=()=>reject(req.error||new Error("Could not open IndexedDB"));
  req.onblocked=()=>reject(new Error("Close other Robotito tabs to upgrade storage"));
 }).catch(e=>{dbPromise=null;throw e;});
 return dbPromise;
}
function serial(key,task){
 const prev=queues.get(key)||Promise.resolve();
 const current=prev.catch(()=>{}).then(task);
 queues.set(key,current);
 current.finally(()=>{if(queues.get(key)===current)queues.delete(key);}).catch(()=>{});
 return current;
}
async function get(key,fallback=null){
 const db=await openDb();const tx=db.transaction("state","readonly");
 const result=await request(tx.objectStore("state").get(key));
 return result?.value===undefined?fallback:result.value;
}
async function set(key,value){
 return serial("state:"+key,async()=>{
  const db=await openDb(),tx=db.transaction("state","readwrite"),finished=complete(tx);
  tx.objectStore("state").put({key,value,updatedAt:Date.now()});
  await finished;return true;
 });
}
async function remove(key){
 return serial("state:"+key,async()=>{
  const db=await openDb(),tx=db.transaction("state","readwrite"),finished=complete(tx);
  tx.objectStore("state").delete(key);await finished;return true;
 });
}
function normalizeRecord(input){
 if(!input||typeof input!=="object"||!TYPES.has(input.type))throw new TypeError("Invalid record type");
 const now=Date.now(),id=String(input.id||"").trim()||(typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():"rec-"+now+"-"+Math.random().toString(36).slice(2));
 const timestamp=Number.isFinite(Number(input.timestamp))?Number(input.timestamp):now;
 return {id,type:input.type,owner:String(input.owner||"local"),timestamp,
  createdAt:Number(input.createdAt)||timestamp,updatedAt:now,version:Number(input.version)||1,
  language:String(input.language||"und"),subject:String(input.subject||""),topic:String(input.topic||""),
  source:String(input.source||"user"),tags:Array.isArray(input.tags)?[...new Set(input.tags.map(String))]:[],
  relatedIds:Array.isArray(input.relatedIds)?[...new Set(input.relatedIds.map(String))]:[],
  data:input.data===undefined?null:input.data,blobId:input.blobId?String(input.blobId):null};
}
async function putRecord(record){
 const row=normalizeRecord(record);
 return serial("record:"+row.id,async()=>{
  const db=await openDb(),tx=db.transaction("records","readwrite"),finished=complete(tx);
  tx.objectStore("records").put(row);await finished;return row;
 });
}
async function getRecord(id){const db=await openDb();return (await request(db.transaction("records","readonly").objectStore("records").get(String(id))))||null;}
async function queryRecords({type,owner,after,before,subject,topic,tags,limit=100}={}){
 if(type&&!TYPES.has(type))throw new TypeError("Invalid type");
 const db=await openDb(),store=db.transaction("records","readonly").objectStore("records");
 const source=type&&owner?store.index("byTypeOwner").openCursor(IDBKeyRange.only([type,owner]))
  :type?store.index("byType").openCursor(IDBKeyRange.only(type))
  :owner?store.index("byOwner").openCursor(IDBKeyRange.only(owner)):store.openCursor();
 const out=[];
 await new Promise((resolve,reject)=>{
  source.onerror=()=>reject(source.error);
  source.onsuccess=()=>{
   const c=source.result;if(!c){resolve();return;}
   const v=c.value;
   if((after===undefined||v.timestamp>=after)&&(before===undefined||v.timestamp<=before)
     &&(!subject||String(v.subject).toLowerCase()===String(subject).toLowerCase())
     &&(!topic||String(v.topic).toLowerCase().includes(String(topic).toLowerCase()))
     &&(!tags||tags.every(t=>v.tags.includes(t))))out.push(v);
   c.continue();
  };
 });
 out.sort((a,b)=>b.timestamp-a.timestamp);
 return out.slice(0,Math.max(1,Math.min(5000,Number(limit)||100)));
}
async function putBlob(id,blob,{owner="local",type="binary",recordId=null}={}){
 if(!(blob instanceof Blob))throw new TypeError("Blob required");
 const db=await openDb(),tx=db.transaction("blobs","readwrite"),finished=complete(tx);
 tx.objectStore("blobs").put({id:String(id),blob,owner,type,recordId,updatedAt:Date.now()});
 await finished;return String(id);
}
async function getBlob(id){
 const db=await openDb(),row=await request(db.transaction("blobs","readonly").objectStore("blobs").get(String(id)));
 return row?.blob||null;
}
async function deleteRecord(id){
 return serial("record:"+id,async()=>{
  const db=await openDb(),tx=db.transaction(["records","blobs"],"readwrite"),finished=complete(tx);
  const store=tx.objectStore("records");const row=await request(store.get(String(id)));
  if(row?.blobId)tx.objectStore("blobs").delete(row.blobId);
  store.delete(String(id));await finished;return Boolean(row);
 });
}
function localValue(key,fallback){try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v);}catch{return fallback;}}
async function migrateKey(key,fallback){
 const existing=await get(key,undefined);
 if(existing!==undefined)return existing;
 const legacy=localValue(key,undefined);
 const value=legacy===undefined?fallback:legacy;
 await set(key,value);
 const verified=await get(key,undefined);
 if(verified===undefined)throw new Error("Migration verification failed: "+key);
 if(legacy!==undefined){try{localStorage.removeItem(key);}catch{}}
 return verified;
}
async function bootstrap(state){
 if(!state)return false;
 try{
  const pairs=[
   ["robotito.classLines.v1","classLines"],
   ["robotito.classSummaries.v1","classSummaries"],
   ["robotito.academicMaterials.v1","academicMaterials"],
   ["robotito.memories.v2","memories"]
  ];
  for(const [key,property] of pairs){
   const value=await migrateKey(key,Array.isArray(state[property])?state[property]:[]);
   state[property]=Array.isArray(value)?value:[];
  }
  return true;
 }catch(e){console.error("Robotito storage bootstrap failed; preserving old data",e);return false;}
}
async function persistStateKey(key,value){
 if(!HEAVY.has(key))return false;
 try{return await set(key,value);}catch(e){console.error("Could not persist heavy Robotito data",key,e);return false;}
}
async function migrateTypedLegacy({owner="local"}={}){
 const db=await openDb();
 for(const key of HEAVY){
  const marker="typed-v3:"+owner+":"+key;
  const done=await request(db.transaction("migrations","readonly").objectStore("migrations").get(marker));
  if(done)continue;
  const rows=await get(key,[]);
  if(!Array.isArray(rows))continue;
  // Every migrated item has a deterministic id, making restart safe/idempotent.
  for(let i=0;i<rows.length;i++){
   const item=rows[i],timestamp=Number(item?.at||item?.timestamp||item?.date)||Date.now();
   await putRecord({id:"legacy:"+owner+":"+key+":"+i,type:LEGACY_TYPE[key],owner,timestamp,
    subject:item?.subject||item?.materia||"",topic:item?.topic||item?.tema||"",
    source:"legacy:"+key,language:item?.language||"und",data:item});
  }
  const tx=db.transaction("migrations","readwrite"),finished=complete(tx);
  tx.objectStore("migrations").put({id:marker,count:rows.length,at:Date.now()});await finished;
 }
 return true;
}
async function audit(){
 const db=await openDb(),records=await request(db.transaction("records","readonly").objectStore("records").getAll()),
  blobs=await request(db.transaction("blobs","readonly").objectStore("blobs").getAll());
 const ids=new Set(records.map(x=>x.id)),blobIds=new Set(blobs.map(x=>x.id));
 const invalid=records.filter(x=>!TYPES.has(x.type)||!x.id||!x.owner).map(x=>x.id);
 const missingBlobs=records.filter(x=>x.blobId&&!blobIds.has(x.blobId)).map(x=>x.id);
 const staleRelations=records.flatMap(x=>x.relatedIds.filter(id=>!ids.has(id)).map(id=>({record:x.id,missing:id})));
 const orphanBlobs=blobs.filter(x=>x.recordId&&!ids.has(x.recordId)).map(x=>x.id);
 return {total:records.length,blobs:blobs.length,invalid,missingBlobs,staleRelations,orphanBlobs};
}
async function stats(){
 const out={};for(const key of HEAVY){try{const rows=await get(key,[]);out[key]=Array.isArray(rows)?rows.length:0;}catch{out[key]=null;}}
 try{const est=await navigator.storage?.estimate?.();if(est){out.usage=est.usage||0;out.quota=est.quota||0;}}catch{}
 return out;
}
root.ROBOTITO_STORE={get,set,remove,bootstrap,persistStateKey,isHeavyKey:key=>HEAVY.has(key),
 heavyKeys:[...HEAVY],putRecord,getRecord,queryRecords,deleteRecord,putBlob,getBlob,
 migrateTypedLegacy,audit,stats,recordTypes:[...TYPES],dbVersion:VERSION};
})(typeof window!=="undefined"?window:globalThis);
