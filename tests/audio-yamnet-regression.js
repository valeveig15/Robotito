"use strict";
const assert=require("node:assert/strict");
const yamnet=require("../audio-yamnet.js");
let checks=0;
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const ok=(v,label)=>{assert.ok(v,label);checks++;};
const categories=[{classifications:[{categories:[
 {categoryName:"Clapping",score:.91},{categoryName:"Applause",score:.75},
 {categoryName:"Laughter",score:.93},{categoryName:"Giggle",score:.69},
 {categoryName:"Crying, sobbing",score:.88},{categoryName:"Cough",score:.94},
 {categoryName:"Sneeze",score:.997},{categoryName:"Traffic noise",score:.8},
 {categoryName:"Knock",score:.99},{categoryName:"Music",score:.9}
]}]}];
const scores=yamnet.categoryScores(categories);
eq(scores,{clap:.91,laugh:.93,cry:.88,cough:.94,sneeze:.997},
 "AudioSet names map only to supported sound events");
eq(yamnet.categoryScores([{}]),{clap:0,laugh:0,cry:0,cough:0,sneeze:0},
 "Missing model result cannot fabricate a sound");
function makeGraph(){
 const connections={source:0,sourceDisconnect:0,processor:0,disconnect:0};
 let processor=null;
 const source={connect:node=>{connections.source++;},disconnect:node=>{connections.sourceDisconnect++;}};
 const ctx={sampleRate:16000,state:"running",destination:{},
  createScriptProcessor:()=>{
   processor={onaudioprocess:null,connect:()=>{connections.processor++;},disconnect:()=>{connections.disconnect++;}};
   return processor;
  },createGain:()=>({gain:{value:1},connect:()=>{},disconnect:()=>{}})};
 return {source,ctx,connections,processor:()=>processor,
  tick(samples){processor.onaudioprocess({inputBuffer:{getChannelData:()=>samples}});}};
}
const graph=makeGraph();
let requested=false,modelClosed=false,now=10000,classified=0,lastLength=0;
const model={
 classify:(samples,sampleRate)=>{
  classified++;lastLength=samples.length;
  eq(sampleRate,16000,"Model uses actual stream sample rate");
  return categories;
 },close:()=>{modelClosed=true;}
};
const moduleMock={
 FilesetResolver:{forAudioTasks:async url=>{ok(url.includes("/wasm"),"WASM asset path");return {wasm:true};}},
 AudioClassifier:{createFromModelPath:async (fileset,url)=>{
  ok(fileset.wasm&&url.includes("yamnet.tflite"),"Official model asset selected");
  return model;
 }}
};
(async()=>{
 const states=[];
 const session=yamnet.create({importer:async url=>{requested=true;ok(url.includes("tasks-audio"),"Model SDK URL");return moduleMock;},
  clock:()=>now,schedule:fn=>fn(),onStatus:state=>states.push(state)});
 eq(requested,false,"Opt-in module must not download anything on construction");
 eq(session.adapter.ready,false,"Model stays inactive without user choice");
 eq(await session.start(graph.ctx,graph.source),true,"Session begins with an explicit request");
 eq(requested,true,"Session loads on demand");
 eq(session.adapter.ready,true,"Model is available after loading");
 for(let i=0;i<4;i++)graph.tick(new Float32Array(4096).fill(.2));
 ok(classified>=1,"Model receives about one second of locally captured samples");
 eq(lastLength,15600,"YAMNet input duration matches ~975ms at 16kHz");
 eq(session.adapter.predict().scores.sneeze,.997,"Classification is exported with event scores");
 const serial=session.adapter.predict().sequence;
 for(let i=0;i<3;i++)graph.tick(new Float32Array(4096));
 eq(session.adapter.predict().sequence,serial,"Inference throttling avoids excessive processing");
 now+=710;
 for(let i=0;i<3;i++)graph.tick(new Float32Array(4096));
 ok(session.adapter.predict().sequence>serial,"Later waveform produces an independent score window");
 now+=3000;
 eq(session.adapter.predict().scores,{},"Stale sound result is not presented as current");
 session.stop();
 eq(graph.connections.sourceDisconnect,1,"Audio capture is disconnected without stopping shared stream");
 eq(graph.connections.disconnect,1,"Audio node is cleaned up");
 eq(modelClosed,true,"Classifier releases resources after stopping");
 eq(session.adapter.ready,false,"Stopped model is no longer eligible for reactions");
 ok(states.includes("ready")&&states.includes("off"),"Lifecycle state exposed");
 const failure=yamnet.create({importer:async()=>{throw Error("offline network");}});
 eq(await failure.start(makeGraph().ctx,makeGraph().source),false,"Failed model loading does not crash Robotito");
 eq(failure.getStatus().active,false,"Failed load leaves no phantom processor");
 ok(failure.getStatus().error.includes("offline"),"Model failure is visible");
 let unblock=null;
 const slow=yamnet.create({importer:()=>new Promise(resolve=>{unblock=resolve;})});
 const slowGraph=makeGraph();
 const loading=slow.start(slowGraph.ctx,slowGraph.source);
 slow.stop();unblock(moduleMock);
 eq(await loading,false,"Disabling during download cancels attachment");
 eq(slow.adapter.ready,false,"Cancelled model cannot react to sound");
 console.log("Robotito pretrained audio adapter:",checks,"assertions passed");
})().catch(error=>{console.error(error);process.exitCode=1;});
