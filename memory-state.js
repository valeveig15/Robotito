// Atomic collection snapshots, safe legacy ownership and voluntary visitor links.
(function(root){
"use strict";
const store=root.ROBOTITO_STORE;
const collections={
 "robotito.classLines.v1":["classLines","transcripts"],
 "robotito.classSummaries.v1":["classSummaries","classes"],
 "robotito.academicMaterials.v1":["academicMaterials","notes"],
 "robotito.temporal-rules.v1":["temporalItems","rules"],
 "robotito.nativeStudyPlanner.v1":["nativeStudyItems","tasks"],"robotito.videoEvidence.v1":["videoEvidenceItems","notes"],
 "robotito.tasks.v1":["tasks","tasks"],"robotito.goodreads.v1":["library","books"]
};
const read=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
const scopeKey=(owner,key)=>"memory-scope:"+encodeURIComponent(owner)+":"+key;
const registeredName=name=>typeof name==="string"&&name!=="local"&&!/^(?:session|visitor|legacy):/.test(name);
const uid=()=>crypto.randomUUID();
const ramQueues=new Map();
function serialRam(key,fn){const job=(ramQueues.get(key)||Promise.resolve()).catch(()=>{}).then(fn);ramQueues.set(key,job);
 job.finally(()=>{if(ramQueues.get(key)===job)ramQueues.delete(key);}).catch(()=>{});return job;}
async function migrate(){
 return store.withTransaction(["state","records","blobs","migrations"],"readwrite",async tx=>{
  const markers=tx.objectStore("migrations");
  if(await read(markers.get("p07:ownership-v1")))return;
  const state=tx.objectStore("state"),records=tx.objectStore("records"),blobs=tx.objectStore("blobs");
  const people=(await read(state.get("robotito.people.v2")))?.value||[];
  const names=new Set(people.map(p=>p.name).filter(Boolean));
  const ownerOf=item=>names.has(item?.owner)?item.owner:names.has(item?.person)?item.person:"legacy:unassigned";
  for(const row of await read(records.getAll())){
   if(row.owner!=="local")continue;
   const owner=row.type==="people"&&names.has(row.data?.name)?row.data.name:ownerOf(row.data);
   records.put({...row,owner,provenance:{kind:"legacy-attribution",originalOwner:"local"}});
   if(row.blobId){const blob=await read(blobs.get(row.blobId));if(blob)blobs.put({...blob,owner});}
  }
  for(const [key,[,type]] of Object.entries(collections)){
   const values=(await read(state.get(key)))?.value||[],groups=new Map();
   if(!Array.isArray(values))continue;
   for(let i=0;i<values.length;i++){
    const item=values[i],owner=ownerOf(item),row={...item,memoryRecordId:"legacy:local:"+key+":"+i};
    if(!groups.has(owner))groups.set(owner,[]);groups.get(owner).push(row);
   }
   for(const [owner,items] of groups)state.put({key:scopeKey(owner,key),value:{version:1,items},updatedAt:Date.now()});
  }
  markers.put({id:"p07:ownership-v1",at:Date.now()});
 });
}
async function collection(owner,key){return store.get(scopeKey(owner,key),{version:0,items:[]});}
async function saveCollection(owner,key,items,version){
 const type=collections[key]?.[1];if(!type||!owner||!Array.isArray(items))throw Error("Invalid scoped collection");
 const rows=items.map(item=>({...item,memoryRecordId:item.memoryRecordId||("scoped:"+uid())}));
 if(new Set(rows.map(row=>row.memoryRecordId)).size!==rows.length)throw Error("Duplicate collection record ID");
 const check=current=>{if((current?.version||0)!==version)throw Error("Collection changed in another tab; reload before saving");};
 if(store.isEphemeral(owner))return serialRam(scopeKey(owner,key),async()=>{
  const current=await collection(owner,key);check(current);
  for(const item of current.items)if(!rows.some(r=>r.memoryRecordId===item.memoryRecordId))await store.deleteRecord(item.memoryRecordId);
  for(const item of rows)await store.putRecord(toRecord(owner,type,item));
  const result={version:version+1,items:rows};await store.set(scopeKey(owner,key),result);return result;
 });
 return store.withTransaction(["state","records","blobs"],"readwrite",async tx=>{
  const state=tx.objectStore("state"),records=tx.objectStore("records");
  const current=(await read(state.get(scopeKey(owner,key))))?.value;check(current);
  const removed=new Set();
  for(const item of current?.items||[])if(!rows.some(r=>r.memoryRecordId===item.memoryRecordId)){
   const previous=await read(records.get(item.memoryRecordId));
   if(previous&&(previous.owner!==owner||previous.type!==type))throw Error("Collection record ownership mismatch");
   if(previous?.blobId)tx.objectStore("blobs").delete(previous.blobId);
   records.delete(item.memoryRecordId);removed.add(item.memoryRecordId);
  }
  if(removed.size){
   state.delete("robotito.restore.undo.v1");
   for(const row of await read(records.getAll()))if(row.relatedIds.some(id=>removed.has(id)))records.put({...row,relatedIds:row.relatedIds.filter(id=>!removed.has(id)),version:row.version+1});
  }
  for(const item of rows){
   const previous=await read(records.get(item.memoryRecordId));
   if(previous&&(previous.owner!==owner||previous.type!==type))throw Error("Collection record ownership mismatch");
   records.put(store.normalizeRecord({...previous,...toRecord(owner,type,item),version:previous?previous.version+1:1}));
  }
  const result={version:version+1,items:rows};state.put({key:scopeKey(owner,key),value:result,updatedAt:Date.now()});return result;
 });
}
function toRecord(owner,type,item){return {id:item.memoryRecordId,type,owner,timestamp:Number(item.at||item.createdAt)||Date.now(),
 source:"scoped-collection",language:item.language||"und",subject:item.subject||"",topic:item.topic||"",data:item};}
async function hash(value){return [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function createVisitor({consent=false}={}){
 if(consent!==true)throw Error("Explicit visitor consent required");
 const id="visitor:"+uid(),secret=uid()+uid(),token=id+"/"+secret;
 await store.putRecord({id,type:"people",owner:id,source:"visitor-consent",data:{kind:"visitor",consentAt:Date.now(),secretHash:await hash(secret),linkedTo:null}});
 return {id,token};
}
async function visitorCredential(token){
 const parts=String(token||"").trim().split("/");
 if(parts.length!==2||!parts[0].startsWith("visitor:")||parts[1].length!==72)throw Error("Invalid visitor key");
 return {id:parts[0],secretHash:await hash(parts[1])};
}
function checkVisitor(row,credential){
 if(!row||row.type!=="people"||row.data?.kind!=="visitor"||!row.data.consentAt||row.data.secretHash!==credential.secretHash||row.data.revokedAt)throw Error("Visitor consent or key is invalid");
}
async function resumeVisitor(token){
 const credential=await visitorCredential(token),row=await store.getRecord(credential.id);checkVisitor(row,credential);
 if(row.data.linkedTo)throw Error("History is linked; undo the link before resuming as visitor");
 return {id:row.id,token};
}
async function previewLink(token,target){
 const visitor=await resumeVisitor(token),rows=await store.queryRecords({owner:visitor.id,limit:Infinity});
 if(!target||target===visitor.id||!registeredName(target))throw Error("Registered target required");
 const people=await store.get("robotito.people.v2",[]);
 if(!people.some(p=>p.name===target))throw Error("Unknown registered profile");
 const ids=rows.filter(r=>r.id!==visitor.id).map(r=>({id:r.id,version:r.version})).sort((a,b)=>a.id.localeCompare(b.id));
 return {visitor:visitor.id,target,records:ids,revision:JSON.stringify(ids),count:ids.length};
}
async function linkVisitor({token,target,confirmation,revision}={}){
 if(confirmation!==target)throw Error("Type the reviewed target name to link");
 const credential=await visitorCredential(token),id="link:"+uid();
 return store.withTransaction(["state","records","blobs"],"readwrite",async tx=>{
  const records=tx.objectStore("records"),state=tx.objectStore("state"),blobs=tx.objectStore("blobs");
  const visitor=await read(records.get(credential.id));checkVisitor(visitor,credential);
  if(visitor.data.linkedTo)throw Error("Visitor is already linked");
  const people=(await read(state.get("robotito.people.v2")))?.value||[];
  if(!people.some(p=>p.name===target)||!registeredName(target))throw Error("Unknown registered target");
  const rows=(await read(records.index("byOwner").getAll(credential.id))).filter(r=>r.id!==credential.id);
  const current=rows.map(r=>({id:r.id,version:r.version})).sort((a,b)=>a.id.localeCompare(b.id));
  if(JSON.stringify(current)!==revision)throw Error("History changed; review the link again");
  for(const row of rows){records.put({...row,owner:target,version:row.version+1,provenance:{kind:"voluntary-link",identityConfirmed:false,originalOwner:credential.id,linkId:id}});
   if(row.blobId){const blob=await read(blobs.get(row.blobId));if(!blob||blob.owner!==credential.id)throw Error("Invalid ownership of linked file");blobs.put({...blob,owner:target});}
  }
  const mirror=await read(state.get("robotito.memories.v2")),movedIds=new Set(rows.map(r=>r.id));
  if(Array.isArray(mirror?.value))state.put({...mirror,value:mirror.value.map(item=>movedIds.has(item.id)?{...item,owner:target,person:target}:item)});
  const movedCollections=[];
  for(const key of Object.keys(collections)){
   const fromKey=scopeKey(credential.id,key),toKey=scopeKey(target,key),from=await read(state.get(fromKey));
   if(!from)continue;
   const to=await read(state.get(toKey)),items=[...(to?.value?.items||[]),...from.value.items];
   state.put({key:toKey,value:{version:(to?.value?.version||0)+1,items},updatedAt:Date.now()});state.delete(fromKey);
   movedCollections.push({key,ids:from.value.items.map(r=>r.memoryRecordId)});
  }
  records.put({...visitor,version:visitor.version+1,data:{...visitor.data,linkedTo:target,linkId:id}});
  const log={id,from:credential.id,to:target,records:rows.map(r=>r.id),collections:movedCollections,at:Date.now(),identityConfirmed:false};
  state.put({key:id,value:log,updatedAt:Date.now()});return log;
 });
}
async function undoLink({id,token,confirmation}={}){
 if(confirmation!=="DESVINCULAR")throw Error("Explicit unlink confirmation required");
 const credential=await visitorCredential(token);
 return store.withTransaction(["state","records","blobs"],"readwrite",async tx=>{
  const state=tx.objectStore("state"),records=tx.objectStore("records"),blobs=tx.objectStore("blobs");
  const log=(await read(state.get(id)))?.value,visitor=await read(records.get(credential.id));checkVisitor(visitor,credential);
  if(!log||log.from!==credential.id||visitor.data.linkId!==id||log.undoneAt)throw Error("No active link for this key");
  for(const recordId of log.records){
   const row=await read(records.get(recordId));if(!row)continue; // Deleted data is never resurrected.
   if(row.owner!==log.to||row.provenance?.linkId!==id)throw Error("Ownership changed; cannot safely unlink");
   records.put({...row,owner:log.from,version:row.version+1,provenance:{kind:"voluntary-unlink",originalOwner:log.from,identityConfirmed:false}});
   if(row.blobId){const blob=await read(blobs.get(row.blobId));if(blob)blobs.put({...blob,owner:log.from});}
  }
  const mirror=await read(state.get("robotito.memories.v2")),movedIds=new Set(log.records);
  if(Array.isArray(mirror?.value))state.put({...mirror,value:mirror.value.map(item=>movedIds.has(item.id)?{...item,owner:log.from,person:log.from}:item)});
  for(const moved of log.collections){
   const toKey=scopeKey(log.to,moved.key),fromKey=scopeKey(log.from,moved.key),to=await read(state.get(toKey)),from=await read(state.get(fromKey));
   const set=new Set(moved.ids),items=(to?.value?.items||[]),back=items.filter(r=>set.has(r.memoryRecordId));
   state.put({key:toKey,value:{version:(to?.value?.version||0)+1,items:items.filter(r=>!set.has(r.memoryRecordId))}});
   state.put({key:fromKey,value:{version:(from?.value?.version||0)+1,items:[...(from?.value?.items||[]),...back]}});
  }
  records.put({...visitor,version:visitor.version+1,data:{...visitor.data,linkedTo:null,linkId:null}});
  state.put({key:id,value:{...log,undoneAt:Date.now()}});return true;
 });
}
async function deleteOwner(owner,{confirmation}={}){
 if(confirmation!=="BORRAR"||!owner)throw Error("Explicit owner deletion required");
 if(store.isEphemeral(owner)){
  store.clearEphemeralOwner(owner);return;
 }
 return store.withTransaction(["state","records","blobs"],"readwrite",async tx=>{
  const records=tx.objectStore("records"),blobs=tx.objectStore("blobs"),state=tx.objectStore("state");
  state.delete("robotito.restore.undo.v1");
  const rows=await read(records.index("byOwner").getAll(owner)),ids=new Set(rows.map(r=>r.id));
  for(const row of rows)records.delete(row.id);
  for(const blob of await read(blobs.getAll()))if(blob.owner===owner)blobs.delete(blob.id);
  for(const row of await read(records.getAll()))if(row.relatedIds.some(id=>ids.has(id)))records.put({...row,relatedIds:row.relatedIds.filter(id=>!ids.has(id)),version:row.version+1});
  for(const row of await read(state.getAll())){
   if(row.key.startsWith(scopeKey(owner,"")))state.delete(row.key);
   else if(row.key==="robotito.memories.v2"&&Array.isArray(row.value))state.put({...row,value:row.value.filter(item=>!ids.has(item.id)&&item.person!==owner&&item.owner!==owner)});
  }
 });
}
root.ROBOTITO_MEMORY_STATE={collections,scopeKey,migrate,collection,saveCollection,createVisitor,resumeVisitor,previewLink,linkVisitor,undoLink,deleteOwner};
})(window);
