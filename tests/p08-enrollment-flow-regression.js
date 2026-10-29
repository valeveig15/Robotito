"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const begin=source.indexOf("async function enrollPerson(){");
const end=source.indexOf("\nfunction ",begin+20);
assert.ok(begin>0&&end>begin,"Production enrollPerson function must be available");
const policyStart=source.indexOf("function enrollmentIdentityCheck(");
const policyEnd=source.indexOf("\nasync function enrollPerson(){",policyStart);
const distanceStart=source.indexOf("function descriptorDistance(");
const distanceEnd=source.indexOf("\nasync function captureFaceEnrollment(){",distanceStart);
const cosineStart=source.indexOf("function cosineSimilarity(");
const cosineEnd=source.indexOf("\nfunction recentVoicePrint(",cosineStart);
const state={started:true,people:[],faceMatchHistory:[],enrollmentActive:false};
const distance=new Function(source.slice(distanceStart,distanceEnd)+"\nreturn descriptorDistance;")();
const policy=new Function("state","descriptorDistance",source.slice(policyStart,policyEnd)+
 "\nreturn enrollmentIdentityCheck;")(state,distance);
const cosine=new Function(source.slice(cosineStart,cosineEnd)+"\nreturn cosineSimilarity;")();
const mean=v=>{
 if(!v?.length)return null;
 const sum=Array.from({length:v[0].length},(_,i)=>v.reduce((a,x)=>a+x[i],0)/v.length);
 const n=Math.hypot(...sum)||1;
 return sum.map(x=>x/n);
};
const $fields={
 "#personName":{value:"Ada"},
 "#personBirthday":{value:""},
 "#personRole":{value:"other"},
 "#personEnrollmentConsent":{checked:false},
 "#enrollBtn":{disabled:false}
};
const actions={capture:0,voice:0,writes:0,build:0,toasts:[],statuses:[]};
let nextFace=Array.from({length:12},()=>[0.01,0,0]);
let nextVoice={prints:[[1,0],[1,0],[1,0],[1,0]],quality:.92};
let revokeAtCapture=false;
const register=new Function(
 "state","$","parseBirthdayInput","toast","setEnrollProgress","enrollText",
 "captureFaceEnrollment","enrollmentIdentityCheck","captureEnrollmentVoice",
 "averageVoiceVectors","cosineSimilarity","save","KEYS","ensureBond",
 "buildMatcher","renderPeople","say","window","responseLanguage",
 source.slice(begin,end)+"\nreturn enrollPerson;"
)(state,id=>$fields[id],v=>v? "2026-10-30":"",x=>actions.toasts.push(x),
 (p,msg)=>actions.statuses.push({p,msg}),a=>a,
 async()=>{actions.capture++;if(revokeAtCapture)$fields["#personEnrollmentConsent"].checked=false;return nextFace;},
 policy,async()=>{actions.voice++;return nextVoice;},mean,cosine,
 ()=>{actions.writes++;},{people:"people"},()=>{},
 ()=>{actions.build++;},()=>{},()=>{},
 {ROBOTITO_I18N:{t:k=>k}} ,()=> "es");
const eq=(a,b,why)=>assert.deepEqual(a,b,why);
(async()=>{
 await register();
 eq(actions.capture,0,"No consent means no camera enrollment");
 eq(actions.writes,0,"No consent never writes a profile");
 $fields["#personEnrollmentConsent"].checked=true;
 await register();
 eq(state.people.length,1,"New explicitly consented person enrolled");
 eq(state.people[0].name,"Ada","Name recorded only after consent");
 eq(state.people[0].voicePrints.length,4,"Multiple verified voice samples stored");
 const successfulWrites=actions.writes;
 $fields["#personName"].value="Bruno";
 $fields["#personEnrollmentConsent"].checked=true;
 nextFace=Array.from({length:12},()=>[.03,0,0]);
 const voicesBefore=actions.voice;
 await register();
 eq(state.people.length,1,"Lookalike cannot be registered under an unrelated name");
 eq(actions.voice,voicesBefore,"Collision rejected before collecting voice");
 eq(actions.writes,successfulWrites,"No storage changed by a failed collision");
 $fields["#personName"].value="Ada";
 $fields["#personEnrollmentConsent"].checked=true;
 nextFace=Array.from({length:12},()=>[.8,0,0]);
 await register();
 eq(actions.writes,successfulWrites,"Same name without matching face cannot overwrite identity");
 $fields["#personEnrollmentConsent"].checked=true;
 nextFace=Array.from({length:12},()=>[0.02,0,0]);
 nextVoice={prints:[[0,1],[0,1],[0,1],[0,1]],quality:.95};
 await register();
 eq(actions.writes,successfulWrites,"Face alone cannot attach an unrelated new voice");
 eq(state.people[0].voicePrints[0][0],1,"Original voice profile preserved");
 $fields["#personEnrollmentConsent"].checked=true;
 nextVoice={prints:[[1,0],[1,0],[1,0]],quality:.91};
 revokeAtCapture=true;
 const captureBefore=actions.voice;
 await register();
 eq(actions.voice,captureBefore,"Consent revocation stops before voice capture");
 eq(actions.writes,successfulWrites,"Revocation causes no profile writes");
 revokeAtCapture=false;
 $fields["#personEnrollmentConsent"].checked=true;
 await register();
 eq(actions.writes,successfulWrites+2,"Verified same person may explicitly refresh their own data");
 eq(state.people[0].voicePrints.length,7,"Verified voice samples appended only to correct profile");
 eq($fields["#personEnrollmentConsent"].checked,false,
  "Consent is cleared after each registration attempt");
 eq($fields["#enrollBtn"].disabled,false,"Enroll control unlocks after each attempt");
 assert.ok(actions.statuses.some(x=>/p08Collision/.test(x.msg)));
 assert.ok(actions.statuses.some(x=>/p08VoiceMismatch/.test(x.msg)));
 console.log("P08 actual enrollment consent and anti-impersonation flow: 20 checks");
})().catch(e=>{console.error(e);process.exitCode=1;});
