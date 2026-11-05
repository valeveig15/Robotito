"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","speech-fallback.js"),"utf8")
 .replace('await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1")',"await importModel()");
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
let checks=0;
const eq=(a,b,why)=>{assert.deepEqual(a,b,why);checks++;};
function fixture(){
 const contexts=[],loads=[],statuses=[];
 const node=()=>({connect(){},disconnect(){this.disconnected=true;}});
 class AudioContext{
  constructor(){this.state="running";this.sampleRate=48000;this.nodes=[];contexts.push(this);}
  createMediaStreamSource(){const n=node();this.nodes.push(n);return n;}
  createScriptProcessor(){const n=node();this.processor=n;this.nodes.push(n);return n;}
  createGain(){const n={...node(),gain:{value:1}};this.nodes.push(n);return n;}
  close(){this.state="closed";return Promise.resolve();}
 }
 const sandbox={window:{AudioContext},navigator:{},Float32Array,performance:{now:()=>0},
  MediaStream:class{},console:{warn(){}},
  importModel:async()=>({env:{},pipeline:()=>new Promise((resolve,reject)=>loads.push({resolve,reject}))})};
 vm.runInNewContext(source,sandbox);
 const api=sandbox.window.RobotitoLocalASR;
 const start=()=>api.start({stream:{getAudioTracks:()=>[{readyState:"live",enabled:true}]},
  onTranscript:()=>{},statusCallback:(text,kind)=>statuses.push({text,kind})});
 return {api,start,contexts,loads,statuses};
}
(async()=>{
 const f=fixture(),first=f.start();await tick();
 eq(f.loads.length,1,"Initial session starts one model load");
 const oldProcessor=f.contexts[0].processor;
 f.api.stop();
 eq(f.api.active,false,"Stopping invalidates the pending local session");
 eq(f.contexts[0].state,"closed","Stopping closes the local AudioContext");
 eq(f.contexts[0].nodes.every(n=>n.disconnected),true,"Source, processor and silent gain all disconnect");
 eq(oldProcessor.onaudioprocess,null,"Detached processor cannot retain a microphone callback");
 const statusesBefore=f.statuses.length;
 f.loads[0].resolve(async()=>({text:"old"}));
 eq(await first,false,"Late model success cannot resurrect a canceled start");
 eq(f.statuses.length,statusesBefore,"Late load does not overwrite the stopped UI");
 eq(await f.start(),true,"A fresh session can reuse the successfully loaded model");
 eq(f.contexts.length,2,"Restart uses a fresh AudioContext");
 f.api.stop();

 const retry=fixture(),failed=retry.start();failed.catch(()=>{});await tick();
 retry.loads[0].reject(Error("base failed"));await tick();
 eq(retry.loads.length,2,"Base model failure tries the light model");
 retry.loads[1].reject(Error("tiny failed"));
 await assert.rejects(failed,/tiny failed/);checks++;
 eq(retry.api.active,false,"Failed startup cannot remain active");
 eq(retry.contexts[0].nodes.every(n=>n.disconnected),true,"Failed startup releases audio nodes");
 const second=retry.start();await tick();
 eq(retry.loads.length,3,"Retry loads again instead of reusing a rejected promise");
 retry.loads[2].resolve(async()=>({text:"ready"}));
 eq(await second,true,"Retry after both model failures succeeds");
 retry.api.stop();

 const replaced=fixture(),old=replaced.start();old.catch(()=>{});await tick();
 const newer=replaced.start();newer.catch(()=>{});await tick();
 eq(replaced.contexts[0].nodes.slice(0,3).every(n=>n.disconnected),true,"Replacement releases the first graph");
 replaced.loads[0].resolve(async()=>({text:"ready"}));
 eq(await old,false,"Old start completion does not claim the replacement session");
 eq(await newer,true,"Only the latest start becomes ready");
 eq(replaced.statuses.filter(x=>x.kind==="listening").length,1,"Ready status is emitted by the latest start only");
 replaced.api.stop();
 console.log("P04 local ASR resource/retry lifecycle:",checks,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
