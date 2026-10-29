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
// A single acoustic passage must never trigger contradictory clap and human
// reactions. With a calibrated competing model, human-event evidence takes
// precedence over heuristic broadband transients.
const competing={scores:{cough:.995,clap:.01,sneeze:.01,laugh:.01,cry:.01}};
const competingModel={version:"test-competing-v1",calibrated:true,
 predict:()=>competing.scores};
let fused=audio.create({classifier:competingModel,clock:()=>0});
let fusedResults=feed(fused,clapFrames,{start:32000});
ok(!onlyEvents(fusedResults).some(x=>x.kind==="clap"||x.kind==="music"),
 "Calibrated human-event evidence suppresses acoustic applause/music");
ok(fusedResults.some(x=>x.candidates.modelCandidate?.kind==="cough"),
 "Competing event is explicitly identified in candidate evidence");
competing.scores={sneeze:.99,cough:.95,clap:.02,laugh:.02,cry:.02};
fused=audio.create({classifier:competingModel,clock:()=>0});
fusedResults=feed(fused,clapFrames,{start:35000});
ok(!onlyEvents(fusedResults).some(x=>x.kind==="clap"||x.kind==="sneeze"),
 "Conflicting cough/sneeze scores abstain rather than trigger applause");
ok(fusedResults.some(x=>x.candidates.modelCandidate?.kind==="uncertain"),
 "Close probabilities are surfaced as uncertain");
competing.scores={cough:.995,clap:.01,sneeze:.01,laugh:.01,cry:.01};
fused=audio.create({classifier:competingModel,clock:()=>0});
const confirmedCough=feed(fused,Array.from({length:15},()=>sample({
 rms:.18,flat:.25,harmonic:.72,low:35,mid:70,high:20})),{start:38000});
eq(onlyEvents(confirmedCough).filter(x=>x.kind==="cough").length,1,
 "A continuous independently validated cough emits once");
ok(!onlyEvents(confirmedCough).some(x=>x.kind==="clap"||x.kind==="music"),
 "One confirmed cough never emits unrelated classes");

detector.reset();
const aborted=feed(detector,clapFrames.slice(0,20),{start:35000});
const suppressed=detector.process(sample({rms:.5}),{now:36000,suppress:true});
eq(suppressed.events,[],"sleep/class/audio suppression yields zero events");
ok(suppressed.musicConfidence===0,"suppression clears accumulated music evidence");
const resumed=feed(detector,clapFrames.slice(20),{start:36100});
ok(!onlyEvents(resumed).some(x=>x.kind==="clap"),
 "clap evidence cannot survive a recording interruption");
// A browser stall or a manual system-clock correction must not reuse old
// rhythmic/clap/model evidence as if the microphones were uninterrupted.
const stalled=audio.create({clock:()=>0});
const musicBeforeStall=feed(stalled,musicFrames,{start:220000});
ok(musicBeforeStall.some(x=>x.kind==="music"),
 "Control: sustained music produces a music state before the stall");
const afterStall=stalled.process(sample({rms:.002}),{now:230000});
eq(afterStall.musicConfidence,0,
 "A long browser stall clears old rhythmic music evidence");
eq(afterStall.events,[],
 "The first sound after a stall cannot inherit a previous reaction");
const backward=audio.create({clock:()=>0});
feed(backward,musicFrames,{start:420000});
const afterClockRollback=backward.process(sample({rms:.002}),{now:40000});
eq(afterClockRollback.musicConfidence,0,
 "A backward system clock correction resets accumulated evidence");
eq(afterClockRollback.kind,"silence",
 "After a backward correction, fresh silence is processed instead of cached music");
const afterInvalidClock=backward.process(sample({rms:.24}),{now:NaN});
eq(afterInvalidClock.events,[],
 "Invalid acoustic timestamps never emit human events");
eq(afterInvalidClock.kind,"unknown",
 "Invalid timestamps fail closed rather than reporting a stale sound");
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
 eq(events[0].metadata.calibrated,true,
  "Model event carries explicit calibrated origin only after detector contract "+kind);
 ok(events[0].metadata.evidenceFrames>=audio.MODEL_GATE[kind].frames,
  "Model event retains independent temporal evidence count "+kind);
 when+=10000;
}
modelPhase.scores={clap:.995,laugh:.01,cry:.01,cough:.01,sneeze:.01};
detector.reset();
const isolatedClap=feed(detector,Array.from({length:4},()=>sample({rms:.25,
 flat:.8,harmonic:.04,low:24,mid:45,high:75,zcr:.3})),{start:85000});
eq(onlyEvents(isolatedClap).filter(x=>x.kind==="clap").length,1,
  "A calibrated transient model can identify a single applause event");
modelPhase.scores={sneeze:.99,cough:.95,laugh:.02,cry:.02};
detector.reset();
const confusion=feed(detector,Array.from({length:16},()=>sample({rms:.22})),{start:90000});
ok(!onlyEvents(confusion).some(x=>x.kind==="sneeze"||x.kind==="cough"),
 "Similar cough and sneeze likelihood abstains");
modelPhase.scores={sneeze:.995,cough:.01,laugh:.01,cry:.01,clap:.01};
detector.reset();
const sustained=feed(detector,Array.from({length:185},()=>sample({rms:.16,flat:.35})),
  {start:95000});
eq(onlyEvents(sustained).filter(x=>x.kind==="sneeze").length,1,
  "Continuous sneeze-label prediction cannot speak twice, even beyond cooldown");
feed(detector,Array.from({length:5},()=>sample({rms:.16,flat:.35})),
  {start:104300}).forEach(()=>{});
modelPhase.scores={sneeze:.01};
feed(detector,Array.from({length:5},()=>sample({rms:.16,flat:.35})),{start:104600});
modelPhase.scores={sneeze:.995,cough:.01};
const secondEpisode=feed(detector,Array.from({length:5},()=>sample({rms:.16,flat:.35})),
 {start:105000});
eq(onlyEvents(secondEpisode).filter(x=>x.kind==="sneeze").length,1,
 "A separate, model-confirmed sneeze after a gap may be recognized");
detector=audio.create();
for(const bad of [null,undefined,{}, {rms:NaN,flat:Infinity,harmonic:-2},
  {rms:Infinity,flat:-Infinity,high:NaN,zcr:Infinity}]){
 const status=detector.process(bad,{now:110000+checks*50});
 ok(Number.isFinite(status.confidence)&&Number.isFinite(status.noiseFloor),
  "Malformed and disconnected input cannot create NaN state");
}
// Cached predictions must not count as independent consecutive acoustic evidence.
let cachedFrame=1,cachedTime=160000,cachedScores={sneeze:.997,cough:.01};
const cachedModel={calibrated:true,version:"cached-test-v1",
 predict:()=>({frameId:cachedFrame,observedAt:cachedTime,scores:cachedScores})};
detector=audio.create({classifier:cachedModel,clock:()=>0});
const staleFrames=feed(detector,Array.from({length:25},()=>sample({rms:.2,flat:.28,harmonic:.6})),{start:160000});
eq(onlyEvents(staleFrames).filter(x=>x.kind==="sneeze").length,0,
 "One model inference replayed 25 times never becomes a sneeze");
cachedFrame=2;cachedTime=163000;
const fresh1=detector.process(sample({rms:.2,flat:.28}),{now:163000});
eq(fresh1.events.filter(x=>x.kind==="sneeze").length,0,"One fresh frame alone is insufficient");
cachedFrame=3;cachedTime=163500;
const fresh2=detector.process(sample({rms:.2,flat:.28}),{now:163500});
eq(fresh2.events.filter(x=>x.kind==="sneeze").length,0,"Two independent frames still insufficient");
cachedFrame=4;cachedTime=164000;
const fresh3=detector.process(sample({rms:.2,flat:.28}),{now:164000});
eq(fresh3.events.filter(x=>x.kind==="sneeze").length,1,
 "Three independently spaced YAMNet-model observations allow a reaction");
detector.reset();
cachedFrame=6;cachedTime=170000;
const late=feed(detector,Array.from({length:15},()=>sample({rms:.2})),{start:171000});
ok(!onlyEvents(late).length,"An outdated cached prediction cannot trigger an event");
cachedFrame=7;cachedTime=Infinity;
const malformed=detector.process(sample({rms:.25}),{now:172000});
eq(malformed.events.length,0,"Invalid timestamps do not emit events");
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
// Regression: classifier's alternatives must include non-reactive categories.
// A high sneeze score cannot override equally credible voice/noise evidence.
for(const [other,probability] of [["voice",.98],["speech",.98],["noise",.98],
 ["impact",.98],["music",.98],["other",.98],["unknown",.98]]){
 const competingBackground={calibrated:true,version:"non-event-competition-v1",
  predict:()=>({scores:{sneeze:.997,cough:.01,laugh:.01,cry:.01,clap:.01,
   [other]:probability}})};
 const detector=audio.create({classifier:competingBackground,clock:()=>0});
 const results=feed(detector,Array.from({length:16},()=>sample({
  rms:.2,flat:.3,harmonic:.7,low:42,mid:63,high:22
 })),{start:180000});
 ok(!onlyEvents(results).some(event=>event.kind==="sneeze"),
  "Competing "+other+" must block invented sneeze");
}
const nonEventWinner={calibrated:true,version:"background-winner-v1",
 predict:()=>({scores:{noise:.999,sneeze:.10,cough:.03,cry:.02,laugh:.01,clap:.01}})};
const nonEventDetector=audio.create({classifier:nonEventWinner,clock:()=>0});
const backgroundRows=feed(nonEventDetector,Array.from({length:12},()=>sample({
 rms:.15,flat:.92,harmonic:.06
})),{start:181000});
ok(!onlyEvents(backgroundRows).some(event=>["sneeze","cough","laugh","cry","clap"].includes(event.kind)),
 "Background winner never triggers a model-confirmed human event");
// A calibrated non-event winner must veto weaker acoustic clap and music
// heuristics. These were previously able to override background classifications.
for(const alternative of ["impact","noise","voice","speech","other","music"]){
 const model={calibrated:true,version:"background-veto-v1",
  predict:()=>({scores:{[alternative]:.999,clap:.01,sneeze:.01,cough:.01}})};
 const det=audio.create({classifier:model,clock:()=>0});
 const rows=feed(det,clapFrames,{start:183000});
 ok(!onlyEvents(rows).some(event=>event.kind==="clap"),
  "Calibrated "+alternative+" must veto heuristic applause");
}
const noiseMusicModel={calibrated:true,version:"noise-over-music-v1",
 predict:()=>({scores:{noise:.999,music:.01,clap:.01}})};
const noiseMusic=feed(audio.create({classifier:noiseMusicModel}),
 musicFrames,{start:185000});
ok(!noiseMusic.some(row=>row.kind==="music")&&
 !onlyEvents(noiseMusic).some(event=>event.kind==="music"),
 "Calibrated background noise must veto heuristic music and dancing");
const musicMusicModel={calibrated:true,version:"music-music-v1",
 predict:()=>({scores:{music:.999,noise:.01,clap:.01}})};
const confirmedMusic=feed(audio.create({classifier:musicMusicModel}),
 musicFrames,{start:195000});
ok(confirmedMusic.some(row=>row.kind==="music"),
 "A calibrated music alternative must preserve actual rhythmic music");
const unopposedModel={calibrated:true,version:"unopposed-model-v1",
 predict:()=>({scores:{sneeze:.997,noise:.04,voice:.02,cough:.01}})};
const unopposedDetector=audio.create({classifier:unopposedModel,clock:()=>0});
const safeHuman=feed(unopposedDetector,Array.from({length:12},()=>sample({
 rms:.18,flat:.3,harmonic:.5
})),{start:182000});
eq(onlyEvents(safeHuman).filter(event=>event.kind==="sneeze").length,1,
 "A clearly unopposed sneeze remains detectable with calibrated evidence");
// Reaction policy is separate from detection: a plausible event does not
// authorize unprompted speech without calibrated evidence and temporal cooldown.
let now=200000;
const unapproved=reactions.create({clock:()=>now});
for(const kind of ["laugh","cry","cough","sneeze","clap"]){
 const hypothetical={kind,confidence:.99,metadata:{model:"claims-calibrated",
  calibrated:true,evidenceFrames:9}};
 eq(unapproved.decide(hypothetical),null,
  "Default policy must reject unapproved "+kind+" model output");
 eq(unapproved.decide({...hypothetical,metadata:{model:"claims-calibrated",
  evidenceFrames:9}}),null,
  "A model name alone cannot authorize "+kind);
}
const policy=reactions.create({clock:()=>now,humanModelReactionsApproved:true});
eq(policy.decide({kind:"clap",confidence:.68}),null,"Low-confidence claps do nothing");
eq(policy.decide({kind:"clap",confidence:1}),null,
 "Clap confidence without repeated-burst or model provenance is insufficient");
eq(policy.decide({kind:"impact",confidence:.98}),null,"Impact never triggers applause");
eq(policy.decide({kind:"sneeze",confidence:1}),null,"Unproven sneeze never triggers speech");
eq(policy.decide({kind:"laugh",confidence:1}),null,"Unproven laugh never changes mood");
eq(policy.decide({kind:"cry",confidence:.995,metadata:{model:"calibrated"}},
  {suppressed:true}),null,"Class-mode suppression prevents concern");
const sneezeEvent={kind:"sneeze",confidence:.98,
 metadata:{model:"mock-calibrated",calibrated:true,evidenceFrames:3}};
eq(policy.decide({kind:"sneeze",confidence:.98,
 metadata:{model:"mock-calibrated",evidenceFrames:3}}),null,
 "Explicit approval cannot replace calibrated evidence");
eq(policy.decide({kind:"sneeze",confidence:.98,
 metadata:{model:"mock-calibrated",calibrated:true,evidenceFrames:1}}),null,
 "One model frame cannot authorize a sneeze");
eq(policy.decide(sneezeEvent)?.action,"bless","Verified sneeze receives one localized blessing");
now+=500;
eq(policy.decide(sneezeEvent),null,"Sneeze cooldown suppresses duplicate");
eq(policy.decide({kind:"cough",confidence:.99,
 metadata:{model:"mock-calibrated",calibrated:true,evidenceFrames:3}}),null,
 "One sneeze/cough episode must not produce two different reactions");
now+=5200;
eq(policy.decide(sneezeEvent)?.action,"bless","New sneeze after cooldown may react");
const verifiedClap={kind:"clap",confidence:.9,
 metadata:{origin:"acoustic-heuristic",bursts:5}};
eq(policy.decide(verifiedClap)?.action,"clap","Confirmed applause gets animation");
eq(policy.decide({...verifiedClap,confidence:.95}),null,"Repeated claps do not spam animation");
eq(reactions.create({humanModelReactionsApproved:true}).decide({kind:"clap",confidence:.99,
 metadata:{model:"test-calibrated",calibrated:true,evidenceFrames:2}})?.action,"clap",
 "Two independent calibrated model frames can verify a clap");
eq(reactions.create().decide({kind:"clap",confidence:1,
 metadata:{origin:"acoustic-heuristic",bursts:1}}),null,
 "One impact cannot be promoted to applause");
now+=1750;
eq(policy.decide({kind:"laugh",confidence:.93,
 metadata:{model:"calibrated",calibrated:true,evidenceFrames:7}})?.action,
  "smile","Calibrated laughter yields a temporary smile");
now+=1750;
eq(policy.decide({kind:"cry",confidence:.94,
 metadata:{model:"calibrated",calibrated:true,evidenceFrames:12}})?.action,
  "comfort","Calibrated crying yields a restrained comfort response");
now+=1750;
eq(policy.decide({kind:"cough",confidence:.96,
 metadata:{model:"calibrated",calibrated:true,evidenceFrames:3}})?.action,
  "notice","Calibrated cough prompts attention without unsolicited speech");
eq(unapproved.decide(verifiedClap)?.action,"clap",
 "Explicitly locked human model reactions still allow legitimate acoustic applause");
eq(policy.decide({kind:"sneeze",confidence:1.5,metadata:sneezeEvent.metadata}),null,
 "Impossible model probabilities never authorize reactions");
eq(policy.decide({kind:"sneeze",confidence:.99,metadata:sneezeEvent.metadata},
 {now:NaN}),null,"Invalid clock time never authorizes speech");
eq(policy.decide({kind:"music",confidence:1}),null,
  "Music is controlled by continuous rhythm state rather than event spam");
// Dance is a natural reaction with its own stability, false-positive,
// interruption and cooldown-independent policy, not an immediate detector
// side effect.
let danceAt=300000;
const dancePolicy=reactions.create({clock:()=>danceAt});
const stableMusic={kind:"music",musicConfidence:.94};
for(let i=0;i<5;i++,danceAt+=60)
 eq(dancePolicy.updateMusic(stableMusic),false,"Do not start dancing on short music fragments");
eq(dancePolicy.updateMusic(stableMusic),false,"Duration matters, not only frame count");
danceAt+=65;
eq(dancePolicy.updateMusic(stableMusic),true,"Sustained classified music starts dance");
danceAt+=60;
eq(dancePolicy.updateMusic(stableMusic),true,"Continuous music keeps movement");
danceAt+=60;
eq(dancePolicy.updateMusic({kind:"noise",musicConfidence:.96}),false,
 "Strong periodic noise classification immediately stops the dance");
danceAt+=55;
eq(dancePolicy.updateMusic(stableMusic),false,"Stale rhythm may not restart dancing");
dancePolicy.reset();
for(let i=0;i<9;i++,danceAt+=70)dancePolicy.updateMusic(stableMusic);
eq(dancePolicy.updateMusic(stableMusic,{suppressed:true}),false,
 "Class/sleep/self-voice suppression immediately stops dancing");
eq(dancePolicy.updateMusic(stableMusic,{now:danceAt+30}),false,
 "Music evidence must restart after interruption");
danceAt+=1800;
eq(dancePolicy.updateMusic(stableMusic),false,"Long audio gap invalidates dance evidence");
console.log("Robotito acoustic event regression:",checks,"assertions; seed:",seed);
