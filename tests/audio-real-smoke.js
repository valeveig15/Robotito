"use strict";
const assert=require("node:assert/strict"),{chromium}=require("playwright");
const {spawn}=require("node:child_process"),path=require("node:path");
const port=Number(process.env.ROBOTITO_REAL_AUDIO_PORT||8798);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],
 {cwd:path.resolve(__dirname,".."),stdio:"ignore"});
(async()=>{
 let browser;
 try{
  await new Promise(r=>setTimeout(r,450));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.goto("http://127.0.0.1:"+port+"/tests/audio-eval.html",{waitUntil:"domcontentloaded"});
  const result=await page.evaluate(async()=>{
   const worker=new Worker("../audio-model-worker.js");
   try{
    const answer=await new Promise((resolve,reject)=>{
     const timeout=setTimeout(()=>reject(Error("YAMNet initialization/inference timed out")),90000);
     const fail=e=>{clearTimeout(timeout);reject(Error(String(e?.message||e)));};
     worker.onerror=fail;
     worker.onmessage=e=>{
      const v=e.data||{};
      if(v.type==="error")fail(v.message);
      if(v.type==="ready"){
       const pcm=new Float32Array(15600);
       for(let i=0;i<pcm.length;i++)pcm[i]=.12*Math.sin(2*Math.PI*440*i/16000);
       worker.postMessage({type:"classify",id:1,sampleRate:16000,samples:pcm},[pcm.buffer]);
      }
      if(v.type==="result"){clearTimeout(timeout);resolve(v);}
     };
     worker.postMessage({type:"init"});
    });
    const cats=answer.categories||[];
    if(answer.id!==1||!Array.isArray(cats)||!cats.length||
       cats.some(c=>!Number.isFinite(c.score)||c.score<0||c.score>1))
     throw Error("Real model returned no valid categories");
    const tentative=window.ROBOTITO_SOUND_MODEL.mapCategories(cats);
    if(!tentative.scores)throw Error("Model class mapping failed");
    return {categories:cats.length,first:cats[0].categoryName};
   }finally{worker.terminate();}
  });
  assert.ok(result.categories>0,"No genuine YAMNet classification");
  console.log("Robotito REAL YAMNet Worker integration:",JSON.stringify(result));
  // End-to-end check: the same actual YAMNet Worker receives converted PCM
  // through Robotito's microphone-rate adapter, not only a prebuilt 16k
  // waveform. Exercise a mid-session switch between 48k and 44.1k.
  const microphoneRates=await page.evaluate(async()=>{
   return await new Promise((resolve,reject)=>{
    let bridge=null,phase=0,finished=false;
    const samples=[];
    const stop=(err,value)=>{
     if(finished)return;
     finished=true;clearTimeout(timeout);
     bridge?.disable();
     if(err)reject(err);else resolve(value);
    };
    const timeout=setTimeout(()=>stop(new Error("YAMNet PCM adapter timed out")),25000);
    const feed=rate=>{
     const source=new Float32Array(rate);
     for(let i=0;i<rate;i++)source[i]=.14*Math.sin(2*Math.PI*440*i/rate);
     for(let i=0;i<rate;i+=2048)
      bridge.pushPCM(source.subarray(i,Math.min(rate,i+2048)),rate);
    };
    bridge=window.ROBOTITO_SOUND_MODEL.create({
     onUpdate:status=>{
      if(status.state==="error"){stop(new Error(status.message));return;}
      if(status.state!=="ready")return;
      if(phase===0){phase=1;feed(48000);}
      else if(status.scores&&phase===1){
       samples.push({rate:48000,kind:status.candidate.kind});
       phase=2;feed(44100);
      }else if(status.scores&&phase===2){
       samples.push({rate:44100,kind:status.candidate.kind});
       phase=3;stop(null,samples);
      }
     }
    });
    bridge.enable();
   });
  });
  assert.deepEqual(microphoneRates.map(x=>x.rate),[48000,44100],
    "Both real microphone sample rates must traverse the resampler and real YAMNet Worker");
  assert.ok(microphoneRates.every(x=>typeof x.kind==="string"),
    "Real PCM adaptation must yield tentative model categories");
  console.log("Robotito real microphone-rate YAMNet integration:",JSON.stringify(microphoneRates));
 }finally{if(browser)await browser.close();server.kill("SIGTERM");}
})().catch(error=>{console.error(error);process.exitCode=1;});
