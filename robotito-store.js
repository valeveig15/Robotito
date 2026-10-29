// Robotito durable storage v3. The legacy key/value store remains readable.
// Typed records and binary objects share ONE IndexedDB database; localStorage is
// only a migration input and a small preference mirror.
(function(root){
"use strict";
const DB_NAME="robotito-data-v2", VERSION=4;
const HEAVY=new Set(["robotito.classLines.v1","robotito.classSummaries.v1","robotito.academicMaterials.v1","robotito.memories.v2","robotito.people.v2","robotito.tasks.v1","robotito.goodreads.v1"]);
const TYPES=new Set(["people","conversations","preferences","memories","classes","subjects","topics","audios","transcripts","pdfs","notes","exercises","books","recommendations","tasks","rules","birthdays"]);
const LEGACY_TYPE={"robotito.classLines.v1":"transcripts","robotito.classSummaries.v1":"classes","robotito.academicMaterials.v1":"notes","robotito.memories.v2":"memories","robotito.people.v2":"people","robotito.tasks.v1":"tasks","robotito.goodreads.v1":"books"};
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
   let records;
   if(!db.objectStoreNames.contains("records")){
    records=db.createObjectStore("records",{keyPath:"id"});
    records.createIndex("byType","type");
    records.createIndex("byOwner","owner");
    records.createIndex("byDate","timestamp");
    records.createIndex("byTypeOwner",["type","owner"]);
   }else records=req.transaction.objectStore("records");
   if(!records.indexNames.contains("byRelation"))records.createIndex("byRelation","relatedIds",{multiEntry:true});
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
// Consent metadata and sampled audio share one atomic IndexedDB transaction.
async function putRecordWithBlob(input,blob,{type="binary"}={}){
 if(!(blob instanceof Blob))throw new TypeError("Blob required");
 const row=normalizeRecord(input);
 if(!row.blobId)throw new TypeError("Record requires blobId");
 return serial("record:"+row.id,async()=>{
  const db=await openDb(),tx=db.transaction(["records","blobs"],"readwrite"),finished=complete(tx);
  tx.objectStore("blobs").put({id:row.blobId,blob,owner:row.owner,type,
   recordId:row.id,updatedAt:Date.now()});
  tx.objectStore("records").put(row);
  await finished;return row;
 });
}
async function getBlob(id){
 const db=await openDb(),row=await request(db.transaction("blobs","readonly").objectStore("blobs").get(String(id)));
 return row?.blob||null;
}
// Removes legacy blobs even if a previous interrupted save left no record.
async function deleteBlob(id){
 const db=await openDb(),tx=db.transaction("blobs","readwrite"),finished=complete(tx);
 tx.objectStore("blobs").delete(String(id));
 await finished;return true;
}
async function deleteRecord(id){
 return serial("record:"+id,async()=>{
  const db=await openDb(),tx=db.transaction(["records","blobs"],"readwrite"),finished=complete(tx);
  const store=tx.objectStore("records");const row=await request(store.get(String(id)));
  if(row?.blobId)tx.objectStore("blobs").delete(row.blobId);
  store.delete(String(id));
  // Keep relation metadata coherent when its target disappears.
  await new Promise((resolve,reject)=>{
    const cursor=store.index("byRelation").openCursor(IDBKeyRange.only(String(id)));
    cursor.onerror=()=>reject(cursor.error);
    cursor.onsuccess=()=>{
      const row=cursor.result;
      if(!row){resolve();return;}
      row.update({...row.value,relatedIds:(row.value.relatedIds||[]).filter(link=>link!==String(id))});
      row.continue();
    };
  });
  await finished;return Boolean(row);
 });
}
async function clearRecordsByType(type,{owner}={}){
 if(!TYPES.has(type))throw new TypeError("Invalid record type");
 let total=0;
 while(true){
  const records=await queryRecords({type,owner,limit:5000});
  if(!records.length)break;
  for(const record of records){await deleteRecord(record.id);total++;}
 }
 return total;
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
   ["robotito.memories.v2","memories"],
   ["robotito.people.v2","people"],["robotito.tasks.v1","tasks"],["robotito.goodreads.v1","library"]
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
  if(key==="robotito.people.v2"){
   for(let i=0;i<rows.length;i++){
    const p=rows[i];
    if(p?.birthday)await putRecord({id:"birth:"+owner+":"+i,type:"birthdays",owner,
      source:"people",data:{person:p.name,date:p.birthday}});
   }
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
// P07: a whole-device, explicitly requested, local-only backup. A subset
// export would silently lose old class state or audio and is NOT acceptable.
const BACKUP_STORES=["state","records","blobs","migrations"];
const BACKUP_MAX_BYTES=32*1024*1024, BACKUP_MAX_SINGLE_BLOB=12*1024*1024;
function validateBackup(raw){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||raw.format!=="robotito-local-backup"||
    raw.schema!==1||raw.dbVersion!==VERSION)throw new TypeError("Unsupported Robotito backup format");
 for(const name of BACKUP_STORES){
  if(!Array.isArray(raw[name])||raw[name].length>20000)throw new TypeError("Missing or oversized backup store: "+name);
 }
 const ids={},check=(key,value)=>{
  if(typeof value!=="string"||!value.trim()||value.length>1024)throw new TypeError("Invalid backup ID: "+key);
  if(ids[key].has(value))throw new TypeError("Duplicate backup ID: "+value);
  ids[key].add(value);
 };
 for(const name of BACKUP_STORES)ids[name]=new Set();
 for(const row of raw.state){if(!row||typeof row!=="object")throw new TypeError("Invalid state");check("state",row.key);}
 for(const row of raw.records){
  if(!row||typeof row!=="object"||!TYPES.has(row.type)||typeof row.owner!=="string"||!row.owner.trim())
   throw new TypeError("Invalid typed backup record");
  check("records",row.id);
  if(row.blobId!==null&&row.blobId!==undefined&&typeof row.blobId!=="string")
   throw new TypeError("Invalid record blob link");
  if(!Array.isArray(row.relatedIds))throw new TypeError("Invalid record relations");
 }
 for(const row of raw.migrations){if(!row||typeof row!=="object")throw new TypeError("Invalid migration");check("migrations",row.id);}
 let bytes=0;
 for(const row of raw.blobs){
  if(!row||typeof row!=="object"||typeof row.base64!=="string"||
    typeof row.owner!=="string"||!row.owner.trim()||typeof row.type!=="string"||
    typeof row.recordId!=="string"||!row.recordId.trim()||
    !Number.isSafeInteger(row.size)||row.size<0||row.size>BACKUP_MAX_SINGLE_BLOB)
   throw new TypeError("Invalid backup audio/blob");
  check("blobs",row.id);
  if(row.base64.length!==Math.ceil(row.size/3)*4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(row.base64))
   throw new TypeError("Malformed backup blob bytes");
  bytes+=row.size;
  if(bytes>BACKUP_MAX_BYTES)throw new Error("Backup contains too much binary data");
 }
 for(const row of raw.records){
  if(row.blobId){
   const blob=raw.blobs.find(b=>b.id===row.blobId);
   if(!blob||blob.recordId!==row.id||blob.owner!==row.owner)
    throw new TypeError("Backup would attach a blob to the wrong person or record");
  }
 }
 for(const blob of raw.blobs){
  const linked=raw.records.find(r=>r.id===blob.recordId);
  if(!linked||linked.blobId!==blob.id||linked.owner!==blob.owner)
   throw new TypeError("Backup contains an orphan or cross-owner blob");
 }
 return {records:raw.records.length,blobs:raw.blobs.length,
  state:raw.state.length,migrations:raw.migrations.length,binaryBytes:bytes,
  owners:[...new Set(raw.records.map(r=>r.owner))].sort()};
}
function encodeBytes(buffer){
 const bytes=new Uint8Array(buffer),chunks=[];
 for(let i=0;i<bytes.length;i+=8192)chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
 return btoa(chunks.join(""));
}
function decodeBytes(encoded){
 const text=atob(encoded),data=new Uint8Array(text.length);
 for(let i=0;i<text.length;i++)data[i]=text.charCodeAt(i);
 return data;
}
async function exportBackup(){
 const db=await openDb();
 if(BACKUP_STORES.some(name=>!db.objectStoreNames.contains(name))||
    db.objectStoreNames.length!==BACKUP_STORES.length)
  throw new Error("Storage schema is not supported by this backup version");
 const tx=db.transaction(BACKUP_STORES,"readonly"),finished=complete(tx);
 const rows=await Promise.all(BACKUP_STORES.map(name=>request(tx.objectStore(name).getAll())));
 await finished;
 const snapshot={format:"robotito-local-backup",schema:1,dbVersion:VERSION,
  createdAt:new Date().toISOString()};
 let totalBytes=0;
 for(let i=0;i<BACKUP_STORES.length;i++){
  const name=BACKUP_STORES[i];
  if(name!=="blobs"){snapshot[name]=rows[i];continue;}
  snapshot.blobs=[];
  for(const item of rows[i]){
   if(!(item.blob instanceof Blob)||item.blob.size>BACKUP_MAX_SINGLE_BLOB)
    throw new Error("Cannot back up a large or invalid local file; no partial backup was produced");
   totalBytes+=item.blob.size;
   if(totalBytes>BACKUP_MAX_BYTES)throw new Error("Local files exceed backup limit; no partial backup was produced");
   snapshot.blobs.push({id:item.id,owner:item.owner,type:item.type,recordId:item.recordId,
    updatedAt:item.updatedAt,size:item.blob.size,mime:item.blob.type||"application/octet-stream",
    base64:encodeBytes(await item.blob.arrayBuffer())});
  }
 }
 validateBackup(snapshot);
 if(new Blob([JSON.stringify(snapshot)]).size>BACKUP_MAX_BYTES)
  throw new Error("Backup exceeds the 32 MiB safe JSON limit; nothing was exported");
 return snapshot;
}
// Restore replaces the ENTIRE same-browser dataset, never merging anonymous,
// pseudonymous or known profiles. IndexedDB commits all stores atomically.
async function restoreBackup(raw,{confirmation}={}){
 if(confirmation!=="RESTAURAR")throw new Error("Explicit restore confirmation required");
 const summary=validateBackup(raw);
 if(new Blob([JSON.stringify(raw)]).size>BACKUP_MAX_BYTES)
  throw new Error("Backup JSON exceeds the supported size");
 const decoded=[];
 for(const item of raw.blobs){
  const bytes=decodeBytes(item.base64);
  if(bytes.length!==item.size)throw new TypeError("Invalid backup blob size");
  decoded.push({id:item.id,owner:item.owner,type:item.type,recordId:item.recordId,
   updatedAt:item.updatedAt,blob:new Blob([bytes],{type:item.mime||"application/octet-stream"})});
 }
 const db=await openDb();
 if(BACKUP_STORES.some(name=>!db.objectStoreNames.contains(name))||
    db.objectStoreNames.length!==BACKUP_STORES.length)
  throw new Error("Incompatible storage schema");
 const tx=db.transaction(BACKUP_STORES,"readwrite"),finished=complete(tx);
 for(const name of BACKUP_STORES)tx.objectStore(name).clear();
 for(const name of BACKUP_STORES){
  for(const item of name==="blobs"?decoded:raw[name])tx.objectStore(name).put(item);
 }
 await finished;
 return summary;
}

async function stats(){
 const out={};for(const key of HEAVY){try{const rows=await get(key,[]);out[key]=Array.isArray(rows)?rows.length:0;}catch{out[key]=null;}}
 try{const est=await navigator.storage?.estimate?.();if(est){out.usage=est.usage||0;out.quota=est.quota||0;}}catch{}
 return out;
}
root.ROBOTITO_STORE={get,set,remove,bootstrap,persistStateKey,isHeavyKey:key=>HEAVY.has(key),
 heavyKeys:[...HEAVY],putRecord,getRecord,queryRecords,deleteRecord,putBlob,putRecordWithBlob,getBlob,deleteBlob,
 migrateTypedLegacy,clearRecordsByType,audit,stats,exportBackup,validateBackup,restoreBackup,recordTypes:[...TYPES],dbVersion:VERSION};
})(typeof window!=="undefined"?window:globalThis);
