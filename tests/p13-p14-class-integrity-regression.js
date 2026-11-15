"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","class-verification.js"),"utf8");
const first=source.indexOf("  function averageRecentVoiceFeature()");
const last=source.indexOf("  function contentWords(",first);
assert.ok(first>=0&&last>first,"Production class functions must exist");
const state={
  voiceProfiles:{me:[],teacher:[],classmate:[]},
  recentAudioFeatures:[],speakerOverride:null,
  classLines:[
    {sessionId:"math-1",subject:"Matemáticas",topic:"Álgebra",text:"ecuaciones"},
    {sessionId:"bio-1",subject:"Biología",topic:"Célula",text:"membranas"}
  ],
  classMode:false,selectedClassSessionId:null,classSubject:"Química",classTopic:"Reacciones"
};
const norm=value=>String(value||"").normalize("NFD")
 .replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const funcs=new Function("state","save","normalizeText","$",
 source.slice(first,last)+"\nreturn {classifySpeaker,classLinesForSubject};")(
 state,()=>{},norm,()=>null);
assert.equal(funcs.classifySpeaker({rms:0.1,centroid:0.3,flat:0.2}),"unknown",
 "A speaker without enrollment must remain unidentified");
assert.equal(state.lastSpeakerConfidence,.24);
state.voiceProfiles.teacher=[{rms:0.1,centroid:0.3,flat:0.2}];
assert.equal(funcs.classifySpeaker({rms:0.1,centroid:0.3,flat:0.2}),"unknown",
 "A single matching voice profile cannot prove speaker identity");
state.voiceProfiles.me=[{rms:0.5,centroid:0.8,flat:0.8}];
assert.equal(funcs.classifySpeaker({rms:0.1,centroid:0.3,flat:0.2}),"teacher",
 "Strong separated profiles may produce a qualified label");
state.speakerOverride="me";
assert.equal(funcs.classifySpeaker({rms:0.4,centroid:0.7,flat:0.8}),"me",
 "An explicit manual correction remains authoritative");
assert.equal(funcs.classLinesForSubject().length,0,
 "An absent subject/topic must never return unrelated class material");
state.classSubject="Biología";state.classTopic="Célula";
assert.deepEqual(funcs.classLinesForSubject().map(x=>x.sessionId),["bio-1"],
 "Exact class subject/topic returns only matching material");
state.selectedClassSessionId="math-1";state.classSubject="Matemáticas";state.classTopic="Álgebra";
assert.deepEqual(funcs.classLinesForSubject().map(x=>x.sessionId),["math-1"],
 "Selected recorded session remains preferred");
assert.match(source,/if\(live\.correctedText===academic\.text\)/,
 "Asynchronous fact verification must not overwrite a newer manual correction");
console.log("P13/P14 speaker abstention and class source isolation: passed");
