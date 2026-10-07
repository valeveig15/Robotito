// Robotito — permanent, data-driven regression battery.
// Extends the focused smoke tests with broad cross-feature coverage.
(function(){
  const baseRun=window.ROBOTITO_TESTS?.run;
  if(typeof baseRun!=="function")return;

  function result(ok,suite,label,actual,expected){return {ok:!!ok,suite,label,actual,expected};}
  function same(suite,label,actual,expected){return result(Object.is(actual,expected),suite,label,actual,expected);}
  function truthy(suite,label,actual){return result(!!actual,suite,label,actual,"truthy");}
  function includes(suite,label,actual,part){return result(String(actual||"").includes(part),suite,label,actual,"includes "+part);}

  function matrix(results,suite,rows,run){
    rows.forEach((row,index)=>{
      try{results.push(run(row,index));}
      catch(error){results.push(result(false,suite,row[0]||("case "+index),String(error),"no exception"));}
    });
  }

  function advanced(){
    const results=[];
    const intent=window.ROBOTITO_INTENT_ENGINE;
    const router=window.ROBOTITO_ROUTER;
    const math=window.ROBOTITO_SPOKEN_MATH;
    const language=window.ROBOTITO_LANGUAGE_PIPELINE;
    const emotions=window.ROBOTITO_EMOTION_DIALOGUE;
    const battery=window.ROBOTITO_BATTERY;
    const silence=window.ROBOTITO_SILENCE;
    const speech=window.ROBOTITO_SPEECH_QA;
    const exercises=window.ROBOTITO_CLASS_EXERCISES;
    const books=window.ROBOTITO_BOOKS;
    const birthdays=window.ROBOTITO_BIRTHDAYS;
    const runtime=window.ROBOTITO_RUNTIME_POLICY;

    const intentRows=[
      ["¿Qué es permutación?","definition","brief",false],["Definime fotosíntesis","definition","brief",false],
      ["Dame la definición de inercia","definition","brief",false],["What is entropy?","definition","brief",false],
      ["Define gravity","definition","brief",false],["O que é densidade?","definition","brief",false],
      ["Explícame permutación","explanation","detailed",false],["¿Cómo funciona la fotosíntesis?","explanation","detailed",false],
      ["¿Por qué llueve?","explanation","detailed",false],["Explain entropy","explanation","detailed",false],
      ["How does gravity work?","explanation","detailed",false],["Me explique densidade","explanation","detailed",false],
      ["Compara mitosis y meiosis","comparison","structured",false],["¿Cuál es la diferencia entre masa y peso?","comparison","structured",false],
      ["¿En qué se diferencian ADN y ARN?","comparison","structured",false],["Compare cats and dogs","comparison","structured",false],
      ["Difference between speed and velocity","comparison","structured",false],
      ["Explícame paso a paso el ejercicio 4","exercise","step-by-step",true],["Resolvé el ejercicio 2","exercise","detailed",true],
      ["Resuelve este problema","exercise","detailed",true],["Solve exercise 9","exercise","detailed",true],
      ["Explique o exercício 2","exercise","detailed",true],
      ["Según la clase, ¿qué es permutación?","class-question","brief",true],["¿Qué vimos en clase?","class-question","normal",true],
      ["Buscá en mis apuntes la fórmula","class-question","normal",true],["According to my class, explain entropy","class-question","detailed",true],
      ["What is in my class notes?","class-question","normal",true],["Na minha aula, o que vimos?","class-question","normal",true],
      ["Recomendame un libro de misterio","book-recommendation","normal",false],["Sugerime novelas parecidas","book-recommendation","normal",false],
      ["Recommend a book about grief","book-recommendation","normal",false],["Sugira um livro de fantasia","book-recommendation","normal",false],
      ["¿Cuánto es 18 por 7?","calculation","normal",false],["Calculá la raíz cuadrada de 144","calculation","normal",false],
      ["What is 8 * 9?","calculation","normal",false],["Calculate 20 percent of 50","calculation","normal",false],
      ["Quanto é 9 + 4?","calculation","normal",false],["Hola robotito","conversation","normal",false],
      ["Te quiero mucho","conversation","normal",false],["Thank you","conversation","normal",false],
      ["Callate por 20 segundos","command","normal",false],["Mostrame un gato","command","normal",false],
      ["Open class","command","normal",false],["Me gusta la permutación","statement","normal",false],
      ["Tengo un problema con mi amigo","statement","normal",false],["¿Qué es una clase abstracta?","definition","brief",false],
      ["La profesora de yoga es amable","statement","normal",false],["Recomendé un libro ayer","statement","normal",false]
    ];
    matrix(results,"intent",intentRows,row=>{
      const got=intent?.classify(row[0])||{};
      const ok=got.intent===row[1]&&got.depth===row[2]&&got.useClassMemory===row[3];
      return result(ok,"intent",row[0],{intent:got.intent,depth:got.depth,useClassMemory:got.useClassMemory},{intent:row[1],depth:row[2],useClassMemory:row[3]});
    });
    results.push(same("intent","definición breve recorta a una oración",router?.shapeAnswer("¿Qué es X?","Primera. Segunda."),"Primera."));
    results.push(truthy("intent","paso a paso admite respuesta extensa",router?.shapeAnswer("Explícame paso a paso el ejercicio 4","a ".repeat(500)).length>500));

    const mathRows=[
      ["dos más dos",4],["10 menos 7",3],["seis por ocho",48],["20 dividido 4",5],
      ["dos más tres por cuatro",14],["(2 + 3) * 4",20],["dos elevado a la cuarta",16],
      ["raíz cuadrada de 144",12],["raíz cúbica de 27",3],["20 por ciento de 50",10],
      ["factorial de 5",120],["la mitad de 18",9],["el doble de 7",14],["el triple de 6",18],
      ["-2^2",-4],["2^-2",.25],["3 + 4 * 2 - 1",10],["100 / 4 + 5",30],
      ["what is five plus seven",12],["six times nine",54],["square root of 81",9],
      ["dois mais três",5],["dez dividido por dois",5],["raiz quadrada de 64",8]
    ];
    matrix(results,"math",mathRows,row=>same("math",row[0],math?.solve(row[0],/what|five|six|square/.test(row[0])?"en":/dois|três|dez|quadrada/.test(row[0])?"pt":"es")?.value,row[1]));
    results.push(same("math","rechaza frase sin operación",math?.solve("tengo dos gatos","es")?.handled,false));
    results.push(truthy("math","división por cero devuelve error",math?.solve("10 dividido 0","es")?.error));

    const languageRows=[
      ["Hola, estoy muy feliz de verte.","es"],["Gracias por jugar conmigo.","es"],
      ["Hello, I am very happy to see you.","en"],["Please help me with this question.","en"],
      ["Olá, estou muito feliz com você.","pt"],["Obrigado por brincar comigo.","pt"]
    ];
    matrix(results,"languages",languageRows,row=>same("languages",row[0],language?.detect(row[0]),row[1]));
    ["es","en","pt"].forEach(lang=>results.push(same("languages","fallback escrito en "+lang,language?.detect(language?.fallback(lang)),lang)));
    results.push(same("languages","una fórmula es neutral",language?.isNeutral("2 + 2 = 4"),true));
    results.push(same("languages","no pronuncia español como inglés",language?.needsLocalization("Tengo hambre y quiero jugar.","en",null),true));
    results.push(same("languages","conserva inglés correcto",language?.needsLocalization("I am hungry and want to play.","en",null),false));

    const emotionRows=[
      ["te quiero mucho","affection"],["me caes muy bien","affection"],["I love you","affection"],
      ["hay un monstruo atrás tuyo","fear"],["cuidado, viene un fantasma","fear"],
      ["viste lo que le pasa a la mamá de Bambi","grief"],["Mufasa murió","grief"],
      ["me caes mal","rejection"],["ya no te quiero","rejection"],
      ["sos un idiota","anger"],["hacés todo mal","anger"],
      ["perdón robotito, te traté mal","apology"],["no quise lastimarte","apology"],
      ["bien hecho, excelente trabajo","praise"],["sos muy inteligente","praise"],
      ["tengo una sorpresa","excitement"],["ganamos, vamos a celebrar","excitement"],
      ["tranquilo, no hay ningún monstruo","reassurance"],
      ["qué significa te quiero",null],["no me caes mal","affection"],["me gusta Bambi",null]
    ];
    matrix(results,"emotions",emotionRows,row=>same("emotions",row[0],emotions?.classify(row[0])?.id||null,row[1]));

    const batteryRows=[[100,null],[51,null],[50,50],[49,50],[21,50],[20,20],[11,20],[10,10],[6,10],[5,5],[1,5],[0,5]];
    matrix(results,"battery",batteryRows,row=>same("battery","nivel "+row[0],battery?.bucket(row[0]),row[1]));
    [[51,50,50],[21,20,20],[11,10,10],[6,5,5],[5,4,null],[4,6,null],[50,50,null]].forEach(row=>results.push(same("battery",row[0]+"→"+row[1],battery?.alertThreshold(row[0],row[1]),row[2])));
    ["es","en","pt"].forEach(lang=>results.push(truthy("battery","mensaje crítico "+lang,battery?.message(5,lang)?.length>25)));

    const silenceRows=[["callate",25000],["callate por 1 segundo",1000],["callate por 20 segundos",20000],["callate durante 2 minutos",120000],["callate media hora",1800000],["callate una hora",3600000],["callate hasta que te diga",Infinity]];
    matrix(results,"silence",silenceRows,row=>same("silence",row[0],silence?.parseDuration(row[0]),row[1]));
    results.push(same("class-mode","modo clase bloquea la voz",runtime?.canSpeak({classMode:true}),false));
    results.push(same("class-mode","silencio solicitado bloquea la voz",runtime?.canSpeak({muted:true}),false));
    results.push(same("class-mode","voz normal permitida",runtime?.canSpeak({}),true));
    results.push(same("class-mode","micrófono puede seguir escuchando en silencio",runtime?.microphoneMayKeepListeningWhileSilent,true));

    const speechRows=[
      ["qué qué es la densidad","qué es la densidad"],["hola hola robotito","hola robotito"],
      ["cuál cuál es el animal más grande","cuál es el animal más grande"]
    ];
    matrix(results,"microphone",speechRows,row=>same("microphone",row[0],speech?.cleanTranscript(row[0]),row[1]));
    results.push(same("microphone","une fragmentos solapados",speech?.mergeChunks("qué es la","la densidad"),"qué es la densidad"));
    results.push(truthy("microphone","prioriza pregunta clara",speech?.alternativeScore({transcript:"qué es permutación",confidence:.7})>speech?.alternativeScore({transcript:"mmm",confidence:.7})));
    results.push(truthy("microphone","ASR móvil expone controles",window.RobotitoLocalASR&&["start","pause","stop","setLanguage"].every(k=>typeof window.RobotitoLocalASR[k]==="function")));

    const sampleText="Ejercicio 1: Calculá 2 + 2.\nEjercicio 4: Un móvil de 2 kg viaja a 3 m/s. Hallá su momentum.\nProblema 8: Compará ambos resultados.";
    const extracted=exercises?.extractFromText(sampleText,{subject:"Física",topic:"Impulso",sourceName:"guía.txt"})||[];
    results.push(same("class-exercises","extrae tres ejercicios",extracted.length,3));
    results.push(same("class-exercises","conserva número exacto",extracted[1]?.number,4));
    results.push(same("class-exercises","conserva materia",extracted[1]?.subject,"Física"));
    [["ejercicio 4",4],["problema número 8",8],["actividad tres",3],["exercise 9",9],["sin número",null]].forEach(row=>results.push(same("class-exercises",row[0],exercises?.requestedNumber(row[0]),row[1])));
    results.push(same("class-exercises","comentario casual no es ejercicio",exercises?.looksLikeExerciseRequest("Tuve un problema ayer"),false));

    const bookRows=[
      ["fantasía con magia","fantasía"],["misterio de detectives","misterio"],["ciencia ficción en el espacio","ciencia ficción"],
      ["algo tierno y reconfortante","lectura reconfortante"],["una novela triste para llorar","emocional"],
      ["dark academia en una universidad","academia oscura"],["aventura con mucha acción","aventura"]
    ];
    matrix(results,"books",bookRows,row=>truthy("books",row[0],books?.analyze(row[0])?.concepts.some(c=>c.labels.includes(row[1]))));
    const mysteryProfile=books?.analyze("misterio de detectives sin romance");
    const orient=books?.catalog.find(b=>b.title.includes("Orient Express"));
    const evelyn=books?.catalog.find(b=>b.title.includes("Evelyn Hugo"));
    results.push(truthy("books","misterio supera romance",books?.score(orient,mysteryProfile).score>books?.score(evelyn,mysteryProfile).score));
    results.push(truthy("books","catálogo local disponible sin Goodreads",books?.catalog.length>=10));

    [["7/10/2010","2010-10-07"],["07-10-2010","2010-10-07"],["31.12.2000","2000-12-31"],["31/02/2010",null],["texto",null]].forEach(row=>results.push(same("birthdays",row[0],birthdays?.parse(row[0]),row[1])));
    results.push(same("birthdays","formatea fecha",birthdays?.format("2010-10-07"),"07/10/2010"));
    results.push(same("birthdays","reconoce cumpleaños de hoy",birthdays?.isToday("2010-10-07",new Date("2026-10-07T12:00:00")),true));
    results.push(same("birthdays","rechaza otro día",birthdays?.isToday("2010-10-08",new Date("2026-10-07T12:00:00")),false));

    const avatars=window.ROBOTITO_AVATARS;
    const art=window.ROBOTITO_AVATAR_ART;
    const species=window.ROBOTITO_SPECIES;
    (avatars?.list||[]).forEach((avatar,index)=>{
      results.push(same("avatars",avatar.id+" conserva orden",avatars.list[index].id,avatar.id));
      results.push(truthy("avatars",avatar.id+" tiene nombre",avatar.es&&avatar.es.length>1));
      results.push(truthy("avatars",avatar.id+" tiene icono",avatars.visualMarkup(avatar.id).length>0));
      results.push(truthy("avatars",avatar.id+" tiene personalidad",species?.profile(avatar.id)?.trait));
      if(avatar.id!=="panda")results.push(includes("avatars",avatar.id+" tiene arte propio",art?.render(avatar,"qa"),'data-character="'+avatar.id+'"'));
    });
    results.push(same("avatars","robot permanece al final",avatars?.list.at(-1)?.id,"robot"));
    results.push(same("avatars","no hay IDs repetidos",new Set(avatars?.list.map(a=>a.id)).size,avatars?.list.length));

    const president=window.ROBOTITO_PRESIDENTS;
    [["¿Quién es el presidente de Uruguay?","uruguay",null,"current"],["¿Quién era presidente de Argentina en 2010?","argentina",2010,"historical"],["List presidents of Brazil","brazil",null,"list"]].forEach(row=>{
      const got=president?.parseQuestion(row[0]);
      results.push(result(got?.country===row[1]&&got?.year===row[2]&&got?.intent===row[3],"presidents",row[0],got,{country:row[1],year:row[2],intent:row[3]}));
    });

    const yt=window.ROBOTITO_YOUTUBE_MATERIAL;
    [["https://youtu.be/dQw4w9WgXcQ","dQw4w9WgXcQ"],["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=4","dQw4w9WgXcQ"],["https://youtube.com/shorts/dQw4w9WgXcQ","dQw4w9WgXcQ"],["https://example.com/watch?v=dQw4w9WgXcQ",null]].forEach(row=>results.push(same("youtube",row[0],yt?.parseYouTubeId(row[0]),row[1])));

    const requiredIds=["world","robotito","speechBubble","classSubject","classQuestion","bookPrompt","batterySourceText","birthdayScene","startClassBtn","stopClassBtn"];
    requiredIds.forEach(id=>results.push(truthy("dom","#"+id+" existe",document.getElementById(id))));
    const help=document.querySelector(".question-help-panel");
    results.push(same("dom","ayuda empieza cerrada",help?.hasAttribute("open"),false));
    const world=document.querySelector("#world"),scene=world?.querySelector(":scope > .world-scene"),controls=world?.querySelector(":scope > .world-controls");
    results.push(truthy("mobile","escena y controles son hermanos",scene&&controls&&scene.parentElement===controls.parentElement));
    results.push(same("mobile","controles no están dentro de escena",scene?.contains(controls),false));
    results.push(truthy("mobile","acciones táctiles presentes",controls?.querySelectorAll("button").length>=7));

    return results;
  }

  function run(){
    const base=baseRun();
    const extra=advanced();
    const results=[...base.results.map(r=>({...r,suite:r.suite||"smoke"})),...extra];
    const passed=results.filter(r=>r.ok).length;
    const failed=results.length-passed;
    const suites={};
    results.forEach(r=>{const s=suites[r.suite]||(suites[r.suite]={passed:0,failed:0});s[r.ok?"passed":"failed"]++;});
    console.group("Robotito full regression suite: "+passed+" passed, "+failed+" failed");
    Object.entries(suites).forEach(([name,value])=>console.log(name,value));
    results.filter(r=>!r.ok).forEach(r=>console.error("✗ ["+r.suite+"] "+r.label,{actual:r.actual,expected:r.expected}));
    console.groupEnd();
    const report={passed,failed,total:results.length,suites,results};
    window.ROBOTITO_LAST_TEST_REPORT=report;
    document.documentElement.dataset.robotitoTests=failed?"failed":"passed";
    return report;
  }

  window.ROBOTITO_TESTS={run,advanced};
})();
