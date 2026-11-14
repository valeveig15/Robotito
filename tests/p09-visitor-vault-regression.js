"use strict";
const assert=require("node:assert/strict");
const {webcrypto}=require("node:crypto");
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const visitors=require("../visitor-memory.js");
const state=new Map();
let writes=0,deleted=0;
globalThis.ROBOTITO_STORE={
 async get(key,fallback=null){return state.has(key)?structuredClone(state.get(key)):fallback;},
 async updateVisitorEnvelope(envelope,{expectedRevision}){
  const current=state.get("robotito.visitors.v1");
  if((current?.revision||0)!==expectedRevision)throw Error("Stale vault");
  state.set("robotito.visitors.v1",structuredClone(envelope));writes++;
 },
 async deleteVisitorVault({confirmation}){
  if(confirmation!=="BORRAR VISITAS")throw Error("Confirm");
  state.delete("robotito.visitors.v1");deleted++;
 },
 async linkVisitorProfile({expectedRevision,envelope,name,confirmation}){
  if(confirmation!=="VINCULAR"||name!=="Ada"||state.get("robotito.visitors.v1").revision!==expectedRevision)
   throw Error("Unverified link");
  state.set("robotito.visitors.v1",structuredClone(envelope));writes++;
  return [{name,bond:{affection:55,trust:51,fear:6,irritation:4}}];
 }
};
const face=(center,offset=0)=>Array.from({length:128},(_,i)=>i===0?center+offset:0);
const frames=center=>Array.from({length:12},(_,i)=>face(center,((i%3)-1)*.025));
const det=(center,confidence=.91)=>({descriptor:face(center),detection:{score:confidence}});
(async()=>{
 assert.equal(visitors.locked(),true);
 const before=visitors.observe(det(.2),{singleFace:true,now:5000});
 assert.equal(before,null);
 assert.equal(writes,0,"Nonconsenting face is never persisted");
 await assert.rejects(()=>visitors.remember(frames(.2)),/consent/i);
 await visitors.open("clave muy larga y segura P09");
 await visitors.remember(frames(.2),{consent:true,people:[]});
 assert.equal(writes,1);
 const raw=JSON.stringify(state.get("robotito.visitors.v1"));
 assert.equal(raw.includes("templates"),false,"Stored vault contains no plaintext descriptors");
 assert.equal(raw.includes("affection"),false,"Stored vault contains no plaintext bond");
 assert.equal(raw.includes('"name"'),false,"Stored vault has no names");
 await assert.rejects(()=>visitors.remember(frames(.21),{consent:true,people:[]}),/already|similar/i);
 await visitors.remember(frames(1.1),{consent:true,people:[]});
 assert.equal(visitors.info().count,2);
 visitors.clearObservation();
 assert.equal(visitors.observe(det(.20),{singleFace:true,now:10000}),null);
 assert.equal(visitors.observe(det(.20),{singleFace:true,now:10400}),null);
 assert.equal(typeof visitors.observe(det(.20),{singleFace:true,now:10800}),"string");
 assert.equal(await visitors.interaction("pet",{now:10900,singleFace:true}),true);
 assert.equal(await visitors.interaction("poke",{now:11000,singleFace:true}),true);
 assert.equal(await visitors.interaction("poke",{now:11100,singleFace:true}),false,"Same-event cooldown");
 assert.equal(await visitors.interaction("pet",{now:15000,singleFace:true}),false,"Expired face");
 visitors.clearObservation();
 assert.equal(visitors.observe(det(.2),{singleFace:false,now:16000}),null);
 assert.equal(visitors.info().active,false,"Multiple faces revoke visitor identity");
 visitors.lock();
 assert.equal(visitors.info().count,null,"Locked vault reveals no anonymous profile count");
 await assert.rejects(()=>visitors.open("passphrase clearly incorrect"),/Wrong passphrase/i);
 await visitors.open("clave muy larga y segura P09");
 assert.equal(visitors.info().count,2,"Weeks-later unlock recovers encrypted history");
 let reviewed;
 const linked=await visitors.offerLink("Ada",frames(.2),{
  review:summary=>{reviewed=summary;return true;}
 });
 assert.equal(linked.linked,true);
 assert.equal(reviewed.interactions.pet,1);
 assert.equal(reviewed.interactions.poke,1);
 assert.equal(linked.people[0].name,"Ada");
 assert.equal(visitors.info().count,1,"Link deletes only matched pseudonymous entry");
 assert.equal(await visitors.offerLink("Bruno",frames(.2),{review:()=>true}),false);
 await assert.rejects(()=>visitors.forgetAll({confirmation:"BORRAR"}),/deletion|confirmation/i);
 await visitors.forgetAll({confirmation:"BORRAR VISITAS"});
 assert.equal(deleted,1);
 assert.equal(state.has("robotito.visitors.v1"),false);
 assert.equal(visitors.locked(),true);
 console.log("P09 consented visitor vault: encrypted persistence, no consent, lookalikes, cooldown, review, erasure passed");
})().catch(error=>{console.error(error);process.exitCode=1;});
