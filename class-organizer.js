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
                  return '<button type="button" class="class-session-item" data-session-id="'+esc(session.sessionId)+'">'+
                    '<span class="class-session-date">'+esc(date)+'</span>'+
                    '<strong>'+esc(topic)+'</strong>'+
                    '<span class="muted">'+session.lineCount+' fragmentos'+(duration!==null?' · '+duration+' min':'')+'</span>'+
                    (point?'<span class="class-session-preview">'+esc(point.slice(0,150))+(point.length>150?'…':'')+'</span>':'')+
                  '</button>';
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
  }

  window.ROBOTITO_CLASS_ORGANIZER={
    migrate,render,inferTopic,finalizeSession,generateAndSaveClassSummary,
    sessionsFromLines,selectSession,currentSessionLines,parseLegacyLabel
  };
  window.generateAndSaveClassSummary=generateAndSaveClassSummary;

  document.addEventListener("DOMContentLoaded",()=>{
    try{migrate();}catch(e){console.warn("class migration",e);}
    render();
  });
})();