// Confidence- and context-gated avatar reactions to acoustic events.
// No microphone/model dependencies: the policy can be tested without a browser.
(function(root){
"use strict";
const REACTIONS=Object.freeze({
 clap:{action:"clap",minimum:.85,cooldown:1900},
 laugh:{action:"smile",minimum:.89,cooldown:8000,requiresModel:true},
 cry:{action:"comfort",minimum:.91,cooldown:18000,requiresModel:true},
 cough:{action:"notice",minimum:.94,cooldown:9500,requiresModel:true},
 sneeze:{action:"bless",minimum:.96,cooldown:5200,requiresModel:true}
});
// No downloaded/pretrained model can authorize unsolicited human reactions.
// Only an independently validated and deliberately approved deployment may
// set this capability to true. It is false for Robotito's shipped app.
function create({clock=()=>Date.now(),humanModelReactionsApproved=false}={}){
 const approved=humanModelReactionsApproved===true;
 const last=Object.create(null);
 let lastVocalAt=-Infinity;
 const VOCAL_GROUP=new Set(["laugh","cry","cough","sneeze"]);
 const VOCAL_GROUP_COOLDOWN=1700;
 let musicStartedAt=null,musicFrames=0,musicLastAt=0,musicActive=false;
 function updateMusic(status,{suppressed=false,now=clock()}={}){
  // Keep movement downstream of acoustic classification. An instantaneous
  // music candidate is insufficient: require independent, spaced frames.
  if(suppressed||!status||status.kind!=="music"||
     !Number.isFinite(status.musicConfidence)||status.musicConfidence<.76||
     !Number.isFinite(now)||(musicFrames>0&&(now<musicLastAt||now-musicLastAt>450))){
   musicStartedAt=null;musicFrames=0;musicActive=false;
   musicLastAt=Number.isFinite(now)?now:0;
   return false;
  }
  if(musicStartedAt===null)musicStartedAt=now;
  if(musicFrames===0||now-musicLastAt>=35)musicFrames++;
  musicLastAt=now;
  if(musicFrames>=6&&now-musicStartedAt>=330)musicActive=true;
  return musicActive;
 }
 function decide(event,{suppressed=false,now=clock()}={}){
  if(suppressed||!event||!Number.isFinite(now)||now<0||
     !Number.isFinite(event.confidence)||event.confidence<0||event.confidence>1)return null;
  const policy=REACTIONS[event.kind];
  if(!policy||event.confidence<policy.minimum)return null;
  // A model name is not proof of calibration or permission to react.
  // Require an explicit deployment approval AND actual independently
  // counted evidence. Heuristic high-fives/claps remain available.
  const modelEvidence=approved&&event.metadata?.calibrated===true&&
   typeof event.metadata.model==="string"&&!!event.metadata.model.trim()&&
   Number.isInteger(event.metadata.evidenceFrames)&&event.metadata.evidenceFrames>=2;
  if(event.kind==="clap"){
   const acoustic=event.metadata?.origin==="acoustic-heuristic"&&
     Number.isInteger(event.metadata.bursts)&&event.metadata.bursts>=5;
   if(!acoustic&&!modelEvidence)return null;
  }
  if(policy.requiresModel&&!modelEvidence)return null;
  if(now-(last[event.kind]??-Infinity)<policy.cooldown)return null;
  if(VOCAL_GROUP.has(event.kind)&&now-lastVocalAt<VOCAL_GROUP_COOLDOWN)return null;
  last[event.kind]=now;
  if(VOCAL_GROUP.has(event.kind))lastVocalAt=now;
  return {kind:event.kind,action:policy.action,confidence:event.confidence,at:now};
 }
 function reset(){
  for(const key of Object.keys(last))delete last[key];
  lastVocalAt=-Infinity;musicStartedAt=null;musicFrames=0;musicLastAt=0;musicActive=false;
 }
 return {decide,updateMusic,reset};
}
root.ROBOTITO_AUDIO_REACTIONS={create,REACTIONS};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_AUDIO_REACTIONS;
})(typeof window!=="undefined"?window:globalThis);
