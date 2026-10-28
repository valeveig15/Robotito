"use strict";
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const assert=require("node:assert/strict");
let Klass=null;
const transfers=[];
class ProcessorBase{
 constructor(){this.port={postMessage:(message,transfer)=>transfers.push({message,transfer})};}
}
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"..","audio-capture-worklet.js"),"utf8"),{
 AudioWorkletProcessor:ProcessorBase,Float32Array,sampleRate:48000,
 registerProcessor:(name,type)=>{assert.equal(name,"robotito-audio-capture");Klass=type;}
});
assert.equal(typeof Klass,"function","Audio capture processor registered");
const capture=new Klass();
// Default-deny: mic samples cannot leave the render thread before opt-in.
for(let i=0;i<32;i++)capture.process([[new Float32Array(128).fill(.8)]]);
assert.equal(transfers.length,0,"No PCM transferred before explicit capture permission");
capture.port.onmessage({data:{type:"capture",enabled:true}});
for(let i=0;i<32;i++){
 const frame=new Float32Array(128).fill(i/32);
 assert.equal(capture.process([[frame]]),true,"Processor remains active");
}
assert.equal(transfers.length,2,"Exactly two nonoverlapping output frames");
assert.equal(transfers[0].message.sampleRate,48000,"Real source rate preserved");
assert.equal(transfers[0].message.samples.length,2048,"Each audio window has 2048 samples");
assert.equal(transfers[0].message.samples[127],0,"End of first input block");
assert.equal(transfers[0].message.samples[128],1/32,"Next input block is contiguous");
assert.equal(transfers[1].message.samples[0],16/32,"Second window does not repeat the first");
assert.equal(transfers[0].transfer[0],transfers[0].message.samples.buffer,
 "Audio buffer is transferred without a second copy");
for(let i=0;i<8;i++)capture.process([[new Float32Array(128).fill(.9)]]);
capture.port.onmessage({data:{type:"capture",enabled:false}});
for(let i=0;i<32;i++)capture.process([[new Float32Array(128).fill(.9)]]);
assert.equal(transfers.length,2,"Paused microphone emits no audio packets");
capture.port.onmessage({data:{type:"capture",enabled:true}});
for(let i=0;i<16;i++)capture.process([[new Float32Array(128).fill(.2)]]);
assert.equal(transfers.length,3,"Explicit resume restarts a full PCM packet");
assert.equal(transfers[2].message.samples[0],Math.fround(.2),
 "Partial audio before suppression is not mixed with new session");
console.log("Robotito contiguous and privacy-gated AudioWorklet regression passed");
