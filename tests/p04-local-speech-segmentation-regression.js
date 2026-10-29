"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"..","speech-fallback.js"),"utf8");
const begin=src.indexOf("processor.onaudioprocess=e=>{");
const terminator="\n    };\n\n    await modelReady;";
const end=src.indexOf(terminator,begin);
assert.ok(begin>=0&&end>begin,"Production mobile ASR microphone callback exists");
const callback=src.slice(begin,end+"\n    };".length);
let checks=0;
function eq(actual,expected,why){assert.deepEqual(actual,expected,why);checks++;}
function create(){
 let clock=0;
 const context=new Function("rmsOf","performance","Date",
 "let active=true,paused=false,noiseFloor=.0075,speaking=false,segment=[],preRoll=[],\n"+
 "segmentStart=0,segmentStartEpoch=0,lastVoiceAt=0,voiceFrames=0;\n"+
 "const ac={sampleRate:48000},processor={};\n"+
 "const finalize=()=>{};\n"+
 callback+"\n"+
 "return {accept(input){processor.onaudioprocess({inputBuffer:{getChannelData(){return input;}}});},\n"+
 "snapshot(){return {segment:segment.map(chunk=>chunk[0]),preRoll:preRoll.map(chunk=>chunk[0]),\n"+
 "voiceFrames,segmentStartEpoch,speaking};}};"
 )(
 data=>Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/Math.max(1,data.length)),
 {now:()=>clock},{now:()=>100000});
 return {feed(level,ms){clock=ms;context.accept(new Float32Array(4096).fill(level));},
 snapshot:context.snapshot};
}
const r=create();
r.feed(0,0);r.feed(0,100);r.feed(0,200);
eq(r.snapshot().preRoll.length,3,"Silence builds three pre-roll frames");
r.feed(.075,300);
eq(r.snapshot().segment.length,4,"First voice frame is appended once, not twice");
eq(r.snapshot().segment.slice(0,3),[0,0,0],"Pre-roll frames remain untouched");
eq(r.snapshot().segment[3],Math.fround(.075),"First voiced frame is the only new frame");
eq(r.snapshot().voiceFrames,1,"One voice frame counted for first speech window");
eq(r.snapshot().preRoll.length,0,"Pre-roll is consumed on speech start");
assert.ok(Math.abs(r.snapshot().segmentStartEpoch-(100000-4*4096/48000*1000))<1,
 "Speech metadata covers pre-roll and exactly one first voiced frame");checks++;
r.feed(.075,400);
eq(r.snapshot().segment.length,5,"Second voiced frame extends segment once");
eq(r.snapshot().voiceFrames,2,"Two voiced frames counted");
const r2=create();
r2.feed(.09,0);
eq(r2.snapshot().segment.length,1,"Immediate speech without pre-roll is not duplicated");
eq(r2.snapshot().preRoll.length,0,"Immediate speech does not create phantom pre-roll");
console.log("P04 local speech frame segmentation:",checks,"checks");
