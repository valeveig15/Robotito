"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","class-audio.js"),"utf8");
const from=source.indexOf("  async function start("),to=source.indexOf("  function isRecording()",from);
assert.ok(from>=0&&to>from);
const cycle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
let checks=0;
const eq=(a,b,why)=>{assert.deepEqual(a,b,why);checks++;};
function fixture(){
 const clones=[],permissions=[],storage=[];
 const track={readyState:"live",clone(){const t={readyState:"live",stop(){this.readyState="ended";}};clones.push(t);return t;}};
 const state={started:true,captureEpoch:1,captureRevision:1,stream:{getAudioTracks:()=>[track]}};
 class Recorder{
  constructor(){this.state="inactive";this.mimeType="audio/webm";}
  start(){this.state="recording";}stop(){this.state="inactive";queueMicrotask(()=>this.onstop?.());}
 }
 const runtime=new Function("state","window","document","navigator","MediaStream","MediaRecorder","crypto",
  "pickMimeType","render","setLiveStatus","putChunk","chunksFor","saveRecording","clearChunks",
  "let active=null,captureRequest=0;\n"+source.slice(from,to)+"\nreturn {start,stop};")(
  state,{MediaRecorder:Recorder},{hidden:false},{storage:{persist:()=>new Promise(resolve=>permissions.push(resolve))}},
  class{constructor(tracks){this.getTracks=()=>tracks;}},Recorder,{randomUUID:()=>"test-class"},()=>"audio/webm",
  async()=>{},()=>{},async()=>{},()=>new Promise(resolve=>storage.push(resolve)),async()=>{},async()=>{});
 return {runtime,state,clones,permissions,storage};
}
(async()=>{
 const canceled=fixture(),pending=canceled.runtime.start("Physics");
 await canceled.runtime.stop();canceled.permissions[0]();
 eq((await pending).reason,"capture-canceled","Stopping invalidates a class recording waiting on storage permission");
 eq(canceled.clones.length,0,"Canceled pending start does not clone microphone tracks");
 const active=fixture(),start=active.runtime.start("Physics");active.permissions[0]();
 eq((await start).ok,true,"Consented current capture can record");
 const saving=active.runtime.stop();
 eq(active.clones.every(t=>t.readyState==="ended"),true,"Microphone clones stop synchronously before storage finishes");
 await cycle();
 // The recorder has stopped; the existing 80 ms chunk flush is allowed to finish.
 while(!active.storage.length)await new Promise(resolve=>setTimeout(resolve,10));
 active.storage[0]([{blob:new Blob(["test"],{type:"audio/webm"})}]);
 const saved=await saving;
 eq(saved.subject,"Physics","Recorded bytes remain saveable after closing the microphone");
 console.log("P04 class-audio cancellation:",checks,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
