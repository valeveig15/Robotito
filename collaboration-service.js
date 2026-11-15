// P16/P17 authenticated backend application service.
// No browser exposure and no default storage: the host must supply durable,
// atomic transactions AND authenticate every request before passing a principal.
"use strict";
const policy=require("./collaboration-domain.js");
function createService({transact}={}){
 if(typeof transact!=="function")throw new Error("Transactional persistence required");
 const run=fn=>transact(async state=>{
  if(!state||typeof state!=="object")throw new Error("Missing backend state");
  state.grants=state.grants||{};
  state.groups=state.groups||{};
  state.shared=state.shared||{};
  state.audit=state.audit||[];
  return await fn(state);
 });
 const addShare=async (actor,{recipient,permission,scope,records=[]})=>run(state=>{
  const grant=policy.makeGrant({actor,recipient,permission,scope});
  const data=records.map(r=>policy.academicOnly(r,grant.selection,grant.owner));
  if(data.length>100)throw new Error("Too many academic records");
  state.grants[grant.id]=grant;state.shared[grant.id]=data;
  state.audit.push({event:"share-created",grantId:grant.id,owner:grant.owner,recipient,at:Date.now()});
  return {grantId:grant.id,revision:1};
 });
 const sharedWith=async (actor)=>run(state=>{
  const id=policy.actorId(actor);
  return Object.values(state.grants).filter(g=>policy.access(g,actor,"read"))
   .map(g=>({id:g.id,owner:g.owner,selection:g.selection,permission:g.permission,
     revision:g.revision,items:(state.shared[g.id]||[]).map(x=>({...x}))}));
 });
 const updateShare=async(actor,{grantId,expectedRevision,records})=>run(state=>{
  const grant=state.grants[grantId];
  const editor=policy.actorId(actor);
  if(!grant||grant.revokedAt||
     (grant.owner!==editor&&!policy.access(grant,actor,"write")))
    throw new Error("Forbidden");
  policy.requireRevision(grant.revision,expectedRevision);
  const data=records.map(r=>policy.academicOnly(r,grant.selection,grant.owner));
  if(data.length>100)throw new Error("Too many academic records");
  state.shared[grantId]=data;
  state.grants[grantId]={...grant,revision:grant.revision+1};
  state.audit.push({event:"share-updated",grantId,owner:grant.owner,by:editor,at:Date.now()});
  return {revision:grant.revision+1};
 });
 const revoke=async(actor,{grantId,expectedRevision})=>run(state=>{
  const grant=state.grants[grantId];
  if(!grant)throw new Error("Not found");
  state.grants[grantId]=policy.revokeGrant(grant,actor,expectedRevision);
  delete state.shared[grantId];
  state.audit.push({event:"share-revoked",grantId,owner:grant.owner,at:Date.now()});
  return {revoked:true,revision:grant.revision+1};
 });
 const createGroup=async(actor,{title,subject})=>run(state=>{
  const g=policy.makeGroup({actor,title,subject});
  state.groups[g.id]=g;
  return {id:g.id,revision:g.revision};
 });
 const groupById=(state,groupId,actor)=>{
  const g=state.groups[groupId];
  if(!g)throw new Error("Not found");
  policy.membership(g,actor);
  return g;
 };
 const getGroup=async(actor,groupId)=>run(state=>{
  const g=groupById(state,groupId,actor);
  return JSON.parse(JSON.stringify(g));
 });
 const groupMember=async(actor,{groupId,memberId,role,expectedRevision})=>run(state=>{
  const g=groupById(state,groupId,actor);
  state.groups[groupId]=policy.memberChange(g,actor,memberId,role,expectedRevision);
  return {revision:state.groups[groupId].revision};
 });
 const send=async(actor,{groupId,text,expectedRevision})=>run(state=>{
  const g=groupById(state,groupId,actor);
  state.groups[groupId]=policy.postMessage(g,actor,text,expectedRevision);
  return {revision:state.groups[groupId].revision,
    id:state.groups[groupId].messages.at(-1).id};
 });
 const setDeadline=async(actor,{groupId,date,expectedRevision})=>run(state=>{
  const g=groupById(state,groupId,actor);
  state.groups[groupId]=policy.deadlineChange(g,actor,date,expectedRevision);
  return {revision:state.groups[groupId].revision};
 });
 const notificationConsent=async(actor,{groupId,enabled,timeZone,expectedRevision})=>run(state=>{
  const g=groupById(state,groupId,actor);
  state.groups[groupId]=policy.notificationChoice(g,actor,enabled,timeZone,expectedRevision);
  return {revision:state.groups[groupId].revision};
 });
 const due=async(actor,{groupId,at=Date.now()})=>run(state=>{
  const g=groupById(state,groupId,actor);
  return policy.reminderPlan(g,actor,at);
 });
 return {addShare,sharedWith,updateShare,revoke,createGroup,getGroup,
   groupMember,send,setDeadline,notificationConsent,due};
}
module.exports={createService};
