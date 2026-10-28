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
     // This test page lives under /tests; the application itself is at /.
     workerFactory:()=>new Worker("../audio-model-worker.js"),
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
  // Real YAMNet integration for a subsecond sound. The previous evaluator
  // discarded these clips outright; the planner must build an eligible
  // model frame with symmetric silence padding (not claim accuracy).
  const shortClip=await page.evaluate(async()=>{
   const planner=window.ROBOTITO_AUDIO_EVALUATION_WINDOWS;
   const pcm=new Float32Array(4000);
   pcm[100]=.8;pcm[3900]=.4;
   const windows=planner.plan(pcm.length),frame=planner.frame(pcm,windows[0]);
   const worker=new Worker("../audio-model-worker.js");
   try{
    const response=await new Promise((resolve,reject)=>{
     const timeout=setTimeout(()=>reject(Error("Subsecond real inference timed out")),90000);
     worker.onerror=e=>{clearTimeout(timeout);reject(Error(String(e.message||e)));};
     worker.onmessage=e=>{
      const v=e.data||{};
      if(v.type==="error"){clearTimeout(timeout);reject(Error(v.message));}
      if(v.type==="ready")
       worker.postMessage({type:"classify",id:3,sampleRate:16000,samples:frame},[frame.buffer]);
      if(v.type==="result"){clearTimeout(timeout);resolve(v);}
     };
     worker.postMessage({type:"init"});
    });
    return {duration:pcm.length,windows:windows.length,
      paddingStart:windows[0].paddingStart,paddingEnd:windows[0].paddingEnd,
      categories:response.categories.length};
   }finally{worker.terminate();}
  });
  assert.equal(shortClip.windows,1,"A 250ms clip must not be thrown away");
  assert.equal(shortClip.paddingStart,5800,"Subsecond audio must be centred");
  assert.ok(shortClip.categories>0,"Real YAMNet must actually classify the short frame");
  console.log("Robotito real subsecond sound evaluation:",JSON.stringify(shortClip));
  // Full browser integration of the actual AudioWorklet -> streaming PCM
  // resampler -> real MediaPipe YAMNet Worker. Prior checks exercised
  // worklet output and YAMNet independently but did not connect them.
  // This deliberately uses a synthesized oscillator, NOT microphone input.
  await page.locator("body").click();
  const fullAudioPath=await page.evaluate(async()=>{
   return await new Promise((resolve,reject)=>{
    let done=false,started=false,ctx=null,node=null,osc=null,heartbeat=null;
    let packets=0,firstRate=0;
    const timeout=setTimeout(()=>finish(Error("Real worklet to YAMNet integration timed out")),30000);
    function finish(error,result){
     if(done)return;
     done=true;clearTimeout(timeout);
     if(heartbeat!==null)clearInterval(heartbeat);
     if(node){
      node.port.onmessage=null;
      node.port.postMessage({type:"capture",enabled:false});
     }
     try{osc?.stop();}catch{}
     try{node?.disconnect();}catch{}
     try{osc?.disconnect();}catch{}
     void ctx?.close?.();
     bridge.disable();
     if(error)reject(error);else resolve(result);
    }
    async function begin(){
     ctx=new AudioContext({sampleRate:48000});
     await ctx.audioWorklet.addModule("../audio-capture-worklet.js");
     node=new AudioWorkletNode(ctx,"robotito-audio-capture");
     const muted=ctx.createGain();muted.gain.value=0;
     osc=ctx.createOscillator();osc.frequency.value=440;
     osc.connect(node);node.connect(muted);muted.connect(ctx.destination);
     node.port.onmessage=event=>{
      const data=event.data||{};
      if(data.type==="pcm"){
       packets++;firstRate=firstRate||data.sampleRate;
       bridge.pushPCM(data.samples,data.sampleRate);
      }
     };
     // The live app refreshes a 250ms audio-thread authorization.
     // This checks that those heartbeats really permit PCM delivery.
     const renew=()=>node.port.postMessage({type:"capture",enabled:true});
     renew();heartbeat=setInterval(renew,45);
     await ctx.resume();
     osc.start();
    }
    const bridge=window.ROBOTITO_SOUND_MODEL.create({
     workerFactory:()=>new Worker("../audio-model-worker.js"),
     onUpdate:status=>{
      if(status.state==="error"){finish(Error(status.message));return;}
      if(status.state!=="ready")return;
      if(!started){started=true;void begin().catch(finish);return;}
      if(status.scores&&!done)
       finish(null,{packets,inputRate:firstRate,candidate:status.candidate?.kind,
        mappedKinds:Object.keys(status.scores).length});
     }
    });
    bridge.enable();
   });
  });
  assert.ok(fullAudioPath.packets>=7,
    "Real AudioWorklet must deliver multiple PCM packets to the model bridge");
  assert.equal(fullAudioPath.inputRate,48000,
    "Live audio processing thread must report real AudioContext sample rate");
  assert.ok(typeof fullAudioPath.candidate==="string"&&fullAudioPath.mappedKinds>=5,
    "Actual YAMNet Worker must classify audio sourced from real Worklet");
  console.log("Robotito real Worklet -> PCM -> YAMNet:",JSON.stringify(fullAudioPath));
 }finally{if(browser)await browser.close();server.kill("SIGTERM");}
})().catch(error=>{console.error(error);process.exitCode=1;});
