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

    if(math){
      results.push(same(math.solve("20 por ciento de 50","es").value,10,"20% de 50"));
      results.push(same(math.solve("raiz cubica de 27","es").value,3,"raíz cúbica de 27"));
      results.push(same(math.solve("dos mas tres por cuatro","es").value,14,"precedencia multiplicación"));
      results.push(same(math.solve("dos elevado a la cuarta","es").value,16,"potencia ordinal"));
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
    }else results.push(truthy(false,"router loaded"));

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