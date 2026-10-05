// Robotito mobile speech engine.
// Continuous local speech recognition using Whisper via Transformers.js.
// This avoids relying on the inconsistent mobile Web Speech API.
(function(){
  let ctx=null, source=null, processor=null, streamRef=null;
  let transcriber=null, modelPromise=null, active=false, paused=false;
  let language="es", onText=()=>{}, onStatus=()=>{};
  let speaking=false, segment=[], segmentStart=0, lastVoiceAt=0, voiceFrames=0;
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
      status(language==="en"?"Preparing offline speech…":"Preparando escucha local…","loading");
      const mod=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1");
      const {pipeline,env}=mod;
      env.allowLocalModels=false;
      const progress_callback=p=>{
        if(p?.status==="progress"&&Number.isFinite(p.progress)){
          const pct=Math.max(0,Math.min(100,Math.round(p.progress)));
          status(language==="en"?`Preparing speech… ${pct}%`:`Preparando escucha… ${pct}%`,"loading");
        }
      };
      const opts={progress_callback};
      if(navigator.gpu)opts.device="webgpu";
      try{
        transcriber=await pipeline("automatic-speech-recognition","onnx-community/whisper-tiny",opts);
      }catch(err){
        console.warn("Whisper WebGPU failed, falling back to WASM",err);
        transcriber=await pipeline("automatic-speech-recognition","onnx-community/whisper-tiny",{device:"wasm",progress_callback});
      }
      return transcriber;
    })();
    return modelPromise;
  }

  function prime(lang="es",statusCb){
    language=lang==="en"?"en":"es";
    if(statusCb)onStatus=statusCb;
    try{ensureAudioContext();}catch{}
    // Begin model download immediately; do not block the UI.
    loadModel().catch(err=>{
      console.warn("local ASR model",err);
      status(language==="en"?"Local speech model failed to load":"No pude cargar el reconocimiento local","problem");
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

  function rmsOf(data){
    let sum=0;for(let i=0;i<data.length;i++){const x=data[i];sum+=x*x;}
    return Math.sqrt(sum/Math.max(1,data.length));
  }

  function resetSegment(){
    speaking=false;segment=[];segmentStart=0;lastVoiceAt=0;voiceFrames=0;
  }

  function enqueueTranscription(raw){
    if(!raw||raw.length<1000)return;
    const sr=ctx?.sampleRate||48000;
    const audio=resample(raw,sr,16000);
    queue=queue.then(async()=>{
      if(!active||paused)return;
      const model=await loadModel();
      if(!active||paused)return;
      status(language==="en"?"Understanding…":"Entendiendo…","processing");
      const opts={task:"transcribe",language:language==="en"?"english":"spanish"};
      const result=await model(audio,opts);
      const text=String(result?.text||"").trim()
        .replace(/^\[[^\]]+\]\s*/,"")
        .replace(/\s+/g," ");
      if(text && text.length>1 && !/^\.{1,3}$/.test(text)){
        onText(text);
      }
      if(active&&!paused)status(language==="en"?"listening":"escuchando","listening");
    }).catch(err=>{
      console.warn("local ASR transcription",err);
      if(active)status(language==="en"?"Listening — retrying":"Escuchando — reintentando","problem");
    });
  }

  function finalize(){
    if(!speaking){resetSegment();return;}
    const duration=(performance.now()-segmentStart)/1000;
    const enough=duration>=0.45&&voiceFrames>=2;
    const raw=enough?concat(segment):null;
    resetSegment();
    if(raw)enqueueTranscription(raw);
  }

  async function start({stream,lang="es",onTranscript,statusCallback}){
    language=lang==="en"?"en":"es";
    onText=typeof onTranscript==="function"?onTranscript:()=>{};
    onStatus=typeof statusCallback==="function"?statusCallback:()=>{};
    streamRef=stream;
    active=true;paused=false;
    resetSegment();

    const ac=ensureAudioContext();
    status(language==="en"?"Preparing continuous listening…":"Preparando escucha continua…","loading");

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
      // Conservative voice activity threshold to ignore room noise.
      const voice=rms>0.018;
      if(voice){
        if(!speaking){
          speaking=true;
          segmentStart=now;
          segment=[];
          voiceFrames=0;
        }
        lastVoiceAt=now;
        voiceFrames++;
        segment.push(data);
      }else if(speaking){
        segment.push(data);
        if(now-lastVoiceAt>850)finalize();
      }
      if(speaking&&now-segmentStart>12000)finalize();
    };

    await modelReady;
    if(active&&!paused)status(language==="en"?"listening":"escuchando","listening");
    return true;
  }

  function pause(value=true){
    paused=!!value;
    if(paused){
      resetSegment();
      status(language==="en"?"paused":"pausado");
    }else if(active){
      status(language==="en"?"listening":"escuchando","listening");
    }
  }

  function setLanguage(lang){
    language=lang==="en"?"en":"es";
  }

  async function stop(){
    active=false;paused=false;resetSegment();
    if(processor){processor.onaudioprocess=null;try{processor.disconnect();}catch{};processor=null;}
    if(source){try{source.disconnect();}catch{};source=null;}
    streamRef=null;
  }

  window.RobotitoLocalASR={prime,start,pause,setLanguage,stop,get active(){return active;}};
})();