"use strict";
// A calibrated test double, NOT a verified human sound model.
// Simulates the real 487.5 ms YAMNet hop while the WebAudio feature loop
// executes every 50 ms. Each cached result has a stable observation ID.
const assert=require("node:assert/strict");
const audio=require("../audio-perception.js");
const sample={rms:.2,flat:.25,harmonic:.74,low:40,mid:60,high:20,zcr:.12};
const noise={rms:.2,flat:.82,harmonic:.05,low:40,mid:60,high:20,zcr:.32};
let checks=0;
function verify(condition,message){assert.ok(condition,message);checks++;}
function simulate(kind,observations,{hop=500,tick=50,
 idPrefix=kind,start=10000,competing=false}={}){
 let snapshot={frameId:idPrefix+"-none",observedAt:start-500,scores:{noise:.995}};
 const model={calibrated:true,version:"synthetic-calibrated-test-only",
  predict:()=>snapshot};
 const events=[];
 const detector=audio.create({classifier:model,onEvent:ev=>events.push(ev)});
 const end=start+(observations-1)*hop+tick*2;
 for(let at=start;at<=end;at+=tick){
  if((at-start)%hop===0){
   const index=Math.floor((at-start)/hop);
   snapshot={frameId:idPrefix+"-"+index,observedAt:at,scores:{
    [kind]:.999,unknown:.001,...(competing?{voice:.997}:{voice:.001})
   }};
  }
  detector.process(sample,{now:at});
 }
 return {events,detector};
}
verify(audio.MODEL_OBSERVATION_CADENCE.taggedMinGapMs>=300,
 "New IDs faster than microphone-independent YAMNet windows never count twice");
verify(audio.MODEL_OBSERVATION_CADENCE.taggedMaxGapMs>=1000,
 "Two actual YAMNet observations spaced roughly .5 s can accumulate");
for(const [kind,count] of Object.entries({
 sneeze:3,cough:3,laugh:7,cry:12,clap:2
})){
 const {events}=simulate(kind,count);
 const matching=events.filter(x=>x.kind===kind);
 verify(matching.length===1,
  kind+" needs "+count+" different YAMNet observation IDs across real cadence");
 verify(matching[0].metadata.evidenceFrames>=count,
  kind+" proof includes count of distinct model windows, not 50ms animation ticks");
 const before=simulate(kind,count-1);
 verify(before.events.filter(x=>x.kind===kind).length===0,
  kind+" cannot emit with one fewer independent YAMNet window");
}
const duplicated=(()=>{
 let snapshot={frameId:"same",observedAt:10000,scores:{sneeze:.999}};
 const detector=audio.create({classifier:{calibrated:true,version:"synthetic-test",
  predict:()=>snapshot}});
 const emitted=[];
 for(let i=0;i<90;i++){
  const time=10000+i*50;
  // Deliberately change the feature tick, but not the model result.
  emitted.push(...detector.process(sample,{now:time}).events);
 }
 return emitted;
})();
verify(duplicated.length===0,"Cached same model frame across 90 UI ticks cannot count repeatedly");
const fastId=(()=>{
 let snapshot=null;const events=[];
 const detector=audio.create({classifier:{calibrated:true,version:"synthetic-test",
  predict:()=>snapshot},onEvent:e=>events.push(e)});
 for(let i=0;i<15;i++){
  const at=10000+i*50;
  snapshot={frameId:"fast-"+i,observedAt:at,scores:{sneeze:.999}};
  detector.process(sample,{now:at});
 }
 return events;
})();
verify(fastId.length===0,
 "New model IDs at just 50 ms do not qualify as independent YAMNet observations");
verify(simulate("sneeze",3,{competing:true}).events.length===0,
 "Nearly tied human and voice evidence must abstain despite 3 unique windows");
const gap=(()=>{
 let modelValue=null;
 const events=[];
 const detector=audio.create({classifier:{calibrated:true,version:"synthetic-test",
  predict:()=>modelValue},onEvent:x=>events.push(x)});
 const feed=(at,id)=>{modelValue={frameId:id,observedAt:at,scores:{sneeze:.999}};
  detector.process(sample,{now:at});};
 feed(10000,"a");feed(10500,"b");feed(12500,"c");
 return events;
})();
verify(gap.length===0,
 "A 2-second inference pause cannot stitch old and new positive observations");
const interrupted=(()=>{
 let value=null;const events=[];
 const detector=audio.create({classifier:{calibrated:true,version:"synthetic-test",
  predict:()=>value},onEvent:x=>events.push(x)});
 const feed=(at,id,suppress=false)=>{
  value={frameId:id,observedAt:at,scores:{sneeze:.999}};
  detector.process(sample,{now:at,suppress});
 };
 feed(10000,"a");feed(10500,"b");feed(11000,"suppressed",true);
 feed(11500,"c");feed(12000,"d");
 verify(events.length===0,
  "Class, sleep, self-speech or mic revocation resets multi-frame evidence");
 feed(12500,"e");
 return events;
})();
verify(interrupted.filter(x=>x.kind==="sneeze").length===1,
 "Three fresh post-interruption model observations can qualify again");
const stale=(()=>{
 let at=10000,version=0,events=[];
 const detector=audio.create({classifier:{calibrated:true,version:"synthetic-test",
  predict:()=>({frameId:"stale-"+version++,observedAt:at-400,
   scores:{sneeze:.999}})},onEvent:e=>events.push(e)});
 for(let i=0;i<15;i++,at+=50)detector.process(noise,{now:at});
 return events;
})();
verify(stale.length===0,"Predictions older than the freshness window cannot emit");
// Replaying an earlier model observation between new IDs is not a new PCM window.
const replayed=(()=>{
 let prediction=null;const events=[];
 const detector=audio.create({classifier:{calibrated:true,version:"synthetic-test",
  predict:()=>prediction},onEvent:e=>events.push(e)});
 for(const [at,id,observedAt] of [[10000,"a",10000],[10500,"b",10500],
  [11000,"a",11000],[11500,"b",11500]]){
  prediction={frameId:id,observedAt,scores:{sneeze:.999}};
  detector.process(sample,{now:at});
 }
 return events;
})();
verify(replayed.length===0,"Alternating reused frame IDs cannot count as independent sound evidence");
// Unique frame IDs cannot turn an older observation into fresh evidence.
const outOfOrder=(()=>{
 let prediction=null;const events=[];
 const detector=audio.create({classifier:{calibrated:true,version:"synthetic-test",
  predict:()=>prediction},onEvent:e=>events.push(e)});
 for(const [at,id,observedAt] of [[10000,"a",10000],[10500,"b",10500],
  [11000,"c",10480]]){
  prediction={frameId:id,observedAt,scores:{sneeze:.999}};
  detector.process(sample,{now:at});
 }
 return events;
})();
verify(outOfOrder.length===0,"An out-of-order model timestamp cannot count as new evidence");
// A gap of silence invalidates the partial human-event run and its latch.
const silenceGap=(()=>{
 let value=null;
 const detected=[],detector=audio.create({classifier:{calibrated:true,
  version:"synthetic-test",predict:()=>value},onEvent:x=>detected.push(x)});
 const sounding={...sample},silent={...sample,rms:.001};
 const tick=(at,id,quiet=false)=>{
  value={frameId:id,observedAt:at,scores:{sneeze:.999}};
  detector.process(quiet?silent:sounding,{now:at});
 };
 tick(10000,"a");tick(10500,"b");tick(10550,"quiet",true);
 tick(11000,"c");
 const prematurelyEmitted=detected.length;
 tick(11500,"d");tick(12000,"e");
 return {prematurelyEmitted,detected};
})();
verify(silenceGap.prematurelyEmitted===0,
 "Two detections before silence cannot be combined with the next fresh detection");
verify(silenceGap.detected.filter(x=>x.kind==="sneeze").length===1,
 "Three independent post-silence windows can still confirm a new event");
const untagged=(()=>{
 const events=[],detector=audio.create({classifier:{
  calibrated:true,version:"synthetic-synchronous-legacy",
  predict:()=>({sneeze:.999})},onEvent:e=>events.push(e)});
 for(let i=0;i<7;i++)detector.process(sample,{now:15000+i*50});
 return events;
})();
verify(untagged.filter(x=>x.kind==="sneeze").length===1,
 "Existing synchronous custom classifier cadence is still supported");
const unauthorized=audio.create({classifier:{calibrated:false,version:"uncalibrated-YAMNet",
 predict:()=>({sneeze:1})}});
verify(unauthorized.getStatus().modelAvailable===false,
 "The actual uncalibrated opt-in YAMNet model still cannot grant reactions");
console.log("Robotito tagged YAMNet cadence regression passed:",checks,"checks");
