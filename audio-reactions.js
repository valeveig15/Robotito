// Confidence- and context-gated avatar reactions to acoustic events.
// No microphone/model dependencies: the policy can be tested without a browser.
(function(root){
"use strict";
const REACTIONS=Object.freeze({
 clap:{action:"clap",minimum:.77,cooldown:1900},
 laugh:{action:"smile",minimum:.89,cooldown:8000,requiresModel:true},
 cry:{action:"comfort",minimum:.91,cooldown:18000,requiresModel:true},
 cough:{action:"notice",minimum:.94,cooldown:9500,requiresModel:true},
 sneeze:{action:"bless",minimum:.96,cooldown:5200,requiresModel:true}
});
function create({clock=()=>Date.now()}={}){
 const last=Object.create(null);
 function decide(event,{suppressed=false,now=clock()}={}){
  if(suppressed||!event||!Number.isFinite(event.confidence))return null;
  const policy=REACTIONS[event.kind];
  if(!policy||event.confidence<policy.minimum)return null;
  if(policy.requiresModel&&!event.metadata?.model)return null;
  if(now-(last[event.kind]??-Infinity)<policy.cooldown)return null;
  last[event.kind]=now;
  return {kind:event.kind,action:policy.action,confidence:event.confidence,at:now};
 }
 function reset(){for(const key of Object.keys(last))delete last[key];}
 return {decide,reset};
}
root.ROBOTITO_AUDIO_REACTIONS={create,REACTIONS};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_AUDIO_REACTIONS;
})(typeof window!=="undefined"?window:globalThis);
