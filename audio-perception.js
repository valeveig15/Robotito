// Robotito audio events: temporal evidence -> classified event -> confidence -> reaction.
// Acoustic heuristics cover silence/voice/music/impact and cautious clap candidates.
// Laughter, crying, coughs and sneezes require an optionally supplied calibrated model:
// raw amplitude, rhythm or ASR text must NEVER be treated as proof of those classes.
(function(root){
"use strict";
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const avg=(rows,key)=>rows.length?rows.reduce((s,x)=>s+(Number(x[key])||0),0)/rows.length:0;
const variance=(rows,key)=>rows.length>1?rows.reduce((s,x)=>s+(x[key]-avg(rows,key))**2,0)/rows.length:0;
const ACOUSTIC_EVENTS=Object.freeze(["voice","music","clap","impact","laugh","cry","cough","sneeze","silence","noise","unknown"]);
const MODEL_EVENTS=Object.freeze(["laugh","cry","cough","sneeze"]);
const MODEL_GATE={
 laugh:{threshold:.89,margin:.14,frames:7,minDuration:330,maxDuration:7000,cooldown:6500},
 cry:{threshold:.91,margin:.15,frames:12,minDuration:560,maxDuration:15000,cooldown:12000},
 cough:{threshold:.94,margin:.18,frames:3,minDuration:95,maxDuration:1900,cooldown:5000},
 sneeze:{threshold:.96,margin:.20,frames:3,minDuration:95,maxDuration:1700,cooldown:5000}
};
function rhythmic(rows){
 if(rows.length<32)return 0;
 const values=rows.map(x=>x.rms),mean=values.reduce((a,b)=>a+b,0)/values.length;
 const denom=values.reduce((a,x)=>a+(x-mean)**2,0);
 if(denom<1e-5)return 0;
 let best=0;
 for(let lag=8;lag<=Math.min(55,Math.floor(values.length/2));lag++){
  let numerator=0;
  for(let i=lag;i<values.length;i++)numerator+=(values[i]-mean)*(values[i-lag]-mean);
  best=Math.max(best,numerator/denom);
 }
 return clamp(best*2);
}
function featureFrame(feature,at){
 const numeric=(key,max=Infinity)=>Math.max(0,Math.min(max,Number(feature?.[key])||0));
 return {rms:numeric("rms"),flat:numeric("flat",1),centroid:numeric("centroid",1),
  harmonic:numeric("harmonic",1),low:numeric("low"),mid:numeric("mid"),
  high:numeric("high"),zcr:numeric("zcr",1),t:at};
}
function create({onEvent=()=>{},clock=()=>Date.now(),classifier=null}={}){
 let frames=[],lastFrame=0,lastEvent=Object.create(null),transients=[],onset=null;
 let musicEvidence=0,lastKind="silence",noiseFloor=.008,modelEvidence=Object.create(null);
 const modelAvailable=classifier?.calibrated===true
  &&typeof classifier?.version==="string"&&classifier.version.trim().length>0
  &&typeof classifier.predict==="function";
 const COOLDOWN={clap:1900,music:4500,impact:600};
 for(const [name,gate] of Object.entries(MODEL_GATE))COOLDOWN[name]=gate.cooldown;
 function emit(kind,confidence,at,metadata={}){
  if(!ACOUSTIC_EVENTS.includes(kind)||confidence<=0||at-(lastEvent[kind]??-Infinity)<(COOLDOWN[kind]||1000))
   return null;
  lastEvent[kind]=at;
  const event={kind,confidence:clamp(confidence),at,metadata};
  try{onEvent(event);}catch(error){console.warn("Audio event callback",error);}
  return event;
 }
 function clearEvidence(){
  frames=[];transients=[];onset=null;musicEvidence=0;modelEvidence=Object.create(null);
  lastKind="unknown";lastFrame=0;
 }
 function classifierEvents(feature,at,active){
  if(!modelAvailable||!active)return [];
  // This is a synchronous, local, separately calibrated classifier contract.
  // An asynchronous model is expected to cache its most recent prediction.
  let scores;
  try{scores=classifier.predict(feature,{noiseFloor,history:frames.slice(-28)})}
  catch(error){console.warn("Audio model inference",error);return [];}
  if(!scores||typeof scores!=="object"||typeof scores.then==="function")return [];
  const values=Object.fromEntries(MODEL_EVENTS.map(kind=>[kind,clamp(Number(scores[kind]))]));
  const ranked=MODEL_EVENTS.map(kind=>({kind,score:values[kind]})).sort((a,b)=>b.score-a.score);
  const best=ranked[0],runnerUp=ranked[1]?.score||0,events=[];
  for(const kind of MODEL_EVENTS){
   const gate=MODEL_GATE[kind],valid=best.kind===kind&&best.score>=gate.threshold
    &&best.score-runnerUp>=gate.margin;
   let evidence=modelEvidence[kind];
   if(!valid){modelEvidence[kind]=null;continue;}
   if(!evidence||at-evidence.lastAt>140){evidence={since:at,count:0,score:0,lastAt:at};}
   evidence.count++;evidence.lastAt=at;evidence.score+=values[kind];
   modelEvidence[kind]=evidence;
   const duration=at-evidence.since+45;
   if(evidence.count>=gate.frames&&duration>=gate.minDuration&&duration<=gate.maxDuration){
    const confidence=evidence.score/evidence.count;
    const event=emit(kind,confidence,at,{model:classifier.version,evidenceFrames:evidence.count});
    if(event)events.push(event);
    modelEvidence[kind]=null;
   }
  }
  return events;
 }
 function process(feature,{now=clock(),suppress=false}={}){
  if(suppress){clearEvidence();return {kind:"unknown",confidence:0,musicConfidence:0,noiseFloor,events:[],candidates:{}};}
  const f=featureFrame(feature,now);
  if(lastFrame&&now-lastFrame<38)return {kind:lastKind,confidence:lastKind==="music"?musicEvidence:.3,
   musicConfidence:musicEvidence,noiseFloor,events:[],candidates:{}};
  lastFrame=now;
  if(f.rms<noiseFloor*1.7)noiseFloor=.96*noiseFloor+.04*f.rms;
  else noiseFloor=.999*noiseFloor+.001*f.rms;
  noiseFloor=Math.max(.004,Math.min(.09,noiseFloor));
  frames.push(f);frames=frames.filter(x=>now-x.t<4500).slice(-110);
  const recent=frames.filter(x=>now-x.t<3500);
  const active=recent.filter(x=>x.rms>noiseFloor*2.3+.004);
  const level=active.length/Math.max(1,recent.length);
  const rhythm=rhythmic(recent),harmonic=avg(active,"harmonic"),flat=avg(active,"flat");
  const dynamic=variance(active,"rms")/Math.max(1e-5,avg(active,"rms")**2);
  const voiceLike=harmonic>.34&&flat<.62&&rhythm<.38;
  const musicScore=clamp(.24*level+.32*rhythm+.34*harmonic+.10*(1-flat)
    -.22*(voiceLike?1:0)-.20*(dynamic<.008&&rhythm<.65?1:0));
  const musicReady=recent.length>=55&&recent.at(-1).t-recent[0].t>=2400;
  musicEvidence=musicReady?.84*musicEvidence+.16*musicScore:0;
  const voiceRecent=recent.slice(-13).filter(x=>x.rms>noiseFloor*2.5+.006
    &&x.harmonic>.30&&x.flat<.67);
  const voiceScore=clamp(voiceRecent.length/10*.65+Math.min(.25,harmonic*.30)
    -(rhythm>.58?.28:0)-(flat>.68?.25:0));
  const loud=f.rms>noiseFloor*2.3+.006;
  let kind="unknown",confidence=.22;
  if(!loud){kind="silence";confidence=.9;}
  else if(musicReady&&musicEvidence>.72&&rhythm>.4&&harmonic>.38){kind="music";confidence=musicEvidence;}
  else if(voiceRecent.length>=8&&voiceScore>=.67){kind="voice";confidence=voiceScore;}
  else if(flat>.68||harmonic<.2){kind="noise";confidence=.65;}
  const events=[];
  if(kind==="music"){const event=emit("music",confidence,now);if(event)events.push(event);}
  // Broadband onsets are possible claps or impacts. A solitary loud sound
  // never becomes applause. Prefer "impact/unknown" over an invented clap.
  const prev=frames.at(-2);
  const onsetCandidate=prev&&f.rms>Math.max(.08,prev.rms*2.65,noiseFloor*6)
    &&f.flat>.38&&f.zcr>.08;
  if(onsetCandidate&&(!onset||now-onset.at>100))
   onset={at:now,peak:f.rms,flat:f.flat,highRatio:f.high/(f.low+1),harmonic:f.harmonic};
  if(onset&&now-onset.at>=65&&now-onset.at<=300&&f.rms<onset.peak*.46){
   const candidate=onset;onset=null;
   const sharp=candidate.highRatio>1.48&&candidate.flat>.48&&candidate.harmonic<.35;
   transients.push({...candidate,sharp});
   transients=transients.filter(x=>now-x.at<2000).slice(-12);
   if(!sharp){
    kind=kind==="music"?"music":"impact";confidence=clamp(.52+candidate.peak*.5);
    const event=emit("impact",confidence,now,{broadband:false});
    if(event)events.push(event);
   }
  }
  if(onset&&now-onset.at>330)onset=null;
  transients=transients.filter(x=>now-x.at<2000);
  const sharp=transients.filter(x=>x.sharp);
  if(sharp.length>=4&&kind!=="music"){
   const hits=sharp.slice(-5),gaps=hits.slice(1).map((x,i)=>x.at-hits[i].at);
   const regular=gaps.every(n=>n>=90&&n<=650);
   const span=hits.at(-1).at-hits[0].at;
   const sharpness=avg(hits,"highRatio"),flatness=avg(hits,"flat");
   const confidence=clamp(.60+(sharp.length>=5?.10:0)+
    .1*Math.min(1,(sharpness-1.48)/.5)+.12*Math.min(1,(flatness-.48)/.25));
   if(regular&&span>=350&&confidence>=.77){
    const event=emit("clap",confidence,now,{bursts:hits.length,origin:"acoustic-heuristic"});
    if(event){events.push(event);kind="clap";confidence=event.confidence;}
    transients=[];
   }
  }
  const validated=classifierEvents(f,now,loud);
  for(const event of validated){events.push(event);kind=event.kind;confidence=event.confidence;}
  lastKind=kind;
  return {kind,confidence,musicConfidence:musicEvidence,noiseFloor,events,
   candidates:{voice:voiceScore,music:musicEvidence,impact:transients.length,
    modelAvailable}};
 }
 function reset(){clearEvidence();lastEvent=Object.create(null);lastKind="silence";}
 return {process,reset,getStatus:()=>({musicEvidence,noiseFloor,lastKind,modelAvailable})};
}
root.ROBOTITO_AUDIO_PERCEPTION={create,rhythmic,ACOUSTIC_EVENTS,MODEL_EVENTS,MODEL_GATE};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_AUDIO_PERCEPTION;
})(typeof window!=="undefined"?window:globalThis);
