"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const i18n=require("../i18n.js");
function section(from,to){
 const a=src.indexOf(from),b=src.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,"Missing production function "+from);return src.slice(a,b);
}
const distSource=section("function descriptorDistance(","\nasync function captureFaceEnrollment(){");
const cosineSource=section("function cosineSimilarity(","\nfunction recentVoicePrint(");
const checkSource=section("function enrollmentIdentityCheck(","\nasync function enrollPerson(){");
const voiceSource=section("function recognizeVoicePerson(","\nfunction ");
let checks=0;
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
const ok=(x,message)=>{assert.ok(x,message);checks++;};
const state={people:[]};
const check=new Function("state",distSource+"\n"+checkSource+"\nreturn enrollmentIdentityCheck;")(state);
const cosine=new Function(cosineSource+"\nreturn cosineSimilarity;")();
const recognize=new Function("state","cosineSimilarity",voiceSource+"\nreturn recognizeVoicePerson;")(state,cosine);
const samples=(v,n=12)=>Array.from({length:n},()=>[v,0,0]);
state.people=[{name:"Ada",descriptors:samples(0),voicePrints:[[1,0],[1,0],[1,0],[1,0]]},
 {name:"Bruno",descriptors:samples(.92),voicePrints:[[0,1],[0,1],[0,1],[0,1]]}];
eq(check(samples(.04),"Ada").ok,true,"Same name and matching face can refresh");
eq(check(samples(.08),"Clara").reason,"other-profile","New name cannot re-enroll Ada");
eq(check(samples(.08),"Bruno").reason,"other-profile","Another face cannot overwrite Bruno");
eq(check(samples(.86),"Bruno").ok,true,"Matching Bruno is eligible");
eq(check(samples(1.5),"Clara").ok,true,"Distinct face may form a new profile");
eq(check(samples(1.5),"Ada").reason,"unverified-existing",
 "Name alone does not authorize a different face");
eq(check(samples(.04,2),"Ada").reason,"insufficient",
 "Too few samples cannot verify an identity");
const broken=state.people[0];
state.people=[{...broken,descriptors:[]}];
eq(check(samples(.03),"Ada").reason,"unverified-existing",
 "Missing old biometric reference is not authorization to change it");
state.people=[{name:"Ada",descriptors:samples(0),voicePrints:[[1,0],[1,0],[1,0]]}];
eq(check(samples(.04),"Ada").ok,true,"Known person retains valid face samples");
eq(recognize([.77,.64],"Ada"),null,
 "Apparent face agreement cannot lower voice threshold to .735");
const closeVoice={name:"Bruno",voicePrints:[
 [.9949,.1005],[.9949,.1005],[.9949,.1005]]};
state.people.push(closeVoice);
eq(recognize([1,0],"Ada"),null,
 "Similar voices reject ambiguity even with agreeing face");
state.people.pop();
eq(recognize([1,0],"Ada")?.name,"Ada",
 "Independent strong voice evidence remains recognized");
eq(recognize([0,1],"Ada"),null,
 "Face cannot manufacture a voice match");
state.people.push({name:"Bruno",voicePrints:[[0,1],[0,1],[0,1]]});
eq(recognize([0,1],"Ada")?.name,"Bruno",
 "Independent verified speaker can differ from a face in view");
eq(recognize([1,0],null)?.name,"Ada",
 "Known voice remains usable with no face evidence");
eq(recognize(null,"Ada"),null,"No signal means no identity");
state.people=[{name:"Legacy",voicePrints:[[1,0]]}];
eq(recognize([1,0],"Legacy"),null,"One legacy voice sample cannot grant identity even with a face");
ok(html.includes('id="personEnrollmentConsent" type="checkbox"'),
 "Enrollment requires explicit subject consent checkbox");
ok(src.includes('$("#personEnrollmentConsent")?.checked!==true'),
 "Production enrollment checks/re-checks consent");
ok(src.includes("const identity=enrollmentIdentityCheck(samples,name)"),
 "Every captured face is checked before voice or profile mutation");
ok(src.includes("cosineSimilarity(oldMean,newMean)<.80"),
 "Existing voice samples cannot be replaced with an inconsistent new speaker");
for(const lang of ["es","en","pt","fr","it","de"]){
 for(const key of ["p08ConsentLabel","p08EnrollmentWarning","p08ConsentRequired",
  "p08Collision","p08ExistingUnverified","p08VoiceMismatch"]){
  ok(i18n.t(key,lang)!==key,"Localized registration privacy "+lang+"/"+key);
 }
}
console.log("P08 face/name/voice consent policy:",checks,"checks");
