"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
function extract(first,last){
 const a=src.indexOf(first),b=src.indexOf(last,a+first.length);
 assert.ok(a>=0&&b>a,"Missing production source: "+first);return src.slice(a,b);
}
const speechCode=extract("function processSpeechResult(","\nfunction recognitionLanguage(){");
const matcherCode=extract("function buildMatcher(){","\nfunction dayPartGreeting(){");
let checks=0;
const eq=(actual,want,description)=>{assert.deepEqual(actual,want,description);checks++;};
const logs={owners:[],speeches:[],classLines:[],learner:0};
const state={
 currentPerson:"Ada",currentVoicePerson:"Ada",
 faceMatchHistory:[{label:"Ada",t:42}],lastFaceConfirmedAt:45,
 classMode:false,lastHeardAt:0,lastTranscriptAt:0,people:[]
};
let voiceCandidate=null;
const speech=new Function(
 "state","$","cleanRecognitionTranscript","voicePrintForWindow","recentVoicePrint",
 "recognizeVoicePerson","autoRemember","captureClassLine","learnSpeaker",
 "averageRecentVoiceFeature","handleSpeech","Date",
 speechCode+"\nreturn processSpeechResult;"
)(state,()=>({textContent:""}),x=>String(x).trim(),()=>[.2,.5],()=>[.2,.5],
 ()=>voiceCandidate,
 text=>logs.owners.push({person:state.currentVoicePerson||state.currentPerson||"local",text}),
 text=>{logs.classLines.push(text);return Promise.resolve();},
 ()=>{logs.learner++;},()=>[],text=>logs.speeches.push(text),Date);
speech("  Voz desconocida ");
eq(logs.owners[0].person,"local","Unknown microphone speech is never assigned to the visible face");
eq(state.currentPerson,null,"Unverified voice revokes cached face ownership");
eq(state.currentVoicePerson,null,"Unverified voice revokes previous voice ownership");
eq(state.faceMatchHistory,[],"Face consensus must be rebuilt after uncertain speech");
eq(state.lastFaceConfirmedAt,0,"Facial confirmation timestamp invalidated");
eq(logs.speeches[0],"Voz desconocida","Text still reaches normal dialogue handler");
state.currentPerson="Ada";
state.faceMatchHistory=[{label:"Ada",t:42}];
voiceCandidate={name:"Bruno"};
speech("Hola, soy Bruno");
eq(logs.owners[1].person,"Bruno","Known speaker can differ from face in view");
eq(state.currentPerson,"Ada","Valid voice match does not rewrite facial recognition");
eq(state.currentVoicePerson,"Bruno","Speaker owner follows verified voice");
state.classMode=true;
voiceCandidate=null;
speech("Otra persona dicta la clase");
eq(logs.owners[2].person,"local","Unidentified class utterance is stored under local owner");
eq(logs.classLines.length,1,"Class materials path remains active");
eq(logs.learner,1,"Existing face/voice learning only executes when face verified");
const vectors=()=>Array.from({length:128},(_,i)=>i/100);
const valid=[vectors(),vectors(),vectors()];
state.people=[
 {name:"OneShot",descriptors:[vectors()]},
 {name:"Short",descriptors:[vectors(),vectors()]},
 {name:"Valid",descriptors:valid},
 {name:"Corrupt",descriptors:[vectors(),[1,2],Array(128).fill(NaN)]}
];
const calls={labels:[],matches:[]};
const faceapi={
 LabeledFaceDescriptors:class{constructor(name,samples){calls.labels.push({name,samples});}},
 FaceMatcher:class{constructor(items,threshold){calls.matches.push({items,threshold});}}
};
const matcher=new Function("state","faceapi",matcherCode+"\nreturn buildMatcher;")(state,faceapi);
matcher();
eq(calls.labels.map(x=>x.name),["Valid"],"One-shot, short and corrupt face profiles excluded");
eq(calls.labels[0].samples.length,3,"Only multiple 128-dimensional samples allowed");
eq(calls.matches[0].threshold,.50,"Existing face distance ceiling preserved");
state.people=[{name:"Legacy",descriptors:[vectors()]}];
matcher();
eq(state.faceMatcher,null,"No valid multi-sample identity means no face matcher");
console.log("P08 verified speech owner and legacy face gating:",checks,"checks");
