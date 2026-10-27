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
eq(samples.candidate.kind,"music","Supported categories map to their strongest event");
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
eq(bridge.getStatus().candidate.kind,"sneeze","Candidate exposed with uncertainty");
eq(bridge.getStatus().calibrated,false,
 "YAMNet predictions are not presented as field-calibrated event proof");
current+=2700;
eq(bridge.getStatus().candidate,null,"Stale model predictions expire");
bridge.clearAudio();
eq(bridge.getStatus().candidate,null,"Suppression clears the previous candidate immediately");
fake.respond({type:"result",id:request.id,categories:[{categoryName:"Sneeze",score:1}]});
eq(bridge.getStatus().candidate,null,"Late result from before class/sleep is ignored");
bridge.disable();eq(fake.closed,true,"Disabling opt-in closes remote-code worker");
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
console.log("Optional on-device sound model regression:",checked,"assertions passed");
