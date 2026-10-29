"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
function extract(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
const helper=extract("function competingFaceTooClose(","\nfunction recognize(det){");
const distanceSource=extract("function descriptorDistance(","\nasync function captureFaceEnrollment(){");
let state={people:[]},checks=0;
const check=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const ambiguous=new Function("state",distanceSource+"\n"+helper+"\nreturn competingFaceTooClose;")(state);
const face=new Float32Array([0,0,0]);
state.people=[{name:"Ada",descriptors:[[0,0,0]]},{name:"Bruno",descriptors:[[.42,0,0]]}];
check(ambiguous(face,"Ada",.40),true,"Near equal competitor requires confirmation");
check(ambiguous(face,"Ada",.20),false,"Clearly better label remains eligible");
check(ambiguous(face,"Bruno",.41),true,"Ambiguity symmetric when similar candidate");
state.people=[{name:"Ada",descriptors:[[0,0,0]]},{name:"Bruno",descriptors:[[.9,0,0]]}];
check(ambiguous(face,"Ada",.10),false,"Distinct face does not block known person");
state.people=[{name:"Ada",descriptors:[[0,0,0]]},{name:"Bruno",descriptors:[[.45,0,0],[.9,0,0]]}];
check(ambiguous(face,"Ada",.41),true,"Closest competitor among multiple enrollment samples");
state.people=[{name:"Ada",descriptors:[[0,0,0]]},{name:"Bruno",descriptors:[[1,2]]}];
check(ambiguous(face,"Ada",.43),false,"Invalid descriptor length is not a match");
check(ambiguous(face,"Ada",NaN),false,"Nonfinite distance cannot be a match");
const detection=extract("async function detectLoop(){","\nfunction buildMatcher(){");
let resolved;
const promise=new Promise(done=>resolved=done);
const view={textContent:""};
const lateState={started:true,lastDetections:[],currentPerson:"Ada",lastFaceConfirmedAt:0};
let called=0,scheduled=0;
const faceapi={TinyFaceDetectorOptions:class{},detectAllFaces:()=>({
 withFaceLandmarks(){return this;},withFaceDescriptors:()=>promise
})};
const run=new Function("state","document","faceapi","camera","$",
 "followFace","recognize","detectEating","resetEyes","setTimeout","Date",
 detection+"\nreturn detectLoop;")(lateState,{hidden:false},faceapi,{},()=>view,
 ()=>called++,()=>called++,()=>called++,()=>called++,()=>scheduled++,{now:()=>1000});
(async()=>{
 const pending=run();
 lateState.started=false;
 resolved([{descriptor:face,detection:{box:{x:1}}}]);
 await pending;
 check(called,0,"Slow recognition finishing after camera stop performs no actions");
 check(scheduled,0,"Stopped camera does not restart inference loop");
 check(lateState.lastDetections,[],"Late camera results do not overwrite state");
 console.log("P04 face ambiguity and slow-camera regression:",checks,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
