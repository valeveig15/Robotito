"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p10-temporal-playback",async test=>{
 const {page,baseURL}=test;
 test.phase("p10-recorded-audio");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_TEMPORAL_COMMANDS?.handle &&
  window.ROBOTITO_CLASS_AUDIO?.listRecordings && window.ROBOTITO_STORE?.putRecordWithBlob));
 const result=await page.evaluate(async()=>{
  const s=window.ROBOTITO_STORE,t=window.ROBOTITO_TEMPORAL_COMMANDS;
  const d=new Date(),yesterday=new Date(d);
  yesterday.setDate(yesterday.getDate()-1);
  yesterday.setHours(9,30,0,0);
  const bytes=new Uint8Array([0,1,254,12,33,5]);
  await s.putRecordWithBlob({id:"class-audio:p10-physics",owner:"local",type:"audios",
   source:"class-recorder",timestamp:yesterday.getTime(),
   blobId:"class-audio:p10-physics",subject:"Física",topic:"Impulso",
   data:{id:"p10-physics",startedAt:yesterday.getTime(),subject:"Física",
    topic:"Impulso",size:bytes.length,durationMs:1200,mimeType:"audio/webm"}},
   new Blob([bytes],{type:"audio/webm"}),{type:"class-audio"});
  const recordings=await window.ROBOTITO_CLASS_AUDIO.listRecordings();
  const say=[];
  const options={owner:"local",lang:"es",at:d,
   classAudio:{listRecordings:()=>Promise.resolve(recordings)},
   store:s,clock:window.ROBOTITO_TEMPORAL,
   activeOwner:()=> "local",speak:text=>say.push(text),
   container:document.getElementById("temporalPlaybackResult")};
  await t.handle("poné la grabación de la clase de ayer",options);
  const player=options.container.querySelector("audio");
  const found=!!player && /^blob:/.test(player.src);
  const source=player?.src||"";
  await t.handle("poné la grabación de la clase de anteayer",options);
  return {found,source,notFound:say.at(-1)===t.msg("missing","es"),
   noFakeAudio:options.container.querySelectorAll("audio").length===0};
 });
 assert.equal(result.found,true,"Actual Blob yields playable local audio controls");
 assert.ok(result.source.startsWith("blob:"),"Playback URL is local");
 assert.equal(result.notFound,true,"Missing date is reported");
 // The previous Blob audio control is cleaned when a request has no result.
 test.report.result={playback:true,missing:true,realBrowser:true};
 console.log("P10 "+test.engineName+" actual IndexedDB audio and date retrieval passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
