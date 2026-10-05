// Robotito — class transcription capture + conservative web verification.
(function(){
  function averageRecentVoiceFeature(){
    const arr=state.recentAudioFeatures.filter(x=>Date.now()-x.t<2600);
    if(!arr.length)return {rms:0,centroid:0,flat:0};
    const avg=k=>arr.reduce((sum,x)=>sum+(Number(x[k])||0),0)/arr.length;
    return {rms:avg("rms"),centroid:avg("centroid"),flat:avg("flat")};
  }
  function featureDistance(a,b){
    if(!a||!b)return Infinity;
    return Math.abs(a.rms-b.rms)*8+Math.abs(a.centroid-b.centroid)*1.6+Math.abs(a.flat-b.flat)*1.2;
  }
  function profileMean(list){
    if(!list?.length)return null;
    const avg=k=>list.reduce((sum,x)=>sum+(Number(x[k])||0),0)/list.length;
    return {rms:avg("rms"),centroid:avg("centroid"),flat:avg("flat")};
  }
  function learnSpeaker(label,feature){
    if(!feature)return;
    const arr=state.voiceProfiles[label]||[];
    arr.push(feature);
    state.voiceProfiles[label]=arr.slice(-20);
    save("robotito.voiceProfiles.v1",state.voiceProfiles);
  }
  function classifySpeaker(feature){
    if(state.speakerOverride){
      const label=state.speakerOverride;
      state.speakerOverride=null;
      learnSpeaker(label,feature);
      return label;
    }
    const profiles=["me","teacher","classmate"]
      .map(label=>({label,mean:profileMean(state.voiceProfiles[label])}))
      .filter(x=>x.mean);
    if(profiles.length){
      const ranked=profiles.map(x=>({label:x.label,d:featureDistance(feature,x.mean)})).sort((a,b)=>a.d-b.d);
      if(ranked[0].d<.7)return ranked[0].label;
      if(ranked.length>1&&ranked[0].d+.10<ranked[1].d)return ranked[0].label;
    }
    return "classmate";
  }
  function classLinesForSubject(){
    const sessionId=state.classMode?state.classSessionId:state.selectedClassSessionId;
    if(sessionId){
      const exact=state.classLines.filter(l=>l.sessionId===sessionId);
      if(exact.length)return exact.slice(-250);
    }

    const subj=normalizeText(state.classSubject||$("#classSubject")?.value||"");
    const topic=normalizeText(state.classTopic||$("#classTopic")?.value||"");
    if(!subj&&!topic)return state.classLines.slice(-250);

    const matched=state.classLines.filter(l=>{
      const ls=normalizeText(l.subject||"");
      const lt=normalizeText(l.topic||"");
      const subjectOk=!subj||ls===subj||ls.includes(subj)||subj.includes(ls);
      const topicOk=!topic||lt===topic||lt.includes(topic)||topic.includes(lt);
      return subjectOk&&topicOk;
    });
    return (matched.length?matched:state.classLines).slice(-250);
  }
  function contentWords(text){
    const stop=new Set(["que","como","para","por","una","uno","unos","unas","del","las","los","con","sin","sobre","esto","esta","este","son","fue","era","hay","muy","mas","pero","porque","cuando","donde","cual","cuales","quien","profesora","profesor","clase"]);
    return normalizeText(text).split(" ").filter(w=>w.length>3&&!stop.has(w));
  }

  const FACT_RULES=[
    {
      test:/\b(?:los\s+)?humanos?\s+(?:tienen?|tenemos?)\s+(?:un|uno|una|1)\s+ojos?\b/i,
      corrected:"Los humanos normalmente tienen dos ojos.",
      query:"ser humano dos ojos anatomía",
      support:[["dos","ojos"],["2","ojos"]]
    },
    {
      test:/\b(?:un\s+)?adulto\s+(?:tiene|tienen)\s+(?!206\b)\d+\s+huesos\b/i,
      corrected:"Un adulto suele tener 206 huesos.",
      query:"esqueleto humano adulto 206 huesos",
      support:[["206","huesos"]]
    },
    {
      test:/\b(?:una\s+)?semana\s+(?:tiene|son)\s+(?!7\b)\d+\s+dias?\b/i,
      corrected:"Una semana tiene siete días.",
      query:"semana siete días",
      support:[["siete","dias"],["7","dias"]]
    },
    {
      test:/\b(?:un\s+)?ano\s+(?:tiene|son)\s+(?!12\b)\d+\s+meses\b/i,
      corrected:"Un año tiene doce meses.",
      query:"año doce meses",
      support:[["doce","meses"],["12","meses"]]
    },
    {
      test:/\b(?:una\s+)?hora\s+(?:tiene|son)\s+(?!60\b)\d+\s+minutos\b/i,
      corrected:"Una hora tiene 60 minutos.",
      query:"hora 60 minutos",
      support:[["60","minutos"]]
    },
    {
      test:/\b(?:un\s+)?minuto\s+(?:tiene|son)\s+(?!60\b)\d+\s+segundos\b/i,
      corrected:"Un minuto tiene 60 segundos.",
      query:"minuto 60 segundos",
      support:[["60","segundos"]]
    },
    {
      test:/\b(?:el\s+)?corazon\s+humano\s+(?:tiene|posee)\s+(?!4\b)\d+\s+(?:camaras|cavidades)\b/i,
      corrected:"El corazón humano tiene cuatro cámaras: dos aurículas y dos ventrículos.",
      query:"corazón humano cuatro cámaras aurículas ventrículos",
      support:[["cuatro","camaras"],["4","camaras"],["dos","auriculas","dos","ventriculos"]]
    },
    {
      test:/\b(?:un\s+)?pulpo\s+(?:tiene|posee)\s+(?!3\b)\d+\s+corazones\b/i,
      corrected:"Un pulpo tiene tres corazones.",
      query:"pulpo tres corazones",
      support:[["tres","corazones"],["3","corazones"]]
    },
    {
      test:/\b(?:los\s+)?insectos\s+(?:tienen|poseen)\s+(?!6\b)\d+\s+patas\b/i,
      corrected:"Los insectos tienen seis patas.",
      query:"insectos seis patas",
      support:[["seis","patas"],["6","patas"]]
    },
    {
      test:/\b(?:las\s+)?aranas\s+(?:tienen|poseen)\s+(?!8\b)\d+\s+patas\b/i,
      corrected:"Las arañas tienen ocho patas.",
      query:"arañas ocho patas",
      support:[["ocho","patas"],["8","patas"]]
    },
    {
      test:/\b(?:el\s+)?sistema\s+solar\s+(?:tiene|posee)\s+(?!8\b)\d+\s+planetas\b/i,
      corrected:"El Sistema Solar tiene ocho planetas.",
      query:"Sistema Solar ocho planetas",
      support:[["ocho","planetas"],["8","planetas"]]
    }
  ];

  function localFactProposal(text){
    const normalized=String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    for(const rule of FACT_RULES){
      if(rule.test.test(normalized))return {corrected:rule.corrected,query:rule.query,reason:"dato objetivo reconocido"};
    }
    return null;
  }
  function factualClaimLooksSuspicious(text){
    const t=normalizeText(text);
    if(!t||t.length<12)return false;
    return /\b(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\b/.test(t)
      || /\b(es|son|tiene|tienen|mide|pesa|equivale|produce|gira|orbita|vive|comen|come|consta)\b/.test(t);
  }
  function verificationQuery(text){
    const proposal=localFactProposal(text);
    if(proposal)return proposal.query;
    const stop=new Set(["los","las","el","la","un","una","unos","unas","de","del","que","y","o","por","para","con","sin","es","son","tiene","tienen","se","en","a","como","esto"]);
    return normalizeText(text).split(" ").filter(w=>w.length>2&&!stop.has(w)).slice(0,10).join(" ");
  }
  async function wikipediaEvidence(text){
    const q=verificationQuery(text);
    if(!q)return [];
    try{
      const searchUrl="https://es.wikipedia.org/w/api.php?origin=*&format=json&action=query&list=search&srlimit=3&srsearch="+encodeURIComponent(q);
      const res=await fetch(searchUrl);
      if(!res.ok)return [];
      const data=await res.json();
      const hits=data?.query?.search||[];
      const evidence=[];
      for(const hit of hits.slice(0,2)){
        const title=hit.title;
        const extractUrl="https://es.wikipedia.org/w/api.php?origin=*&format=json&action=query&prop=extracts&exintro=1&explaintext=1&titles="+encodeURIComponent(title);
        try{
          const er=await fetch(extractUrl);
          if(!er.ok)continue;
          const ej=await er.json();
          const page=Object.values(ej?.query?.pages||{})[0];
          const extract=String(page?.extract||"").replace(/\s+/g," ").trim().slice(0,1800);
          const snippet=String(hit.snippet||"").replace(/<[^>]+>/g," ").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
          if(extract||snippet){
            evidence.push({
              title,
              url:"https://es.wikipedia.org/wiki/"+encodeURIComponent(title.replace(/ /g,"_")),
              extract,
              snippet
            });
          }
        }catch{}
      }
      return evidence;
    }catch(e){
      console.warn("class web verification",e);
      return [];
    }
  }
  function evidenceSupportsProposal(proposal,evidence){
    if(!proposal||!evidence.length)return false;
    const body=normalizeText(evidence.map(e=>(e.snippet||"")+" "+(e.extract||"")).join(" "));
    const rule=FACT_RULES.find(r=>r.corrected===proposal.corrected);
    if(rule?.support?.length){
      return rule.support.some(group=>group.every(term=>body.includes(normalizeText(term))));
    }
    const keyWords=contentWords(proposal.corrected).filter(w=>!/^(humanos|adulto|tiene|suele|sistema)$/.test(w));
    if(!keyWords.length)return false;
    const hits=keyWords.filter(w=>body.includes(w)).length;
    return hits>=Math.min(2,keyWords.length);
  }
  async function aiVerifyTranscript(text,subject,evidence){
    if(!window.LanguageModel?.create||!evidence.length)return null;
    try{
      const session=await window.LanguageModel.create({temperature:0,topK:1});
      const src=evidence.map((e,i)=>`[${i+1}] ${e.title}: ${e.extract}`).join("\n");
      const prompt=`Verificá una transcripción de clase de forma extremadamente conservadora.
Transcripción original: "${text}"
Materia: "${subject||"clase"}"
Fuentes web:
${src}

Solo podés corregir un error claro de reconocimiento que cambie un hecho objetivo: número, unidad, término científico, singular/plural o palabra mal oída.
No cambies estilo, opiniones, ejemplos hipotéticos ni afirmaciones que las fuentes no confirmen claramente.
Si no hay evidencia suficiente, no cambies nada.
Respondé únicamente JSON válido:
{"corrected":"texto","changed":false,"reason":"breve","sourceIndexes":[1]}`;
      const raw=String(await session.prompt(prompt)||"").trim();
      session.destroy?.();
      const m=raw.match(/\{[\s\S]*\}/);
      if(!m)return null;
      const obj=JSON.parse(m[0]);
      const corrected=String(obj.corrected||text).trim();
      const indexes=Array.isArray(obj.sourceIndexes)?obj.sourceIndexes:[];
      const sources=indexes.map(i=>evidence[Number(i)-1]).filter(Boolean);
      if(obj.changed&&sources.length&&normalizeText(corrected)!==normalizeText(text)){
        return {text:corrected,verified:true,reason:String(obj.reason||"verificación web"),sources};
      }
    }catch(e){console.warn("class AI verification",e);}
    return null;
  }
  async function verifyTranscript(text,subject){
    const proposal=localFactProposal(text);
    const shouldCheck=proposal||factualClaimLooksSuspicious(text);
    if(!state.verifyClassWeb||!shouldCheck){
      return {text,verified:false,status:"none",sources:[],changes:[]};
    }

    const evidence=await wikipediaEvidence(proposal?.corrected||text);

    if(proposal&&evidenceSupportsProposal(proposal,evidence)){
      return {
        text:proposal.corrected,
        verified:true,
        status:"verified",
        sources:evidence.slice(0,2),
        changes:[{from:text,to:proposal.corrected,kind:"web",reason:proposal.reason}]
      };
    }

    const ai=await aiVerifyTranscript(text,subject,evidence);
    if(ai){
      return {
        text:ai.text,
        verified:true,
        status:"verified",
        sources:ai.sources,
        changes:[{from:text,to:ai.text,kind:"web",reason:ai.reason}]
      };
    }

    return {text,verified:false,status:evidence.length?"checked":"none",sources:evidence.slice(0,1),changes:[]};
  }

  async function captureClassLine(text){
    const feature=averageRecentVoiceFeature();
    const voicePrint=recentVoicePrint();
    const voiceMatch=recognizeVoicePerson(voicePrint,state.currentPerson);
    const speaker=voiceMatch&&["me","teacher","classmate"].includes(voiceMatch.role)
      ?voiceMatch.role
      :classifySpeaker(feature);

    const academic=correctAcademicTranscript(text,[state.classSubject,state.classTopic].filter(Boolean).join(" — "));
    const line={
      id:(crypto.randomUUID?.()||("line-"+Date.now()+"-"+Math.random().toString(16).slice(2))),
      text:String(text||"").trim(),
      correctedText:academic.text,
      corrections:[...(academic.changes||[])],
      speaker,
      speakerName:voiceMatch?.name||null,
      voiceScore:voiceMatch?.score||null,
      voicePrint,
      subject:state.classSubject||"Clase",
      topic:state.classTopic||"",
      sessionId:state.classSessionId||null,
      at:Date.now(),
      feature,
      verificationStatus:state.verifyClassWeb?"checking":"off",
      verificationSources:[]
    };
    state.classLines.push(line);
    state.classLines=state.classLines.slice(-1000);
    save("robotito.classLines.v1",state.classLines);
    if(voiceMatch&&["me","teacher","classmate"].includes(voiceMatch.role)&&(state.voiceProfiles[speaker]||[]).length<4){
      learnSpeaker(speaker,feature);
    }
    renderClassTranscript();
    $("#speakerPill")?.classList.remove("hidden");
    if($("#speakerLabel"))$("#speakerLabel").textContent=speaker==="me"?"vos":speaker==="teacher"?"profesora":"compañero/a";

    const verification=await verifyTranscript(line.correctedText,[state.classSubject,state.classTopic].filter(Boolean).join(" — "));
    const live=state.classLines.find(x=>x.id===line.id);
    if(!live)return;
    live.correctedText=verification.text;
    live.corrections=[...(live.corrections||[]),...(verification.changes||[])];
    live.verificationStatus=verification.status;
    live.verificationSources=verification.sources||[];
    save("robotito.classLines.v1",state.classLines);
    renderClassTranscript();
  }
  async function startClassMode(){
    if(!state.started){toast("Primero despertá los sentidos.");return;}
    if(state.classMode)return;

    // Enter Class Mode in absolute silence. If Robotito was speaking, stop it
    // before recording and immediately give the microphone back to listening.
    state.classMode=true;
    clearTimeout(state.speechRestartTimer);
    if("speechSynthesis" in window){
      try{speechSynthesis.cancel();}catch{}
    }
    state.speaking=false;
    if(isMobileSpeech()&&window.RobotitoLocalASR?.active){
      window.RobotitoLocalASR.pause(false);
    }else{
      state.speechBlocked=false;
      state.recognitionWanted=true;
      setTimeout(()=>startListeningCycle(false),80);
    }

    state.classStartedAt=Date.now();
    const rawSubject=$("#classSubject")?.value.trim()||"Clase";
    const rawTopic=$("#classTopic")?.value.trim()||"";
    const parsed=window.ROBOTITO_CLASS_ORGANIZER?.parseLegacyLabel?.(rawSubject)||{subject:rawSubject,topic:""};
    state.classSubject=parsed.subject||"Clase";
    state.classTopic=rawTopic||parsed.topic||"";
    state.classSessionId=crypto.randomUUID?.()||("class-session-"+Date.now()+"-"+Math.random().toString(16).slice(2));
    state.selectedClassSessionId=state.classSessionId;
    if($("#classSubject"))$("#classSubject").value=state.classSubject;
    if($("#classTopic"))$("#classTopic").value=state.classTopic;
    $("#classBadge").textContent="escuchando";
    $("#classBadge").classList.add("on");
    $("#speakerPill")?.classList.remove("hidden");
    setMood("focused","Robotito está concentrado escuchando la clase.");

    const audio=await window.ROBOTITO_CLASS_AUDIO?.start?.(state.classSubject,state.classTopic,state.classSessionId);
    if(audio?.ok){
      toast("Modo clase activado: transcripción y audio en marcha.");
    }else{
      const reason=audio?.reason;
      const msg=reason==="unsupported"
        ?"El navegador no permite grabar audio, pero la transcripción sigue funcionando."
        :reason==="no-audio-track"
          ?"No encontré una pista de micrófono para grabar, pero la transcripción sigue funcionando."
          :"Modo clase activado. La transcripción está funcionando.";
      toast(msg);
    }
  }
  async function stopClassMode(){
    if(!state.classMode)return;
    const endedAt=Date.now();
    state.classMode=false;
    $("#classBadge").textContent="guardando…";
    $("#classBadge").classList.remove("on");
    $("#speakerPill")?.classList.add("hidden");
    setMood("proud","Robotito terminó de escuchar la clase y está guardando el audio.");

    const recording=await window.ROBOTITO_CLASS_AUDIO?.stop?.();
    $("#classBadge").textContent="apagado";

    const summary=await generateAndSaveClassSummary(endedAt,recording);
    state.selectedClassSessionId=state.classSessionId;
    state.classSessionId=null;
    window.ROBOTITO_CLASS_ORGANIZER?.render?.();

    if(recording){
      say(summary
        ?"Listo. Guardé el audio completo y también preparé el resumen de la clase."
        :"Listo. Guardé el audio completo de la clase.");
    }else{
      say(summary
        ?"Listo. Te preparé y guardé el resumen de la clase, aunque no pude guardar el audio."
        :"Listo. Guardé la transcripción, aunque no pude guardar el audio.");
    }
  }

  window.averageRecentVoiceFeature=averageRecentVoiceFeature;
  window.featureDistance=featureDistance;
  window.profileMean=profileMean;
  window.learnSpeaker=learnSpeaker;
  window.classifySpeaker=classifySpeaker;
  window.classLinesForSubject=classLinesForSubject;
  window.contentWords=contentWords;
  window.captureClassLine=captureClassLine;
  window.startClassMode=startClassMode;
  window.stopClassMode=stopClassMode;
  window.ROBOTITO_CLASS_VERIFY={verifyTranscript,wikipediaEvidence};
})();