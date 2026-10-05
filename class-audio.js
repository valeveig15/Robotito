// Robotito — persistent audio recordings for Class Mode.
// Stores audio locally in IndexedDB so long classes do not live only in RAM.
(function(){
  const DB_NAME="robotito-class-audio-v1";
  const DB_VERSION=1;
  const RECORDINGS="recordings";
  const CHUNKS="chunks";
  let active=null;
  let objectUrls=[];

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!("indexedDB" in window)){reject(new Error("IndexedDB no disponible"));return;}
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(RECORDINGS)){
          const store=db.createObjectStore(RECORDINGS,{keyPath:"id"});
          store.createIndex("startedAt","startedAt");
        }
        if(!db.objectStoreNames.contains(CHUNKS)){
          const store=db.createObjectStore(CHUNKS,{keyPath:"key"});
          store.createIndex("sessionId","sessionId");
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error("No pude abrir almacenamiento"));
    });
  }
  function requestResult(req){
    return new Promise((resolve,reject)=>{
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error("Error de almacenamiento"));
    });
  }
  function transactionDone(tx){
    return new Promise((resolve,reject)=>{
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error("Error de almacenamiento"));
      tx.onabort=()=>reject(tx.error||new Error("Operación cancelada"));
    });
  }
  async function putChunk(sessionId,seq,blob){
    const db=await openDb();
    const tx=db.transaction(CHUNKS,"readwrite");
    tx.objectStore(CHUNKS).put({
      key:sessionId+":"+String(seq).padStart(8,"0"),
      sessionId,seq,blob
    });
    await transactionDone(tx);
    db.close();
  }
  async function chunksFor(sessionId){
    const db=await openDb();
    const tx=db.transaction(CHUNKS,"readonly");
    const idx=tx.objectStore(CHUNKS).index("sessionId");
    const rows=await requestResult(idx.getAll(IDBKeyRange.only(sessionId)));
    await transactionDone(tx).catch(()=>{});
    db.close();
    return rows.sort((a,b)=>a.seq-b.seq);
  }
  async function clearChunks(sessionId){
    const db=await openDb();
    const tx=db.transaction(CHUNKS,"readwrite");
    const idx=tx.objectStore(CHUNKS).index("sessionId");
    await new Promise((resolve,reject)=>{
      const req=idx.openCursor(IDBKeyRange.only(sessionId));
      req.onsuccess=()=>{
        const cursor=req.result;
        if(!cursor){resolve();return;}
        cursor.delete();
        cursor.continue();
      };
      req.onerror=()=>reject(req.error);
    });
    await transactionDone(tx);
    db.close();
  }
  async function saveRecording(record){
    const db=await openDb();
    const tx=db.transaction(RECORDINGS,"readwrite");
    tx.objectStore(RECORDINGS).put(record);
    await transactionDone(tx);
    db.close();
  }
  async function listRecordings(){
    const db=await openDb();
    const tx=db.transaction(RECORDINGS,"readonly");
    const rows=await requestResult(tx.objectStore(RECORDINGS).getAll());
    await transactionDone(tx).catch(()=>{});
    db.close();
    return rows.sort((a,b)=>b.startedAt-a.startedAt);
  }
  async function removeRecording(id){
    const db=await openDb();
    const tx=db.transaction(RECORDINGS,"readwrite");
    tx.objectStore(RECORDINGS).delete(id);
    await transactionDone(tx);
    db.close();
  }
  async function updateMetadata(id,patch={}){
    if(!id)return null;
    const db=await openDb();
    const tx=db.transaction(RECORDINGS,"readwrite");
    const store=tx.objectStore(RECORDINGS);
    const current=await requestResult(store.get(id));
    if(!current){db.close();return null;}
    const next={...current,...patch,id:current.id};
    store.put(next);
    await transactionDone(tx);
    db.close();
    return next;
  }
  function pickMimeType(){
    if(!window.MediaRecorder)return "";
    const candidates=[
      "audio/webm;codecs=opus",
      "audio/mp4",
      "audio/webm",
      "audio/ogg;codecs=opus"
    ];
    return candidates.find(t=>MediaRecorder.isTypeSupported?.(t))||"";
  }
  function prettyDuration(ms){
    const sec=Math.max(0,Math.round((ms||0)/1000));
    const h=Math.floor(sec/3600);
    const m=Math.floor((sec%3600)/60);
    const s=sec%60;
    return h?String(h)+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")
      :String(m)+":"+String(s).padStart(2,"0");
  }
  function prettyBytes(bytes){
    if(!Number.isFinite(bytes))return "";
    if(bytes<1024*1024)return Math.max(1,Math.round(bytes/1024))+" KB";
    return (bytes/(1024*1024)).toFixed(bytes<10*1024*1024?1:0)+" MB";
  }
  function safeFilename(subject,startedAt,mime,topic=""){
    const base=String([subject,topic].filter(Boolean).join("_")||"Clase")
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-zA-Z0-9_-]+/g,"_").replace(/^_+|_+$/g,"").slice(0,55)||"Clase";
    const d=new Date(startedAt);
    const stamp=[
      d.getFullYear(),
      String(d.getMonth()+1).padStart(2,"0"),
      String(d.getDate()).padStart(2,"0"),
      String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")
    ].join("-");
    const ext=/mp4/i.test(mime)?"m4a":/ogg/i.test(mime)?"ogg":"webm";
    return base+"_"+stamp+"."+ext;
  }
  function setLiveStatus(text,activeNow=false){
    const el=document.querySelector("#classRecordingLive");
    if(el){
      el.textContent=text;
      el.classList.toggle("recording",activeNow);
    }
  }
  async function storageText(){
    try{
      const est=await navigator.storage?.estimate?.();
      if(!est?.usage)return "";
      return " · almacenamiento usado "+prettyBytes(est.usage);
    }catch{return "";}
  }
  function revokeUrls(){
    objectUrls.forEach(u=>URL.revokeObjectURL(u));
    objectUrls=[];
  }
  async function render(){
    const root=document.querySelector("#classRecordingsList");
    if(!root)return;
    revokeUrls();
    let rows=[];
    try{rows=await listRecordings();}
    catch(e){
      root.innerHTML='<p class="muted">No pude abrir las grabaciones guardadas en este navegador.</p>';
      return;
    }
    const extra=await storageText();
    const stat=document.querySelector("#classRecordingStatus");
    if(stat)stat.textContent=rows.length
      ?rows.length+" grabación"+(rows.length===1?"":"es")+" guardada"+(rows.length===1?"":"s")+" en este dispositivo"+extra+"."
      :"Todavía no hay grabaciones guardadas en este dispositivo.";

    if(!rows.length){
      root.innerHTML='<p class="muted">Cuando termines una clase, el audio aparecerá acá para volver a escucharlo.</p>';
      return;
    }

    const grouped=new Map();
    rows.forEach(r=>{
      const subject=r.subject||"Sin materia";
      const topic=r.topic||"Sin tema identificado";
      if(!grouped.has(subject))grouped.set(subject,new Map());
      const topics=grouped.get(subject);
      if(!topics.has(topic))topics.set(topic,[]);
      topics.get(topic).push(r);
    });

    root.innerHTML=[...grouped.entries()].map(([subject,topics])=>
      '<details class="recording-subject" open>'+
        '<summary>'+escapeHtml(subject)+'</summary>'+
        [...topics.entries()].map(([topic,recs])=>
          '<div class="recording-topic">'+
            '<h4>'+escapeHtml(topic)+'</h4>'+
            recs.map(r=>{
              const url=URL.createObjectURL(r.blob);
              objectUrls.push(url);
              const date=new Date(r.startedAt).toLocaleString("es-UY",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
              const filename=safeFilename(r.subject,r.startedAt,r.mimeType,r.topic);
              return '<article class="class-recording" data-recording-id="'+String(r.id).replace(/"/g,"&quot;")+'">'+
                '<div class="class-recording-head">'+
                  '<div><strong>'+escapeHtml(topic)+'</strong><div class="muted">'+escapeHtml(date)+' · '+escapeHtml(prettyDuration(r.durationMs))+' · '+escapeHtml(prettyBytes(r.size))+'</div></div>'+
                  '<span class="recording-saved">● guardada</span>'+
                '</div>'+
                '<audio controls preload="metadata" src="'+url+'"></audio>'+
                '<div class="class-recording-actions">'+
                  '<a class="button-link" href="'+url+'" download="'+escapeHtml(filename)+'">Guardar archivo</a>'+
                  '<button type="button" class="ghost delete-class-recording" data-id="'+escapeHtml(r.id)+'">Borrar</button>'+
                '</div>'+
              '</article>';
            }).join("")+
          '</div>'
        ).join("")+
      '</details>'
    ).join("");

    root.querySelectorAll(".delete-class-recording").forEach(btn=>btn.addEventListener("click",async()=>{
      const id=btn.dataset.id;
      if(!confirm("¿Querés borrar esta grabación de clase de este dispositivo?"))return;
      await removeRecording(id);
      await render();
      window.ROBOTITO_CLASS_ORGANIZER?.render?.();
    }));
  }
  async function start(subject,topic="",sessionId=null){
    if(active)return {ok:false,reason:"already-recording"};
    if(!window.MediaRecorder)return {ok:false,reason:"unsupported"};
    const source=state.stream;
    const tracks=source?.getAudioTracks?.().filter(t=>t.readyState==="live")||[];
    if(!tracks.length)return {ok:false,reason:"no-audio-track"};

    try{await navigator.storage?.persist?.();}catch{}

    const id=crypto.randomUUID?.()||("class-audio-"+Date.now()+"-"+Math.random().toString(16).slice(2));
    const startedAt=Date.now();
    const audioStream=new MediaStream(tracks.map(t=>t.clone?t.clone():t));
    const mimeType=pickMimeType();
    let recorder;
    try{
      recorder=mimeType?new MediaRecorder(audioStream,{mimeType,audioBitsPerSecond:96000}):new MediaRecorder(audioStream);
    }catch{
      recorder=new MediaRecorder(audioStream);
    }

    const session={
      id,
      sessionId:sessionId||id,
      subject:subject||"Clase",
      topic:topic||"",
      startedAt,recorder,audioStream,
      mimeType:recorder.mimeType||mimeType||"audio/webm",
      seq:0,pending:[],stopped:false,stopResolve:null,stopReject:null
    };
    active=session;

    recorder.ondataavailable=e=>{
      if(!e.data||!e.data.size)return;
      const seq=session.seq++;
      const write=putChunk(id,seq,e.data).catch(err=>console.warn("class audio chunk",err));
      session.pending.push(write);
    };
    recorder.onerror=e=>{
      console.warn("class audio recorder",e.error||e);
      setLiveStatus("problema al grabar audio",false);
    };
    recorder.start(1500);
    setLiveStatus("● grabando audio de la clase",true);
    await render();
    return {ok:true,id};
  }
  async function stop(){
    const session=active;
    if(!session)return null;
    if(session.stopped)return null;
    session.stopped=true;

    const stopped=new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>resolve(),8000);
      session.recorder.onstop=()=>{clearTimeout(timeout);resolve();};
      session.recorder.onerror=e=>{clearTimeout(timeout);reject(e.error||e);};
    });

    try{
      if(session.recorder.state!=="inactive")session.recorder.stop();
      await stopped;
      await Promise.allSettled(session.pending);
      // Give the final dataavailable write a brief chance to register.
      await new Promise(r=>setTimeout(r,80));
      await Promise.allSettled(session.pending);

      const rows=await chunksFor(session.id);
      if(!rows.length)throw new Error("La grabación quedó vacía.");
      const blob=new Blob(rows.map(x=>x.blob),{type:session.mimeType||rows[0].blob?.type||"audio/webm"});
      const endedAt=Date.now();
      const record={
        id:session.id,
        sessionId:session.sessionId,
        subject:session.subject,
        topic:session.topic||"",
        startedAt:session.startedAt,
        endedAt,
        durationMs:endedAt-session.startedAt,
        mimeType:blob.type||session.mimeType,
        size:blob.size,
        blob,
        transcriptFrom:session.startedAt,
        transcriptTo:endedAt,
        createdAt:Date.now()
      };
      await saveRecording(record);
      await clearChunks(session.id);
      setLiveStatus("audio guardado",false);
      return record;
    }catch(e){
      console.warn("class audio stop",e);
      setLiveStatus("no pude guardar el audio",false);
      return null;
    }finally{
      session.audioStream.getTracks().forEach(t=>{try{t.stop();}catch{}});
      active=null;
      await render();
    }
  }
  function isRecording(){return !!active&&active.recorder?.state==="recording";}

  window.ROBOTITO_CLASS_AUDIO={start,stop,render,isRecording,listRecordings,removeRecording,updateMetadata};

  document.addEventListener("DOMContentLoaded",()=>{
    render();
    window.addEventListener("pagehide",()=>{
      if(active?.recorder?.state==="recording"){
        try{active.recorder.requestData();}catch{}
      }
    });
  });
})();