"use strict";
const assert=require("node:assert/strict");
const {createService}=require("../collaboration-service.js");
const actor=id=>({id,source:"trusted-server-auth"});
let db={grants:{},groups:{},shared:{},audit:[]},chain=Promise.resolve();
const transact=fn=>{
 const result=chain.then(async()=>{
  const snapshot=structuredClone(db);
  const value=await fn(snapshot);
  db=snapshot;return value;
 });
 chain=result.catch(()=>{});return result;
};
const svc=createService({transact});
const main={owner:"alice",type:"class-line",sessionId:"s1",subject:"Historia",topic:"Revolución",
  text:"La clase trata de transformaciones políticas.",privateFace:"NO"};
(async()=>{
 const s=await svc.addShare(actor("alice"),{
  recipient:"bob",permission:"read",scope:{type:"class",id:"s1",subject:"Historia"},records:[main]});
 assert.equal((await svc.sharedWith(actor("bob"))).length,1);
 assert.equal((await svc.sharedWith(actor("eve"))).length,0);
 const read=await svc.sharedWith(actor("bob"));
 assert.equal(read[0].items.length,1);
 assert.equal(read[0].items[0].privateFace,undefined);
 await assert.rejects(svc.updateShare(actor("eve"),{grantId:s.grantId,expectedRevision:1,records:[main]}),/Forbidden/);
 await assert.rejects(svc.updateShare(actor("alice"),{grantId:s.grantId,expectedRevision:2,records:[main]}),/Revision/);
 const changed=await svc.updateShare(actor("alice"),{grantId:s.grantId,expectedRevision:1,
  records:[{...main,text:"Nuevo contenido académico tras subir apuntes."}]});
 assert.equal(changed.revision,2);
 assert.equal((await svc.sharedWith(actor("bob")))[0].items[0].text,"Nuevo contenido académico tras subir apuntes.");
 await assert.rejects(svc.updateShare(actor("alice"),{grantId:s.grantId,expectedRevision:2,
  records:[{...main,owner:"eve"}]}),/ownership mismatch/);
 await assert.rejects(svc.revoke(actor("bob"),{grantId:s.grantId,expectedRevision:2}),/Forbidden/);
 await svc.revoke(actor("alice"),{grantId:s.grantId,expectedRevision:2});
 assert.equal((await svc.sharedWith(actor("bob"))).length,0);
 assert.equal(db.shared[s.grantId],undefined);
 const g=await svc.createGroup(actor("alice"),{title:"Grupo de Historia",subject:"Historia"});
 await assert.rejects(svc.getGroup(actor("eve"),g.id),/Not a group member/);
 const m=await svc.groupMember(actor("alice"),{groupId:g.id,memberId:"bob",role:"editor",expectedRevision:1});
 const msg=await svc.send(actor("bob"),{groupId:g.id,text:"Hola equipo",expectedRevision:m.revision});
 assert.ok(msg.id);
 await assert.rejects(svc.send(actor("bob"),{groupId:g.id,text:"Edición concurrente",expectedRevision:m.revision}),/Revision/);
 const due=await svc.setDeadline(actor("alice"),{groupId:g.id,date:"2026-11-22",expectedRevision:msg.revision});
 assert.deepEqual(await svc.due(actor("bob"),{groupId:g.id,at:Date.parse("2026-11-15T10:00:00Z")}),[]);
 await svc.notificationConsent(actor("bob"),{groupId:g.id,enabled:true,timeZone:"UTC",expectedRevision:due.revision});
 assert.equal((await svc.due(actor("bob"),{groupId:g.id,at:Date.parse("2026-11-15T10:00:00Z")})).length,1);
 const removed=await svc.groupMember(actor("alice"),{groupId:g.id,memberId:"bob",role:"remove",expectedRevision:(await svc.getGroup(actor("alice"),g.id)).revision});
 await assert.rejects(svc.getGroup(actor("bob"),g.id),/Not a group member/);
 assert.equal(removed.revision>due.revision,true);
 console.log("P16/P17 backend transaction and revocation contract: passed");
})().catch(e=>{console.error(e);process.exitCode=1;});
