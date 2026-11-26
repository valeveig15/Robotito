"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","class-audio.js"),"utf8");
const from=source.indexOf("  async function start("),to=source.indexOf("  function isRecording()",from);
assert.ok(from>=0&&to>from);
const cycle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
let checks=0;
const eq=(a,b,why)=>{assert.deepEqual(a,b,why);checks++;};
function fixture({delayBegin=false}={}){
 const clones=[],permissions=[],storage=[],initialization=[];let started=false;
 const track={readyState:"live",clone(){const t={readyState:"live",stop(){this.readyState="ended";}};clones.push(t);return t;}};
 const state={started:true,captureEpoch:1,captureRevision:1,stream:{getAudioTracks:()=>[track]}};
 class Recorder{
  constructor(){this.state="inactive";this.mimeType="audio/webm";}
  start(){started=true;this.state="recording";}stop(){this.state="inactive";queueMicrotask(()=>this.onstop?.());}
 }
 let metadata;
 const journal={begin:async value=>{metadata=value;if(delayBegin)await new Promise(resolve=>initialization.push(resolve));},list:async()=>[{id:"test-class",chunkCount:started?1:0}],seal:async()=>{},discard:async()=>{},
  finish:()=>new Promise(resolve=>storage.push(()=>resolve({...metadata,blob:new Blob(["test"])}))),touch:async()=>{}};
 const runtime=new Function("state","window","document","navigator","MediaStream","MediaRecorder","crypto",
  "pickMimeType","render","setLiveStatus","endPlayback",
  "let active=null,captureRequest=0;\n"+source.slice(from,to)+"\nreturn {start,stop};")(
  state,{MediaRecorder:Recorder,ROBOTITO_CLASS_JOURNAL:journal},{hidden:false,querySelectorAll:()=>[]},{storage:{persist:()=>new Promise(resolve=>permissions.push(resolve))}},
  class{constructor(tracks){this.getTracks=()=>tracks;}},Recorder,{randomUUID:()=>"test-class"},()=>"audio/webm",
  async()=>{},()=>{},()=>{});
 return {runtime,state,clones,permissions,storage,initialization};
}
(async()=>{
 const canceled=fixture({delayBegin:true}),pending=canceled.runtime.start("Physics");
 const stopped=canceled.runtime.stop();
 eq(canceled.clones.every(t=>t.readyState==="ended"),true,"Cancellation closes clones while journal initialization is pending");
 canceled.initialization[0]();await stopped;
 eq((await pending).reason,"capture-canceled","Stopping invalidates a class recording waiting on its journal");
 canceled.permissions[0](true);await cycle();
 eq(canceled.clones.every(t=>t.readyState==="ended"),true,"Late persistent-storage consent cannot restart a canceled recording");
 const active=fixture(),start=active.runtime.start("Physics");
 eq((await start).ok,true,"A pending optional persistence permission cannot prevent recording");
 active.permissions[0](false);await cycle();
 const saving=active.runtime.stop();
 eq(active.clones.every(t=>t.readyState==="ended"),true,"Microphone clones stop synchronously before storage finishes");
 await cycle();
 // The recorder has stopped; assembly may wait on storage without retaining a microphone.
 while(!active.storage.length)await new Promise(resolve=>setTimeout(resolve,10));
 active.storage[0]();
 const saved=await saving;
 eq(saved.subject,"Physics","Recorded bytes remain saveable after closing the microphone");
 console.log("P04 class-audio cancellation:",checks,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
