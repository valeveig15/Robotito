// P16/P17: server-side authorization and collaboration domain rules.
// This module is intentionally NOT a client-side sharing API. A trusted backend
// must authenticate users and persist every state transition atomically.
"use strict";
const crypto=require("node:crypto");
const ID=()=>crypto.randomUUID();
const clean=s=>typeof s==="string"?s.trim():"";
const validId=s=>/^[\w.-]{1,120}$/.test(s||"");
function actorId(actor){
  // Never use a browser-provided "verified" checkbox as authentication.
  // Only the trusted server's auth adapter may supply this principal.
  if(!actor||actor.source!=="trusted-server-auth"||!validId(actor.id))
    throw new Error("Authentication required");
  return actor.id;
}
function selection({type,id,subject,topic}={}){
  if(!["class","topic","subject"].includes(type)||!validId(id)||
     !clean(subject)||clean(subject).length>120||
     (type==="topic"&&!clean(topic)))
    throw new Error("Invalid class selection");
  return {type,id,subject:clean(subject),topic:clean(topic)};
}
function academicOnly(record,scope){
  // Explicit allowlist; never accept raw memory, voice, face or profile fields.
  if(!record||!["class-line","class-summary","academic-material"].includes(record.type))
    throw new Error("Only academic content can be shared");
  if(record.subject!==scope.subject||
     (scope.type==="topic"&&record.topic!==scope.topic)||
     (scope.type==="class"&&record.sessionId!==scope.id))
    throw new Error("Outside approved share scope");
  const limit=s=>clean(s).slice(0,3000);
  return {
    type:record.type,
    sessionId:validId(record.sessionId)?record.sessionId:null,
    subject:scope.subject,topic:limit(record.topic),
    title:limit(record.name||record.title),
    text:limit(record.correctedText||record.text||""),
    excerpt:limit(record.excerpt||"")
  };
}
function access(grant,actor,operation,record){
 const id=actorId(actor);
 if(!grant||grant.revokedAt||grant.recipient!==id||
    !["read","write"].includes(grant.permission))return false;
 if(operation==="write"&&grant.permission!=="write")return false;
 if(operation!=="read"&&operation!=="write")return false;
 try{if(record)academicOnly(record,grant.selection);}catch{return false;}
 return true;
}
function requireRevision(current,expected){
 if(!Number.isSafeInteger(expected)||expected!==current)
   throw new Error("Revision conflict");
}
function makeGrant({actor,recipient,permission,scope}){
 const owner=actorId(actor);
 if(!validId(owner)||!validId(recipient)||owner===recipient||
    !["read","write"].includes(permission))throw new Error("Invalid recipient or permission");
 return {id:ID(),owner,recipient,permission,selection:selection(scope),
   revision:1,revokedAt:null,createdAt:Date.now()};
}
function revokeGrant(grant,principal,expected,now=Date.now()){
 if(!grant||actorId(principal)!==grant.owner)throw new Error("Forbidden");
 requireRevision(grant.revision,expected);
 return {...grant,revokedAt:now,revision:grant.revision+1};
}
function makeGroup({actor,title,subject}){
 const owner=actorId(actor);
 if(!validId(owner)||!clean(title)||clean(title).length>120||!clean(subject))
  throw new Error("Invalid group");
 return {id:ID(),owner,title:clean(title),subject:clean(subject),
   members:{[owner]:{role:"admin",notify:false,timeZone:"UTC"}},
   messages:[],deadline:null,deadlineVersion:0,revision:1,audit:[]};
}
function membership(group,actor){
 const id=actorId(actor);
 const role=group?.members?.[id]?.role;
 if(!["admin","editor","reader"].includes(role))throw new Error("Not a group member");
 return {id,role};
}
function memberChange(group,actor,memberId,role,expected){
 const requester=membership(group,actor);
 if(requester.role!=="admin"||!validId(memberId)||!["reader","editor","remove"].includes(role))
  throw new Error("Forbidden member change");
 requireRevision(group.revision,expected);
 if(memberId===group.owner)throw new Error("Cannot remove owner");
 const members={...group.members};
 if(role==="remove")delete members[memberId];
 else members[memberId]={role,notify:false,timeZone:"UTC"};
 return {...group,members,revision:group.revision+1,
  audit:[...group.audit,{event:"member-change",by:requester.id,member:memberId,revision:group.revision+1}]};
}
function postMessage(group,actor,text,expected){
 const {id,role}=membership(group,actor);
 if(role==="reader")throw new Error("Read-only group membership");
 if(!clean(text)||clean(text).length>2000||/[\u0000-\u001f]/.test(text))
  throw new Error("Invalid message");
 requireRevision(group.revision,expected);
 const msg={id:ID(),author:id,body:clean(text),createdAt:Date.now()};
 return {...group,messages:[...group.messages,msg].slice(-2000),revision:group.revision+1};
}
function deadlineChange(group,actor,date,expected){
 const {id,role}=membership(group,actor);
 if(role!=="admin"&&role!=="editor")throw new Error("Forbidden deadline change");
 requireRevision(group.revision,expected);
 if(date!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||
   !Number.isFinite(Date.parse(date+"T12:00:00Z"))||
   new Date(date+"T12:00:00Z").toISOString().slice(0,10)!==date))
  throw new Error("Invalid deadline");
 return {...group,deadline:date,deadlineVersion:(group.deadlineVersion||0)+1,revision:group.revision+1,
   audit:[...group.audit,{event:"deadline-change",by:id,date,revision:group.revision+1}]};
}
function notificationChoice(group,actor,enabled,timeZone,expected){
 const {id}=membership(group,actor);
 requireRevision(group.revision,expected);
 try{new Intl.DateTimeFormat("en-US",{timeZone}).format(new Date());}
 catch{throw new Error("Invalid time zone");}
 const members={...group.members,[id]:{...group.members[id],notify:enabled===true,timeZone}};
 return {...group,members,revision:group.revision+1};
}
function reminderPlan(group,actor,at=Date.now()){
 const {id}=membership(group,actor);
 const member=group.members[id];
 if(!member.notify||!group.deadline)return [];
 const formatter=new Intl.DateTimeFormat("en-CA",{
  timeZone:member.timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"});
 const parts=Object.fromEntries(formatter.formatToParts(new Date(at))
   .filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
 const localDate=[parts.year,parts.month,parts.day].join("-");
 const days=Math.round((Date.parse(group.deadline+"T12:00:00Z")-
   Date.parse(localDate+"T12:00:00Z"))/86400000);
 const hour=Number(parts.hour);
 const slot=hour>=6&&hour<12?"morning":hour>=12&&hour<18?"afternoon":
   hour>=18&&hour<24?"evening":null;
 if(days<0||days>7||!slot)return [];
 // Only an eligible, opt-in event. Durable dedup and dispatch belong to backend.
 return [{groupId:group.id,memberId:id,date:localDate,slot,daysRemaining:days,
   deadline:group.deadline,dedupeKey:[group.id,id,group.deadlineVersion||0,group.deadline,localDate,slot].join(":")}];
}
module.exports={actorId,selection,academicOnly,access,requireRevision,
 makeGrant,revokeGrant,makeGroup,membership,memberChange,postMessage,
 deadlineChange,notificationChoice,reminderPlan};
