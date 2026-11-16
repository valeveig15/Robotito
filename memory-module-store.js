// Adapt synchronous domain engines to atomic, owner-scoped collection storage.
(function(root){
"use strict";
const pending=new Set();
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
function create({key,factory,decode,encode}){
 const store=root.ROBOTITO_STORE,api=root.ROBOTITO_MEMORY_STATE;
 let engine=null,active=null,queue=Promise.resolve(),migration=null;
 async function migrate(){
  let raw=null;try{raw=root.localStorage.getItem(key);}catch{}
  const items=raw?encode(JSON.parse(raw),[]):[];
  const migrated=await store.withTransaction(["state","records","migrations"],"readwrite",async tx=>{
   const markers=tx.objectStore("migrations"),marker="p07:module:"+key;
   if(await request(markers.get(marker)))return false;
   const owner="legacy:unassigned",scoped=api.scopeKey(owner,key);
   if(items.length){
    const state=tx.objectStore("state"),old=(await request(state.get(scoped)))?.value;
    if(old?.items?.length)throw Error("Legacy module history already exists");
    state.put({key:scoped,value:{version:1,items},updatedAt:Date.now()});
    for(const item of items)tx.objectStore("records").put(store.normalizeRecord({id:item.memoryRecordId,
     owner,type:api.collections[key][1],source:"legacy-module",timestamp:item.createdAt||item.recordedAt,
     data:item,provenance:{kind:"legacy-unassigned",identityConfirmed:false}}));
   }
   markers.put({id:marker,at:Date.now()});return true;
  });
  // Remove only the exact legacy value that was successfully checkpointed.
  try{if(migrated&&raw!==null&&root.localStorage.getItem(key)===raw)root.localStorage.removeItem(key);}catch{}
 }
 async function load(owner){
  await root.ROBOTITO_MEMORY.ready();
  if(owner!==root.ROBOTITO_MEMORY.owner())throw Error("History changed; try again");
  if(!migration)migration=migrate().catch(error=>{migration=null;throw error;});
  await migration;
  const snapshot=await api.collection(owner,key);
  let value=decode(snapshot.items,owner),changed=false;
  const current=factory({storage:{getItem:()=>JSON.stringify(value),setItem:(_,text)=>{value=JSON.parse(text);changed=true;}}});
  if(owner!==root.ROBOTITO_MEMORY.owner())throw Error("History changed; try again");
  active=owner;engine=current;
  return {snapshot,current,value:()=>value,changed:()=>changed};
 }
 function run(action){
  const owner=root.ROBOTITO_MEMORY.owner();
  const job=queue.catch(()=>{}).then(async()=>{
   const loaded=await load(owner),result=await action(loaded.current);
   if(owner!==root.ROBOTITO_MEMORY.owner())throw Error("History changed; changes discarded");
   if(loaded.changed())await api.saveCollection(owner,key,encode(loaded.value(),loaded.snapshot.items),loaded.snapshot.version);
   return result;
  });
  queue=job;pending.add(job);job.finally(()=>pending.delete(job)).catch(()=>{});return job;
 }
 root.addEventListener("robotito:memoryscopechange",()=>{engine=null;active=null;});
 return {run,read:()=>run(x=>x),get engine(){return active===root.ROBOTITO_MEMORY.owner()?engine:null;}};
}
const idFor=(rows,kind,id)=>rows.find(row=>row.kind===kind&&(row.id||row.name)===id)?.memoryRecordId||"module:"+crypto.randomUUID();
const native={
 key:"robotito.nativeStudyPlanner.v1",
 decode:rows=>({version:1,tasks:rows.filter(x=>x.kind==="task"),subjects:rows.filter(x=>x.kind==="subject"),blocks:rows.filter(x=>x.kind==="block")}),
 encode:(data,rows)=>[...["tasks","subjects","blocks"].flatMap((key,i)=>(data[key]||[]).map(item=>({...item,kind:["task","subject","block"][i],
  memoryRecordId:item.memoryRecordId||idFor(rows,["task","subject","block"][i],item.id||item.name)})))]
};
const video={key:"robotito.videoEvidence.v1",decode:(rows,owner)=>rows.map(row=>({...row,owner})),
 encode:(rows,previous)=>rows.map(row=>({...row,memoryRecordId:row.memoryRecordId||previous.find(x=>x.id===row.id)?.memoryRecordId||"module:"+crypto.randomUUID()}))};
const rules={...video,key:"robotito.temporal-rules.v1"};
root.ROBOTITO_MEMORY_MODULES={create,native,video,rules,flush:()=>Promise.all([...pending])};
})(window);
