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
  "detectEating","resetEyes","setTimeout","Date","uiSet",
  body+"\nreturn detectLoop;")(state,document,faceapi,camera,
   selector=>{assert.equal(selector,"#seenLabel");return label;},
   box=>calls.followed.push(box),det=>calls.recognized.push(det),
   det=>calls.eating.push(det),()=>{calls.reset++;},()=>{calls.schedules++;},
   {now:()=>5000},(el,source,data={})=>{el.textContent=require("../i18n.js").text(source,"es",data);});
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
 // Exercise the production face identity consensus with deterministic model outputs.
 const recognizeStart=source.indexOf("function recognize(det){");
 const recognizeEnd=source.indexOf("\nfunction countExtendedFingers(",recognizeStart);
 assert.ok(recognizeStart>0&&recognizeEnd>recognizeStart,"Production face matcher exists");
 let time=100000;
 const frame=(value,score=.9)=>{time+=700;return {descriptor:new Float32Array(128).fill(value),detection:{score}};};
 let match={label:"Ada",distance:.42};
 const calls={greet:0,save:0,affection:0,birthday:0};
 const faceState={faceMatcher:{findBestMatch:()=>match},currentPerson:null,
  lastFaceConfirmedAt:0,faceMatchHistory:[],people:[
   {name:"Ada",lastGreetingAt:0},{name:"Bruno",lastGreetingAt:0}]};
 const recognize=new Function("state","Date","save","KEYS","say","greetingFor",
  "temporaryRobotClass","bondCategory","animateAffection","checkBirthday","competingFaceTooClose",
  source.slice(recognizeStart,recognizeEnd)+"\nreturn recognize;")(
   faceState,{now:()=>time},()=>{calls.save++;},{people:"people"},
   ()=>{calls.greet++;},p=>p.name,()=>{},()=>"",()=>{calls.affection++;},
   ()=>{calls.birthday++;},()=>false);
 recognize(frame(.5));
 eq(faceState.currentPerson,null,"One matching frame does not grant identity");
 match={label:"Ada",distance:.41};recognize(frame(.5));
 eq(faceState.currentPerson,"Ada","Two strong matching frames confirm identity");
 eq(calls.greet,0,"Face-only consensus cannot announce a name or birthday");
eq(calls.birthday,0,"A face alone does not reveal private birthdays");
 match={label:"unknown",distance:.99};time+=100;
 recognize(frame(.9));
 eq(faceState.currentPerson,null,"Unknown face immediately revokes private identity");
 eq(calls.greet,0,"Unknown face never gets a known person's greeting");
 match={label:"Ada",distance:.65};time+=100;
 recognize(frame(.7));
 eq(faceState.currentPerson,null,"Poor score cannot authorize a known identity");
 match={label:"Bruno",distance:.40};time+=100;
 recognize(frame(.4));
 eq(faceState.currentPerson,null,"New person requires consensus before identity switch");
 recognize(frame(.4));
 eq(faceState.currentPerson,"Bruno","Second strong frame confirms new person");
 match={label:"Ada",distance:.42};time+=100;
 recognize(frame(.4));
 eq(faceState.currentPerson,null,"Different visible face revokes stale identity pending consensus");
 faceState.faceMatcher=null;time+=3000;
 recognize(frame(.3));
 eq(faceState.currentPerson,null,"No matcher does not fabricate identity");
 // Adjacent inferences of a frozen frame cannot grant identity.
 faceState.faceMatcher={findBestMatch:()=>match};faceState.faceMatchHistory=[];
 match={label:"Ada",distance:.4};
 const still=frame(.4);recognize(still);recognize(still);
 eq(faceState.currentPerson,null,"Two calls at the same time are not independent evidence");
 recognize(frame(.4));
 eq(faceState.currentPerson,"Ada","Later independent frame completes evidence");
 time+=3000;recognize(frame(.4));
 eq(faceState.currentPerson,null,"An expired identity needs new consensus after a long gap");
 recognize(frame(.4));
 eq(faceState.currentPerson,"Ada","Fresh consensus restores an expired identity");
 recognize(frame(.4,.3));
 eq(faceState.currentPerson,null,"Low-confidence face cannot retain private identity");
 for(const label of ["Ada","Bruno","Ada","Bruno","Ada"]){
  match={label,distance:.48};recognize(frame(.4));
 }
 eq(faceState.currentPerson,null,"Alternating people cannot accumulate a three-of-five identity");
 match={label:"Ada",distance:.4};recognize(frame(.4));
 time-=10000;recognize(frame(.4));
 eq(faceState.currentPerson,null,"Clock rollback breaks consensus");
 console.log("P04 camera face-selection privacy regression:",checks,"checks");
})().catch(e=>{console.error(e);process.exitCode=1;});
