"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const from=source.indexOf("async function detectLoop(){"),to=source.indexOf("\nfunction buildMatcher(){",from);
assert.ok(from>=0&&to>from);
let checks=0;
const eq=(a,b,why)=>{assert.deepEqual(a,b,why);checks++;};
function fixture(){
 let now=10000,id=0;
 const state={started:true,captureEpoch:1,captureRevision:1,currentPerson:"Ada",lastFaceConfirmedAt:9900,
  lastDetections:[],faceMatchHistory:[{label:"Ada",t:9900}]};
 const document={hidden:false},camera={readyState:4,currentTime:1};
 const timers=new Map(),requests=[],calls={recognized:0,followed:0,stopped:[]};
 const faceapi={TinyFaceDetectorOptions:class{},detectAllFaces:()=>({withFaceLandmarks(){return this;},
  withFaceDescriptors:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))})};
 const run=new Function("state","document","camera","faceapi","$","followFace","recognize","detectEating",
  "resetEyes","setTimeout","clearTimeout","Date","console","stopSenses",source.slice(from,to)+"\nreturn detectLoop;")(
  state,document,camera,faceapi,()=>({}),()=>calls.followed++,()=>calls.recognized++,()=>{},()=>{},
  (fn,ms)=>{timers.set(++id,{fn,ms});return id;},id=>timers.delete(id),{now:()=>now},{warn(){}},
  reason=>{calls.stopped.push(reason);state.started=false;state.captureEpoch++;state.currentPerson=null;});
 return {state,document,camera,timers,requests,calls,run,advance:ms=>now+=ms,
  fire(ms){for(const [key,t]of [...timers])if(t.ms===ms){timers.delete(key);t.fn();}}};
}
const face={descriptor:new Float32Array(128),detection:{score:.9,box:{x:0,y:0,width:100,height:100}}};
(async()=>{
 const stale=fixture(),job=stale.run();
 stale.state.captureRevision++;
 stale.requests[0].resolve([face]);await job;
 eq(stale.calls.recognized,0,"Inference from before a pause/resume cannot authorize identity");
 eq(stale.state.lastDetections.length,0,"Interrupted inference does not publish stale landmarks");
 const slow=fixture(),slowJob=slow.run();
 slow.advance(2600);slow.fire(2500);
 eq(slow.state.currentPerson,null,"Watchdog expires identity while model is still pending");
 slow.requests[0].resolve([face]);await slowJob;
 eq(slow.calls.recognized,0,"Late result cannot restore expired identity");
 eq(slow.state.faceInferencePending,null,"Settled late inference releases its slot");
 const frozen=fixture();frozen.state.lastFaceMediaTime=1;frozen.advance(3000);
 await frozen.run();
 eq(frozen.requests.length,0,"Unchanged camera time cannot masquerade as a new frame");
 eq(frozen.state.currentPerson,null,"Frozen video expires identity");
 const failed=fixture(),failedJob=failed.run();
 failed.requests[0].reject(Error("camera failed"));await failedJob;
 eq(failed.state.currentPerson,null,"Model error removes private identity");
 eq(failed.state.faceMatchHistory.length,0,"Model error clears accumulated face evidence");
 const replaced=fixture(),old=replaced.run();
 replaced.state.captureEpoch++;replaced.camera.currentTime++;
 const newer=replaced.run(),slot=replaced.state.faceInferencePending;
 replaced.requests[0].resolve([face]);await old;
 eq(replaced.state.faceInferencePending,slot,"An old finally cannot clear the new inference slot");
 eq(replaced.calls.recognized,0,"Replaced session cannot publish an old face");
 replaced.requests[1].resolve([face]);await newer;
 eq(replaced.calls.recognized,1,"Replacement session continues normally");
 const stuck=fixture(),stuckJob=stuck.run();
 stuck.fire(10000);
 eq(stuck.calls.stopped,["captureVisionTimeout"],"Stalled camera stops capture for an explicit retry");
 stuck.requests[0].resolve([face]);await stuckJob;
 eq(stuck.calls.recognized,0,"Result arriving after hard timeout is inert");
 eq(stuck.timers.size,0,"Stopped inference leaves no retry/watchdog timer");
 console.log("P04 temporal camera inference:",checks,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
