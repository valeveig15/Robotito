// Robotito — exact exercise retrieval from academic material + guided explanations.
(function(){
  const WORD_NUMBERS={
    uno:1,una:1,primer:1,primero:1,primera:1,
    dos:2,segundo:2,segunda:2,tres:3,tercero:3,tercera:3,
    cuatro:4,cuarto:4,cuarta:4,cinco:5,quinto:5,quinta:5,
    seis:6,sexto:6,sexta:6,siete:7,septimo:7,séptimo:7,septima:7,séptima:7,
    ocho:8,octavo:8,octava:8,nueve:9,noveno:9,novena:9,diez:10,decimo:10,décimo:10,decima:10,décima:10
  };
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
  function romanToInt(s){
    const map={I:1,V:5,X:10,L:50,C:100};
    let out=0,prev=0;
    for(const ch of String(s||"").toUpperCase().split("").reverse()){
      const v=map[ch]||0;
      if(v<prev)out-=v;else{out+=v;prev=v;}
    }
    return out||null;
  }
  function numberFromToken(token){
    const raw=String(token||"").trim();
    if(/^\d+$/.test(raw))return Number(raw);
    if(/^[ivxlc]+$/i.test(raw))return romanToInt(raw);
    return WORD_NUMBERS[norm(raw)]||null;
  }
  function extractFromText(text,meta={}){
    const source=String(text||"").replace(/\r/g,"\n");
    if(!source.trim())return [];

    const marker=/\b(?:ejercicio|ej\.?|problema|actividad)\s*(?:n(?:ro|umero|úmero)?\.?\s*[º°#]?\s*)?(\d{1,3}|[ivxlc]{1,6})\s*[:.)\-]?\s*/gi;
    const hits=[...source.matchAll(marker)];
    const out=[];
    if(hits.length){
      hits.forEach((m,i)=>{
        const start=m.index;
        const end=i+1<hits.length?hits[i+1].index:source.length;
        const num=numberFromToken(m[1]);
        let statement=source.slice(start,end).replace(/\s+/g," ").trim();
        if(statement.length>7000)statement=statement.slice(0,7000)+"…";
        if(num!==null&&statement.length>8){
          out.push({
            id:(meta.materialId||"material")+"-exercise-"+num+"-"+i,
            number:num,
            label:m[0].trim(),
            statement,
            subject:meta.subject||"",
            topic:meta.topic||"",
            sourceName:meta.sourceName||"",
            materialId:meta.materialId||null
          });
        }
      });
      return out;
    }

    // Fallback for worksheets whose filename strongly suggests a numbered exercise list.
    if(/ejerc|problema|practica|práctica|guia|guía|actividad/i.test(meta.sourceName||"")){
      const numbered=/(?:^|\n)\s*(\d{1,3})\s*[.)\-:]\s+([^\n]+(?:\n(?!\s*\d{1,3}\s*[.)\-:]).*)?)/g;
      const rows=[...source.matchAll(numbered)];
      rows.forEach((m,i)=>{
        const num=Number(m[1]);
        let statement=(m[0]||"").replace(/\s+/g," ").trim();
        if(statement.length>7000)statement=statement.slice(0,7000)+"…";
        if(statement.length>8)out.push({
          id:(meta.materialId||"material")+"-exercise-"+num+"-"+i,
          number:num,label:"Ejercicio "+num,statement,
          subject:meta.subject||"",topic:meta.topic||"",
          sourceName:meta.sourceName||"",materialId:meta.materialId||null
        });
      });
    }
    return out;
  }
  function materialExercises(material){
    if(Array.isArray(material.exercises)&&material.exercises.length)return material.exercises;
    const text=material.rawText||(material.chunks||[]).join("\n");
    return extractFromText(text,{
      materialId:material.id,
      subject:material.subject,
      topic:material.topic,
      sourceName:material.name
    });
  }
  function requestedNumber(text){
    const raw=String(text||"");
    let m=raw.match(/\b(?:ejercicio|ej\.?|problema|actividad)\s*(?:n(?:ro|umero|úmero)?\.?\s*[º°#]?\s*)?(\d{1,3}|[ivxlc]{1,6})\b/i);
    if(m)return numberFromToken(m[1]);

    m=raw.match(/\b(?:ejercicio|problema|actividad)\s+(uno|una|primer[oa]?|dos|segund[oa]|tres|tercer[oa]|cuatro|cuart[oa]|cinco|quint[oa]|seis|sext[oa]|siete|s[eé]ptim[oa]|ocho|octav[oa]|nueve|noven[oa]|diez|d[eé]cim[oa])\b/i);
    return m?numberFromToken(m[1]):null;
  }
  function looksLikeExerciseRequest(text){
    const t=norm(text);
    if(!/\b(ejercicio|ej|problema|actividad)\b/.test(t))return false;
    return requestedNumber(text)!==null || /\b(resolve|resolver|resolvelo|resu[eé]lvelo|explica|explicame|paso a paso|hacer|hace|solucion|solución)\b/i.test(String(text));
  }
  function unique(values){
    return [...new Set(values.filter(Boolean))].sort((a,b)=>b.length-a.length);
  }
  function scopeFromQuery(query){
    const q=norm(query);
    const materials=state.academicMaterials||[];
    const subjects=unique(materials.map(m=>m.subject));
    const topics=unique(materials.map(m=>m.topic));
    const explicitSubject=subjects.find(s=>q.includes(norm(s)))||null;
    const explicitTopic=topics.find(t=>q.includes(norm(t)))||null;
    return {
      subject:explicitSubject||state.classSubject||document.querySelector("#classSubject")?.value||"",
      topic:explicitTopic||state.classTopic||document.querySelector("#classTopic")?.value||"",
      explicitSubject:!!explicitSubject,
      explicitTopic:!!explicitTopic
    };
  }
  function scopeScore(query,exercise,scope){
    const q=norm(query);
    let score=0;
    if(scope.subject){
      const s=norm(scope.subject),es=norm(exercise.subject);
      if(es===s)score+=scope.explicitSubject?12:6;
      else if(es.includes(s)||s.includes(es))score+=scope.explicitSubject?8:4;
      else if(scope.explicitSubject)score-=30;
    }
    if(scope.topic){
      const t=norm(scope.topic),et=norm(exercise.topic);
      if(et===t)score+=scope.explicitTopic?14:8;
      else if(et.includes(t)||t.includes(et))score+=scope.explicitTopic?10:5;
      else if(scope.explicitTopic)score-=30;
    }
    const words=q.split(" ").filter(w=>w.length>3);
    const body=norm((exercise.topic||"")+" "+exercise.statement);
    score+=words.filter(w=>body.includes(w)).length*.45;
    return score;
  }
  function findExercise(query){
    const num=requestedNumber(query);
    if(num===null)return {exercise:null,reason:"missing-number",matches:[]};
    const scope=scopeFromQuery(query);
    const all=(state.academicMaterials||[]).flatMap(materialExercises);
    const sameNumber=all.filter(e=>Number(e.number)===Number(num));
    if(!sameNumber.length)return {exercise:null,reason:"not-found",number:num,scope,matches:[]};

    const ranked=sameNumber
      .map(e=>({e,score:scopeScore(query,e,scope)}))
      .sort((a,b)=>b.score-a.score);
    const best=ranked[0];
    const second=ranked[1];
    if(second&&Math.abs(best.score-second.score)<1.5 &&
       (!scope.explicitSubject&&!scope.explicitTopic)){
      return {exercise:null,reason:"ambiguous",number:num,scope,matches:ranked.slice(0,5).map(x=>x.e)};
    }
    return {exercise:best.e,reason:null,number:num,scope,matches:ranked.map(x=>x.e)};
  }
  function isMomentumContext(exercise){
    const t=norm([exercise.subject,exercise.topic,exercise.statement].join(" "));
    return /\b(fisica|impulso|cantidad de movimiento|momentum|choque|colision|fuerza|velocidad)\b/.test(t);
  }
  function sourceLabel(exercise){
    return [exercise.subject,exercise.topic,exercise.sourceName].filter(Boolean).join(" · ");
  }
  function renderMissing(query,result){
    const root=document.querySelector("#classAnswer");
    if(!root)return;
    if(result.reason==="ambiguous"){
      const opts=result.matches.map(e=>'<li>'+esc(e.subject||"Sin materia")+' › '+esc(e.topic||"Sin tema")+' · '+esc(e.sourceName||"material")+'</li>').join("");
      root.innerHTML='<div class="exercise-solution"><strong>Necesito una precisión</strong><p>Encontré más de un ejercicio '+esc(result.number)+' en tus materiales. Decime también la materia o el tema.</p><ul>'+opts+'</ul></div>';
      return;
    }
    if(result.reason==="missing-number"){
      root.innerHTML='<div class="exercise-solution"><strong>¿Qué ejercicio?</strong><p>Decime el número, por ejemplo: “explicame paso a paso el ejercicio 4 de Impulso de Física”.</p></div>';
      return;
    }
    root.innerHTML='<div class="exercise-solution"><strong>No encontré ese ejercicio</strong><p>Busqué el ejercicio '+esc(result.number??"")+' en el material cargado'+(result.scope?.subject?' de '+esc(result.scope.subject):'')+(result.scope?.topic?' › '+esc(result.scope.topic):'')+'. No voy a inventar un enunciado que no esté en tus archivos.</p></div>';
  }
  function renderDetailed(exercise,solution,generatedText=null){
    const root=document.querySelector("#classAnswer");
    if(!root)return;
    const header='<div class="exercise-source"><strong>Ejercicio '+esc(exercise.number)+'</strong><span>'+esc(sourceLabel(exercise))+'</span></div>';
    const statement='<div class="exercise-statement"><strong>Enunciado recuperado</strong><p>'+esc(exercise.statement)+'</p></div>';

    if(generatedText){
      root.innerHTML='<div class="exercise-solution">'+header+statement+
        '<div class="exercise-explanation"><strong>Resolución paso a paso</strong><div class="exercise-generated">'+esc(generatedText).replace(/\n/g,"<br>")+'</div></div>'+
        '</div>';
      return;
    }

    if(solution?.steps?.length){
      const steps=solution.steps.map(step=>
        '<div class="exercise-step"><strong>'+esc(step.title)+'</strong><p>'+esc(step.body)+'</p></div>'
      ).join("");
      root.innerHTML='<div class="exercise-solution">'+header+statement+
        '<div class="exercise-explanation"><strong>Resolución paso a paso</strong>'+steps+
          '<div class="exercise-final"><span>Resultado</span><strong>'+esc(solution.result||"")+'</strong></div>'+
        '</div></div>';
      return;
    }

    root.innerHTML='<div class="exercise-solution">'+header+statement+
      '<div class="study-chip">Encontré el ejercicio exacto, pero con los datos del enunciado no puedo construir una resolución segura sin inventar información.</div></div>';
  }
  async function aiExplanation(exercise,physicsCheck=null){
    if(!window.LanguageModel?.create)return null;
    try{
      const session=await window.LanguageModel.create({temperature:0.1,topK:2});
      const check=physicsCheck?.steps?.length
        ?"\nControl matemático ya calculado por Robotito:\n"+physicsCheck.steps.map(s=>s.title+": "+s.body).join("\n")+"\nResultado de control: "+physicsCheck.result
        :"";
      const prompt=`Sos un tutor muy claro y preciso.
Materia: ${exercise.subject||"no indicada"}
Tema: ${exercise.topic||"no indicado"}
Ejercicio ${exercise.number}, tomado literalmente del material cargado:
"${exercise.statement}"
${check}

Explicalo PASO A PASO para una estudiante.
Reglas:
- Usá solamente los datos que aparecen en el enunciado.
- No inventes valores, condiciones ni resultados faltantes.
- Primero indicá "Datos".
- Después "Qué pide".
- Luego explicá el concepto o principio físico/matemático que corresponde y POR QUÉ.
- Escribí la fórmula antes de sustituir.
- Sustituí mostrando unidades.
- Mostrá cada cuenta intermedia necesaria.
- Explicá signos, dirección y unidades cuando corresponda.
- Terminá con "Resultado" y una interpretación en palabras.
- Si falta un dato indispensable, detenete y decí exactamente cuál falta.
- Si el control matemático de Robotito está presente, no lo contradigas salvo que el propio enunciado muestre que no aplica.
- No agregues teoría que no ayude a resolver este ejercicio.
- Sé detallado pero pedagógico.`;
      const out=String(await session.prompt(prompt)||"").trim();
      session.destroy?.();
      return out||null;
    }catch(e){
      console.warn("exercise explanation",e);
      return null;
    }
  }
  async function explainExercise(exercise){
    let physics=null;
    if(isMomentumContext(exercise)){
      physics=window.ROBOTITO_PHYSICS_MOMENTUM?.detailedStepByStep?.([exercise.topic,exercise.statement].filter(Boolean).join(". "))||null;
    }
    const generated=await aiExplanation(exercise,physics);
    renderDetailed(exercise,physics,generated);
    if(generated)return {ok:true,exercise,generated,solution:physics};
    if(physics)return {ok:true,exercise,solution:physics};
    renderDetailed(exercise,null,null);
    return {ok:false,exercise,reason:"cannot-solve"};
  }
  async function handleRequest(text,{spoken=true}={}){
    if(!looksLikeExerciseRequest(text))return false;

    const root=document.querySelector("#classAnswer");
    if(root)root.innerHTML='<div class="study-chip">Buscando el ejercicio exacto en el material cargado…</div>';
    const result=findExercise(text);
    if(!result.exercise){
      renderMissing(text,result);
      if(spoken&&typeof say==="function"){
        if(result.reason==="ambiguous")say("Encontré más de un ejercicio con ese número. Decime también la materia o el tema.",5200);
        else if(result.reason==="missing-number")say("Decime qué número de ejercicio querés que te explique.",3800);
        else say("No encontré ese ejercicio en el material cargado. No voy a inventar el enunciado.",4800);
      }
      return true;
    }

    const explained=await explainExercise(result.exercise);
    if(spoken&&typeof say==="function"){
      if(explained.ok){
        const final=explained.solution?.result?(" El resultado es "+explained.solution.result+"."):"";
        say("Encontré el ejercicio "+result.exercise.number+" en "+(result.exercise.subject||"el material")+" y te dejé la resolución paso a paso en la pestaña Clase."+final,8500);
      }else{
        say("Encontré el ejercicio exacto, pero me faltan herramientas o datos para resolverlo con seguridad. Te mostré el enunciado sin inventar nada.",7000);
      }
    }
    return true;
  }

  window.ROBOTITO_CLASS_EXERCISES={
    extractFromText,materialExercises,requestedNumber,looksLikeExerciseRequest,
    findExercise,explainExercise,handleRequest
  };
})();