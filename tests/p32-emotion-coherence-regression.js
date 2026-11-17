"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../emotional-dialogue.js"),"utf8");
const messages=[],moods=[],timers=[];
const state={people:[{name:"Ada",bond:{affection:20,trust:20,fear:85,irritation:75}},
 {name:"Beto",bond:{affection:91,trust:89,fear:4,irritation:1}}],
 currentVoicePerson:null,currentPerson:null,classMode:false,sleeping:false,mood:"calm",
 emotion:"calm",emotionHoldUntil:0};
let affectionEffects=0;
const context={window:{},state,Date,Math,setTimeout:fn=>{timers.push(fn);return timers.length;},
 changeMoodScore(){},adjustBond(){},bondCategory:p=>p.name==="Ada"?"afraid":"loves",
 setMood:mood=>{state.mood=mood;state.emotion=mood;moods.push(mood);},
 animateAffection:()=>affectionEffects++,sayInLanguage:message=>messages.push(message),
 responseLanguage:()=>"es",sample:values=>values[0]};
vm.runInNewContext(source,context,{filename:"emotional-dialogue.js"});
const engine=context.window.ROBOTITO_EMOTION_DIALOGUE;
for(const prompt of ["mi profesora dijo: te quiero","el texto dice: te odio",
 "en la clase vimos que un personaje dijo te odio","traduce te quiero al ingles",
 "la cita es: te quiero mucho"])
 assert.equal(engine.classify(prompt),null,"Quoted/academic speech is not direct affection: "+prompt);
assert.equal(engine.handle("te quiero",{who:"Ada"}),true);
assert.equal(state.mood,"confused","Fearful bond should not become instant romance");
assert.equal(affectionEffects,0,"No hearts for cautious visitor");
assert.match(messages.at(-1),/confianza/i);
assert.ok(state.emotionHoldUntil>Date.now(),"Mood must last long enough for visuals");
assert.equal(engine.handle("te quiero",{who:"Beto"}),true);
assert.equal(state.mood,"affectionate");
assert.equal(affectionEffects,1);
assert.equal(engine.handle("hay un monstruo detras de vos",{who:"Beto"}),true);
assert.equal(state.mood,"scared");
assert.match(messages.at(-1),/compañía/i);
state.classMode=true;
assert.equal(engine.handle("te quiero",{who:"Beto"}),false,"Class speech cannot alter relationship");
assert.equal(state.mood,"scared");
state.classMode=false;state.sleeping=true;
assert.equal(engine.handle("te quiero",{who:"Beto"}),false,"Sleeping avatar does not respond");
state.sleeping=false;
const prev=state.mood;timers[0]();assert.equal(state.mood,prev,"Old reaction timer never overwrites recent fear");
console.log("P32 quoted classroom dialogue, trust-aware relationships and fear/heart exclusions passed");
