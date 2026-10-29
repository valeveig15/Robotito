"use strict";
// Production-function regression: a recognized voice must never be stored under
// an unrelated face's owner while both people are visible.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
function functionBody(startMarker,endMarker){
 const begin=source.indexOf(startMarker);
 const end=source.indexOf(endMarker,begin);
 assert.ok(begin>=0&&end>begin,"Missing production function: "+startMarker);
 return source.slice(begin,end);
}
const speechSource=functionBody("function autoRemember(text){","\nconst INTENT_ALIASES=");
const replySource=functionBody("function commitSpeechMessage(","\nfunction say(");
let checks=0;
function eq(value,expected,message){assert.deepEqual(value,expected,message);checks++;}
const writes=[],memoryWrites=[],ephemeral=new Map();
const window={ROBOTITO_STORE:{putRecord(row){writes.push(row);return Promise.resolve(row);}}};
const state={currentPerson:"Ada",currentVoicePerson:"Bruno",memories:[],
 languageMode:"es",speechBubbleToken:1,pendingSpeechLocalization:true};
const KEYS={memories:"memories"};
const DateStub={now:()=>50000};
const bubble={textContent:"",classList:{remove(){}}};
const remember=new Function("state","window","save","KEYS","renderMemories","Date",
 speechSource+"\nreturn autoRemember;")(state,window,()=>{},KEYS,()=>{},DateStub);
const reply=new Function("state","window","robotitoReplyByOwner","$",
 "readingDisplayTime","scheduleSpeechBubbleHide","speakResponse","Date",
 replySource+"\nreturn commitSpeechMessage;")(
 state,window,ephemeral,()=>bubble,()=>1000,()=>{},()=>{},DateStub);
function checkSpeech(text,expectedOwner){
 const before=writes.length;
 remember(text);
 reply("Reply for "+text,2000,"es",1);
 eq(writes.length,before+2,"Memory and reply both persisted");
 eq(writes[before].owner,expectedOwner,"Speech owner matches recognized speaker");
 eq(writes[before+1].owner,expectedOwner,"Reply owner matches speech owner");
 eq(writes[before].data.person,expectedOwner==="local"?"persona no reconocida":expectedOwner,
  "Visible legacy label is consistent with typed ownership");
 eq(ephemeral.has(expectedOwner),true,"Short-term reply context uses matching owner");
}
checkSpeech("Hola, habla Bruno","Bruno");
eq(writes[0].owner!=="Ada",true,"Visible face must not own Bruno's speech");
state.currentVoicePerson=null;
checkSpeech("Hola, habla Ada","Ada");
state.currentPerson=null;
checkSpeech("Una persona desconocida está hablando","local");
eq(writes.every(row=>typeof row.owner==="string"&&row.owner.length>0),true,
 "Records always have a nonempty owner");
console.log("P04 cross-modal memory isolation:",checks,"checks");
