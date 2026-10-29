"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const start=source.indexOf("async function detectLoop(){");
const end=source.indexOf("\nfunction buildMatcher(){",start);
assert.ok(start>=0&&end>start,"Production face detection loop exists");
const body=source.slice(start,end);
let checks=0;
function eq(actual,expected,description){assert.deepEqual(actual,expected,description);checks++;}
const one={descriptor:new Float32Array([.1]),detection:{box:{x:1}}};
async function scenario(detections,{hidden=false,started=true,lastFaceConfirmedAt=4990}={}){
 const calls={recognized:[],followed:[],eating:[],reset:0,detector:0,schedules:0};
 const label={textContent:""};
 const state={started,currentPerson:"Ada",faceMatchHistory:[{label:"Ada",t:4900}],
  lastFaceConfirmedAt,lastDetections:[],lastSeenAt:0};
 const document={hidden},camera={};
 const faceapi={TinyFaceDetectorOptions:class{},
  detectAllFaces(){calls.detector++;return {
   withFaceLandmarks(){return this;},
   async withFaceDescriptors(){return detections;}
  };}};
 const detectLoop=new Function("state","document","faceapi","camera","$","followFace","recognize",
  "detectEating","resetEyes","setTimeout","Date",
  body+"\nreturn detectLoop;")(state,document,faceapi,camera,
   selector=>{assert.equal(selector,"#seenLabel");return label;},
   box=>calls.followed.push(box),det=>calls.recognized.push(det),
   det=>calls.eating.push(det),()=>{calls.reset++;},()=>{calls.schedules++;},
   {now:()=>5000});
 await detectLoop();
 return {state,label,calls};
}
(async()=>{
 let r=await scenario([one]);
 eq(r.calls.recognized.length,1,"Single face is passed to recognition");
 eq(r.calls.eating.length,1,"Single face preserves existing reaction path");
 eq(r.calls.followed.length,1,"Single face gaze tracking preserved");
 eq(r.state.currentPerson,"Ada","Recognized person's prior state is not unnecessarily cleared");
 eq(r.label.textContent,"1 persona","Single face label");
 r=await scenario([one,one]);
 eq(r.calls.recognized.length,0,"Crowded frame must not recognize first face");
 eq(r.calls.eating.length,0,"Crowded frame must not use arbitrary person's eating gesture");
 eq(r.calls.followed.length,0,"Crowded frame must not track arbitrary first face");
 eq(r.state.currentPerson,null,"Crowded frame immediately drops private identity");
 eq(r.state.faceMatchHistory,[],"Crowded frame drops prior consensus");
 eq(r.state.lastFaceConfirmedAt,0,"Crowded frame invalidates confirmation timestamp");
 eq(r.label.textContent,"2 personas","Crowded frame shown truthfully");
 eq(r.calls.reset,1,"Crowded frame resets gaze");
 r=await scenario([]);
 eq(r.calls.recognized.length,0,"Empty frame is not identified");
 eq(r.state.currentPerson,"Ada","Short empty-frame dropout keeps identity briefly");
 eq(r.label.textContent,"a nadie","Empty frame label");
 r=await scenario([],{lastFaceConfirmedAt:100});
 eq(r.state.currentPerson,null,"Long face absence expires identity");
 r=await scenario([one,one],{hidden:true});
 eq(r.calls.detector,0,"Hidden tab does not use camera");
 eq(r.calls.recognized.length,0,"Hidden tab does not recognize");
 r=await scenario([one],{started:false});
 eq(r.calls.detector,0,"Stopped session does not access camera");
 eq(r.calls.schedules,0,"Stopped session does not restart loop");
 console.log("P04 camera face-selection privacy regression:",checks,"checks");
})().catch(e=>{console.error(e);process.exitCode=1;});
