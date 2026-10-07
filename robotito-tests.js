// Robotito vNext — lightweight regression tests.
// Open the page with ?tests=1 to run automatically, or run ROBOTITO_TESTS.run() in the console.
(function(){
  function same(actual,expected,label){
    const ok=Object.is(actual,expected);
    return {ok,label,actual,expected};
  }
  function truthy(value,label){return {ok:!!value,label,actual:value,expected:"truthy"};}

  function run(){
    const results=[];
    const math=window.ROBOTITO_SPOKEN_MATH;
    const circles=window.ROBOTITO_CIRCLE_MATH;
    const router=window.ROBOTITO_ROUTER;
    const questionRouting=window.ROBOTITO_QUESTION_ROUTING;
    const commonKnowledge=window.ROBOTITO_COMMON_KNOWLEDGE;
    const webKnowledge=window.ROBOTITO_WEB_KNOWLEDGE;
    const battery=window.ROBOTITO_BATTERY;
    const avatars=window.ROBOTITO_AVATARS;
    const avatarArt=window.ROBOTITO_AVATAR_ART;
    const species=window.ROBOTITO_SPECIES;
    const languagePipeline=window.ROBOTITO_LANGUAGE_PIPELINE;
    const silence=window.ROBOTITO_SILENCE;
    const videoMaterial=window.ROBOTITO_YOUTUBE_MATERIAL;
    const speechQA=window.ROBOTITO_SPEECH_QA;

    if(math){
      results.push(same(math.solve("20 por ciento de 50","es").value,10,"20% de 50"));
      results.push(same(math.solve("raiz cubica de 27","es").value,3,"raíz cúbica de 27"));
      results.push(same(math.solve("dos mas tres por cuatro","es").value,14,"precedencia multiplicación"));
      results.push(same(math.solve("dos elevado a la cuarta","es").value,16,"potencia ordinal"));
      results.push(same(math.solve("-2^2","es").value,-4,"signo unario después de potencia"));
      results.push(same(math.solve("2^-2","es").value,.25,"exponente negativo"));
    }else results.push(truthy(false,"spoken math loaded"));

    if(circles){
      let c=circles.parse("x² + y² - 6x + 4y - 12 = 0");
      results.push(same(c?.h,3,"circunferencia general centro h"));
      results.push(same(c?.k,-2,"circunferencia general centro k"));
      results.push(same(c?.r2,25,"circunferencia general r²"));
      c=circles.parse("(x-3)^2 + (y+2)^2 = 25");
      results.push(same(c?.r,5,"circunferencia canónica radio"));
      c=circles.parse("centro (3, -2) radio 5");
      results.push(same(c?.h,3,"circunferencia por datos"));
    }else results.push(truthy(false,"circle math loaded"));

    if(router){
      results.push(same(router.classify("¿Qué es un choque elástico?").depth,"definition","respuesta breve para definición"));
      results.push(same(router.classify("Explicame paso a paso el ejercicio").depth,"detailed","respuesta detallada pedida"));
      results.push(same(router.classify("¿Quién es el presidente de Uruguay?").intent,"president","ruta presidentes"));
      results.push(same(router.classify("¿Qué objeto es esto?").intent,"object","ruta objeto"));
      results.push(same(router.shapeAnswer("¿Qué es la gravedad?","La gravedad es una interacción física. Además tiene múltiples efectos y aplicaciones."),"La gravedad es una interacción física.","recorta definiciones al alcance pedido"));
      results.push(same(router.classify("¿Qué es permutación?").intent,"definition","permutación se entiende como definición general"));
      results.push(same(router.classify("Explícame permutación").intent,"explanation","explicación no se confunde con definición"));
      results.push(same(router.classify("Compara permutación y combinación").intent,"comparison","comparación tiene intención propia"));
      results.push(same(router.classify("Explícame paso a paso el ejercicio 4").intent,"exercise","ejercicio tiene prioridad sobre explicación"));
      results.push(same(router.classify("Explícame paso a paso el ejercicio 4").depth,"detailed","compatibilidad de profundidad detallada"));
      results.push(same(window.ROBOTITO_INTENT_ENGINE.classify("Explícame paso a paso el ejercicio 4").depth,"step-by-step","política distingue paso a paso"));
      results.push(same(window.ROBOTITO_INTENT_ENGINE.classify("Según la clase, ¿qué es permutación?").source,"class","referencia explícita autoriza memoria de clase"));
      results.push(same(window.ROBOTITO_INTENT_ENGINE.classify("¿Qué es permutación?").useClassMemory,false,"definición general no autoriza memoria de clase"));
      results.push(same(window.ROBOTITO_INTENT_ENGINE.classify("Recomendame un libro sobre duelo").intent,"book-recommendation","recomendación de libros tiene ruta propia"));
      results.push(same(window.ROBOTITO_INTENT_ENGINE.classify("¿Cuánto es 18 por 7?").intent,"calculation","cálculo tiene ruta propia"));
    }else results.push(truthy(false,"router loaded"));

    if(questionRouting){
      results.push(same(questionRouting.shouldUseClassFirst("¿Qué es permutación?"),false,"definición general no usa clase primero"));
      results.push(same(questionRouting.shouldUseClassFirst("Según la clase, ¿qué es permutación?"),true,"referencia explícita usa clase primero"));
      results.push(same(questionRouting.shouldUseClassFirst("¿Qué es una clase abstracta?"),false,"concepto llamado clase no se confunde con memoria de clase"));
      results.push(same(questionRouting.isDefinitionQuestion("¿Qué son las permutaciones?"),true,"reconoce definición en plural"));
      results.push(same(questionRouting.definitionSubject("¿Qué es una permutación?"),"permutacion","extrae concepto definido"));
      results.push(same(questionRouting.definitionEvidenceQuality("¿Qué es permutación?",{text:"Entonces por permutación nos da x igual a seis."}),0,"rechaza mención incidental como definición"));
      results.push(same(questionRouting.definitionEvidenceQuality("¿Qué es permutación?",{text:"Una permutación es una ordenación de todos los elementos."}),1,"acepta evidencia definitoria"));
    }else results.push(truthy(false,"question routing loaded"));

    if(commonKnowledge){
      results.push(same(commonKnowledge.answer("¿Qué es permutación?","es"),"Una permutación es una ordenación de todos los elementos de un conjunto; el orden sí importa.","responde permutación sin depender de materiales"));
    }else results.push(truthy(false,"common knowledge loaded"));

    if(webKnowledge){
      results.push(same(webKnowledge.isFactualQuestion("Definime entropía"),true,"acepta pedido imperativo de definición"));
      results.push(same(webKnowledge.isFactualQuestion("Explícame la entropía"),true,"acepta explicaciones generales"));
      results.push(same(webKnowledge.isFactualQuestion("Compara masa y peso"),true,"acepta comparaciones generales"));
      results.push(same(webKnowledge.isFactualQuestion("Según la clase, explicame entropía"),false,"la web no suplanta una consulta explícita de clase"));
      results.push(same(webKnowledge.isFactualQuestion("Me gusta la entropía"),false,"no confunde comentario con pregunta factual"));
    }else results.push(truthy(false,"web knowledge loaded"));

    if(battery){
      results.push(same(battery.alertThreshold(51,50),50,"aviso al llegar a 50%"));
      results.push(same(battery.alertThreshold(21,20),20,"aviso al llegar a 20%"));
      results.push(same(battery.alertThreshold(11,10),10,"aviso al llegar a 10%"));
      results.push(same(battery.alertThreshold(6,5),5,"alerta crítica al llegar a 5%"));
      results.push(same(battery.alertThreshold(4,6),null,"no avisa al subir mientras carga"));
      results.push(same(battery.bucket(4),5,"mantiene alerta por debajo de 5%"));
      results.push(truthy(battery.message(5,"es").includes("no me quiero apagar"),"mensaje crítico expresa miedo a apagarse"));
    }else results.push(truthy(false,"battery integration loaded"));

    if(avatars){
      const ids=avatars.list.map(item=>item.id);
      results.push(same(avatars.list.length,50,"ofrece 50 avatares únicos"));
      results.push(same(new Set(ids).size,ids.length,"no repite animales"));
      results.push(same(avatars.byId("chameleon").es,"Camaleón","incluye camaleón"));
      results.push(same(avatars.byId("unicorn").emoji,"🦄","incluye unicornio"));
      results.push(same(avatars.byId("dolphin").emoji,"🐬","incluye delfín"));
      results.push(truthy(avatars.visualMarkup("panther").includes("<svg"),"pantera usa icono ilustrado propio"));
      results.push(truthy(avatars.visualMarkup("armadillo").includes("<svg"),"armadillo usa icono ilustrado"));
      results.push(same(avatars.byId("missing").id,"panda","usa panda como avatar seguro"));
    }else results.push(truthy(false,"avatar catalog loaded"));

    if(avatarArt&&avatars){
      const nonPanda=avatars.list.filter(item=>item.id!=="panda");
      results.push(same(avatarArt.customIds.length,49,"los otros 49 avatares tienen ilustración propia"));
      results.push(same(avatarArt.render({id:"panda"},"test-art"),null,"el panda no se reemplaza"));
      results.push(truthy(nonPanda.every(item=>avatarArt.render(item,"test-art")?.includes('data-character="'+item.id+'"')),"cada avatar usa el dibujo de su especie"));
      results.push(truthy(nonPanda.every(item=>avatarArt.render(item,"test-art")?.includes("plush-avatar-whole")),"todos los avatares nuevos tienen cuerpo animado completo"));
      results.push(truthy(document.querySelector(".panda-svg .panda-whole .head-group"),"el panda original permanece intacto"));
      results.push(truthy(avatarArt.render({id:"turtle"},"test-art").includes("avatar-shell"),"la tortuga tiene caparazón propio"));
      results.push(truthy(avatarArt.render({id:"elephant"},"test-art").includes("avatar-trunk"),"el elefante tiene trompa propia"));
      results.push(truthy(avatarArt.render({id:"robot"},"test-art").includes("avatar-antenna"),"el robot tiene piezas propias"));
    }else results.push(truthy(false,"custom avatar art loaded"));

    if(species&&avatars){
      const audit=species.audit(avatars.list.map(item=>item.id));
      results.push(same(audit.count,50,"hay una personalidad por avatar"));
      results.push(same(audit.missing.length,0,"cada especie tiene rasgo, movimiento y comentarios"));
      results.push(truthy(species.line("chameleon","surprise").includes("color"),"camaleón reacciona cambiando de color"));
      results.push(truthy(species.line("dolphin","play").includes("agua"),"delfín juega en el agua"));
      results.push(truthy(species.line("robot","pet").toLowerCase().includes("bip"),"robot reacciona con sonidos electrónicos"));
      results.push(same(avatars.list.at(-1).id,"robot","robot aparece al final del selector"));
    }else results.push(truthy(false,"species personalities loaded"));

    if(videoMaterial){
      results.push(same(videoMaterial.parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),"dQw4w9WgXcQ","extrae ID de URL de YouTube"));
      results.push(same(videoMaterial.parseYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=10"),"dQw4w9WgXcQ","extrae ID de URL corta"));
      results.push(same(videoMaterial.parseYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),"dQw4w9WgXcQ","extrae ID de Shorts"));
      results.push(same(videoMaterial.parseYouTubeId("https://example.com/video"),null,"rechaza enlace que no es de YouTube"));
    }else results.push(truthy(false,"YouTube material controls loaded"));

    if(languagePipeline){
      results.push(same(languagePipeline.detect("Me gustan mucho los mimos tranquilos."),"es","detecta respuesta generada en español"));
      results.push(same(languagePipeline.detect("I really like gentle pats."),"en","detecta respuesta generada en inglés"));
      results.push(same(languagePipeline.detect("Eu entendi você e estou feliz."),"pt","detecta respuesta generada en portugués"));
      results.push(same(languagePipeline.needsLocalization("Me gustan mucho los mimos tranquilos.","en",null),true,"inglés traduce respuestas españolas"));
      results.push(same(languagePipeline.needsLocalization("Mi nariz detectó algo rico a varios metros.","en",null),true,"inglés traduce frases españolas de baja confianza"));
      results.push(same(languagePipeline.needsLocalization("I really like gentle pats.","en",null),false,"inglés conserva respuestas ya inglesas"));
      results.push(same(languagePipeline.needsLocalization("Me gustan mucho los mimos tranquilos.","pt",null),true,"portugués traduce respuestas españolas"));
      results.push(same(languagePipeline.needsLocalization("Eu entendi você e estou feliz.","pt",null),false,"portugués conserva respuestas portuguesas"));
      results.push(same(languagePipeline.needsLocalization("I really like gentle pats.","es",null),true,"español traduce respuestas inglesas inesperadas"));
      results.push(same(languagePipeline.needsLocalization("Me gustan mucho los mimos tranquilos.","es",null),false,"español conserva respuestas españolas"));
      results.push(same(languagePipeline.needsLocalization("2 + 2 = 4","en",null),false,"fórmulas no se traducen"));
      results.push(same(languagePipeline.detect(languagePipeline.fallback("en")),"en","la respuesta de emergencia está en inglés"));
      results.push(same(languagePipeline.detect(languagePipeline.fallback("pt")),"pt","la respuesta de emergencia está en portugués"));
      results.push(same(languagePipeline.detect(languagePipeline.fallback("es")),"es","la respuesta de emergencia está en español"));
      results.push(same(languagePipeline.voiceMatches({lang:"en-US"},"en"),true,"voz inglesa coincide con inglés"));
      results.push(same(languagePipeline.voiceMatches({lang:"es-UY"},"en"),false,"voz española no coincide con inglés"));
      results.push(same(languagePipeline.voiceMatches({lang:"pt-BR"},"pt"),true,"voz portuguesa coincide con portugués"));
    }else results.push(truthy(false,"language pipeline loaded"));

    if(silence){
      results.push(same(silence.parseDuration("callate"),25000,"silencio predeterminado de 25 segundos"));
      results.push(same(silence.parseDuration("callate por 10 segundos"),10000,"silencio en segundos"));
      results.push(same(silence.parseDuration("callate durante 2 minutos"),120000,"silencio en minutos"));
      results.push(same(silence.parseDuration("callate durante media hora"),1800000,"silencio de media hora"));
      results.push(same(silence.parseDuration("callate hasta que te diga"),Infinity,"silencio hasta nuevo aviso"));
    }else results.push(truthy(false,"silence controls loaded"));


    if(speechQA){
      results.push(same(speechQA.cleanTranscript("qué qué es la densidad"),"qué es la densidad","limpia repeticiones del reconocimiento"));
      results.push(same(speechQA.mergeChunks("qué es la","la densidad"),"qué es la densidad","une fragmentos de una misma pregunta"));
      results.push(same(speechQA.mergeChunks("cuál es el animal","el animal más grande del mundo"),"cuál es el animal más grande del mundo","conserva solapamiento entre fragmentos"));
      results.push(truthy(speechQA.alternativeScore({transcript:"qué es permutación",confidence:.7})>speechQA.alternativeScore({transcript:"mmm",confidence:.7}),"prioriza alternativas con intención clara"));
    }else results.push(truthy(false,"speech quality helpers loaded"));

    const world=document.querySelector("#world");
    const scene=world?.querySelector(":scope > .world-scene");
    const controls=world?.querySelector(":scope > .world-controls");
    results.push(truthy(scene&&controls,"escena y controles móviles están separados"));
    results.push(same(!!scene?.contains(controls),false,"los controles no pueden superponerse por pertenecer a la escena"));

    if(window.ROBOTITO_PRESIDENTS){
      const p=window.ROBOTITO_PRESIDENTS.parseQuestion("¿Quién era presidente de Uruguay en 2010?");
      results.push(same(p?.country,"uruguay","identifica país en pregunta presidencial"));
      results.push(same(p?.year,2010,"identifica año en pregunta presidencial"));
      results.push(same(p?.intent,"historical","distingue presidente histórico"));
    }else results.push(truthy(false,"president knowledge loaded"));

    const passed=results.filter(x=>x.ok).length;
    const failed=results.length-passed;
    console.group("Robotito regression tests: "+passed+" passed, "+failed+" failed");
    for(const r of results){
      (r.ok?console.log:console.error)((r.ok?"✓ ":"✗ ")+r.label,{actual:r.actual,expected:r.expected});
    }
    console.groupEnd();
    return {passed,failed,results};
  }

  window.ROBOTITO_TESTS={run};
  document.addEventListener("DOMContentLoaded",()=>{
    if(new URLSearchParams(location.search).get("tests")==="1"){
      setTimeout(run,500);
    }
  });
})();
