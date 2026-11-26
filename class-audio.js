// Robotito — persistent audio recordings for Class Mode.
// Stores audio locally in IndexedDB so long classes do not live only in RAM.
(function(){
  const DB_NAME="robotito-class-audio-v1";
  const DB_VERSION=1;
  const RECORDINGS="recordings";
  const CHUNKS="chunks";
  let active=null;
  let recovering=0;
  let captureRequest=0;
  let objectUrls=[];
  let renderVersion=0;
  let playbackEpoch=null;

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
  async function saveLegacyRecording(record){
    const db=await openDb();
    const tx=db.transaction(RECORDINGS,"readwrite");
    tx.objectStore(RECORDINGS).put(record);
    await transactionDone(tx);
    db.close();
  }
  async function listLegacyRecordings(){
    const db=await openDb();
    const tx=db.transaction(RECORDINGS,"readonly");
    const rows=await requestResult(tx.objectStore(RECORDINGS).getAll());
    await transactionDone(tx).catch(()=>{});
    db.close();
    return rows.sort((a,b)=>b.startedAt-a.startedAt);
  }
  async function removeLegacyRecording(id){
    const db=await openDb();
    const tx=db.transaction(RECORDINGS,"readwrite");
    tx.objectStore(RECORDINGS).delete(id);
    await transactionDone(tx);
    db.close();
  }
  async function updateLegacyMetadata(id,patch={}){
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
  // Unified new storage, with read/migration compatibility for older recordings.
  const memoryId=id=>"class-audio:"+String(id);
  async function saveRecording(record){
    const store=window.ROBOTITO_STORE;
    if(!store?.putRecord||!store?.putBlob)return saveLegacyRecording(record);
    const id=memoryId(record.id),blob=record.blob;
    if(!(blob instanceof Blob))throw new Error("Missing audio blob");
    const owner=record.owner||window.ROBOTITO_MEMORY?.owner?.()||"local";
    const {blob:ignored,...metadata}=record;
    await store.putRecordWithBlob({id,type:"audios",owner,source:"class-recorder",
      timestamp:record.startedAt||Date.now(),subject:record.subject||"",topic:record.topic||"",
      blobId:id,data:metadata},blob,{type:"class-audio"});
    const checked=await store.getBlob(id);
    if(!checked||checked.size!==blob.size)throw new Error("Class audio integrity check failed");
    return record;
  }
  async function listRecordings(){
    const owner=window.ROBOTITO_MEMORY?.owner?.()||"local";
    const legacy=await listLegacyRecordings().catch(()=>[]);
    const store=window.ROBOTITO_STORE;
    if(!store?.queryRecords)return legacy;
    let modern=[];
    try{
      const rows=await store.queryRecords({type:"audios",owner,limit:Infinity});
      modern=await Promise.all(rows.filter(x=>x.source==="class-recorder"||x.source==="class-audio-migration").map(async x=>{
        const blob=await store.getBlob(x.blobId);
        return {...x.data,owner:x.owner,version:x.version,blob,subject:x.subject||x.data?.subject,topic:x.topic||x.data?.topic};
      }));
    }catch(e){console.warn("Class audio read",e);}
    if(owner!==(window.ROBOTITO_MEMORY?.owner?.()||"local"))return [];
    const ids=new Set(modern.map(x=>x.id));
    return modern.concat(window.ROBOTITO_MEMORY?.active?[]:legacy.filter(x=>!ids.has(x.id))).sort((a,b)=>b.startedAt-a.startedAt);
  }
  async function removeRecording(id,{owner=window.ROBOTITO_MEMORY?.owner?.()||"local",expectedVersion}={}){
    const store=window.ROBOTITO_STORE,saved=await store?.getRecord?.(memoryId(id));
    if(owner!==(window.ROBOTITO_MEMORY?.owner?.()||"local"))throw new Error("History changed");
    if(saved)return store.editRecord(memoryId(id),{owner,expectedVersion:expectedVersion??saved.version,remove:true});
    if(window.ROBOTITO_MEMORY?.active)throw new Error("Recording not found in this history");
    return removeLegacyRecording(id);
  }
  async function updateMetadata(id,patch={}){
    const owner=window.ROBOTITO_MEMORY?.owner?.()||"local";
    const store=window.ROBOTITO_STORE;
    const saved=await store?.getRecord?.(memoryId(id));
    if(owner!==(window.ROBOTITO_MEMORY?.owner?.()||"local"))throw new Error("History changed");
    if(saved){
      const allowed=Object.fromEntries(Object.entries(patch).filter(([key])=>["subject","topic","startedAt","transcriptFrom","transcriptTo"].includes(key)));
      const data={...saved.data,...allowed,id};
      await store.editRecord(saved.id,{owner,expectedVersion:saved.version,subject:data.subject||"",topic:data.topic||"",data});
      return {...data,blob:await store.getBlob(saved.blobId)};
    }
    if(window.ROBOTITO_MEMORY?.active)throw new Error("Recording not found in this history");
    return updateLegacyMetadata(id,patch);
  }
  async function migrateAudio(){
    const store=window.ROBOTITO_STORE;
    if(!store?.putRecord)return;
    const old=await listLegacyRecordings().catch(()=>[]);
    for(const record of old){
      try{
        if(!(await store.getRecord(memoryId(record.id)))){
          await saveRecording({...record,owner:"legacy:unassigned"});
        }
        const verified=await store.getRecord(memoryId(record.id));
        const blob=await store.getBlob(memoryId(record.id));
        if(verified&&blob?.size===record.blob?.size)await removeLegacyRecording(record.id);
      }catch(error){console.warn("Audio legacy migration preserved",record.id,error);}
    }
    // Older versions stored loose fragments without an owner or a manifest.
    // Preserve them as unassigned legacy material, never as a current visitor's
    // class and never with a fabricated original date or completion claim.
    try{
      const db=await openDb(),tx=db.transaction(CHUNKS,"readonly");
      const parts=await requestResult(tx.objectStore(CHUNKS).getAll());db.close();
      const groups=new Map();
      for(const part of parts){if(!groups.has(part.sessionId))groups.set(part.sessionId,[]);groups.get(part.sessionId).push(part);}
      for(const [sessionId,chunks] of groups){
        if(!sessionId||chunks.some(part=>!(part.blob instanceof Blob)))continue;
        chunks.sort((a,b)=>a.seq-b.seq);
        const size=chunks.reduce((sum,part)=>sum+part.blob.size,0);
        if(size>window.ROBOTITO_CLASS_JOURNAL.maxBytes)continue;
        const id="class-audio-orphan:"+sessionId,blob=new Blob(chunks.map(part=>part.blob),{type:chunks[0].blob.type||"audio/webm"});
        if(!(await store.getRecord(id)))await store.putRecordWithBlob({id,type:"audios",owner:"legacy:unassigned",source:"class-audio-orphan",blobId:id,
          data:{id,originalDateUnknown:true,complete:false,recoveredAt:Date.now(),size,chunkCount:chunks.length}},blob,{type:"class-audio"});
        const verified=await store.getRecord(id),file=await store.getBlob(id);
        if(verified?.owner==="legacy:unassigned"&&file?.size===size)await clearChunks(sessionId);
      }
    }catch(error){console.warn("Legacy audio fragments preserved",error);}
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
      uiSet(el,text);
      el.classList.toggle("recording",activeNow);
    }
  }
  async function storageText(){
    try{
      const est=await navigator.storage?.estimate?.();
      return Number(est?.usage)||0;
    }catch{return 0;}
  }
  function revokeUrls(){
    document.querySelectorAll("#classRecordingsList audio").forEach(player=>{player.pause();player.removeAttribute("src");player.load();});
    objectUrls.forEach(u=>URL.revokeObjectURL(u));
    objectUrls=[];
    endPlayback();
  }
  function endPlayback(){
    if(playbackEpoch===null)return;
    const epoch=playbackEpoch;playbackEpoch=null;state.classAudioPlaybackActive=false;
    if(epoch===state.captureEpoch&&state.started&&!document.hidden&&!state.captureSuspended&&!state.enrollmentActive&&!state.speaking&&!state.speechBlocked&&!state.voiceSampleCaptureActive&&!state.voiceSamplePlaybackActive){
      window.RobotitoLocalASR?.pause?.(false);
      if(typeof restartRecognitionAfterSpeech==="function")restartRecognitionAfterSpeech();
    }
  }
  async function render(){
    const root=document.querySelector("#classRecordingsList");
    if(!root)return;
    const version=++renderVersion;
    const owner=window.ROBOTITO_MEMORY?.owner?.()||"local";
    let drafts=[],rows=[];
    try{drafts=await window.ROBOTITO_CLASS_JOURNAL?.list?.(owner)||[];rows=await listRecordings();}
    catch(e){
      if(version!==renderVersion)return;
      revokeUrls();
      root.innerHTML='<p class="muted" data-ui-copy=No%20pude%20abrir%20las%20grabaciones%20guardadas%20en%20este%20navegador.>No pude abrir las grabaciones guardadas en este navegador.</p>';
      return;
    }
    const extra=await storageText();
    if(version!==renderVersion||owner!==(window.ROBOTITO_MEMORY?.owner?.()||"local"))return;
    revokeUrls();
    const recovery=document.getElementById("classRecordingRecovery");
    if(recovery){
      recovery.replaceChildren();
      for(const draft of drafts.filter(row=>row.id!==active?.id)){
        const line=document.createElement("div"),label=document.createElement("span"),recover=document.createElement("button"),discard=document.createElement("button");
        line.className="memory-row";
        uiSet(label,"Grabación interrumpida: {subject} · {size}",{subject:draft.subject,size:prettyBytes(draft.committedBytes)});
        uiSet(recover,"Recuperar audio parcial");uiSet(discard,"Descartar fragmentos");
        recover.type=discard.type="button";recover.disabled=draft.leaseUntil>Date.now();discard.disabled=recover.disabled;
        if(recover.disabled){uiSet(label,"Hay una grabación activa en otra pestaña. Volvé a revisar en unos segundos.");
          const refresh=document.createElement("button");refresh.type="button";uiSet(refresh,"Actualizar");refresh.onclick=()=>void render();line.append(refresh);}
        recover.onclick=async()=>{
          try{await recoverRecording(draft.id,{owner});}catch{setLiveStatus("No pude finalizar el audio. Revisá las grabaciones interrumpidas.");}await render();
        };
        discard.onclick=async()=>{
          if(owner!==(window.ROBOTITO_MEMORY?.owner?.()||"local")||!confirm(uiText("¿Querés descartar estos fragmentos de audio?")))return;
          try{await window.ROBOTITO_CLASS_JOURNAL.discard(draft.id,owner);}catch{setLiveStatus("No pude finalizar el audio. Revisá las grabaciones interrumpidas.");}await render();
        };
        line.append(label,recover,discard);recovery.append(line);
      }
    }
    const stat=document.querySelector("#classRecordingStatus");
    if(stat){
      stat.removeAttribute("data-i18n");
      const count=document.createElement("span");
      stat.replaceChildren(count);
      uiSet(count,rows.length?"{count} grabaciones guardadas en este dispositivo.":"Todavía no hay grabaciones guardadas en este dispositivo.",{count:rows.length});
      if(extra){
        const usage=document.createElement("span");stat.append(" · ",usage);
        uiSet(usage,"Almacenamiento usado: {size}",{size:prettyBytes(extra)});
      }
    }

    if(!rows.length){
      root.innerHTML='<p class="muted" data-ui-copy=Cuando%20termines%20una%20clase%2C%20el%20audio%20aparecer%C3%A1%20ac%C3%A1%20para%20volver%20a%20escucharlo.>Cuando termines una clase, el audio aparecerá acá para volver a escucharlo.</p>';
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
              const url=r.blob instanceof Blob&&r.blob.size?URL.createObjectURL(r.blob):null;
              if(url)objectUrls.push(url);
              const date=new Date(r.startedAt).toLocaleString(window.ROBOTITO_I18N.locale(state.languageMode),{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
              const filename=safeFilename(r.subject,r.startedAt,r.mimeType,r.topic);
              return '<article class="class-recording" data-recording-id="'+String(r.id).replace(/"/g,"&quot;")+'">'+
                '<div class="class-recording-head">'+
                  '<div><strong>'+escapeHtml(topic)+'</strong><div class="muted"><span data-recording-date="'+Number(r.startedAt)+'">'+escapeHtml(date)+'</span> · '+escapeHtml(prettyDuration(r.durationMs))+' · '+escapeHtml(prettyBytes(r.size))+'</div></div>'+
                  '<span class="recording-saved" data-ui-copy="'+encodeURIComponent(r.complete===false?"● parcial recuperada":"● guardada")+'">'+escapeHtml(uiText(r.complete===false?"● parcial recuperada":"● guardada"))+'</span>'+
                '</div>'+
                (url?'<audio controls preload="metadata" src="'+url+'"></audio>':'<p>'+escapeHtml(uiText("El registro existe, pero falta el archivo de audio."))+'</p>')+
                '<div class="class-recording-actions">'+
                  (url?'<a class="button-link" href="'+url+'" download="'+escapeHtml(filename)+'" data-ui-copy=Guardar%20archivo>Guardar archivo</a>':'')+
                  '<button type="button" class="ghost delete-class-recording" data-id="'+escapeHtml(r.id)+'" data-ui-copy=Borrar>Borrar</button>'+
                '</div>'+
              '</article>';
            }).join("")+
          '</div>'
        ).join("")+
      '</details>'
    ).join("");

    root.querySelectorAll(".delete-class-recording").forEach(btn=>btn.addEventListener("click",async()=>{
      const id=btn.dataset.id;
      if(!confirm(uiText("¿Querés borrar esta grabación de clase de este dispositivo?")))return;
      try{await removeRecording(id,{owner,expectedVersion:rows.find(row=>row.id===id)?.version});}
      catch{setLiveStatus("No se guardó el cambio: la memoria cambió en otra pestaña. Recargá y revisá los datos.");}
      await render();
      window.ROBOTITO_CLASS_ORGANIZER?.render?.();
    }));
    root.querySelectorAll("audio").forEach(player=>{
      player.addEventListener("play",()=>{
        if(owner!==(window.ROBOTITO_MEMORY?.owner?.()||"local")||state.classMode||document.hidden||state.enrollmentActive||state.voiceSampleCaptureActive||state.voiceSamplePlaybackActive){player.pause();return;}
        root.querySelectorAll("audio").forEach(other=>{if(other!==player)other.pause();});
        if(typeof stopSpeaking==="function")stopSpeaking();
        playbackEpoch=state.captureEpoch;state.classAudioPlaybackActive=true;
        window.RobotitoLocalASR?.pause?.(true);
        if(typeof discardRecognition==="function")discardRecognition();
      });
      for(const event of ["pause","ended","error"])player.addEventListener(event,()=>{
        if(![...root.querySelectorAll("audio")].some(item=>!item.paused&&!item.ended))endPlayback();
      });
    });
  }
  async function start(subject,topic="",sessionId=null){
    if(active)return {ok:false,reason:"already-recording"};
    document.querySelectorAll("#classRecordingsList audio").forEach(player=>player.pause());endPlayback();
    if(!window.MediaRecorder||!window.ROBOTITO_CLASS_JOURNAL)return {ok:false,reason:"unsupported"};
    const source=window.ROBOTITO_YOUTUBE_MATERIAL?.captureStream||state.stream;
    const sharedCapture=source===state.stream,epoch=state.captureEpoch,revision=state.captureRevision;
    const tracks=source?.getAudioTracks?.().filter(t=>t.readyState==="live")||[];
    if(!tracks.length)return {ok:false,reason:"no-audio-track"};
    const request=++captureRequest,owner=window.ROBOTITO_MEMORY?.owner?.()||"local";
    // Firefox may leave this optional permission pending until the user
    // answers a browser prompt. Best-effort storage is enough to start;
    // recording and cancellation must not wait for persistent-storage consent.
    try{Promise.resolve(navigator.storage?.persist?.()).catch(()=>{});}catch{}
    const canceled=()=>request!==captureRequest||owner!==(window.ROBOTITO_MEMORY?.owner?.()||"local")||
      sharedCapture&&(source!==state.stream||state.captureEpoch!==epoch||state.captureRevision!==revision||!state.started||document.hidden||state.captureSuspended);
    if(canceled())return {ok:false,reason:"capture-canceled"};
    if(tracks.some(track=>track.readyState!=="live"))return {ok:false,reason:"no-audio-track"};
    const id=crypto.randomUUID(),writerToken=crypto.randomUUID(),startedAt=Date.now();
    // Never stop the shared microphone when releasing the recorder's clones.
    let audioStream,recorder;
    try{
      audioStream=new MediaStream(tracks.map(track=>track.clone()));
      const mimeType=pickMimeType();
      try{recorder=mimeType?new MediaRecorder(audioStream,{mimeType,audioBitsPerSecond:96000}):new MediaRecorder(audioStream);}
      catch{recorder=new MediaRecorder(audioStream);}
    }catch(error){audioStream?.getTracks().forEach(track=>track.stop());return {ok:false,reason:"recorder-start-failed"};}
    const metadata={id,owner,writerToken,sessionId:sessionId||id,subject:subject||"Clase",topic:topic||"",startedAt,mimeType:recorder.mimeType||"audio/webm"};
    const session={...metadata,recorder,audioStream,seq:0,pending:Promise.resolve(),pendingBytes:0,stopped:false,finalized:false,error:null};
    active=session;
    let done;session.done=new Promise(resolve=>{done=resolve;});
    recorder.onstop=()=>{done();if(!session.stopped){session.error||=new Error("Recording interrupted");void stop();}};
    recorder.onerror=event=>{session.error=event.error||new Error("Recorder failed");void stop();};
    recorder.ondataavailable=event=>{
      if(session.finalized||session.error||!event.data?.size)return;
      const blob=event.data,at=Date.now();
      if(session.pendingBytes+blob.size>8*1024*1024){session.error=new Error("Recording storage cannot keep up");void stop();return;}
      const seq=session.seq++;session.pendingBytes+=blob.size;
      session.pending=session.pending.then(async()=>{
        if(session.error)return;
        await window.ROBOTITO_CLASS_JOURNAL.append(id,owner,writerToken,seq,blob,at);
      }).catch(error=>{session.error=error;void stop();}).finally(()=>{session.pendingBytes-=blob.size;});
    };
    session.onTrackEnded=()=>{session.error||=new Error("Audio track interrupted");void stop();};
    for(const track of tracks)for(const event of ["ended","mute"])track.addEventListener?.(event,session.onTrackEnded);
    session.sourceTracks=tracks;
    session.ready=window.ROBOTITO_CLASS_JOURNAL.begin(metadata);
    try{
      await session.ready;
      if(canceled()||session.stopped){await stop();return {ok:false,reason:"capture-canceled"};}
      recorder.start(1500);
      session.heartbeat=setInterval(()=>{
        session.heartbeatJob=window.ROBOTITO_CLASS_JOURNAL.touch(id,owner,writerToken).catch(error=>{session.error=error;void stop();});
      },5000);
      setLiveStatus("● grabando audio de la clase",true);await render();return {ok:true,id};
    }catch(error){session.error=error;await stop();return {ok:false,reason:"recorder-start-failed"};}
  }
  async function stop(){
    ++captureRequest;
    const session=active;if(!session)return null;
    if(session.stopPromise)return session.stopPromise;
    session.stopped=true;session.endedAt=Date.now();clearInterval(session.heartbeat);
    const wasActive=session.recorder.state!=="inactive";
    try{if(wasActive)session.recorder.stop();}catch(error){session.error=error;}
    // Release hardware synchronously, even when IndexedDB is slow or full.
    session.audioStream.getTracks().forEach(track=>{try{track.stop();}catch{}});
    for(const track of session.sourceTracks||[])for(const event of ["ended","mute"])track.removeEventListener?.(event,session.onTrackEnded);
    session.stopPromise=(async()=>{
      let timeout;
      try{
        await session.ready;
        if(wasActive)await Promise.race([session.done,new Promise(resolve=>{timeout=setTimeout(()=>{session.error||=new Error("Recorder stop timed out");resolve();},8000);})]);
        clearTimeout(timeout);session.finalized=true;
        await session.pending;await session.heartbeatJob;
        const journal=window.ROBOTITO_CLASS_JOURNAL;
        const pending=(await journal.list(session.owner)).find(row=>row.id===session.id);
        if(!pending)throw new Error("Recording was removed from memory");
        if(!pending.chunkCount){await journal.discard(session.id,session.owner,session.writerToken);throw new Error("Empty recording");}
        await journal.seal(session.id,session.owner,session.writerToken,{complete:!session.error,endedAt:session.endedAt,reason:session.error?.message});
        const record=await journal.finish(session.id,session.owner,session.writerToken);
        if(session.owner===(window.ROBOTITO_MEMORY?.owner?.()||"local"))setLiveStatus(record.complete?"audio guardado":"Audio parcial guardado. La grabación se interrumpió.");
        return record;
      }catch(error){
        console.warn("class audio stop",error);
        if(session.owner===(window.ROBOTITO_MEMORY?.owner?.()||"local"))setLiveStatus("No pude finalizar el audio. Revisá las grabaciones interrumpidas.");
        return null;
      }finally{
        clearTimeout(timeout);session.finalized=true;
        if(active===session)active=null;
        await render();
      }
    })();return session.stopPromise;
  }
  function isRecording(){return !!active&&active.recorder?.state==="recording";}
  async function recoverRecording(id,{owner=window.ROBOTITO_MEMORY?.owner?.()||"local"}={}){
    if(active?.id===id||owner!==(window.ROBOTITO_MEMORY?.owner?.()||"local"))throw Error("Recording history changed or still active");
    recovering++;
    try{
      const journal=window.ROBOTITO_CLASS_JOURNAL,token=await journal.claim(id,owner);
      if(owner!==(window.ROBOTITO_MEMORY?.owner?.()||"local"))throw Error("Recording history changed");
      const result=await journal.finish(id,owner,token);
      if(owner===(window.ROBOTITO_MEMORY?.owner?.()||"local"))setLiveStatus("Audio parcial guardado. La grabación se interrumpió.");
      return result;
    }finally{recovering--;}
  }
  function refreshLocale(){
    for(const node of document.querySelectorAll("[data-recording-date]")){
      node.textContent=new Date(Number(node.dataset.recordingDate)).toLocaleString(
        window.ROBOTITO_I18N.locale(state.languageMode),{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
    }
  }

  window.ROBOTITO_CLASS_AUDIO={start,stop,isBusy:()=>Boolean(active||recovering),render,refreshLocale,isRecording,listRecordings,listPending:()=>window.ROBOTITO_CLASS_JOURNAL.list(window.ROBOTITO_MEMORY?.owner?.()||"local"),removeRecording,updateMetadata,migrateAudio,recoverRecording};

  window.addEventListener("robotito:memoryscopechange",()=>{
    ++captureRequest;++renderVersion;revokeUrls();
    for(const id of ["classRecordingsList","classRecordingStatus","classRecordingLive","classRecordingRecovery"])document.getElementById(id)?.replaceChildren();
    if(active&&!active.stopped)void stop();
  });
  document.addEventListener("visibilitychange",()=>{if(document.hidden){document.querySelectorAll("#classRecordingsList audio").forEach(player=>player.pause());endPlayback();}});

  document.addEventListener("DOMContentLoaded",()=>{
    void migrateAudio().finally(()=>render());
    render();
    window.addEventListener("pagehide",()=>{
      if(active){active.error||=new Error("Page closed during recording");void stop();}
    });
  });
})();
