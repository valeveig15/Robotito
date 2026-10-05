// YouTube/video material bridge for Robotito.
// It does not download videos or bypass YouTube permissions. It captures a user-selected
// browser tab with explicit permission and transcribes its audio locally with Whisper.
(function(){
  let captureStream=null;
  let captureActive=false;
  let captureStopping=false;
  let startedClassForCapture=false;
  let visualTimer=null;
  let visionBusy=false;
  let transcriptSegments=[];
  let visualObservations=new Map();

  function norm(value){
    return String(value||"").trim();
  }
  function safeName(value){
    return norm(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-zA-Z0-9_-]+/g,"_").replace(/^_+|_+$/g,"").slice(0,60)||"video";
  }
  function parseYouTubeId(value){
    const raw=norm(value);
    if(/^[a-zA-Z0-9_-]{11}$/.test(raw))return raw;
    try{
      const url=new URL(raw);
      const host=url.hostname.replace(/^www\./,"").toLowerCase();
      if(host==="youtu.be")return url.pathname.split("/").filter(Boolean)[0]?.slice(0,11)||null;
      if(host.endsWith("youtube.com")){
        if(url.searchParams.get("v"))return url.searchParams.get("v").slice(0,11);
        const parts=url.pathname.split("/").filter(Boolean);
        const marker=parts.findIndex(x=>["shorts","embed","live"].includes(x));
        if(marker>=0&&parts[marker+1])return parts[marker+1].slice(0,11);
      }
    }catch{}
    return null;
  }
  function currentUrl(){
    return norm(document.querySelector("#youtubeUrl")?.value);
  }
  function setStatus(text,kind=""){
    const el=document.querySelector("#youtubeCaptureStatus");
    if(!el)return;
    el.textContent=text;
    el.dataset.kind=kind;
  }
  function setButtons(active){
    const start=document.querySelector("#startYoutubeCaptureBtn");
    const stop=document.querySelector("#stopYoutubeCaptureBtn");
    if(start)start.disabled=active;
    if(stop)stop.disabled=!active;
  }
  function titleForVideo(id){
    return norm(document.querySelector("#youtubeVideoTitle")?.value)||("Video de YouTube "+id);
  }
  async function fetchTitle(url){
    try{
      const response=await fetch("https://www.youtube.com/oembed?format=json&url="+encodeURIComponent(url));
      if(!response.ok)return "";
      const data=await response.json();
      return norm(data?.title);
    }catch{return "";}
  }
  async function prepareVideo(){
    const url=currentUrl();
    const id=parseYouTubeId(url);
    if(!id){
      setStatus("Pegá un enlace válido de YouTube.","error");
      toast?.("No pude reconocer ese enlace de YouTube.");
      return null;
    }
    const canonical="https://www.youtube.com/watch?v="+id;
    const titleInput=document.querySelector("#youtubeVideoTitle");
    setStatus("Video reconocido. Podés abrirlo, pegar su transcripción o compartir la pestaña con audio.","ready");
    const title=await fetchTitle(canonical);
    if(titleInput&&!titleInput.value&&title)titleInput.value=title;
    return {id,url:canonical,title:title||titleForVideo(id)};
  }
  async function openVideo(){
    const video=await prepareVideo();
    if(!video)return;
    window.open(video.url,"_blank","noopener,noreferrer");
    setStatus("Abrí el video en otra pestaña. Para escucharlo automáticamente, volvé y elegí «Escuchar pestaña».","ready");
  }
  async function saveTextMaterial(text,name){
    const body=norm(text);
    if(body.length<20)throw new Error("empty-transcript");
    const file=new File([body],name,{type:"text/plain"});
    await window.ROBOTITO_CLASS_ORGANIZER?.importAcademicFiles?.([file]);
  }
  async function savePastedTranscript(){
    const video=await prepareVideo();
    if(!video)return;
    const textarea=document.querySelector("#youtubeTranscript");
    const transcript=norm(textarea?.value);
    if(transcript.length<20){
      toast?.("Pegá primero la transcripción o los subtítulos del video.");
      textarea?.focus();
      return;
    }
    const material=[
      "Fuente: "+video.url,
      "Título: "+video.title,
      "",
      "Transcripción del video:",
      transcript
    ].join("\n");
    await saveTextMaterial(material,"YouTube_"+safeName(video.title)+".txt");
    if(textarea)textarea.value="";
    setStatus("Transcripción guardada como material académico de la materia y el tema actuales.","success");
    toast?.("Transcripción del video incorporada.");
  }
  function translatedObject(label){
    const item=window.ROBOTITO_OBJECTS?.findByModelLabel?.(label);
    return item?.es?.[0]||label;
  }
  async function inspectFrame(){
    if(!captureActive||visionBusy||document.hidden)return;
    const preview=document.querySelector("#youtubeCapturePreview");
    if(!preview||preview.readyState<2||!window.cocoSsd)return;
    visionBusy=true;
    try{
      state.objectModel=state.objectModel||await cocoSsd.load({base:"lite_mobilenet_v2"});
      const predictions=await state.objectModel.detect(preview,12,.52);
      const second=Math.max(0,Math.round((Date.now()-(state.classStartedAt||Date.now()))/1000));
      predictions.filter(x=>Number(x.score)>=.58).forEach(x=>{
        const name=translatedObject(x.class);
        const previous=visualObservations.get(name)||{name,count:0,firstAt:second,lastAt:second,best:0};
        previous.count++;
        previous.lastAt=second;
        previous.best=Math.max(previous.best,Number(x.score)||0);
        visualObservations.set(name,previous);
      });
      const visual=document.querySelector("#youtubeVisualStatus");
      if(visual){
        const names=[...visualObservations.values()].sort((a,b)=>b.count-a.count).slice(0,5).map(x=>x.name);
        visual.textContent=names.length?"Objetos vistos: "+names.join(", "):"Todavía no reconocí objetos generales con suficiente seguridad.";
      }
    }catch(e){
      console.warn("video frame vision",e);
    }finally{
      visionBusy=false;
    }
  }
  function startVisualInspection(){
    clearInterval(visualTimer);
    visualTimer=setInterval(inspectFrame,6500);
    setTimeout(inspectFrame,1800);
  }
  async function importVisualObservations(video){
    const rows=[...visualObservations.values()].sort((a,b)=>b.count-a.count);
    if(!rows.length)return;
    const lines=[
      "Fuente: "+video.url,
      "Título: "+video.title,
      "",
      "Observaciones visuales automáticas:",
      "Estas observaciones reconocen objetos generales y pueden contener errores. No describen por sí solas toda la explicación visual.",
      ...rows.map(x=>"- "+x.name+" (detectado entre "+x.firstAt+" s y "+x.lastAt+" s; confianza máxima "+Math.round(x.best*100)+"%)")
    ];
    await saveTextMaterial(lines.join("\n"),"Observaciones_visuales_"+safeName(video.title)+".txt");
  }
  async function restoreNormalListening(){
    if(!state.started||!state.stream)return;
    if(isMobileSpeech()){
      try{
        await window.RobotitoLocalASR?.start?.({
          stream:state.stream,
          lang:state.languageMode||"es",
          onTranscript:(text,meta)=>{
            updateDetectedLanguage(text);
            processSpeechResult(text,meta);
          },
          statusCallback:(text,kind)=>setListenState(text,kind)
        });
        if(state.speaking)window.RobotitoLocalASR?.pause?.(true);
      }catch(e){console.warn("restore local ASR",e);}
    }else{
      state.recognitionWanted=true;
      if(!state.speaking)setTimeout(()=>startListeningCycle(false),300);
    }
  }
  async function startCapture(){
    if(captureActive||captureStopping)return;
    const video=await prepareVideo();
    if(!video)return;
    if(!state.started){
      toast?.("Primero despertá los sentidos de Robotito.");
      setStatus("Primero elegí el idioma y despertá los sentidos.","error");
      return;
    }
    if(state.classMode){
      toast?.("Terminá primero la clase que ya está activa.");
      setStatus("Ya hay una clase activa. Terminála antes de escuchar el video.","error");
      return;
    }
    if(!navigator.mediaDevices?.getDisplayMedia){
      setStatus("Este navegador no permite compartir una pestaña con audio. Usá la opción de pegar la transcripción.","error");
      return;
    }

    setStatus("Elegí la pestaña donde está YouTube y activá «Compartir audio de la pestaña».","working");
    try{
      captureStream=await navigator.mediaDevices.getDisplayMedia({
        video:{displaySurface:"browser"},
        audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},
        preferCurrentTab:false,
        selfBrowserSurface:"exclude",
        surfaceSwitching:"include",
        systemAudio:"include"
      });
      if(!captureStream.getAudioTracks().length){
        captureStream.getTracks().forEach(track=>track.stop());
        captureStream=null;
        throw new Error("no-audio");
      }

      captureActive=true;
      captureStopping=false;
      transcriptSegments=[];
      visualObservations=new Map();
      setButtons(true);
      const preview=document.querySelector("#youtubeCapturePreview");
      if(preview){
        preview.srcObject=captureStream;
        preview.hidden=false;
        preview.muted=true;
        await preview.play().catch(()=>{});
      }

      // Class audio chooses this stream instead of the microphone while capture is active.
      startedClassForCapture=true;
      await startClassMode();

      state.recognitionWanted=false;
      discardRecognition();
      await window.RobotitoLocalASR?.stop?.();
      await window.RobotitoLocalASR?.start?.({
        stream:captureStream,
        lang:state.languageMode||"es",
        onTranscript:(text,meta)=>{
          const clean=norm(text);
          if(!clean)return;
          transcriptSegments.push({text:clean,at:Date.now()});
          state.speakerOverride="teacher";
          void captureClassLine(clean,meta);
        },
        statusCallback:(text,kind)=>{
          setListenState(text,kind);
          setStatus("Escuchando el audio del video y transcribiendo localmente…","active");
        }
      });

      captureStream.getTracks().forEach(track=>{
        track.addEventListener("ended",()=>{ if(captureActive&&!captureStopping)void stopCapture(true); },{once:true});
      });
      startVisualInspection();
      document.querySelector("#classBadge").textContent="video";
      setStatus("Escuchando el video. Reproducilo en la pestaña compartida; Robotito irá guardando lo que dice.","active");
      toast?.("Captura iniciada. Volvé a YouTube y reproducí el video.");
    }catch(e){
      console.warn("YouTube tab capture",e);
      captureStream?.getTracks?.().forEach(track=>track.stop());
      captureStream=null;
      captureActive=false;
      startedClassForCapture=false;
      setButtons(false);
      const msg=e?.message==="no-audio"
        ?"La pestaña se compartió sin audio. Reintentá y marcá «Compartir audio de la pestaña»."
        :e?.name==="NotAllowedError"
          ?"No se concedió permiso para compartir la pestaña."
          :"No pude escuchar esa pestaña. Podés pegar la transcripción como alternativa.";
      setStatus(msg,"error");
      await restoreNormalListening();
    }
  }
  async function stopCapture(endedByBrowser=false){
    if((!captureActive&&!captureStream)||captureStopping)return;
    captureStopping=true;
    captureActive=false;
    clearInterval(visualTimer);
    visualTimer=null;
    window.RobotitoLocalASR?.pause?.(true);
    const id=parseYouTubeId(currentUrl())||"video";
    const video={id,url:"https://www.youtube.com/watch?v="+id,title:titleForVideo(id)};

    try{
      if(startedClassForCapture&&state.classMode)await stopClassMode();
      await importVisualObservations(video);
    }catch(e){
      console.warn("finish video material",e);
    }
    await window.RobotitoLocalASR?.stop?.();
    captureStream?.getTracks?.().forEach(track=>{try{track.stop();}catch{}});
    captureStream=null;
    startedClassForCapture=false;

    const preview=document.querySelector("#youtubeCapturePreview");
    if(preview){preview.pause();preview.srcObject=null;preview.hidden=true;}
    setButtons(false);
    const visual=document.querySelector("#youtubeVisualStatus");
    if(visual&&visualObservations.size===0)visual.textContent="No se guardaron observaciones visuales.";
    setStatus(
      endedByBrowser
        ?"La pestaña dejó de compartirse. Guardé la transcripción obtenida."
        :"Video terminado. Guardé la transcripción y las observaciones visuales disponibles.",
      "success"
    );
    captureStopping=false;
    await restoreNormalListening();
  }
  function bind(){
    document.querySelector("#prepareYoutubeBtn")?.addEventListener("click",prepareVideo);
    document.querySelector("#openYoutubeBtn")?.addEventListener("click",openVideo);
    document.querySelector("#saveYoutubeTranscriptBtn")?.addEventListener("click",savePastedTranscript);
    document.querySelector("#startYoutubeCaptureBtn")?.addEventListener("click",startCapture);
    document.querySelector("#stopYoutubeCaptureBtn")?.addEventListener("click",()=>stopCapture(false));
    document.querySelector("#youtubeUrl")?.addEventListener("change",prepareVideo);
    setButtons(false);
  }

  window.ROBOTITO_YOUTUBE_MATERIAL={
    parseYouTubeId,
    prepareVideo,
    startCapture,
    stopCapture,
    savePastedTranscript,
    get captureStream(){return captureStream;},
    get active(){return captureActive;}
  };
  document.addEventListener("DOMContentLoaded",bind);
})();