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
    const silence=window.ROBOTITO_SILENCE;
    const videoMaterial=window.ROBOTITO_YOUTUBE_MATERIAL;

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
      results.push(same(webKnowledge.isFactualQuestion("Me gusta la entropía"),false,"no confunde comentario con pregunta factual"));
    }else results.push(truthy(false,"web knowledge loaded"));

    if(videoMaterial){
      results.push(same(videoMaterial.parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),"dQw4w9WgXcQ","extrae ID de URL de YouTube"));
      results.push(same(videoMaterial.parseYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=10"),"dQw4w9WgXcQ","extrae ID de URL corta"));
      results.push(same(videoMaterial.parseYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),"dQw4w9WgXcQ","extrae ID de Shorts"));
      results.push(same(videoMaterial.parseYouTubeId("https://example.com/video"),null,"rechaza enlace que no es de YouTube"));
    }else results.push(truthy(false,"YouTube material controls loaded"));

    if(silence){
      results.push(same(silence.parseDuration("callate"),25000,"silencio predeterminado de 25 segundos"));
      results.push(same(silence.parseDuration("callate por 10 segundos"),10000,"silencio en segundos"));
      results.push(same(silence.parseDuration("callate durante 2 minutos"),120000,"silencio en minutos"));
      results.push(same(silence.parseDuration("callate durante media hora"),1800000,"silencio de media hora"));
      results.push(same(silence.parseDuration("callate hasta que te diga"),Infinity,"silencio hasta nuevo aviso"));
    }else results.push(truthy(false,"silence controls loaded"));

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