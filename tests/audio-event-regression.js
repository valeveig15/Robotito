"use strict";
// Fixed synthetic signals are deliberately not passed off as real microphone validation.
const assert=require("node:assert/strict");
const audio=require("../audio-perception.js");
const reactions=require("../audio-reactions.js");
const {randomSource}=require("./generative-kit.js");
const seed=process.env.ROBOTITO_TEST_SEED||17,random=randomSource(seed);
let checks=0;
function ok(condition,label){assert.ok(condition,label);checks++;}
function eq(a,b,label){assert.deepEqual(a,b,label);checks++;}
function sample(overrides={}){return {rms:.007,flat:.96,harmonic:.02,
  low:12,mid:15,high:10,zcr:.25,...overrides};}
function feed(detector,frames,{start=1000,step=50,suppress=false}={}){
 return frames.map((frame,i)=>detector.process(frame,{now:start+i*step,suppress}));
}
function onlyEvents(rows){return rows.flatMap(r=>r.events);}
let detector=audio.create({clock:()=>0});
for(let i=0;i<160;i++){
 const result=detector.process(sample({rms:.0015}),{now:1000+50*i});
 ok(!result.events.length,"silence must not emit an event");
 if(i>14)eq(result.kind,"silence","low energy returns silence");
}
detector.reset();
const voiceFrames=Array.from({length:72},()=>sample({rms:.08+random.next()*.03,
 flat:.23,harmonic:.79,low:56,mid:79,high:36,zcr:.12}));
const voiceResults=feed(detector,voiceFrames);
ok(voiceResults.some(x=>x.kind==="voice"),"voiced activity is recognized after evidence accumulates");
ok(!onlyEvents(voiceResults).some(x=>x.kind==="sneeze"||x.kind==="cough"),
 "voice never turns into an unsupported medical event");
detector.reset();
const ambientFrames=Array.from({length:180},(_,i)=>sample({rms:.12,flat:.93,
 low:52,mid:60,high:42,harmonic:.04,zcr:.31}));
const ambient=feed(detector,ambientFrames);
ok(ambient.every(x=>x.kind!=="music"&&x.kind!=="clap"),"steady vacuum is not music/clap");
ok(!onlyEvents(ambient).length,"ambient noise has no reactive event");
detector.reset();
const musicFrames=Array.from({length:160},(_,i)=>sample({
 rms:i%12<5?.13:.024,flat:.19,harmonic:.91,low:65,mid:90,high:44,zcr:.08
}));
const music=feed(detector,musicFrames);
ok(music.some(x=>x.kind==="music"),"harmonic periodic signal becomes music after long evidence");
ok(!onlyEvents(music).some(x=>x.kind==="sneeze"||x.kind==="clap"),
 "rhythm and high RMS do not become sneeze or applause");
detector.reset();
const transient=(sharp=true)=>[
 sample({rms:.01}),
 sample({rms:.24,flat:sharp?.78:.4,harmonic:sharp?.08:.2,
  low:sharp?22:90,mid:70,high:sharp?85:30,zcr:.32}),
 sample({rms:.2,flat:.52,low:26,mid:50,high:60,zcr:.2}),
 sample({rms:.022,flat:.74,low:21,mid:20,high:20,zcr:.2}),
 sample({rms:.006})];
const knocks=[];for(let i=0;i<5;i++){knocks.push(...transient(false),sample(),sample());}
const knockResults=feed(detector,knocks,{start:12000});
ok(onlyEvents(knockResults).some(x=>x.kind==="impact"),"percussive low-frequency impacts detected");
ok(!onlyEvents(knockResults).some(x=>x.kind==="clap"),"knocks cannot become applause");
detector.reset();
const clapFrames=[];for(let i=0;i<6;i++){clapFrames.push(...transient(true),sample(),sample());}
const applause=feed(detector,clapFrames,{start:26000});
ok(onlyEvents(applause).some(x=>x.kind==="clap"),"repeated distinct broadband attacks yield a cautious clap candidate");
ok(onlyEvents(applause).every(x=>x.confidence>=0&&x.confidence<=1),"event probabilities bounded");
detector.reset();
const aborted=feed(detector,clapFrames.slice(0,20),{start:35000});
const suppressed=detector.process(sample({rms:.5}),{now:36000,suppress:true});
eq(suppressed.events,[],"sleep/class/audio suppression yields zero events");
ok(suppressed.musicConfidence===0,"suppression clears accumulated music evidence");
const resumed=feed(detector,clapFrames.slice(20),{start:36100});
ok(!onlyEvents(resumed).some(x=>x.kind==="clap"),
 "clap evidence cannot survive a recording interruption");
for(const kind of ["laugh","cry","cough","sneeze"]){
 detector=audio.create({clock:()=>0});
 const results=feed(detector,Array.from({length:40},()=>sample({rms:.15,harmonic:.8,flat:.2})),{start:45000});
 ok(!onlyEvents(results).some(x=>x.kind===kind),"No calibrated model -> abstain from "+kind);
}
const modelPhase={scores:{}};
const model={version:"test-calibrated-v1",calibrated:true,predict:()=>modelPhase.scores};
detector=audio.create({classifier:model,clock:()=>0});
let when=50000;
for(const kind of ["laugh","cry","cough","sneeze"]){
 modelPhase.scores=Object.fromEntries(audio.MODEL_EVENTS.map(x=>[x,x===kind?.995:.01]));
 const samples=Array.from({length:17},()=>sample({rms:.20,flat:.25,harmonic:.7}));
 const results=feed(detector,samples,{start:when});
 const events=onlyEvents(results).filter(x=>x.kind===kind);
 eq(events.length,1,"Calibrated, stable "+kind+" produces one event (cooldown)");
 ok(events[0].metadata.model===model.version,"Event retains classifier provenance "+kind);
 when+=10000;
}
modelPhase.scores={sneeze:.99,cough:.95,laugh:.02,cry:.02};
detector.reset();
const confusion=feed(detector,Array.from({length:16},()=>sample({rms:.22})),{start:90000});
ok(!onlyEvents(confusion).some(x=>x.kind==="sneeze"||x.kind==="cough"),
 "Similar cough and sneeze likelihood abstains");
const fake={calibrated:false,version:"test",predict:()=>({sneeze:1})};
detector=audio.create({classifier:fake});
ok(!onlyEvents(feed(detector,Array.from({length:18},()=>sample({rms:.2})),{start:100000}))
 .some(x=>x.kind==="sneeze"),"Uncalibrated score cannot cause bless you");
for(let scenario=0;scenario<65;scenario++){
 detector=audio.create({clock:()=>0});
 const result=feed(detector,Array.from({length:65},()=>sample({rms:.08+random.next()*.03,
   flat:.86+random.next()*.10,harmonic:random.next()*.06,
   low:40+random.next()*30,mid:45+random.next()*22,
   high:16+random.next()*20,zcr:.20+random.next()*.12})),{start:120000+scenario*4000});
 ok(!onlyEvents(result).some(x=>["sneeze","cough","laugh","cry","music"].includes(x.kind)),
 "Seeded noise never invents a human event "+scenario);
}
// Reaction policy is separate from detection: a plausible event does not
// authorize unprompted speech without calibrated evidence and temporal cooldown.
let now=200000;
const policy=reactions.create({clock:()=>now});
eq(policy.decide({kind:"clap",confidence:.68}),null,"Low-confidence claps do nothing");
eq(policy.decide({kind:"impact",confidence:.98}),null,"Impact never triggers applause");
eq(policy.decide({kind:"sneeze",confidence:1}),null,"Unproven sneeze never triggers speech");
eq(policy.decide({kind:"laugh",confidence:1}),null,"Unproven laugh never changes mood");
eq(policy.decide({kind:"cry",confidence:.995,metadata:{model:"calibrated"}},
  {suppressed:true}),null,"Class-mode suppression prevents concern");
const sneezeEvent={kind:"sneeze",confidence:.98,metadata:{model:"mock-calibrated"}};
eq(policy.decide(sneezeEvent)?.action,"bless","Verified sneeze receives one localized blessing");
now+=500;
eq(policy.decide(sneezeEvent),null,"Sneeze cooldown suppresses duplicate");
now+=5200;
eq(policy.decide(sneezeEvent)?.action,"bless","New sneeze after cooldown may react");
eq(policy.decide({kind:"clap",confidence:.8})?.action,"clap","Confirmed applause gets animation");
eq(policy.decide({kind:"clap",confidence:.95}),null,"Repeated claps do not spam animation");
eq(policy.decide({kind:"laugh",confidence:.93,metadata:{model:"calibrated"}})?.action,
  "smile","Calibrated laughter yields a temporary smile");
eq(policy.decide({kind:"cry",confidence:.94,metadata:{model:"calibrated"}})?.action,
  "comfort","Calibrated crying yields a restrained comfort response");
eq(policy.decide({kind:"cough",confidence:.96,metadata:{model:"calibrated"}})?.action,
  "notice","Calibrated cough prompts attention without unsolicited speech");
eq(policy.decide({kind:"music",confidence:1}),null,
  "Music is controlled by continuous rhythm state rather than event spam");
console.log("Robotito acoustic event regression:",checks,"assertions; seed:",seed);
