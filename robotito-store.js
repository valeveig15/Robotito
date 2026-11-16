// Robotito durable storage v3. The legacy key/value store remains readable.
// Typed records and binary objects share ONE IndexedDB database; localStorage is
// only a migration input and a small preference mirror.
(function(root){
"use strict";
const DB_NAME="robotito-data-v2", VERSION=4;
const HEAVY=new Set(["robotito.classLines.v1","robotito.classSummaries.v1","robotito.academicMaterials.v1","robotito.memories.v2","robotito.people.v2","robotito.tasks.v1","robotito.goodreads.v1"]);
const TYPES=new Set(["people","conversations","preferences","memories","relationships","classes","subjects","topics","audios","transcripts","pdfs","notes","exercises","books","recommendations","tasks","rules","birthdays"]);
const LEGACY_TYPE={"robotito.classLines.v1":"transcripts","robotito.classSummaries.v1":"classes","robotito.academicMaterials.v1":"notes","robotito.memories.v2":"memories","robotito.people.v2":"people","robotito.tasks.v1":"tasks","robotito.goodreads.v1":"books"};
const queues=new Map();
const ephemeralRecords=new Map(),ephemeralBlobs=new Map(),ephemeralState=new Map();
const isEphemeral=owner=>String(owner).startsWith("session:");
const ephemeralKey=key=>String(key).startsWith("memory-scope:session%3A");
function clearEphemeralOwner(owner){
 if(!isEphemeral(owner))throw Error("Temporary owner required");
 for(const [id,row] of ephemeralRecords)if(row.owner===owner)ephemeralRecords.delete(id);
 for(const [id,row] of ephemeralBlobs)if(row.owner===owner)ephemeralBlobs.delete(id);
 const prefix="memory-scope:"+encodeURIComponent(owner)+":";
 for(const key of ephemeralState.keys())if(key.startsWith(prefix))ephemeralState.delete(key);
}
let dbPromise=null;
let databaseEpoch=null;
const changes=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("robotito-memory-changes"):null;
function notifyChange(){root.dispatchEvent?.(new Event("robotito:memorychange"));changes?.postMessage({changed:true});}
if(changes)changes.onmessage=()=>root.dispatchEvent?.(new Event("robotito:memorychange"));
function transaction(db,names,mode="readonly",{replace=false}={}){
 const list=typeof names==="string"?[names]:[...names];
 if(mode==="readwrite"&&!list.includes("migrations"))list.push("migrations");
 const tx=db.transaction(list,mode);
 if(mode==="readwrite"){
  if(!replace){const guard=tx.objectStore("migrations").get("p07:epoch");
   guard.onsuccess=()=>{if((guard.result?.value||"initial")!==databaseEpoch){try{tx.abort();}catch{};}};
  }
  tx.addEventListener("complete",notifyChange);
 }
 return tx;
}
async function withTransaction(names,mode,body,options){
 const db=await openDb(),tx=transaction(db,names,mode,options),finished=complete(tx);
 try{const result=await body(tx);await finished;return result;}
 catch(error){try{tx.abort();}catch{}await finished.catch(()=>{});throw error;}
}
function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("IndexedDB request failed"));});}
function complete(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=event=>reject(event?.target?.error||tx.error||new Error("IndexedDB transaction failed"));tx.onabort=()=>reject(tx.error||new Error("IndexedDB transaction aborted"));});}
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
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();dbPromise=null;};
   const epoch=db.transaction("migrations","readonly").objectStore("migrations").get("p07:epoch");
   epoch.onsuccess=()=>{databaseEpoch=epoch.result?.value||"initial";resolve(db);};epoch.onerror=()=>reject(epoch.error);
  };
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
 if(ephemeralKey(key))return structuredClone(ephemeralState.get(key)??fallback);
 const db=await openDb();const tx=transaction(db,"state","readonly");
 const result=await request(tx.objectStore("state").get(key));
 return result?.value===undefined?fallback:result.value;
}
async function set(key,value){
 if(ephemeralKey(key)){ephemeralState.set(key,structuredClone(value));return true;}
 return serial("state:"+key,async()=>{
  const db=await openDb(),tx=transaction(db,"state","readwrite"),finished=complete(tx);
  tx.objectStore("state").put({key,value,updatedAt:Date.now()});
  await finished;return true;
 });
}
async function remove(key){
 if(ephemeralKey(key)){ephemeralState.delete(key);return true;}
 return serial("state:"+key,async()=>{
  const db=await openDb(),tx=transaction(db,"state","readwrite"),finished=complete(tx);
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
  data:input.data===undefined?null:input.data,blobId:input.blobId?String(input.blobId):null,
  ...(input.provenance?{provenance:input.provenance}:{})};
}
async function putRecord(record){
 const row=normalizeRecord(record);
 if(isEphemeral(row.owner)){
  const previous=ephemeralRecords.get(row.id);
  if(previous&&(previous.owner!==row.owner||previous.type!==row.type))throw Error("Record ID belongs to another session");
  row.version=previous?previous.version+1:row.version;ephemeralRecords.set(row.id,structuredClone(row));return row;
 }
 return serial("record:"+row.id,async()=>{
  const db=await openDb(),tx=transaction(db,"records","readwrite"),finished=complete(tx);
  try{
   const previous=await request(tx.objectStore("records").get(row.id));
   if(previous&&(previous.owner!==row.owner||previous.type!==row.type))throw Error("Use a reviewed link to change record ownership");
   row.version=previous?previous.version+1:row.version;
   tx.objectStore("records").put(row);await finished;return row;
  }catch(error){try{tx.abort();}catch{}await finished.catch(()=>{});throw error;}
 });
}
async function getRecord(id){if(ephemeralRecords.has(String(id)))return structuredClone(ephemeralRecords.get(String(id)));const db=await openDb();return (await request(transaction(db,"records","readonly").objectStore("records").get(String(id))))||null;}
async function queryRecords({type,owner,after,before,subject,topic,tags,limit=100}={}){
 if(type&&!TYPES.has(type))throw new TypeError("Invalid type");
 if(isEphemeral(owner))return [...ephemeralRecords.values()].filter(v=>v.owner===owner&&(!type||v.type===type)
  &&(after===undefined||v.timestamp>=after)&&(before===undefined||v.timestamp<=before)
  &&(!subject||v.subject===subject)&&(!topic||v.topic.includes(topic))&&(!tags||tags.every(t=>v.tags.includes(t))))
  .sort((a,b)=>b.timestamp-a.timestamp).slice(0,limit).map(v=>structuredClone(v));
 const db=await openDb(),store=transaction(db,"records","readonly").objectStore("records");
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
 // Infinity is used by contextual retrieval: filtering after a 100-row window
 // could falsely claim an older, matching memory did not exist.
 return limit===Infinity?out:out.slice(0,Math.max(1,Math.min(5000,Number(limit)||100)));
}
async function putBlob(id,blob,{owner="local",type="binary",recordId=null}={}){
 if(!(blob instanceof Blob))throw new TypeError("Blob required");
 if(isEphemeral(owner)){ephemeralBlobs.set(String(id),{blob,owner,recordId,type});return String(id);}
 // ArrayBuffer works in engines/private contexts that cannot persist Blob
 // backing files. Decode before opening a transaction, never while it idles.
 const blobBytes=await blob.arrayBuffer(),mimeType=blob.type;
 const db=await openDb(),tx=transaction(db,"blobs","readwrite"),finished=complete(tx);
 tx.objectStore("blobs").put({id:String(id),blobBytes,mimeType,owner,type,recordId,updatedAt:Date.now()});
 await finished;return String(id);
}
// Consent metadata and sampled audio share one atomic IndexedDB transaction.
async function putRecordWithBlob(input,blob,{type="binary"}={}){
 if(!(blob instanceof Blob))throw new TypeError("Blob required");
 const row=normalizeRecord(input);
 if(!row.blobId)throw new TypeError("Record requires blobId");
 if(isEphemeral(row.owner)){
  const previous=ephemeralRecords.get(row.id),file=ephemeralBlobs.get(row.blobId);
  if(previous&&(previous.owner!==row.owner||previous.type!==row.type)||file&&(file.owner!==row.owner||file.recordId!==row.id))throw Error("File ownership mismatch");
  row.version=previous?previous.version+1:row.version;
  const copy=structuredClone(row);ephemeralRecords.set(row.id,copy);ephemeralBlobs.set(row.blobId,{blob,owner:row.owner,recordId:row.id,type});return copy;
 }
 return serial("record:"+row.id,async()=>{
  const blobBytes=await blob.arrayBuffer(),mimeType=blob.type;
  const db=await openDb(),tx=transaction(db,["records","blobs"],"readwrite"),finished=complete(tx);
  try{
   const previous=await request(tx.objectStore("records").get(row.id));
   if(previous&&(previous.owner!==row.owner||previous.type!==row.type))throw Error("Use a reviewed link to change record ownership");
   const file=await request(tx.objectStore("blobs").get(row.blobId));
   if(file&&(file.owner!==row.owner||file.recordId!==row.id))throw Error("File ownership mismatch");
   row.version=previous?previous.version+1:row.version;
   tx.objectStore("blobs").put({id:row.blobId,blobBytes,mimeType,owner:row.owner,type,
    recordId:row.id,updatedAt:Date.now()});
   tx.objectStore("records").put(row);
   await finished;return row;
  }catch(error){
   // A synchronous DataCloneError does not automatically abort earlier writes.
   // Roll back the staged blob as well, preserving any previously saved pair.
   try{tx.abort();}catch{}
   await finished.catch(()=>{});
   throw error;
  }
 });
}
async function getBlob(id){
 if(ephemeralBlobs.has(String(id)))return ephemeralBlobs.get(String(id)).blob;
 const db=await openDb(),row=await request(transaction(db,"blobs","readonly").objectStore("blobs").get(String(id)));
 return storedBlob(row);
}
function storedBlob(row){
 if(!row)return null;
 if(row.blob instanceof Blob)return row.blob; // Existing recordings remain readable.
 if(row.blobBytes instanceof ArrayBuffer)return new Blob([row.blobBytes],{type:row.mimeType||""});
 return null;
}
// Removes legacy blobs even if a previous interrupted save left no record.
async function deleteBlob(id){
 if(ephemeralBlobs.has(String(id))){ephemeralBlobs.delete(String(id));return true;}
 const db=await openDb(),tx=transaction(db,["blobs","state"],"readwrite"),finished=complete(tx);
 tx.objectStore("blobs").delete(String(id));
 tx.objectStore("state").delete(RESTORE_UNDO_KEY);
 await finished;return true;
}
async function deleteRecord(id){
 if(ephemeralRecords.has(String(id))){const row=ephemeralRecords.get(String(id));ephemeralRecords.delete(String(id));if(row.blobId)ephemeralBlobs.delete(row.blobId);return true;}
 return serial("record:"+id,async()=>{
  const db=await openDb(),tx=transaction(db,["records","blobs","state"],"readwrite"),finished=complete(tx);
  const store=tx.objectStore("records");const row=await request(store.get(String(id)));
  if(row?.blobId)tx.objectStore("blobs").delete(row.blobId);
  store.delete(String(id));
  tx.objectStore("state").delete(RESTORE_UNDO_KEY);
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
// P07: owner-checked, optimistic-concurrency memory changes. The typed row
// and the legacy memory mirror are changed in ONE transaction so editing cannot
// resurrect a stale answer after reload. Unknown legacy entries stay local.
const MEMORY_MIRROR_KEY="robotito.memories.v2";
function mirrorMemoryIndex(memories,id,record){
 const direct=memories.findIndex(m=>m&&m.id===id);
 if(direct!==-1)return direct;
 const match=/^legacy:local:robotito\.memories\.v2:(\d+)$/.exec(id);
 if(!match||record.owner!=="local")return -1;
 const i=Number(match[1]),candidate=memories[i];
 return candidate&&candidate.at===record.timestamp&&candidate.text===record.data?.text?i:-1;
}
async function changeOwnedMemory({id,owner,text,expectedVersion,remove=false}={}){
 if(typeof id!=="string"||!id||typeof owner!=="string"||!owner.trim()||
    !Number.isSafeInteger(expectedVersion)||expectedVersion<1)
  throw new TypeError("Memory identity and expected version are required");
 if(!remove&&(typeof text!=="string"||!text.trim()||text.trim().length>3000))
  throw new TypeError("Memory text must be between 1 and 3000 characters");
 return serial("record:"+id,async()=>{
  const db=await openDb(),tx=transaction(db,["records","state","blobs"],"readwrite"),
   finished=complete(tx),records=tx.objectStore("records"),state=tx.objectStore("state");
  try{
   const old=await request(records.get(id));
   if(!old||old.owner!==owner||old.type!=="memories")
    throw new Error("Memory not found for the current owner");
   if((Number(old.version)||1)!==expectedVersion)
    throw new Error("Memory changed in another tab; refresh before editing");
   const stored=await request(state.get(MEMORY_MIRROR_KEY));
   const memories=Array.isArray(stored?.value)?stored.value:null;
   const index=memories?mirrorMemoryIndex(memories,id,old):-1;
   const now=Date.now();
   let updated=null,mirror=null;
   if(remove){
    if(old.blobId)tx.objectStore("blobs").delete(old.blobId);
    records.delete(id);
    state.delete(RESTORE_UNDO_KEY);
    // A deleted memory must not remain as a dangling relation.
    await new Promise((resolve,reject)=>{
     const cursor=records.index("byRelation").openCursor(IDBKeyRange.only(id));
     cursor.onerror=()=>reject(cursor.error);
     cursor.onsuccess=()=>{
      const current=cursor.result;if(!current){resolve();return;}
      current.update({...current.value,
       relatedIds:(current.value.relatedIds||[]).filter(related=>related!==id)});
      current.continue();
     };
    });
   }else{
    updated={...old,version:expectedVersion+1,updatedAt:now,
     data:{...(old.data&&typeof old.data==="object"?old.data:{}),text:text.trim()}};
    records.put(updated);
   }
   if(index!==-1){
    mirror=memories.slice();
    if(remove)mirror.splice(index,1);
    else mirror[index]={...mirror[index],text:text.trim(),version:updated.version,id,owner};
    state.put({...stored,value:mirror,updatedAt:now});
   }
   await finished;
   return {record:updated,memories:mirror};
  }catch(error){try{tx.abort();}catch{}await finished.catch(()=>{});throw error;}
 });
}
// New memories are written to both generations of storage together; failure
// leaves neither a misleading UI entry nor a partially stored typed record.
async function appendMemory({owner,person,text,language="es",source="manual",at=Date.now()}={}){
 if(typeof owner!=="string"||!owner.trim()||typeof text!=="string"||
    !text.trim()||text.trim().length>3000)throw new TypeError("Invalid memory");
 const id="memory:"+Date.now()+":"+(typeof crypto!=="undefined"&&crypto.randomUUID?
  crypto.randomUUID():Math.random().toString(36).slice(2));
 const row=normalizeRecord({id,type:"memories",owner,language,source,
  timestamp:at,data:{text:text.trim(),person:person||owner,source}});
 return serial("state:"+MEMORY_MIRROR_KEY,async()=>{
  const db=await openDb(),tx=transaction(db,["records","state"],"readwrite"),
   finished=complete(tx);
  try{
   const state=tx.objectStore("state"),existing=await request(state.get(MEMORY_MIRROR_KEY));
   const before=Array.isArray(existing?.value)?existing.value:[];
   const entry={id,owner,person:person||owner,text:text.trim(),at,
    language,source,version:row.version};
   const memories=[...before,entry];
   tx.objectStore("records").add(row);
   state.put({key:MEMORY_MIRROR_KEY,value:memories,updatedAt:Date.now()});
   await finished;return {record:row,memories};
  }catch(error){try{tx.abort();}catch{}await finished.catch(()=>{});throw error;}
 });
}
async function updateOwnedMemory({id,owner,text,expectedVersion}){
 return changeOwnedMemory({id,owner,text,expectedVersion});
}
async function deleteOwnedMemory({id,owner,expectedVersion}){
 return changeOwnedMemory({id,owner,expectedVersion,remove:true});
}
// Clear only the selected owner's memories, in a single write transaction.
// Never erase a different person's record because one profile requested cleanup.
async function clearOwnedMemories(owner){
 if(typeof owner!=="string"||!owner.trim())throw new TypeError("Memory owner required");
 const db=await openDb(),tx=transaction(db,["records","blobs","state"],"readwrite"),
  finished=complete(tx),records=tx.objectStore("records"),state=tx.objectStore("state");
 try{
  const rows=await request(records.index("byTypeOwner").getAll(IDBKeyRange.only(["memories",owner])));
  const ids=new Set(rows.map(row=>row.id));
  for(const row of rows){
   if(row.blobId)tx.objectStore("blobs").delete(row.blobId);
   records.delete(row.id);
  }
  // Remove any relations to deleted memories without touching other content.
  if(ids.size)await new Promise((resolve,reject)=>{
   const cursor=records.openCursor();
   cursor.onerror=()=>reject(cursor.error);
   cursor.onsuccess=()=>{
    const current=cursor.result;if(!current){resolve();return;}
    const prev=current.value,related=prev.relatedIds||[];
    if(related.some(id=>ids.has(id)))
     current.update({...prev,relatedIds:related.filter(id=>!ids.has(id))});
    current.continue();
   };
  });
  const mirror=await request(state.get(MEMORY_MIRROR_KEY));
  const memories=Array.isArray(mirror?.value)?
   mirror.value.filter(m=>m&&(m.owner||"local")!==owner):null;
  if(memories)state.put({...mirror,value:memories,updatedAt:Date.now()});
  // A privacy deletion must also erase any checkpoint containing old data.
  if(ids.size||memories)state.delete(RESTORE_UNDO_KEY);
  await finished;
  return {deleted:rows.length,memories};
 }catch(error){try{tx.abort();}catch{}await finished.catch(()=>{});throw error;}
}
// P08 consent revocation: delete a named registered profile and its clearly
// owned local records in ONE transaction. Never infer that a legacy anonymous
// conversation belongs to the person merely because it mentions their name.
async function deleteRegisteredProfile(name,{confirmation}={}){
 const target=String(name||"").trim();
 if(!target||target.length>200||confirmation!=="BORRAR")
  throw new Error("Explicit profile deletion confirmation required");
 const norm=s=>String(s||"").trim().toLocaleLowerCase();
 const db=await openDb(),tx=transaction(db,["state","records","blobs"],"readwrite"),
  finished=complete(tx),state=tx.objectStore("state"),records=tx.objectStore("records"),
  blobs=tx.objectStore("blobs");
 try{
  const peopleState=await request(state.get("robotito.people.v2"));
  const people=peopleState?.value;
  if(!Array.isArray(people))throw new Error("Registered profiles unavailable");
  const matched=people.filter(p=>norm(p?.name)===norm(target));
  if(matched.length!==1)throw new Error("Profile name is missing or ambiguous");
  const personName=matched[0].name;
  const match=s=>norm(s)===norm(personName);
  const rows=await request(records.getAll());
  const deleted=new Set(),deletedBlobs=new Set();
  for(const row of rows){
   const directOwner=match(row.owner);
   const legacyProfile=row.type==="people"&&match(row.data?.name);
   const legacyBirthday=row.type==="birthdays"&&match(row.data?.person);
   if(directOwner||legacyProfile||legacyBirthday){
    deleted.add(row.id);records.delete(row.id);
    if(row.blobId){deletedBlobs.add(row.blobId);blobs.delete(row.blobId);}
   }
  }
  for(const row of rows){
   if(deleted.has(row.id)||!Array.isArray(row.relatedIds))continue;
   const links=row.relatedIds.filter(id=>!deleted.has(id));
   if(links.length!==row.relatedIds.length)
    records.put({...row,relatedIds:links,updatedAt:Date.now()});
  }
  const allBlobs=await request(blobs.getAll());
  for(const item of allBlobs){
   if(match(item.owner)||deleted.has(item.recordId)){
    blobs.delete(item.id);deletedBlobs.add(item.id);
   }
  }
  const replacement=people.filter(p=>!match(p?.name));
  state.put({...peopleState,value:replacement,updatedAt:Date.now()});
  const memories=await request(state.get("robotito.memories.v2"));
  if(Array.isArray(memories?.value))
   state.put({...memories,value:memories.value.filter(m=>!match(m?.owner)),
    updatedAt:Date.now()});
  const transcripts=await request(state.get("robotito.classLines.v1"));
  if(Array.isArray(transcripts?.value)){
   const revised=transcripts.value.map(line=>{
    if(!match(line?.speakerName))return line;
    const {voicePrint,feature,...safe}=line;
    return {...safe,speakerName:null,speaker:"classmate",speakerConfidence:0};
   });
   state.put({...transcripts,value:revised,updatedAt:Date.now()});
  }
  for(const item of await request(state.getAll()))if(item.key.startsWith("memory-scope:"+encodeURIComponent(personName)+":"))state.delete(item.key);
  // A previous restore must not resurrect a deleted biometric identity.
  state.delete(RESTORE_UNDO_KEY);
  await finished;
  return {name:personName,people:replacement,recordsDeleted:deleted.size,
   blobsDeleted:deletedBlobs.size};
 }catch(error){try{tx.abort();}catch{}await finished.catch(()=>{});throw error;}
}
// P09 — transactional, revision-checked updates to the encrypted visitor vault.
// No raw face descriptors or names are stored at this key, and no visitor is
// automatically associated with a registered person.
const VISITOR_VAULT_KEY="robotito.visitors.v1";
function checkVisitorEnvelope(next,expectedRevision){
 if(!next||next.format!=="robotito-p09-encrypted-vault"||next.schema!==1||
  !Number.isSafeInteger(next.revision)||next.revision!==expectedRevision+1||
  next.cipher!=="AES-256-GCM"||next.kdf!=="PBKDF2-SHA256"||
  next.iterations!==310000||typeof next.ciphertext!=="string"||
  next.ciphertext.length>Math.ceil(262160/3)*4||
  typeof next.salt!=="string"||typeof next.iv!=="string")
  throw new TypeError("Invalid private visitor envelope");
}
async function updateVisitorEnvelope(envelope,{expectedRevision}={}){
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)
  throw new TypeError("Missing expected visitor vault revision");
 checkVisitorEnvelope(envelope,expectedRevision);
 const db=await openDb(),tx=transaction(db,"state","readwrite"),finished=complete(tx),
  state=tx.objectStore("state");
 try{
  const prior=await request(state.get(VISITOR_VAULT_KEY));
  if((prior?.value?.revision||0)!==expectedRevision)
   throw new Error("Visitor vault changed in another tab; lock and reopen it");
  state.put({key:VISITOR_VAULT_KEY,value:envelope,updatedAt:Date.now()});
  await finished;return true;
 }catch(error){try{tx.abort();}catch{}await finished.catch(()=>{});throw error;}
}
async function deleteVisitorVault({confirmation}={}){
 if(confirmation!=="BORRAR VISITAS")throw new Error("Explicit visitor deletion required");
 const db=await openDb(),tx=transaction(db,"state","readwrite"),finished=complete(tx),
  state=tx.objectStore("state");
 state.delete(VISITOR_VAULT_KEY);
 // Undo must never resurrect biometrics the visitor chose to delete.
 state.delete(RESTORE_UNDO_KEY);
 await finished;return true;
}
async function linkVisitorProfile({name,bond,expectedRevision,envelope,confirmation}={}){
 if(confirmation!=="VINCULAR"||typeof name!=="string"||!name.trim()||
   !Number.isSafeInteger(expectedRevision)||expectedRevision<1||
   !bond||["affection","trust","fear","irritation"].some(k=>
    !Number.isFinite(bond[k])||bond[k]<0||bond[k]>100))
  throw new TypeError("Verified explicit association required");
 checkVisitorEnvelope(envelope,expectedRevision);
 const db=await openDb(),tx=transaction(db,"state","readwrite"),finished=complete(tx),
  state=tx.objectStore("state");
 try{
  const [oldVault,oldPeople]=await Promise.all([
   request(state.get(VISITOR_VAULT_KEY)),request(state.get("robotito.people.v2"))]);
  if(oldVault?.value?.revision!==expectedRevision)
   throw new Error("Visitor history changed during association");
  if(!Array.isArray(oldPeople?.value))
   throw new Error("People were not durably saved");
  const match=oldPeople.value.filter(p=>
    String(p?.name||"").trim().toLocaleLowerCase()===name.trim().toLocaleLowerCase());
  if(match.length!==1)throw new Error("Registered person not uniquely found");
  const old=match[0];
  const b=old.bond&&["affection","trust","fear","irritation"].every(k=>
    Number.isFinite(old.bond[k]))?old.bond:{
     affection:50,trust:50,fear:8,irritation:8};
  // Never overwrite a registered relationship using an unverified face alone.
  // Only the latest explicitly reviewed encrypted visitor profile can add
  // cautious influence to each dimension, bounded to avoid abrupt jumps.
  const merged={...b};
  for(const k of ["affection","trust","fear","irritation"])
   merged[k]=Math.max(0,Math.min(100,b[k]+Math.max(-12,Math.min(12,(bond[k]-b[k])*.30))));
  merged.updatedAt=Date.now();
  const people=oldPeople.value.map(p=>p===old?{...p,bond:merged,
   relationship:Math.round((merged.affection+merged.trust+(100-merged.fear)+(100-merged.irritation))/4),
   visitorBondLinkedAt:Date.now()}:p);
  state.put({...oldPeople,value:people,updatedAt:Date.now()});
  state.put({key:VISITOR_VAULT_KEY,value:envelope,updatedAt:Date.now()});
  state.delete(RESTORE_UNDO_KEY);
  await finished;return people;
 }catch(error){try{tx.abort();}catch{}await finished.catch(()=>{});throw error;}
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
async function editRecord(id,{owner,expectedVersion,data,remove=false}={}){
 if(!owner||!Number.isInteger(expectedVersion))throw Error("Owner and record version required");
 if(!isEphemeral(owner)&&(await getRecord(id))?.type==="memories"){
  const result=await changeOwnedMemory({id,owner,expectedVersion,text:data?.text,remove});return result.record;
 }
 const change=row=>{
  if(!row||row.owner!==owner)throw Error("Record does not belong to this owner");
  if(row.version!==expectedVersion)throw Error("Memory changed in another tab; reload before editing");
  return {...row,data:structuredClone(data),version:row.version+1,updatedAt:Date.now()};
 };
 if(isEphemeral(owner)){
  const next=change(ephemeralRecords.get(String(id)));
  if(remove)await deleteRecord(id);else ephemeralRecords.set(String(id),next);
  notifyChange();return remove?null:next;
 }
 return withTransaction(["records","blobs","state"],"readwrite",async tx=>{
  const records=tx.objectStore("records"),row=await request(records.get(String(id))),next=change(row);
  if(remove){tx.objectStore("state").delete(RESTORE_UNDO_KEY);records.delete(String(id));if(row.blobId)tx.objectStore("blobs").delete(row.blobId);
   const related=await request(records.index("byRelation").getAll(String(id)));
   for(const linked of related)records.put({...linked,relatedIds:linked.relatedIds.filter(x=>x!==String(id)),version:linked.version+1});
  }else records.put(next);
  return remove?null:next;
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
  const done=await request(transaction(db,"migrations","readonly").objectStore("migrations").get(marker));
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
  const tx=transaction(db,"migrations","readwrite"),finished=complete(tx);
  tx.objectStore("migrations").put({id:marker,count:rows.length,at:Date.now()});await finished;
 }
 return true;
}
async function audit(){
 const db=await openDb(),records=await request(transaction(db,"records","readonly").objectStore("records").getAll()),
  blobs=await request(transaction(db,"blobs","readonly").objectStore("blobs").getAll());
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
// This is internal IndexedDB state, never included in exported backup files.
const RESTORE_UNDO_KEY="robotito.restore.undo.v1";
const RESTORE_UNDO_MAX_BYTES=256*1024*1024;
const BACKUP_MAX_BYTES=32*1024*1024, BACKUP_MAX_SINGLE_BLOB=12*1024*1024;
function validateBackup(raw){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||raw.format!=="robotito-local-backup"||
    raw.schema!==1||![3,4].includes(raw.dbVersion))throw new TypeError("Unsupported Robotito backup format");
 for(const name of BACKUP_STORES){
  if(!Array.isArray(raw[name])||raw[name].length>20000)throw new TypeError("Missing or oversized backup store: "+name);
 }
 const ids={},check=(key,value)=>{
  if(typeof value!=="string"||!value.trim()||value.length>1024)throw new TypeError("Invalid backup ID: "+key);
  if(ids[key].has(value))throw new TypeError("Duplicate backup ID: "+value);
  ids[key].add(value);
 };
 for(const name of BACKUP_STORES)ids[name]=new Set();
 for(const row of raw.state){
  if(!row||typeof row!=="object"||row.key===RESTORE_UNDO_KEY)
   throw new TypeError("Invalid or reserved backup state key");
  check("state",row.key);
 }
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
    (row.recordId!=null&&(typeof row.recordId!=="string"||!row.recordId.trim()))||
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
  if(blob.recordId==null)continue;
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
 const tx=transaction(db,BACKUP_STORES,"readonly"),finished=complete(tx);
 const rows=await Promise.all(BACKUP_STORES.map(name=>request(tx.objectStore(name).getAll())));
 await finished;
 const snapshot={format:"robotito-local-backup",schema:1,dbVersion:VERSION,
  createdAt:new Date().toISOString()};
 let totalBytes=0;
 for(let i=0;i<BACKUP_STORES.length;i++){
  const name=BACKUP_STORES[i];
  if(name!=="blobs"){
   snapshot[name]=name==="state"?rows[i].filter(row=>row.key!==RESTORE_UNDO_KEY):rows[i];
   continue;
  }
  snapshot.blobs=[];
  for(const item of rows[i]){
   const blob=storedBlob(item);
   if(!blob||blob.size>BACKUP_MAX_SINGLE_BLOB)
    throw new Error("Cannot back up a large or invalid local file; no partial backup was produced");
   totalBytes+=blob.size;
   if(totalBytes>BACKUP_MAX_BYTES)throw new Error("Local files exceed backup limit; no partial backup was produced");
   snapshot.blobs.push({id:item.id,owner:item.owner,type:item.type,recordId:item.recordId,
    updatedAt:item.updatedAt,size:blob.size,mime:blob.type||"application/octet-stream",
    base64:encodeBytes(await blob.arrayBuffer())});
  }
 }
 validateBackup(snapshot);
 if(new Blob([JSON.stringify(snapshot)]).size>BACKUP_MAX_BYTES)
  throw new Error("Backup exceeds the 32 MiB safe JSON limit; nothing was exported");
 return snapshot;
}
// Snapshot size is limited so creating an undo never silently consumes all
// available quota. ArrayBuffers/Blobs remain typed: no base64 conversion while
// an IndexedDB transaction is active.
function validateUndoSnapshot(snapshot){
 if(!snapshot||snapshot.format!=="robotito-restore-undo"||
    snapshot.schema!==1||snapshot.dbVersion!==VERSION)
  throw new TypeError("Unsupported local restore checkpoint");
 const stores=snapshot.stores;
 if(!stores||BACKUP_STORES.some(name=>!Array.isArray(stores[name])||
    stores[name].length>50000))throw new TypeError("Invalid local restore checkpoint");
 const distinct={};
 for(const name of BACKUP_STORES){
  distinct[name]=new Set();
  for(const row of stores[name]){
   const key=name==="state"?row?.key:row?.id;
   if(typeof key!=="string"||!key||distinct[name].has(key)||
      (name==="state"&&key===RESTORE_UNDO_KEY))
    throw new TypeError("Invalid checkpoint key");
   distinct[name].add(key);
  }
 }
 for(const row of stores.records){
  if(!TYPES.has(row?.type)||typeof row.owner!=="string"||!row.owner.trim()||
     (row.blobId!=null&&typeof row.blobId!=="string"))
   throw new TypeError("Invalid checkpoint typed record");
 }
 const blobs=new Map(stores.blobs.map(row=>[row.id,row]));
 for(const row of stores.records){
  if(!row.blobId)continue;
  const blob=blobs.get(row.blobId);
  if(!blob||blob.owner!==row.owner||blob.recordId!==row.id)
   throw new TypeError("Checkpoint audio ownership mismatch");
 }
 for(const row of stores.blobs){
  if(!row||typeof row.owner!=="string"||!row.owner.trim()||!storedBlob(row))
   throw new TypeError("Invalid checkpoint binary data");
  if(row.recordId!=null){
   const record=stores.records.find(r=>r.id===row.recordId);
   if(!record||record.blobId!==row.id||record.owner!==row.owner)
    throw new TypeError("Checkpoint contains an invalid linked blob");
  }
 }
 return {at:snapshot.at,records:stores.records.length,
  blobs:stores.blobs.length,owners:[...new Set(stores.records.map(row=>row.owner))].sort()};
}
function checkpointBytes(stores){
 let total=0;
 for(const row of stores.blobs){
  const blob=storedBlob(row);
  if(!blob)throw new TypeError("Cannot checkpoint a damaged binary file");
  total+=blob.size;
  if(total>RESTORE_UNDO_MAX_BYTES)throw new Error("Current data is too large for automatic undo");
 }
 try{
  total+=new Blob([JSON.stringify({state:stores.state,records:stores.records,
   migrations:stores.migrations})]).size;
 }catch{throw new TypeError("Current state is not safely checkpointable");}
 if(total>RESTORE_UNDO_MAX_BYTES)
  throw new Error("Current data is too large for automatic undo");
}
function checkpointFromRows(rows){
 const stores={};
 for(let i=0;i<BACKUP_STORES.length;i++){
  const name=BACKUP_STORES[i];
  stores[name]=name==="state"?rows[i].filter(row=>row.key!==RESTORE_UNDO_KEY):rows[i];
 }
 checkpointBytes(stores);
 const snapshot={format:"robotito-restore-undo",schema:1,dbVersion:VERSION,
  at:Date.now(),stores};
 validateUndoSnapshot(snapshot);
 return snapshot;
}
async function getRestoreUndoInfo(){
 const db=await openDb(),row=await request(transaction(db,"state","readonly")
  .objectStore("state").get(RESTORE_UNDO_KEY));
 return row?.value?validateUndoSnapshot(row.value):null;
}
async function discardRestoreUndo(){
 const db=await openDb(),tx=transaction(db,"state","readwrite"),finished=complete(tx);
 tx.objectStore("state").delete(RESTORE_UNDO_KEY);
 await finished;return true;
}
// Restore replaces the ENTIRE same-browser dataset, never merging anonymous,
// pseudonymous or known profiles. The previous state is checkpointed in THE SAME
// transaction as the replacement, preventing partial backup or cross-tab races.
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
   updatedAt:item.updatedAt,blobBytes:bytes.buffer,mimeType:item.mime||"application/octet-stream"});
 }
 await replaceSnapshot({...raw,blobs:decoded},{confirmation});
 return summary;
}
// Undo is one-use and deliberately discards changes made AFTER the restore.
// Its source is the browser's own preserved checkpoint, never an uploaded file.
async function undoLastRestore({confirmation}={}){
 if(confirmation!=="DESHACER")throw new Error("Explicit undo confirmation required");
 return replaceSnapshot(null,{confirmation,undo:true});
}

function devicePreferences(){
 const result=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith("robotito."))result.push({key,value:localStorage.getItem(key)});}return result;
}
async function rawSnapshot(){
 return withTransaction(BACKUP_STORES,"readonly",async tx=>{
  const values=await Promise.all(BACKUP_STORES.map(name=>request(tx.objectStore(name).getAll())));
  return Object.fromEntries(BACKUP_STORES.map((name,i)=>[name,name==="state"?values[i].filter(row=>row.key!==RESTORE_UNDO_KEY):values[i]]));
 });
}
async function replaceSnapshot(input,{confirmation,undo=false}={}){
 if(confirmation!==(undo?"DESHACER":"RESTAURAR"))throw Error("Explicit restore confirmation required");
 const preferences=devicePreferences(),nextEpoch=crypto.randomUUID();let summary;
 await withTransaction(BACKUP_STORES,"readwrite",async tx=>{
  const state=tx.objectStore("state"),saved=undo?await request(state.get(RESTORE_UNDO_KEY)):null;
  const snapshot=undo?saved?.value?.stores:input;if(!snapshot)throw Error("No recovery checkpoint");
  if(undo)summary=validateUndoSnapshot(saved.value);
  const before=checkpointFromRows(await Promise.all(BACKUP_STORES.map(name=>request(tx.objectStore(name).getAll()))));
  const pending=before.stores.state.find(row=>row.key==="p07:pending-preferences");
  before.preferences=pending?.value||preferences;
  for(const name of BACKUP_STORES){const table=tx.objectStore(name);table.clear();for(const item of snapshot[name])table.put(item);}
  if(!undo)state.put({key:RESTORE_UNDO_KEY,value:before,updatedAt:Date.now()});
  const desired=undo?saved.value.preferences:input.preferences;
  if(desired)state.put({key:"p07:pending-preferences",value:desired,updatedAt:Date.now()});
  tx.objectStore("migrations").put({id:"p07:epoch",value:nextEpoch,at:Date.now()});
 },{replace:true});
 databaseEpoch=nextEpoch;return summary;
}
async function applyPendingPreferences(){
 const pending=await get("p07:pending-preferences",null);if(!pending)return false;
 const previous=devicePreferences();
 const apply=values=>{
  for(const item of devicePreferences())localStorage.removeItem(item.key);
  for(const item of values){if(typeof item?.key!=="string"||!item.key.startsWith("robotito.")||typeof item.value!=="string")throw Error("Invalid preference entry");localStorage.setItem(item.key,item.value);}
 };
 try{apply(pending);}catch(error){try{apply(previous);}catch{}throw error;}
 await remove("p07:pending-preferences");return true;
}

async function stats(){
 const out={};for(const key of HEAVY){try{const rows=await get(key,[]);out[key]=Array.isArray(rows)?rows.length:0;}catch{out[key]=null;}}
 try{const est=await navigator.storage?.estimate?.();if(est){out.usage=est.usage||0;out.quota=est.quota||0;}}catch{}
 return out;
}
root.ROBOTITO_STORE={get,set,remove,bootstrap,persistStateKey,isHeavyKey:key=>HEAVY.has(key),
 heavyKeys:[...HEAVY],putRecord,getRecord,queryRecords,deleteRecord,appendMemory,updateOwnedMemory,deleteOwnedMemory,clearOwnedMemories,deleteRegisteredProfile,updateVisitorEnvelope,deleteVisitorVault,linkVisitorProfile,putBlob,putRecordWithBlob,getBlob,deleteBlob,
 migrateTypedLegacy,clearRecordsByType,audit,stats,exportBackup,validateBackup,restoreBackup,getRestoreUndoInfo,undoLastRestore,discardRestoreUndo,recordTypes:[...TYPES],dbVersion:VERSION,editRecord,withTransaction,isEphemeral,clearEphemeralOwner,normalizeRecord,notifyChange,rawSnapshot,replaceSnapshot,devicePreferences,applyPendingPreferences,flush:()=>Promise.all([...queues.values()])};
})(typeof window!=="undefined"?window:globalThis);
