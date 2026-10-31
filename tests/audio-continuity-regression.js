"use strict";
// Synthetic fault sequences, never evidence of real human-audio accuracy.
const assert=require("node:assert/strict");
const audio=require("../audio-perception.js"),reactions=require("../audio-reactions.js");
const model=require("../audio-sound-model.js");
let checks=0;const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
const frame={rms:.2,flat:.25,harmonic:.74,low:40,mid:60,high:20,zcr:.12};
for(const fault of [null,[],Promise.resolve({sneeze:1}),{scores:{sneeze:"1"}},"throw"]){
  let value={sneeze:.999};const events=[];
  const detector=audio.create({classifier:{calibrated:true,version:"synthetic-continuity",
    predict:()=>{if(value==="throw")throw Error("expected inference failure");return value;}},onEvent:e=>events.push(e)});
  detector.process(frame,{now:10000});detector.process(frame,{now:10050});
  value=fault;detector.process(frame,{now:10100});
  value={sneeze:.999};detector.process(frame,{now:10150});
  eq(events.length,0,"Invalid inference must break partial positive evidence");
  detector.process(frame,{now:10200});detector.process(frame,{now:10250});
  eq(events.filter(e=>e.kind==="sneeze").length,1,"Fresh valid observations can recover");
}
for(const invalid of [{frameId:"stale",observedAt:9000,scores:{sneeze:.999}},
  {frameId:NaN,observedAt:10600,scores:{sneeze:.999}},
  {frameId:"",observedAt:10600,scores:{sneeze:.999}},
  {frameId:"invalid-time",observedAt:"10600",scores:{sneeze:.999}}]){
  let snapshot;const events=[];
  const detector=audio.create({classifier:{calibrated:true,version:"synthetic-tagged-fault",
    predict:()=>snapshot},onEvent:e=>events.push(e)});
  for(const [at,id] of [[10000,"a"],[10500,"b"]]){
    snapshot={frameId:id,observedAt:at,scores:{sneeze:.999}};detector.process(frame,{now:at});
  }
  snapshot=invalid;detector.process(frame,{now:10600});
  snapshot={frameId:"c",observedAt:11000,scores:{sneeze:.999}};detector.process(frame,{now:11000});
  eq(events.length,0,"Malformed or stale tagged inference cannot bridge positive runs");
}
let snapshot,detected=[];
const fused=audio.create({classifier:{calibrated:true,version:"synthetic-cached-human",
  predict:()=>snapshot},onEvent:e=>detected.push(e)});
for(let i=0;i<180;i++){
  const at=10000+i*50;
  if(i%10===0)snapshot={frameId:i,observedAt:at,scores:{cough:.999}};
  fused.process({...frame,rms:i%12<5?.13:.024,flat:.19,harmonic:.91,low:65,mid:90,high:44,zcr:.08},{now:at});
}
eq(detected.some(e=>e.kind==="music"||e.kind==="clap"),false,
  "Cached human evidence and expired observations cannot unlock a competing heuristic reaction");
for(const invalid of ["1",true,null,NaN,Infinity,-1,2])
  eq(model.mapCategories([{categoryName:"Sneeze",score:invalid}]).candidate.kind,"unknown","Adapter rejects non-probability values");
const clap={kind:"clap",confidence:.99,metadata:{origin:"acoustic-heuristic",bursts:5}};
for(const at of [NaN,Infinity,-1,11001,9999])
  eq(reactions.create().decide({...clap,at},{now:11000}),null,"Old, future or invalid event must not trigger an action");
eq(reactions.create().decide({...clap,at:10950},{now:11000})?.action,"clap","Fresh verified applause still works");
const dance=reactions.create();let active=false;
for(let now=10000;now<=10400;now+=10)active=dance.updateMusic({kind:"music",musicConfidence:.95},{now});
eq(active,true,"Fast polling must not starve independent music evidence");
eq(dance.updateMusic({kind:"music",musicConfidence:.95},{now:-1}),false,"Invalid time clears dance evidence");

let now=1000,id=0;const timers=new Map(),workers=[];
const setTimer=(fn,ms)=>{const key=++id;timers.set(key,{fn,ms});return key;};
const clearTimer=key=>timers.delete(key);
const fire=ms=>{const entry=[...timers].find(([,value])=>value.ms===ms);assert.ok(entry,"Expected timer "+ms);timers.delete(entry[0]);entry[1].fn();};
class Worker{
  constructor(){this.requests=[];this.closed=false;workers.push(this);}
  postMessage(data){this.requests.push(data);}
  terminate(){this.closed=true;}
  respond(data){this.onmessage({data});}
}
const bridge=model.create({workerFactory:()=>new Worker(),clock:()=>now,setTimer,clearTimer});
bridge.enable();fire(model.MAX_MODEL_LOAD_MS);
eq(bridge.getStatus().state,"error","Silent initialization must time out");
eq(workers[0].closed,true,"Timed-out initialization releases Worker");
workers[0].respond({type:"ready"});eq(bridge.getStatus().state,"error","Late ready cannot revive failed Worker");
bridge.enable();workers[1].respond({type:"ready"});
eq(timers.size,0,"Successful startup cancels its watchdog");
bridge.pushPCM(new Float32Array(24000),16000);fire(model.MAX_INFERENCE_MS);
eq(bridge.getStatus().state,"error","Inference must time out even with no further PCM");
eq(bridge.getStatus().performance.timedOutInferences,1,"One timed-out inference counted");
bridge.enable();const worker=workers[2];worker.respond({type:"ready"});
bridge.pushPCM(new Float32Array(24000),16000);
const request=worker.requests.find(r=>r.type==="classify");
worker.respond({type:"result",id:request.id,categories:[{categoryName:"Sneeze",score:.999}]});
eq(timers.size,0,"Completion cancels inference watchdog");
now=900;eq(bridge.getStatus().candidate,null,"Clock rollback must not freshen a prediction");
now=1200;bridge.pushPCM(new Float32Array(24000),16000);bridge.clearAudio();
eq(timers.size,0,"Privacy interruption cancels pending watchdog");
bridge.disable();eq(timers.size,0,"Opt-out leaves no watchdog running");
console.log("P03 continuity and failure recovery:",checks,"checks passed");
