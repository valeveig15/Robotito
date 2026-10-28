"use strict";
const assert=require("node:assert/strict");
const {create}=require("../audio-script-fallback.js");
let now=1000,allowed=false,cleared=0;
const delivered=[],processors=[],sources=[],gains=[];
const context={
 sampleRate:48000,destination:{name:"speakers"},
 createScriptProcessor(size,input,output){
  assert.deepEqual([size,input,output],[2048,1,1],
   "Legacy fallback must request complete nonoverlapping PCM buffers");
  const processor={onaudioprocess:null,connections:[],
   connect(x){this.connections.push(x);},
   disconnect(){this.disconnected=true;}};
  processors.push(processor);return processor;
 },
 createGain(){
  const gain={gain:{value:1},connections:[],
   connect(x){this.connections.push(x);},
   disconnect(){this.disconnected=true;}};
  gains.push(gain);return gain;
 }
};
const source={
 connect(node){sources.push(node);},
 disconnect(node){assert.ok(sources.includes(node),"Must detach the original source edge");}
};
const capture=create({context,source,isAllowed:()=>allowed,
 forward:(samples,rate)=>delivered.push({sample:samples[0],rate}),
 reset:()=>{cleared++;},
 clock:()=>now});
function emit(v){
 const processor=processors.at(-1);
 processor.onaudioprocess?.({inputBuffer:{getChannelData:()=>new Float32Array(2048).fill(v)}});
}
assert.equal(capture.isActive(),false,"No fallback node before opt-in");
assert.equal(capture.start(),true,"ScriptProcessor fallback available");
assert.equal(capture.start(),true,"Repeated enable must be idempotent");
assert.equal(processors.length,1,"Only one capture node is connected");
assert.equal(gains[0].gain.value,0,"Microphone capture cannot loop to speakers");
emit(.3);
assert.equal(delivered.length,0,"Audio is default-denied without an active permission gate");
allowed=true;
emit(.2);now+=44;emit(.4);now+=44;emit(.6);
assert.deepEqual(delivered.map(x=>x.sample),
 [Math.fround(.2),Math.fround(.4),Math.fround(.6)],
 "Consecutive ScriptProcessor callbacks pass distinct complete buffers once");
assert.ok(delivered.every(x=>x.rate===48000),"Source sample rate preserved");
allowed=false;
emit(.8);
assert.equal(cleared,1,"Entering class/sleep/own speech clears earlier PCM");
assert.equal(delivered.length,3,"Suppression blocks every new input buffer");
allowed=true;now+=44;emit(.1);
assert.equal(delivered.length,4,"New permission accepts fresh audio");
now+=650;emit(.9);
assert.equal(delivered.length,4,"Long main-thread stall discards first stale callback");
assert.equal(cleared,2,"Long stall clears prior partial YAMNet evidence");
now+=44;emit(.5);
assert.equal(delivered.length,5,"Following fresh buffer is accepted");
now-=140;emit(.7);
assert.equal(delivered.length,5,"Clock rewind discards potentially repeated audio");
assert.equal(cleared,3,"Clock rewind clears partial old input");
now+=44;emit(.35);
assert.equal(delivered.length,6,"Clock recovery collects new sequential PCM");
const previous=processors[0];
capture.stop();
assert.equal(capture.isActive(),false,"Opt-out tears down capture");
assert.equal(previous.onaudioprocess,null,"No callback remains after opt-out");
assert.equal(previous.disconnected,true,"Capture processor edge disconnected");
assert.equal(gains[0].disconnected,true,"Muted output edge disconnected");
assert.equal(cleared,4,"Opt-out erases queued PCM");
capture.stop();
assert.equal(delivered.length,6,"Repeated stop never leaks samples");
capture.start();
assert.equal(processors.length,2,"Re-opt-in creates a fresh processor");
now+=44;emit(.15);
assert.equal(delivered.length,7,"Fresh consent does not reuse previous recording");
capture.stop();
const unsupported=create({
 context:{sampleRate:48000},source,isAllowed:()=>true,
 forward:()=>{throw Error("Must not forward unsupported capture");},reset:()=>{}
});
assert.equal(unsupported.start(),false,"Missing browser PCM API must fail closed");
assert.equal(unsupported.isActive(),false,"Never simulate PCM by analyzer polling");
console.log("Robotito legacy PCM privacy and contiguous-frame regression passed");
