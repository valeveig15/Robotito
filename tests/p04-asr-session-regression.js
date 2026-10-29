"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"..","speech-fallback.js"),"utf8");
const begin=src.indexOf("  function enqueueTranscription(");
const end=src.indexOf("  function finalize(){",begin);
assert.ok(begin>0&&end>begin);
const create=new Function("logger",`
 let language="es",languageRevision=0,active=true,paused=false,queue=Promise.resolve();
 let lastTranscript="",lastTranscriptAt=0,ctx={sampleRate:16000};
 let output=[],waiting=[],options=[];
 const enhanceAudio=x=>x,resample=x=>x,status=()=>{},statusText=x=>x;
 const onText=text=>output.push(text);
 const loadModel=async()=>async (_audio,opts)=>new Promise(resolve=>{options.push(opts);waiting.push(resolve);});
 const console=logger;
 ${src.slice(begin,end)}
 return {enqueue:enqueueTranscription,output,waiting,options,
  change:l=>{language=l;languageRevision++;queue=Promise.resolve();},
  pause:()=>{paused=true;languageRevision++;queue=Promise.resolve();},
  resume:()=>{paused=false;},
  stop:()=>{active=false;languageRevision++;queue=Promise.resolve();}};
`);
const cycle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
(async()=>{
 const t=create({warn:()=>{}});
 t.enqueue(new Float32Array(2000));await cycle();
 assert.equal(t.waiting.length,1);
 assert.equal(t.options[0].language,"spanish");
 t.change("de");t.waiting.shift()({text:"Frase vieja"});await cycle();
 assert.equal(t.output.length,0,"Old language result rejected");
 t.enqueue(new Float32Array(2000));await cycle();
 assert.equal(t.options.at(-1).language,"german");
 t.waiting.shift()({text:"Neue Antwort"});await cycle();
 assert.deepEqual(t.output,["Neue Antwort"]);
 t.enqueue(new Float32Array(2000));await cycle();
 t.pause();t.waiting.shift()({text:"Old paused"});await cycle();
 assert.equal(t.output.length,1,"Paused inference rejected");
 t.resume();t.enqueue(new Float32Array(2000));await cycle();
 t.stop();t.waiting.shift()({text:"Old stopped"});await cycle();
 assert.equal(t.output.length,1,"Stopped inference rejected");
 console.log("Robotito ASR language-switch regression passed");
})().catch(e=>{console.error(e);process.exitCode=1});
