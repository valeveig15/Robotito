// Robotito mobile speech engine.
// Continuous local speech recognition using Whisper via Transformers.js.
// This avoids relying on the inconsistent mobile Web Speech API.
(function(){
  let ctx=null, source=null, processor=null, streamRef=null;
  let transcriber=null, modelPromise=null, active=false, paused=false;
  let language="es", onText=()=>{}, onStatus=()=>{};
  let speaking=false, segment=[], preRoll=[], segmentStart=0, segmentStartEpoch=0, lastVoiceAt=0, voiceFrames=0;
  let noiseFloor=.0075, lastTranscript="", lastTranscriptAt=0;
  let queue=Promise.resolve();

  function status(text,kind=""){ try{onStatus(text,kind);}catch{} }

  function ensureAudioContext(){
    if(!ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)throw new Error("AudioContext unavailable");
      ctx=new AC({latencyHint:"interactive"});
    }
    if(ctx.state==="suspended")ctx.resume().catch(()=>{});
    return ctx;
  }

  async function loadModel(){
    if(transcriber)return transcriber;
    if(modelPromise)return modelPromise;
    modelPromise=(async()=>{
      status(statusText("Preparando escucha local…","Preparing offline speech…","Preparando escuta local…"),"loading");
      const mod=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1");
      const {pipeline,env}=mod;
      env.allowLocalModels=false;
      const progress_callback=p=>{
        if(p?.status==="progress"&&Number.isFinite(p.progress)){
          const pct=Math.max(0,Math.min(100,Math.round(p.progress)));
          status(statusText(`Preparando escucha… ${pct}%`,`Preparing speech… ${pct}%`,`Preparando escuta… ${pct}%`),"loading");
        }
      };
      const opts={progress_callback};
      if(navigator.gpu)opts.device="webgpu";
      try{
        // Whisper Base is noticeably more accurate with short questions and Rioplatense Spanish.
        transcriber=await pipeline("automatic-speech-recognition","onnx-community/whisper-base",opts);
      }catch(baseErr){
        console.warn("Whisper Base failed, trying the lighter model",baseErr);
        try{
          transcriber=await pipeline("automatic-speech-recognition","onnx-community/whisper-tiny",{device:"wasm",progress_callback});
        }catch(tinyErr){
          console.warn("Whisper fallback failed",tinyErr);
          throw tinyErr;
        }
      }
      return transcriber;
    })();
    return modelPromise;
  }

  function normalizeLang(lang){return lang==="en"?"en":lang==="pt"?"pt":"es";}
  function statusText(es,en,pt){return language==="en"?en:language==="pt"?pt:es;}

  function prime(lang="es",statusCb){
    language=normalizeLang(lang);
    if(statusCb)onStatus=statusCb;
    try{ensureAudioContext();}catch{}
    // Begin model download immediately; do not block the UI.
    loadModel().catch(err=>{
      console.warn("local ASR model",err);
      status(statusText("No pude cargar el reconocimiento local","Local speech model failed to load","Não consegui carregar o reconhecimento local"),"problem");
    });
  }

  function concat(chunks){
    let n=0;for(const a of chunks)n+=a.length;
    const out=new Float32Array(n);let o=0;
    for(const a of chunks){out.set(a,o);o+=a.length;}
    return out;
  }

  function resample(input,inRate,outRate=16000){
    if(inRate===outRate)return input;
    const ratio=inRate/outRate;
    const length=Math.max(1,Math.round(input.length/ratio));
    const out=new Float32Array(length);
    for(let i=0;i<length;i++){
      const pos=i*ratio;
      const a=Math.floor(pos),b=Math.min(input.length-1,a+1),f=pos-a;
      out[i]=(input[a]||0)*(1-f)+(input[b]||0)*f;
    }
    return out;
  }

  function enhanceAudio(input){
    if(!input?.length)return input;
    let mean=0;
    for(let i=0;i<input.length;i++)mean+=input[i];
    mean/=input.length;
    let energy=0,peak=0;
    for(let i=0;i<input.length;i++){
      const centered=input[i]-mean;
      energy+=centered*centered;
      peak=Math.max(peak,Math.abs(centered));
    }
    const rms=Math.sqrt(energy/Math.max(1,input.length));
    if(rms<.0005)return input;
    const gain=Math.max(.75,Math.min(6,.105/rms,.92/Math.max(.01,peak)));
    const out=new Float32Array(input.length);
    for(let i=0;i<input.length;i++)out[i]=Math.max(-1,Math.min(1,(input[i]-mean)*gain));
    return out;
  }

  function rmsOf(data){
    let sum=0;for(let i=0;i<data.length;i++){const x=data[i];sum+=x*x;}
    return Math.sqrt(sum/Math.max(1,data.length));
  }

  function resetSegment(){
    speaking=false;segment=[];preRoll=[];segmentStart=0;segmentStartEpoch=0;lastVoiceAt=0;voiceFrames=0;
  }

  function enqueueTranscription(raw,meta=null){
    if(!raw||raw.length<1000)return;
    const sr=ctx?.sampleRate||48000;
    const audio=enhanceAudio(resample(raw,sr,16000));
    queue=queue.then(async()=>{
      if(!active||paused)return;
      const model=await loadModel();
      if(!active||paused)return;
      status(statusText("Entendiendo…","Understanding…","Entendendo…"),"processing");
      const opts={
        task:"transcribe",
        language:language==="en"?"english":language==="pt"?"portuguese":"spanish",
        chunk_length_s:20,
        stride_length_s:3,
        num_beams:4,
        temperature:0,
        condition_on_prev_tokens:false
      };
      const result=await model(audio,opts);
      const text=String(result?.text||"").trim()
        .replace(/^\[[^\]]+\]\s*/,"")
        .replace(/^\([^\)]+\)\s*/,"")
        .replace(/(^|\s)([a-záéíóúüñ]+)(?:\s+\2)(?=\s|$)/gi,"$1$2")
        .replace(/\s+/g," ");
      const normalized=text.toLowerCase().replace(/[^a-záéíóúüñ0-9]+/g," ").trim();
      const duplicate=normalized&&normalized===lastTranscript&&Date.now()-lastTranscriptAt<4500;
      if(text && text.length>1 && !duplicate && !/^\.{1,3}$/.test(text)){
        lastTranscript=normalized;
        lastTranscriptAt=Date.now();
        onText(text,meta||null);
      }
      if(active&&!paused)status(statusText("escuchando","listening","escutando"),"listening");
    }).catch(err=>{
      console.warn("local ASR transcription",err);
      if(active)status(statusText("Escuchando — reintentando","Listening — retrying","Escutando — tentando novamente"),"problem");
    });
  }

  function finalize(){
    if(!speaking){resetSegment();return;}
    const endedAt=Date.now();
    const startedAt=segmentStartEpoch||endedAt;
    const duration=(performance.now()-segmentStart)/1000;
    const enough=duration>=0.42&&voiceFrames>=2;
    const raw=enough?concat(segment):null;
    const meta=enough?{startedAt,endedAt,duration}:null;
    resetSegment();
    if(raw)enqueueTranscription(raw,meta);
  }

  async function start({stream,lang="es",onTranscript,statusCallback}){
    language=normalizeLang(lang);
    onText=typeof onTranscript==="function"?onTranscript:()=>{};
    onStatus=typeof statusCallback==="function"?statusCallback:()=>{};
    streamRef=stream;
    active=true;paused=false;
    resetSegment();

    const ac=ensureAudioContext();
    status(statusText("Preparando escucha continua…","Preparing continuous listening…","Preparando escuta contínua…"),"loading");

    // Load in parallel while wiring audio.
    const modelReady=loadModel();

    if(processor){try{processor.disconnect();}catch{}}
    if(source){try{source.disconnect();}catch{}}

    const audioTracks=stream?.getAudioTracks?.()||[];
    if(!audioTracks.length)throw new Error("No audio track available");

    source=ac.createMediaStreamSource(new MediaStream(audioTracks));
    processor=ac.createScriptProcessor(4096,1,1);
    const mute=ac.createGain();
    mute.gain.value=0;
    source.connect(processor);
    processor.connect(mute);
    mute.connect(ac.destination);

    processor.onaudioprocess=e=>{
      if(!active||paused)return;
      const data=new Float32Array(e.inputBuffer.getChannelData(0));
      const rms=rmsOf(data);
      const now=performance.now();

      // Learn the room noise continuously and adapt to quiet or loud voices.
      if(!speaking&&rms<Math.max(.03,noiseFloor*2.2)){
        noiseFloor=noiseFloor*.965+rms*.035;
      }
      const voiceThreshold=Math.max(.009,Math.min(.032,noiseFloor*2.35+0.0025));
      const voice=rms>voiceThreshold;

      if(!speaking){
        // Keep about 350–450 ms of audio so the first syllable is not cut off.
        preRoll.push(data);
        while(preRoll.length>5)preRoll.shift();
      }
      if(voice){
        if(!speaking){
          speaking=true;
          segmentStart=now;
          segmentStartEpoch=Date.now()-Math.round(preRoll.length*4096/ac.sampleRate*1000);
          segment=preRoll.slice();
          preRoll=[];
          voiceFrames=0;
        }
        lastVoiceAt=now;
        voiceFrames++;
        segment.push(data);
      }else if(speaking){
        segment.push(data);
        // A slightly longer pause keeps natural sentences together.
        if(now-lastVoiceAt>1050)finalize();
      }
      if(speaking&&now-segmentStart>16000)finalize();
    };

    await modelReady;
    if(active&&!paused)status(statusText("escuchando","listening","escutando"),"listening");
    return true;
  }

  function pause(value=true){
    paused=!!value;
    if(paused){
      resetSegment();
      status(statusText("pausado","paused","pausado"));
    }else if(active){
      status(statusText("escuchando","listening","escutando"),"listening");
    }
  }

  function setLanguage(lang){
    language=normalizeLang(lang);
  }

  async function stop(){
    active=false;paused=false;resetSegment();
    if(processor){processor.onaudioprocess=null;try{processor.disconnect();}catch{};processor=null;}
    if(source){try{source.disconnect();}catch{};source=null;}
    streamRef=null;
  }

  window.RobotitoLocalASR={prime,start,pause,setLanguage,stop,get active(){return active;}};
})();