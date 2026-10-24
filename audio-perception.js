// Temporal acoustic-event detection from WebAudio features.
// Conservative detector: ambiguous one-off sounds remain "unknown"; it is not
// an ML sound-event classifier or a biometric identifier.
(function(root){
"use strict";
function clamp(x){return Math.max(0,Math.min(1,x));}
function average(a,key){return a.length?a.reduce((s,x)=>s+Number(x[key]||0),0)/a.length:0;}
function variance(a,key){if(a.length<2)return 0;const m=average(a,key);return a.reduce((s,x)=>s+(Number(x[key]||0)-m)**2,0)/a.length;}
function rhythmic(frames){
 if(frames.length<32)return 0;
 const vals=frames.map(x=>x.rms),mean=vals.reduce((a,b)=>a+b,0)/vals.length;
 const den=vals.reduce((s,x)=>s+(x-mean)**2,0);
 if(den<1e-5)return 0;
 let best=0;
 for(let lag=8;lag<=Math.min(55,Math.floor(vals.length/2));lag++){
  let num=0;for(let i=lag;i<vals.length;i++)num+=(vals[i]-mean)*(vals[i-lag]-mean);
  best=Math.max(best,num/den);
 }
 return clamp(best*2);
}
function create({onEvent=()=>{},clock=()=>Date.now()}={}){
 let frames=[],lastFrame=0,lastEvent={},transients=[],onsetAt=0;
 let musicEvidence=0,lastKind="silence",noiseFloor=.008,transientPeak=0;
 const COOLDOWN={clap:1700,sneeze:4500,music:4500};
 function emit(kind,confidence,at,metadata={}){
  if(at-(lastEvent[kind]||-Infinity)<COOLDOWN[kind])return null;
  lastEvent[kind]=at;
  const event={kind,confidence,at,metadata};
  try{onEvent(event);}catch(err){console.warn("Audio event callback",err);}
  return event;
 }
 function process(feature,{now=clock(),suppress=false}={}){
  const f={rms:Math.max(0,Number(feature.rms)||0),flat:clamp(Number(feature.flat)||0),
   centroid:clamp(Number(feature.centroid)||0),harmonic:clamp(Number(feature.harmonic)||0),
   low:Math.max(0,Number(feature.low)||0),mid:Math.max(0,Number(feature.mid)||0),
   high:Math.max(0,Number(feature.high)||0),zcr:clamp(Number(feature.zcr)||0),t:now};
  if(suppress){frames=[];transients=[];musicEvidence=0;return {kind:"unknown",confidence:0,events:[]};}
  if(now-lastFrame<38)return {kind:lastKind,confidence:musicEvidence,events:[]};
  lastFrame=now;
  if(f.rms<noiseFloor*1.7)noiseFloor=.96*noiseFloor+.04*f.rms;
  else noiseFloor=.999*noiseFloor+.001*f.rms;
  noiseFloor=Math.max(.004,Math.min(.09,noiseFloor));
  frames.push(f);frames=frames.filter(x=>now-x.t<4500).slice(-110);
  const recent=frames.filter(x=>now-x.t<3500),active=recent.filter(x=>x.rms>noiseFloor*2.3+.004);
  const level=active.length/Math.max(1,recent.length);
  const rhythm=rhythmic(recent);
  const harmonic=average(active,"harmonic");
  const flat=average(active,"flat");
  const voiceLike=harmonic>.34&&flat<.62&&rhythm<.38;
  const dynamic=variance(active,"rms")/Math.max(1e-5,average(active,"rms")**2);
  // A combination of persistence, tonality and repetition is required.
  const musicScore=clamp(.24*level+.32*rhythm+.34*harmonic+.10*(1-flat)
    -.22*(voiceLike?1:0)-.20*(dynamic<.008?1:0));
  const required=recent.length>=55&&recent.at(-1).t-recent[0].t>=2400;
  musicEvidence=required?(.84*musicEvidence+.16*musicScore):0;
  const events=[];
  if(required&&musicEvidence>.72&&rhythm>.4&&harmonic>.38){
   lastKind="music";
   const event=emit("music",musicEvidence,now);
   if(event)events.push(event);
  }else if(f.rms<noiseFloor*1.4+.003){lastKind="silence";}
  else if(flat>.68||harmonic<.2){lastKind="noise";}
  else lastKind="unknown";
  // Transient event candidate: multiple broadband bursts with fast attack and decay.
  const prev=frames.at(-2),rising=prev&&f.rms>Math.max(.08,prev.rms*2.65,noiseFloor*6)
    &&f.high>f.low*1.45&&f.flat>.42&&f.zcr>.08;
  if(rising&&now-onsetAt>110){onsetAt=now;transientPeak=f.rms;}
  if(onsetAt&&now-onsetAt>60&&now-onsetAt<280&&f.rms<transientPeak*.48){
   transients.push({at:onsetAt,peak:transientPeak,flat:f.flat});
   onsetAt=0;transientPeak=0;
  }
  transients=transients.filter(x=>now-x.at<2000);
  if(transients.length>=3){
   const gaps=transients.slice(1).map((x,i)=>x.at-transients[i].at);
   const regular=gaps.every(x=>x>=90&&x<=650);
   const avgPeak=transients.reduce((s,x)=>s+x.peak,0)/transients.length;
   const confidence=clamp(.66+(regular?.20:0)+(avgPeak>.18?.11:0));
   if(regular&&confidence>=.85){
    const event=emit("clap",confidence,now,{bursts:transients.length});
    if(event)events.push(event);transients=[];
   }
  }
  // Coughs and sneezes are acoustically similar. Without a trained
  // classifier, do not fabricate certainty or react with "bless you".
  return {kind:lastKind,confidence:lastKind==="music"?musicEvidence:lastKind==="noise"?.65:.2,
   musicConfidence:musicEvidence,noiseFloor,events};
 }
 function reset(){frames=[];transients=[];musicEvidence=0;lastKind="silence";lastFrame=0;}
 return {process,reset,getStatus:()=>({musicEvidence,noiseFloor,lastKind})};
}
root.ROBOTITO_AUDIO_PERCEPTION={create,rhythmic};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_AUDIO_PERCEPTION;
})(typeof window!=="undefined"?window:globalThis);