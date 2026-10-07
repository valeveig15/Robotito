// Robotito — centralized question understanding and response policy.
// Classification happens before retrieval: a keyword found in class notes is evidence,
// never proof that the user asked about a class.
(function(){
  function normalize(value){
    return String(value||"").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[¿?¡!.,;:()[\]{}]/g," ")
      .replace(/\s+/g," ").trim();
  }

  const RULES={
    step:/\b(paso a paso|todos los pasos|mostrame el procedimiento|muestrame el procedimiento|step by step|show (?:me )?the steps|passo a passo)\b/,
    exercise:/\b(ejercicio|exercise|exercicio)\b|\b(problema|actividad|problem)\s*(?:numero|number|nro|n°|#)?\s*\d+\b|\b(resuelve|resolve|resolver|explica|explicame|solve|explain)\b.*\b(problema|actividad|problem)\b/,
    class:/\b(segun (?:la|mi) clase|de acuerdo con (?:la|mi) clase|en (?:(?:la|esta|mi) )?clase|durante (?:(?:la|esta|mi) )?clase|transcripcion|material cargado|mis apuntes|los apuntes|mi profesor|mi profesora|la profe|el profe|vimos en clase|aprendimos en clase|dijo (?:el|la) profesor|explico (?:el|la) profesor|according to (?:the|my) class|in (?:the|my) class|class notes|my notes|uploaded material|na (?:minha )?aula|material enviado)\b/,
    book:/\b(libro|libros|novela|novelas|lectura|book|books|novel|reading|livro|livros|leitura)\b.*\b(recomendame|recomiendame|recomenda|recomienda|recommend|suggest|sugerime|sugiereme|sugiere|sugira|parecid|similar)\w*|\b(recomendame|recomiendame|recomenda|recomienda|recommend|suggest|sugerime|sugiereme|sugiere|sugira)\w*\b.*\b(libro|libros|novela|book|books|novel|livro|livros)\b/,
    compare:/\b(compara|comparame|comparacion|diferencia entre|diferencias entre|en que se diferencian|que tienen en comun|versus|vs|compare|comparison|difference between|differences between|compare|diferenca entre)\b/,
    define:/^(?:por favor\s+)?(?:que (?:es|son|significa)|cual(?:es)? es la definicion(?: de)?|define|defini|definime|dame la definicion(?: de)?|que se entiende por|what (?:is|are|does .+ mean)|define|definition of|o que (?:e|sao)|defina)\b/,
    explain:/^(?:por favor\s+)?(?:explica|explicame|contame sobre|desarrolla|como funciona|por que|porque|help me understand|explain|how does|how do|why|explique|me explique|como funciona|por que)\b/,
    calculation:/\b(cuanto (?:es|da)|calcula|resolve|resolver|resultado|raiz (?:cuadrada|cubica)|por ciento|sum[ao]|rest[ao]|multiplica|divide|calculate|solve|what is \d|square root|percent of|quanto (?:e|da)|calcule)\b|(?:\d\s*[-+*/^×÷=]\s*\d)/,
    object:/\b(que es esto|que objeto es|que estoy mostrando|reconoce (?:este objeto|esto)|what is this object|what am i showing)\b/,
    conversation:/^(?:hola|buen(?:os dias|as tardes|as noches)|como estas|gracias|te quiero|te amo|me caes|tengo miedo|estoy triste|estoy feliz|hello|hi|how are you|thank you|i love you|ola|obrigad[oa])\b/,
    command:/^(?:callate|silencio|deja de hablar|habla|repeti|repite|dibuj\w*|mostra\w*|muestra\w*|abri|abre|cerr\w*|cambia|pon|pone|anda|ven|sleep|stop|be quiet|repeat|show|open|close|change|draw)\b/
  };

  function extractExerciseNumber(q){
    const match=q.match(/\b(?:ejercicio|problema|actividad|exercise|problem|exercicio)\s*(?:numero|number|nro|n|#)?\s*(\d{1,3})\b/);
    return match?Number(match[1]):null;
  }

  function extractTopic(raw,intent){
    let q=normalize(raw);
    if(intent==="definition")q=q.replace(RULES.define,"");
    else if(intent==="explanation")q=q.replace(RULES.explain,"");
    else if(intent==="comparison")q=q.replace(/^.*?\b(compara(?:me)?|comparacion|diferencia(?:s)? entre|compare|comparison|difference(?:s)? between)\b/,"");
    else if(intent==="class-question")q=q.replace(RULES.class," ");
    return q.replace(/^(?:un|una|el|la|los|las|a|an|the)\s+/,"").trim();
  }

  function classify(raw){
    const q=normalize(raw);
    const result={intent:"statement",depth:"normal",source:"none",topic:"",exerciseNumber:null,confidence:.72};
    if(!q)return {...result,intent:"empty",confidence:1};

    // Priority is semantic. Specific actions beat broad question forms.
    if(RULES.object.test(q))result.intent="object";
    else if(RULES.exercise.test(q)){result.intent="exercise";result.source="class";result.exerciseNumber=extractExerciseNumber(q);}
    else if(RULES.class.test(q)){result.intent="class-question";result.source="class";}
    else if(RULES.book.test(q)){result.intent="book-recommendation";result.source="books";}
    else if(RULES.command.test(q))result.intent="command";
    else if(RULES.calculation.test(q)){result.intent="calculation";result.source="calculator";}
    else if(RULES.compare.test(q)){result.intent="comparison";result.source="general";}
    else if(RULES.define.test(q)){result.intent="definition";result.source="general";}
    else if(RULES.explain.test(q)){result.intent="explanation";result.source="general";}
    else if(RULES.conversation.test(q))result.intent="conversation";
    else if(/[?¿]/.test(String(raw))||/^(que|quien|cual|como|cuando|donde|por que|cuanto|what|who|which|how|when|where|why|o que|quem|qual|quando|onde)\b/.test(q)){
      result.intent="factual-question";result.source="general";
    }

    const depthQuery=q.replace(RULES.class," ").trim();
    if(RULES.step.test(q))result.depth="step-by-step";
    else if(result.intent==="definition"||RULES.define.test(depthQuery))result.depth="brief";
    else if(result.intent==="comparison"||RULES.compare.test(depthQuery))result.depth="structured";
    else if(result.intent==="explanation"||result.intent==="exercise"||RULES.explain.test(depthQuery))result.depth="detailed";
    result.topic=extractTopic(raw,result.intent);
    result.useClassMemory=result.intent==="class-question"||result.intent==="exercise";
    result.isQuestion=["definition","explanation","comparison","calculation","class-question","exercise","factual-question","object","book-recommendation"].includes(result.intent);
    return result;
  }

  function legacyDepth(raw){
    const depth=classify(raw).depth;
    if(depth==="brief")return "definition";
    if(depth==="detailed"||depth==="step-by-step"||depth==="structured")return "detailed";
    return "normal";
  }

  function shapeAnswer(raw,answer){
    const text=String(answer||"").replace(/\s+/g," ").trim();
    const policy=classify(raw);
    if(!text)return text;
    const sentences=text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text];
    if(policy.depth==="brief"){
      const one=(sentences[0]||text).trim();
      return one.length>240?one.slice(0,237).replace(/\s+\S*$/,"")+"…":one;
    }
    const max=policy.depth==="step-by-step"?1800:policy.depth==="detailed"?1200:policy.depth==="structured"?1000:520;
    const limited=policy.depth==="normal"?sentences.slice(0,3).join(" ").trim():text;
    return limited.length>max?limited.slice(0,max-1).replace(/\s+\S*$/,"")+"…":limited;
  }

  window.ROBOTITO_INTENT_ENGINE={normalize,classify,responseDepth:legacyDepth,shapeAnswer};
})();
