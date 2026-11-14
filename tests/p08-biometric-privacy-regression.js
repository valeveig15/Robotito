"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const i18n=require("../i18n.js");
const extract=(start,end)=>{
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,"Missing "+start);return source.slice(a,b);
};
const helperSource=extract("function enrollmentVoiceConflict(","\nasync function enrollPerson(){");
const ownerSource=extract("function activeMemoryOwner(){","\nfunction p07Message(");
const manualSource=extract("function changeClassLineSpeaker(","\nfunction speakerSelectHtml(");
const people=[{name:"Ada",voicePrints:[[1,0],[1,0],[1,0],[1,0]]},
 {name:"Bruno",voicePrints:[[0,1],[0,1],[0,1],[0,1]]}];
const normalized=v=>{
 const sum=Array.from({length:v[0].length},(_,j)=>v.reduce((n,row)=>n+row[j],0)/v.length);
 const norm=Math.hypot(...sum)||1;return sum.map(x=>x/norm);
};
const cosine=(a,b)=>{
 if(!a||!b||a.length!==b.length)return -1;
 return a.reduce((n,v,i)=>n+v*b[i],0)/(Math.hypot(...a)*Math.hypot(...b)||1);
};
const conflict=new Function("state","averageVoiceVectors","cosineSimilarity",
 helperSource+"\nreturn enrollmentVoiceConflict;")({people},normalized,cosine);
let checks=0,eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
eq(conflict([[1,0],[1,0],[1,0]],"Clara"),true,
 "A different face cannot register Ada's voice under another name");
eq(conflict([[0,1],[0,1],[0,1]],"Clara"),true,
 "Both existing speakers block imitative new voice enrollment");
eq(conflict([[.71,.71],[.71,.71],[.71,.71]],"Clara"),false,
 "A distinct speaker is not forced into an old profile");
eq(conflict([[1,0],[1,0],[1,0]],"Ada"),false,
 "The same consented person may refresh their own samples");
eq(conflict([[NaN,0],[1,0],[1,0]],"Clara"),true,
 "Invalid audio features cannot pass as a new speaker");
const now=Date.now();
const state={currentPerson:"Ada",currentVoicePerson:"Bruno",lastVoiceConfirmedAt:now,
 classLines:[{id:"line1",text:"Hola",speaker:"teacher",speakerName:null,
   voicePrint:[1,0],feature:[.7,.7]}],people:JSON.parse(JSON.stringify(people))};
let writes=0,learn=0;
const manual=new Function("state","speakerRoleForPerson","save","renderClassTranscript",
 "KEYS","learnSpeaker",manualSource+"\nreturn changeClassLineSpeaker;")(
 state,()=> "teacher",()=>{writes++;},()=>{},{people:"people"},
 ()=>{learn++;});
manual("line1","person:Ada");
eq(state.classLines[0].speakerName,"Ada","Manual speaker correction remains available");
eq(writes,1,"Only transcript correction is persisted");
eq(learn,0,"Manual correction may not silently enroll a speaker model");
eq(state.people[0].voicePrints.length,4,"Person's voiceprint count remains unchanged");
const owner=new Function("state","Date",ownerSource+"\nreturn activeMemoryOwner;")(
 state,{now:()=>now});
eq(owner(),"local","Visible Ada cannot authorize Bruno's private memory panel");
state.currentPerson=null;
eq(owner(),"Bruno","Fresh independently verified Bruno can own his own memory");
state.lastVoiceConfirmedAt=now-9000;
eq(owner(),"local","Old voice evidence expires from private memory UI");
state.lastVoiceConfirmedAt=now+1000;
eq(owner(),"local","Future timestamp is rejected");
for(const lang of ["es","en","pt","fr","it","de"]){
 for(const key of ["p08VoiceCollision","p08DeleteProfileLabel","p08DeleteProfileConfirm",
  "p08DeleteProfileType","p08DeleteProfileDone","p08DeleteProfileFailed"]){
  assert.notEqual(i18n.t(key,lang),key);checks++;
 }
}
console.log("P08 biometrics privacy, speaker correction, owner freshness:",checks,"checks");
