// Robotito — organize classes as Subject → Topic → Session.
(function(){
  const SUMMARY_KEY="robotito.classSummaries.v1";

  function norm(s){
    return String(s||"").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9ñ\s]/g," ")
      .replace(/\s+/g," ").trim();
  }
  function esc(s){
    if(typeof escapeHtml==="function")return escapeHtml(s);
    return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  }
  function parseLegacyLabel(value){
    const raw=String(value||"").trim();
    const m=raw.match(/^(.+?)\s+[—–-]\s+(.+)$/);
    if(!m)return {subject:raw||"Clase",topic:""};
    return {subject:m[1].trim()||"Clase",topic:m[2].trim()};
  }
  function dayKey(ts){
    const d=new Date(ts||Date.now());
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("");
  }
  function legacySessionId(item,index){
    const parsed=parseLegacyLabel(item.subject||"Clase");
    return "legacy-"+norm(parsed.subject).slice(0,24).replace(/\s+/g,"-")+"-"+norm(item.topic||parsed.topic||"sin-tema").slice(0,28).replace(/\s+/g,"-")+"-"+dayKey(item.at||item.createdAt)+"-"+Math.floor(index/80);
  }
  function migrate(){
    let linesChanged=false;
    const bucketMap=new Map();
    state.classLines.forEach((line,i)=>{
      const parsed=parseLegacyLabel(line.subject||"Clase");
      if(!line.topic&&parsed.topic){line.topic=parsed.topic;linesChanged=true;}
      if(line.subject!==parsed.subject){line.subject=parsed.subject;linesChanged=true;}
      if(!line.sessionId){
        const base=norm(line.subject)+"|"+norm(line.topic||"")+"|"+dayKey(line.at);
        if(!bucketMap.has(base))bucketMap.set(base,"legacy-session-"+Date.now().toString(36)+"-"+bucketMap.size);
        line.sessionId=bucketMap.get(base);
        linesChanged=true;
      }
    });
    if(linesChanged)save("robotito.classLines.v1",state.classLines);

    let sumChanged=false;
    state.classSummaries=(state.classSummaries||[]).map((summary,i)=>{
      const parsed=parseLegacyLabel(summary.subject||"Clase");
      const next={...summary};
      if(!next.topic&&parsed.topic){next.topic=parsed.topic;sumChanged=true;}
      if(next.subject!==parsed.subject){next.subject=parsed.subject;sumChanged=true;}
      if(!next.sessionId){
        next.sessionId=legacySessionId(next,i);
        sumChanged=true;
      }
      return next;
    });
    if(sumChanged)save(SUMMARY_KEY,state.classSummaries);

    let materialChanged=false;
    state.academicMaterials=(state.academicMaterials||[]).map(m=>{
      const parsed=parseLegacyLabel(m.subject||"Material");
      const next={...m};
      if(!next.topic&&parsed.topic){next.topic=parsed.topic;materialChanged=true;}
      if(next.subject!==parsed.subject){next.subject=parsed.subject;materialChanged=true;}
      return next;
    });
    if(materialChanged)save("robotito.academicMaterials.v1",state.academicMaterials);
  }

  const TOPIC_STOP=new Set([
    "que","como","para","por","porque","cuando","donde","cual","cuales","quien","quienes","esto","esta","este",
    "una","uno","unos","unas","los","las","del","de","con","sin","sobre","entre","desde","hasta","muy","mas","más",
    "son","era","eran","fue","hay","tiene","tienen","hacer","hace","puede","pueden","profesor","profesora","clase",
    "entonces","bueno","tambien","también","pero","esto","eso","cada","vamos","ahora","despues","después"
  ]);
  function topicWords(text){
    return norm(text).split(" ").filter(w=>w.length>=4&&!TOPIC_STOP.has(w));
  }
  function fallbackTopic(lines,subject){
    const all=lines.map(l=>l.correctedText||l.text||"").join(" ");
    const subjectWords=new Set(topicWords(subject));
    const tokens=topicWords(all).filter(w=>!subjectWords.has(w));
    const counts=new Map();
    tokens.forEach(w=>counts.set(w,(counts.get(w)||0)+1));

    const bigramCounts=new Map();
    for(let i=0;i<tokens.length-1;i++){
      const bg=tokens[i]+" "+tokens[i+1];
      bigramCounts.set(bg,(bigramCounts.get(bg)||0)+1);
    }
    const bestBigram=[...bigramCounts.entries()]
      .filter(([bg,n])=>n>=2&&bg.split(" ")[0]!==bg.split(" ")[1])
      .sort((a,b)=>b[1]-a[1])[0]?.[0];
    if(bestBigram)return bestBigram.replace(/\b\w/g,m=>m.toUpperCase());

    const top=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
    if(top.length)return top.join(" · ").replace(/^./,m=>m.toUpperCase());
    return "Tema no identificado";
  }
  async function inferTopic(lines,subject){
    const useful=lines
      .filter(l=>l.speaker==="teacher"||l.speaker==="classmate")
      .map(l=>l.correctedText||l.text||"")
      .filter(t=>t.length>20)
      .slice(0,24);
    if(!useful.length)return "Tema no identificado";

    try{
      if(window.LanguageModel?.create){
        const session=await window.LanguageModel.create({temperature:0,topK:1});
        const prompt=`Identificá el tema principal de esta clase de ${subject||"una materia"}.
Usá solo la transcripción.
Respondé únicamente con un título breve de 2 a 7 palabras, sin comillas, sin punto final y sin anteponer "Tema".
Transcripción:
${useful.join("\n").slice(0,7000)}`;
        const out=String(await session.prompt(prompt)||"")
          .replace(/^["“]|["”]$/g,"").replace(/[.。]$/,"").trim();
        session.destroy?.();
        if(out&&out.length<=90)return out;
      }
    }catch(e){console.warn("topic inference",e);}
    return fallbackTopic(lines,subject);
  }
  function currentSessionLines(){
    const id=state.classSessionId||state.selectedClassSessionId;
    if(id){
      const exact=state.classLines.filter(l=>l.sessionId===id);
      if(exact.length)return exact;
    }
    const subject=norm(state.classSubject||document.querySelector("#classSubject")?.value||"");
    const topic=norm(state.classTopic||document.querySelector("#classTopic")?.value||"");
    return state.classLines.filter(l=>{
      const subjectOk=!subject||norm(l.subject)===subject;
      const topicOk=!topic||norm(l.topic)===topic;
      return subjectOk&&topicOk;
    });
  }
  function buildSummaryText(lines){
    const candidates=lines
      .filter(l=>l.speaker==="teacher"||l.speaker==="classmate")
      .map(l=>(l.correctedText||l.text||"").replace(/\s+/g," ").trim())
      .filter(t=>t.length>32);
    const seen=new Set(),selected=[];
    for(const text of candidates){
      const key=norm(text).split(" ").slice(0,8).join(" ");
      if(!key||seen.has(key))continue;
      seen.add(key);
      selected.push(text);
      if(selected.length>=6)break;
    }
    return selected;
  }
  async function finalizeSession(endedAt,recording=null){
    const sessionId=state.classSessionId;
    const lines=state.classLines.filter(l=>l.sessionId===sessionId);
    let topic=String(state.classTopic||document.querySelector("#classTopic")?.value||"").trim();
    if(!topic)topic=await inferTopic(lines,state.classSubject||"Clase");
    state.classTopic=topic;
    if(document.querySelector("#classTopic"))document.querySelector("#classTopic").value=topic;

    lines.forEach(l=>{l.topic=topic;l.subject=state.classSubject||l.subject||"Clase";});
    save("robotito.classLines.v1",state.classLines);

    if(recording?.id){
      await window.ROBOTITO_CLASS_AUDIO?.updateMetadata?.(recording.id,{
        sessionId,
        subject:state.classSubject||"Clase",
        topic
      });
    }

    const points=buildSummaryText(lines);
    const existingIndex=state.classSummaries.findIndex(x=>x.sessionId===sessionId);
    const entry={
      id:existingIndex>=0?state.classSummaries[existingIndex].id:(crypto.randomUUID?.()||("summary-"+Date.now())),
      sessionId,
      subject:state.classSubject||"Clase",
      topic,
      startedAt:state.classStartedAt,
      endedAt:endedAt||Date.now(),
      lineCount:lines.length,
      points,
      updatedAt:Date.now()
    };
    if(existingIndex>=0)state.classSummaries[existingIndex]=entry;
    else state.classSummaries.push(entry);
    save(SUMMARY_KEY,state.classSummaries);

    state.selectedClassSessionId=sessionId;
    render();
    window.ROBOTITO_CLASS_AUDIO?.render?.();
    if(typeof summarizeClass==="function")summarizeClass();
    return entry;
  }
  async function generateAndSaveClassSummary(endedAt,recording=null){
    return await finalizeSession(endedAt,recording);
  }
  function sessionsFromLines(){
    const map=new Map();
    state.classLines.forEach(line=>{
      const id=line.sessionId||legacySessionId(line,0);
      if(!map.has(id)){
        map.set(id,{
          sessionId:id,
          subject:line.subject||"Clase",
          topic:line.topic||"Tema no identificado",
          startedAt:line.at||Date.now(),
          endedAt:line.at||Date.now(),
          lineCount:0,
          points:[]
        });
      }
      const s=map.get(id);
      s.startedAt=Math.min(s.startedAt,line.at||s.startedAt);
      s.endedAt=Math.max(s.endedAt,line.at||s.endedAt);
      s.lineCount++;
    });
    (state.classSummaries||[]).forEach(summary=>{
      const prev=map.get(summary.sessionId)||{};
      map.set(summary.sessionId,{...prev,...summary});
    });
    return [...map.values()];
  }
  function groupSessions(){
    const subjects=new Map();
    sessionsFromLines().forEach(session=>{
      const subject=session.subject||"Sin materia";
      const topic=session.topic||"Tema no identificado";
      if(!subjects.has(subject))subjects.set(subject,new Map());
      const topics=subjects.get(subject);
      if(!topics.has(topic))topics.set(topic,[]);
      topics.get(topic).push(session);
    });
    return subjects;
  }
  function selectSession(id){
    const session=sessionsFromLines().find(x=>x.sessionId===id);
    if(!session)return;
    state.selectedClassSessionId=id;
    state.classSubject=session.subject||"Clase";
    state.classTopic=session.topic||"";
    const s=document.querySelector("#classSubject");
    const t=document.querySelector("#classTopic");
    if(s)s.value=state.classSubject;
    if(t)t.value=state.classTopic;
    if(typeof renderClassTranscript==="function")renderClassTranscript();
    if(typeof summarizeClass==="function")summarizeClass();
    document.querySelector("#classTranscript")?.scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  function dateTimeLocalValue(timestamp){
    const d=new Date(timestamp||Date.now());
    const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,16);
  }
  function openSessionEditor(id){
    const session=sessionsFromLines().find(x=>x.sessionId===id);
    if(!session)return;
    if(state.classMode&&state.classSessionId===id){
      toast("Terminá la clase antes de editar sus datos.");
      return;
    }
    const dialog=document.querySelector("#classSessionEditor");
    if(!dialog)return;
    document.querySelector("#editClassSessionId").value=id;
    document.querySelector("#editClassSubject").value=session.subject||"";
    document.querySelector("#editClassTopic").value=session.topic||"";
    document.querySelector("#editClassDateTime").value=dateTimeLocalValue(session.startedAt);
    if(typeof dialog.showModal==="function")dialog.showModal();
    else dialog.setAttribute("open","");
    setTimeout(()=>document.querySelector("#editClassSubject")?.focus(),30);
  }
  function closeSessionEditor(){
    const dialog=document.querySelector("#classSessionEditor");
    if(!dialog)return;
    if(typeof dialog.close==="function")dialog.close();
    else dialog.removeAttribute("open");
  }
  async function saveSessionEdit(event){
    event?.preventDefault?.();
    const id=document.querySelector("#editClassSessionId")?.value||"";
    const subject=String(document.querySelector("#editClassSubject")?.value||"").trim();
    const topic=String(document.querySelector("#editClassTopic")?.value||"").trim();
    const dateValue=document.querySelector("#editClassDateTime")?.value||"";
    const newStartedAt=new Date(dateValue).getTime();
    const session=sessionsFromLines().find(x=>x.sessionId===id);
    if(!id||!session)return;
    if(!subject||!topic||!Number.isFinite(newStartedAt)){
      toast("Completá la materia, el tema, la fecha y la hora.");
      return;
    }
    const oldStartedAt=Number(session.startedAt)||newStartedAt;
    const delta=newStartedAt-oldStartedAt;
    const oldEndedAt=Number(session.endedAt)||oldStartedAt;
    const duration=Math.max(0,oldEndedAt-oldStartedAt);

    state.classLines.forEach(line=>{
      if(line.sessionId!==id)return;
      line.subject=subject;
      line.topic=topic;
      if(Number.isFinite(Number(line.at)))line.at=Number(line.at)+delta;
    });
    save("robotito.classLines.v1",state.classLines);

    state.classSummaries=(state.classSummaries||[]).map(summary=>{
      if(summary.sessionId!==id)return summary;
      return {
        ...summary,
        subject,
        topic,
        startedAt:newStartedAt,
        endedAt:newStartedAt+duration
      };
    });
    save(SUMMARY_KEY,state.classSummaries);

    if(state.selectedClassSessionId===id){
      state.classSubject=subject;
      state.classTopic=topic;
      const subjectInput=document.querySelector("#classSubject");
      const topicInput=document.querySelector("#classTopic");
      if(subjectInput)subjectInput.value=subject;
      if(topicInput)topicInput.value=topic;
    }

    try{
      const audio=window.ROBOTITO_CLASS_AUDIO;
      const recordings=await audio?.listRecordings?.()||[];
      for(const recording of recordings.filter(r=>r.sessionId===id||r.id===id)){
        const patch={subject,topic,startedAt:newStartedAt};
        if(Number.isFinite(Number(recording.transcriptFrom)))patch.transcriptFrom=Number(recording.transcriptFrom)+delta;
        await audio.updateMetadata?.(recording.id,patch);
      }
      await audio?.render?.();
    }catch(error){
      console.warn("class edit audio metadata",error);
    }

    closeSessionEditor();
    render();
    if(typeof renderClassTranscript==="function"&&state.selectedClassSessionId===id)renderClassTranscript();
    if(typeof summarizeClass==="function"&&state.selectedClassSessionId===id)summarizeClass();
    toast("Clase actualizada correctamente.");
  }

  function render(){
    const root=document.querySelector("#classLibrary");
    if(!root)return;
    const grouped=groupSessions();
    if(!grouped.size){
      root.innerHTML='<p class="muted">Todavía no hay clases organizadas.</p>';
      return;
    }
    root.innerHTML=[...grouped.entries()]
      .sort((a,b)=>a[0].localeCompare(b[0],"es"))
      .map(([subject,topics])=>
        '<details class="class-subject-group" open>'+
          '<summary><span>📚</span> '+esc(subject)+'</summary>'+
          '<div class="class-topic-groups">'+
          [...topics.entries()]
            .sort((a,b)=>a[0].localeCompare(b[0],"es"))
            .map(([topic,sessions])=>
              '<details class="class-topic-group" open>'+
                '<summary>'+esc(topic)+' <span class="muted">('+sessions.length+' clase'+(sessions.length===1?'':'s')+')</span></summary>'+
                '<div class="class-session-list">'+
                sessions.sort((a,b)=>(b.startedAt||0)-(a.startedAt||0)).map(session=>{
                  const date=new Date(session.startedAt||Date.now()).toLocaleString("es-UY",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
                  const duration=session.endedAt&&session.startedAt?Math.max(0,Math.round((session.endedAt-session.startedAt)/60000)):null;
                  const point=(session.points||[])[0]||"";
                  return '<div class="class-session-row">'+
                    '<button type="button" class="class-session-item" data-session-id="'+esc(session.sessionId)+'">'+
                      '<span class="class-session-date">'+esc(date)+'</span>'+
                      '<strong>'+esc(topic)+'</strong>'+
                      '<span class="muted">'+session.lineCount+' fragmentos'+(duration!==null?' · '+duration+' min':'')+'</span>'+
                      (point?'<span class="class-session-preview">'+esc(point.slice(0,150))+(point.length>150?'…':'')+'</span>':'')+
                    '</button>'+
                    '<button type="button" class="ghost class-session-edit" data-session-id="'+esc(session.sessionId)+'" aria-label="Editar '+esc(topic)+'">✏️ Editar</button>'+
                  '</div>';
                }).join("")+
                '</div>'+
              '</details>'
            ).join("")+
          '</div>'+
        '</details>'
      ).join("");

    root.querySelectorAll(".class-session-item").forEach(btn=>
      btn.addEventListener("click",()=>selectSession(btn.dataset.sessionId))
    );
    root.querySelectorAll(".class-session-edit").forEach(btn=>
      btn.addEventListener("click",()=>openSessionEditor(btn.dataset.sessionId))
    );
  }

  async function migrateAudioRecordings(){
    const api=window.ROBOTITO_CLASS_AUDIO;
    if(!api?.listRecordings||!api?.updateMetadata)return;
    try{
      const recordings=await api.listRecordings();
      const sessions=sessionsFromLines();
      for(const rec of recordings){
        const parsed=parseLegacyLabel(rec.subject||"Clase");
        let subject=parsed.subject||"Clase";
        let topic=rec.topic||parsed.topic||"";
        let sessionId=rec.sessionId||null;

        if(!sessionId){
          const candidates=sessions
            .filter(s=>norm(s.subject)===norm(subject) && (!topic||norm(s.topic)===norm(topic)))
            .map(s=>({...s,diff:Math.abs((s.startedAt||0)-(rec.startedAt||0))}))
            .sort((a,b)=>a.diff-b.diff);
          if(candidates[0]&&candidates[0].diff<8*60*60*1000){
            sessionId=candidates[0].sessionId;
            if(!topic)topic=candidates[0].topic||"";
          }
        }
        if(subject!==rec.subject||topic!==rec.topic||sessionId!==rec.sessionId){
          await api.updateMetadata(rec.id,{subject,topic,sessionId:sessionId||rec.id});
        }
      }
      await api.render?.();
    }catch(e){console.warn("audio metadata migration",e);}
  }

  function chunkAcademicText(text,size=1200){
    const clean=String(text||"").replace(/\s+/g," ").trim();
    if(!clean)return [];
    const sentences=clean.split(/(?<=[.!?])\s+/).filter(Boolean);
    const chunks=[];
    let current="";
    for(const sentence of sentences){
      if(!current){current=sentence;continue;}
      if((current+" "+sentence).length<=size)current+=" "+sentence;
      else{chunks.push(current);current=sentence;}
    }
    if(current)chunks.push(current);
    return chunks.length?chunks:[clean.slice(0,size)];
  }
  async function textFromAcademicFile(file){
    const name=String(file.name||"").toLowerCase();
    if(name.endsWith(".pdf")||file.type==="application/pdf"){
      const pdfjs=await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs");
      const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
      const pages=[];
      for(let p=1;p<=pdf.numPages;p++){
        const page=await pdf.getPage(p);
        const content=await page.getTextContent();
        pages.push(content.items.map(x=>x.str||"").join(" "));
      }
      return pages.join("\n");
    }
    const raw=await file.text();
    if(name.endsWith(".srt")||name.endsWith(".vtt")||file.type==="text/vtt"||file.type==="application/x-subrip"){
      return raw
        .replace(/^\uFEFF?WEBVTT[^\n]*$/gim,"")
        .replace(/^\s*\d+\s*$/gm,"")
        .replace(/^\s*(?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}\s*-->\s*(?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}.*$/gm,"")
        .replace(/^\s*(?:NOTE|STYLE|REGION)\b.*$/gim,"")
        .replace(/<[^>]+>/g,"")
        .replace(/\n{3,}/g,"\n\n")
        .trim();
    }
    return raw;
  }
  function renderAcademicMaterials(){
    const root=document.querySelector("#academicFilesList");
    if(!root)return;
    const mats=state.academicMaterials||[];
    if(!mats.length){
      root.innerHTML='<p class="muted">Todavía no cargaste material.</p>';
      return;
    }
    const grouped=new Map();
    mats.forEach(m=>{
      const subject=m.subject||"Sin materia";
      const topic=m.topic||"Material general";
      if(!grouped.has(subject))grouped.set(subject,new Map());
      const topics=grouped.get(subject);
      if(!topics.has(topic))topics.set(topic,[]);
      topics.get(topic).push(m);
    });
    root.innerHTML=[...grouped.entries()].map(([subject,topics])=>
      '<div class="academic-subject-group"><strong>'+esc(subject)+'</strong>'+
      [...topics.entries()].map(([topic,items])=>
        '<div class="academic-topic-group"><span class="academic-topic-title">'+esc(topic)+'</span>'+
        items.map(m=>
          '<div class="academic-file-row">'+
            '<span>📄 '+esc(m.name)+(Array.isArray(m.exercises)&&m.exercises.length?' · '+m.exercises.length+' ejercicios detectados':'')+'</span>'+
            '<button type="button" class="ghost delete-academic-file" data-id="'+esc(m.id)+'">Borrar</button>'+
          '</div>'
        ).join("")+
        '</div>'
      ).join("")+
      '</div>'
    ).join("");

    root.querySelectorAll(".delete-academic-file").forEach(btn=>btn.addEventListener("click",()=>{
      state.academicMaterials=state.academicMaterials.filter(m=>m.id!==btn.dataset.id);
      save("robotito.academicMaterials.v1",state.academicMaterials);
      renderAcademicMaterials();
    }));
  }
  async function importAcademicFiles(files){
    if(!files?.length)return;
    const subject=(document.querySelector("#classSubject")?.value||state.classSubject||"Material").trim()||"Material";
    const topic=(document.querySelector("#classTopic")?.value||state.classTopic||"").trim();
    const root=document.querySelector("#academicFilesList");
    if(root)root.innerHTML='<p class="muted">Procesando material…</p>';

    for(const file of files){
      try{
        const text=await textFromAcademicFile(file);
        const chunks=chunkAcademicText(text);
        const id=crypto.randomUUID?.()||("material-"+Date.now()+"-"+Math.random().toString(16).slice(2));
        const exercises=window.ROBOTITO_CLASS_EXERCISES?.extractFromText?.(text,{
          materialId:id,subject,topic,sourceName:file.name
        })||[];
        state.academicMaterials.push({
          id,
          name:file.name,
          type:file.type||"",
          size:file.size||0,
          subject,
          topic,
          chunks,
          exercises,
          at:Date.now()
        });
      }catch(e){
        console.warn("academic file",file.name,e);
        if(typeof toast==="function")toast("No pude leer "+file.name+".");
      }
    }
    state.academicMaterials=state.academicMaterials.slice(-80);
    save("robotito.academicMaterials.v1",state.academicMaterials);
    renderAcademicMaterials();
  }

  window.ROBOTITO_CLASS_ORGANIZER={
    migrate,render,inferTopic,finalizeSession,generateAndSaveClassSummary,
    sessionsFromLines,selectSession,openSessionEditor,saveSessionEdit,currentSessionLines,parseLegacyLabel,
    migrateAudioRecordings,renderAcademicMaterials,importAcademicFiles
  };
  window.generateAndSaveClassSummary=generateAndSaveClassSummary;
  window.renderAcademicMaterials=renderAcademicMaterials;
  window.importAcademicFiles=importAcademicFiles;

  document.addEventListener("DOMContentLoaded",()=>{
    try{migrate();}catch(e){console.warn("class migration",e);}
    render();
    renderAcademicMaterials();
    migrateAudioRecordings();
    document.querySelector("#classSessionEditorForm")?.addEventListener("submit",saveSessionEdit);
    document.querySelector("#cancelClassSessionEdit")?.addEventListener("click",closeSessionEditor);
    document.querySelector("#closeClassSessionEditor")?.addEventListener("click",closeSessionEditor);
    document.querySelector("#classSessionEditor")?.addEventListener("click",event=>{
      if(event.target===event.currentTarget)closeSessionEditor();
    });
  });
})();