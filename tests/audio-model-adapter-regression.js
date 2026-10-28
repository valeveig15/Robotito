"use strict";
const assert=require("node:assert/strict");
const model=require("../audio-sound-model.js");
let checked=0;
function eq(a,b,n){assert.deepEqual(a,b,n);checked++;}
const samples=model.mapCategories([
 {categoryName:"Laughter",score:.73},{categoryName:"Sneeze",score:.41},
 {categoryName:"Music",score:.82},{categoryName:"Speech",score:.20},
 {categoryName:"Knock",score:.25},{categoryName:"Unknown",score:.95}
]);
eq(samples.candidate.kind,"unknown","Unrecognized higher model class outranks weaker music");
eq(samples.scores.unknown,.95,"Unmapped sound is an explicit competing score");
eq(model.mapCategories([{categoryName:"Sneeze",score:.995},
 {categoryName:"Door creak",score:.98}]).candidate.kind,"unknown",
 "Close non-event competitor prevents a false sneeze label");
eq(model.mapCategories([{categoryName:"Sneeze",score:.995},
 {categoryName:"Door creak",score:.4}]).candidate.kind,"sneeze",
 "Unopposed sneeze remains a tentative candidate");
eq(model.mapCategories([{categoryName:"Sneezing",score:.995},
 {categoryName:"Coughing",score:.98}]).candidate.kind,"unknown",
 "Close cough/sneeze evidence abstains");
eq(model.mapCategories([{categoryName:"Bird singing",score:.995},
 {categoryName:"Sneeze",score:.96}]).candidate.kind,"unknown",
 "Bird singing is not human music and can veto a false sneeze");
eq(samples.scores.laugh,.73,"Laughter is a tentative event");
eq(samples.scores.sneeze,.41,"Sneeze score is not boosted");
eq(samples.scores.impact,.25,"Impacts are alternative labels");
eq(model.mapCategories([{categoryName:"Sneeze",score:NaN}]).candidate.kind,"unknown",
 "Nonnumeric classifications ignored");
let current=1000,instances=[],updates=0;
class FakeWorker{
 constructor(){this.requests=[];this.closed=false;instances.push(this);}
 postMessage(data){this.requests.push(data);if(data.type==="init")this.onmessage({data:{type:"ready"}});}
 terminate(){this.closed=true;}
 respond(data){this.onmessage({data});}
}
const bridge=model.create({workerFactory:()=>new FakeWorker(),clock:()=>current,onUpdate:()=>updates++});
eq(bridge.getStatus().state,"off","Model is disabled unless explicitly enabled");
bridge.pushPCM(new Float32Array(40000),16000);
eq(instances.length,0,"No third-party model/worker before consent");
bridge.enable();eq(bridge.getStatus().state,"ready","Opt-in loads worker");
const fake=instances[0];const pcm=new Float32Array(24000);
pcm.fill(.25);
bridge.pushPCM(pcm,16000);
const request=fake.requests.find(m=>m.type==="classify");
assert.ok(request&&request.samples.length===15600);checked++;
eq(request.sampleRate,16000,"Mic stream is processed at YAMNet sampling rate");
eq(request.samples[0],.25,"Samples retained in rolling window");
fake.respond({type:"result",id:request.id,categories:[
 {categoryName:"Sneeze",score:.97},{categoryName:"Speech",score:.95}
]});
eq(bridge.getStatus().candidate.kind,"unknown","Close sneeze/speech candidates remain uncertain");
eq(bridge.getStatus().performance.completedInferences,1,
 "One real completion is counted once");
eq(bridge.getStatus().performance.lastInferenceMs,0,
 "Fake clock shows deterministic zero inference latency");
eq(bridge.getStatus().performance.averageInferenceMs,0,
 "Average inference latency is computed from completed jobs only");
eq(bridge.getStatus().calibrated,false,
 "YAMNet predictions are not presented as field-calibrated event proof");
current+=2700;
eq(bridge.getStatus().candidate,null,"Stale model predictions expire");
bridge.clearAudio();
eq(bridge.getStatus().candidate,null,"Suppression clears the previous candidate immediately");
fake.respond({type:"result",id:request.id,categories:[{categoryName:"Sneeze",score:1}]});
eq(bridge.getStatus().candidate,null,"Late result from before class/sleep is ignored");
bridge.disable();eq(fake.closed,true,"Disabling opt-in closes remote-code worker");
eq(bridge.getStatus().performance.completedInferences,0,
 "Disabling clears session-specific latency telemetry");
eq(bridge.getStatus().performance.lastInferenceMs,null,
 "No previous user's timing metadata survives model disable");
eq(bridge.getStatus().candidate,null,"Opt-out clears cached audio evidence");
fake.respond({type:"result",id:request.id+1,categories:[{categoryName:"Cough",score:1}]});
eq(bridge.getStatus().state,"off","Late inference cannot reactivate disabled model");
eq(updates>1,true,"Model publishes useful status updates");
bridge.enable();
const second=instances.at(-1);
second.respond({type:"error",message:"download failed"});
eq(second.closed,true,"Failed models release their worker");
eq(bridge.getStatus().state,"error","Download failure stays visible");
bridge.enable();
eq(instances.length,3,"Retry starts a fresh worker rather than reusing one");
eq(bridge.getStatus().state,"ready","Model can be retried after network recovery");
bridge.disable();
// Old results after a class/sleep interruption must not release a newer
// pending request; hanging WASM inferences must fail and allow a retry.
const delayed=model.create({workerFactory:()=>new FakeWorker(),clock:()=>current});
delayed.enable();
const delayedWorker=instances.at(-1);
delayed.pushPCM(new Float32Array(24000).fill(.3),16000);
const staleRequest=delayedWorker.requests.find(x=>x.type==="classify");
delayed.clearAudio();
delayed.pushPCM(new Float32Array(24000).fill(.3),16000);
const newer=delayedWorker.requests.filter(x=>x.type==="classify").at(-1);
eq(newer.id>staleRequest.id,true,"New audio window gets a distinct inference ID");
delayedWorker.respond({type:"error",id:staleRequest.id,
 message:"Old cancelled audio inference failed"});
eq(delayed.getStatus().state,"ready",
 "Stale classifier errors must not disable new listening session");
eq(delayedWorker.closed,false,
 "A stale classification exception must not terminate the healthy Worker");
delayedWorker.respond({type:"result",id:staleRequest.id,
 categories:[{categoryName:"Sneeze",score:1}]});
eq(delayed.getStatus().candidate,null,"Stale prediction stays discarded");
delayedWorker.respond({type:"error",message:"Unidentified old result"});
eq(delayed.getStatus().state,"ready",
 "Untagged post-initialization errors cannot invalidate current inference");
delayed.pushPCM(new Float32Array(10000),16000);
eq(delayedWorker.requests.filter(x=>x.type==="classify").length,2,
 "Stale prediction must not unlock a newer in-flight request");
current+=2600;
delayed.pushPCM(new Float32Array(2000),16000);
eq(delayed.getStatus().state,"error","Hanging inference times out");
eq(delayed.getStatus().performance.timedOutInferences,1,
 "Timed-out inference is tracked explicitly");
eq(delayed.getStatus().performance.completedInferences,0,
 "Timed-out inference cannot masquerade as successful latency");
eq(delayedWorker.closed,true,"Hanging worker is terminated");
delayed.enable();
eq(delayed.getStatus().state,"ready","Model supports retry after hanging inference");
delayed.disable();
const failed=model.create({workerFactory:()=>new FakeWorker(),clock:()=>current});
failed.enable();
failed.pushPCM(new Float32Array(24000).fill(.2),16000);
const failedWorker=instances.at(-1);
const failedRequest=failedWorker.requests.find(x=>x.type==="classify");
failedWorker.respond({type:"error",id:failedRequest.id,message:"Current inference failed"});
eq(failed.getStatus().state,"error",
 "Current inference errors still terminate the faulty Worker");
eq(failedWorker.closed,true,
 "A real current classifier error must release the Worker");
failed.disable();

// Streaming resampler invariants: 16/44.1/48 kHz, arbitrary Worklet splits,
// passband fidelity and out-of-band attenuation. Neither overcounting nor
// fractional phase reset can masquerade as "sound recognition".
function sine(n,rate,frequency,amplitude=.6){
 return Float32Array.from({length:n},(_,i)=>amplitude*Math.sin(2*Math.PI*frequency*i/rate));
}
function resample(input,rate,chunks){
 const stream=model.createResampler(),out=[];
 let offset=0,k=0;
 while(offset<input.length){
  const end=Math.min(input.length,offset+chunks[k++%chunks.length]);
  stream.push(input.subarray(offset,end),rate,value=>out.push(value));
  offset=end;
 }
 return out;
}
for(const rate of [16000,44100,48000]){
 const input=sine(rate,rate,1000);
 const single=resample(input,rate,[rate]);
 const split=resample(input,rate,[128,2048,257,384,999]);
 eq(single.length,16000,"One second always becomes 16000 samples at "+rate);
 eq(split.length,16000,"Fractional phase is conserved across Worklet chunks at "+rate);
 let maxError=0;
 for(let i=0;i<single.length;i++)maxError=Math.max(maxError,Math.abs(single[i]-split[i]));
 assert.ok(maxError<1e-8,"Chunk boundaries must not change output samples at "+rate+
  ": "+maxError);checked++;
 const level=split.slice(2500).reduce((sum,v)=>sum+v*v,0)/(split.length-2500);
 assert.ok(level>.12&&level<.22,"Speech/music passband amplitude at "+rate+": "+level);checked++;
 const silence=resample(new Float32Array(rate),rate,[203,1500,99]);
 eq(silence.every(v=>v===0),true,"Silence stays silence at "+rate);
}
for(const rate of [44100,48000]){
 const alias=resample(sine(rate,rate,11000),rate,[2048,191,333]);
 const rms=Math.sqrt(alias.slice(3000).reduce((n,x)=>n+x*x,0)/(alias.length-3000));
 assert.ok(rms<.12,"Above-Nyquist signal must not sound like 5 kHz voice at "+
  rate+": rms "+rms);checked++;
}
const resetResampler=model.createResampler(),before=[],after=[];
resetResampler.push(new Float32Array(270).fill(.6),48000,v=>before.push(v));
resetResampler.reset();
resetResampler.push(new Float32Array(44100),44100,v=>after.push(v));
eq(after.length,16000,"Reset clears fractional phase and input-rate history");
eq(after.every(v=>v===0),true,"Reset prevents audio bleeding into next session");
console.log("Optional on-device sound model regression:",checked,"assertions passed");
