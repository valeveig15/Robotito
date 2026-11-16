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
  let activeVideo=null,activeScope=null,captureBeganAt=0,evidenceStore=null;
  function evidence(){
    if(!evidenceStore)evidenceStore=window.ROBOTITO_MEMORY_MODULES.create({...window.ROBOTITO_MEMORY_MODULES.video,factory:window.ROBOTITO_VIDEO_EVIDENCE.createStore});
    if(!evidenceStore)throw new Error("Evidence store unavailable");
    return evidenceStore;
  }
  function classScope(){
    return {owner:window.ROBOTITO_MEMORY.owner(),subject:norm(document.querySelector("#classSubject")?.value||state.classSubject),
      topic:norm(document.querySelector("#classTopic")?.value||state.classTopic),
      sessionId:norm(state.classSessionId)};
  }
  async function storeEvidence(video,items,scope=classScope()){
    if(!scope.subject||!items.length)return 0;
    try{
      if(scope.owner!==window.ROBOTITO_MEMORY.owner())throw Error("History changed; evidence discarded");
      return await evidence().run(store=>store.addBatch({
        sourceId:video.id,sourceUrl:video.url,title:video.title,
        ...scope,consent:true,items
      }));
    }catch(e){console.warn("video evidence persistence",e);setStatus(
      "No pude guardar el índice de evidencias: "+String(e.message||e),"error");return 0;}
  }

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
    uiSet(el,text);
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
    const scope=classScope();
    const video=await prepareVideo();
    if(scope.owner!==window.ROBOTITO_MEMORY.owner())return;
    if(!video)return;
    const textarea=document.querySelector("#youtubeTranscript");
    const transcript=norm(textarea?.value);
    if(transcript.length<20){
      toast?.("Pegá primero la transcripción o los subtítulos del video.");
      textarea?.focus();
      return;
    }
    const material=[
      uiText("Fuente: {value}",{value:video.url}),
      uiText("Título: {value}",{value:video.title}),
      "",
      uiText("Transcripción del video:"),
      transcript
    ].join("\n");
    await saveTextMaterial(material,"YouTube_"+safeName(video.title)+".txt");
    if(scope.owner!==window.ROBOTITO_MEMORY.owner())return;
    // Pasted captions are supplied text, not something that Robotito actually heard.
    await storeEvidence(video,window.ROBOTITO_VIDEO_EVIDENCE?.segmentCaptions?.(transcript)?.map(row=>({
      kind:"provided-caption",text:row.text,atSec:row.atSec,complete:false
    }))||[],scope);
    if(textarea)textarea.value="";
    setStatus("Transcripción guardada como material académico de la materia y el tema actuales.","success");
    toast?.("Transcripción del video incorporada.");
  }
  function translatedObject(label,lang=state.languageMode||"es"){
    const item=window.ROBOTITO_OBJECTS?.findByModelLabel?.(label);
    return item?window.ROBOTITO_OBJECTS.displayName(item,lang):label;
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
        const name=x.class;
        const previous=visualObservations.get(name)||{name,count:0,firstAt:second,lastAt:second,best:0};
        previous.count++;
        previous.lastAt=second;
        previous.best=Math.max(previous.best,Number(x.score)||0);
        visualObservations.set(name,previous);
      });
      const visual=document.querySelector("#youtubeVisualStatus");
      if(visual){
        const names=[...visualObservations.values()].sort((a,b)=>b.count-a.count).slice(0,5).map(x=>x.name);
        uiSet(visual,names.length?"Posibles objetos detectados: {names}":"Todavía no reconocí objetos generales con suficiente seguridad.",lang=>({names:names.map(name=>translatedObject(name,lang)).join(", ")}));
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
    if(activeScope?.owner!==window.ROBOTITO_MEMORY.owner())return;
    const rows=[...visualObservations.values()]
      .filter(x=>x.count>=2&&x.best>=.70)
      .sort((a,b)=>b.count-a.count);
    if(!rows.length)return;
    const lines=[
      uiText("Fuente: {value}",{value:video.url}),
      uiText("Título: {value}",{value:video.title}),
      "",
      uiText("Observaciones visuales automáticas:"),
      uiText("Estas observaciones reconocen objetos generales y pueden contener errores. No describen por sí solas toda la explicación visual."),
      ...rows.map(x=>uiText("- {name} (detectado entre {start} s y {end} s; confianza máxima {confidence}%)",{name:translatedObject(x.name),start:x.firstAt,end:x.lastAt,confidence:Math.round(x.best*100)}))
    ];
    await saveTextMaterial(lines.join("\n"),"Observaciones_visuales_"+safeName(video.title)+".txt");
    await storeEvidence(video,rows.map(x=>({kind:"seen",text:translatedObject(x.name),
      atSec:x.firstAt,score:x.best,samples:x.count,complete:false})),activeScope||classScope());
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
    const owner=window.ROBOTITO_MEMORY.owner();
    const video=await prepareVideo();
    if(!video||owner!==window.ROBOTITO_MEMORY.owner())return;
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
      if(owner!==window.ROBOTITO_MEMORY.owner()){captureStream.getTracks().forEach(track=>track.stop());captureStream=null;throw Error("History changed");}
      if(!captureStream.getAudioTracks().length){
        captureStream.getTracks().forEach(track=>track.stop());
        captureStream=null;
        throw new Error("no-audio");
      }

      captureActive=true;
      captureStopping=false;
      activeVideo=video;
      activeScope=classScope();
      captureBeganAt=Date.now();
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
          transcriptSegments.push({text:clean,atSec:Math.max(0,(Date.now()-captureBeganAt)/1000)});
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
      activeVideo=null;activeScope=null;
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
    // Capture may continue after the user edits the link field; retain the
    // original source selected when permission was granted.
    const video=activeVideo||{id,url:"https://www.youtube.com/watch?v="+id,title:titleForVideo(id)};

    try{
      if(activeScope?.owner!==window.ROBOTITO_MEMORY.owner())throw Error("History changed; capture discarded");
      if(startedClassForCapture&&state.classMode)await stopClassMode();
      await storeEvidence(video,transcriptSegments.map(x=>({kind:"heard",text:x.text,
        atSec:x.atSec,capture:true,complete:false})).slice(0,240),activeScope||classScope());
      await importVisualObservations(video);
    }catch(e){
      console.warn("finish video material",e);
    }
    await window.RobotitoLocalASR?.stop?.();
    captureStream?.getTracks?.().forEach(track=>{try{track.stop();}catch{}});
    captureStream=null;
    startedClassForCapture=false;
    activeVideo=null;activeScope=null;

    const preview=document.querySelector("#youtubeCapturePreview");
    if(preview){preview.pause();preview.srcObject=null;preview.hidden=true;}
    setButtons(false);
    const visual=document.querySelector("#youtubeVisualStatus");
    if(visual&&visualObservations.size===0)uiSet(visual,"No se guardaron observaciones visuales.");
    setStatus(
      endedByBrowser
        ?"La pestaña dejó de compartirse. Guardé la transcripción obtenida."
        :"Video terminado. Guardé la transcripción y las observaciones visuales disponibles.",
      "success"
    );
    captureStopping=false;
    await restoreNormalListening();
  }
  async function searchEvidence(){
    const scope=classScope();
    const out=document.querySelector("#videoEvidenceResults");
    if(!out)return;
    out.replaceChildren();
    let rows=[];
    try{
      rows=(await evidence().read()).search({...scope,
        query:norm(document.querySelector("#videoEvidenceQuery")?.value),limit:12});
      if(scope.owner!==window.ROBOTITO_MEMORY.owner())return;
    }catch(e){out.textContent="No pude consultar las evidencias guardadas: "+e.message;return;}
    if(!rows.length){out.textContent="No hay fragmentos coincidentes en la materia y el tema seleccionados.";return;}
    const labels={"provided-caption":"Subtítulo aportado","heard":"Audio transcrito",
      "seen":"Detección visual probable","inferred":"Inferencia no verificada"};
    const list=document.createElement("ol");
    for(const entry of rows){
      const li=document.createElement("li"),lead=document.createElement("strong");
      lead.textContent=(labels[entry.kind]||entry.kind)+
        (entry.atSec==null?"":" · "+Math.round(entry.atSec)+" s")+
        " · "+(entry.title||entry.sourceId);
      const text=document.createElement("p");text.textContent=entry.text;
      li.append(lead,text);
      if(entry.sourceUrl){const a=document.createElement("a");
        a.href=entry.sourceUrl;a.target="_blank";a.rel="noopener noreferrer";
        a.textContent="Abrir fuente";li.append(a);}
      list.append(li);
    }
    out.append(list);
  }
  function bind(){
    document.querySelector("#videoEvidenceSearch")?.addEventListener("click",searchEvidence);
    document.querySelector("#prepareYoutubeBtn")?.addEventListener("click",prepareVideo);
    document.querySelector("#openYoutubeBtn")?.addEventListener("click",openVideo);
    document.querySelector("#saveYoutubeTranscriptBtn")?.addEventListener("click",savePastedTranscript);
    document.querySelector("#startYoutubeCaptureBtn")?.addEventListener("click",startCapture);
    document.querySelector("#stopYoutubeCaptureBtn")?.addEventListener("click",()=>stopCapture(false));
    document.querySelector("#youtubeUrl")?.addEventListener("change",prepareVideo);
    setButtons(false);
  }

  window.addEventListener("robotito:memoryscopechange",()=>{
    for(const id of ["videoEvidenceResults","youtubeTranscript","youtubeVisualStatus"]) {const el=document.getElementById(id);if(el){el.replaceChildren();if("value" in el)el.value="";}}
    if(captureActive||captureStream)void stopCapture();
  });
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
