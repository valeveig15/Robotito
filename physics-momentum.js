// Robotito — Física: impulso, cantidad de movimiento y choques.
// Núcleo alineado con los apuntes de Física de la usuaria; incluye una expansión
// conceptual estable para poder explicar y resolver ejercicios del tema.
(function(){
  const norm=s=>String(s||"").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[×·]/g,"*").replace(/÷/g,"/")
    .replace(/[^a-z0-9+\-*/=.,²^\s]/g," ")
    .replace(/\s+/g," ").trim();

  const nfmt=n=>{
    if(!Number.isFinite(n))return String(n);
    const v=Math.abs(n)<1e-12?0:Number(n.toFixed(6));
    return String(v).replace(".",",");
  };
  const has=(t,arr)=>arr.some(x=>t.includes(norm(x)));
  const words=t=>new Set(norm(t).split(" "));
  const all=(t,arr)=>{const w=words(t);return arr.every(x=>w.has(norm(x)));};

  const topics=[
    {
      keys:["cantidad de movimiento","momentum","momento lineal","cantidad movimiento","p=mv","p = m v"],
      answer:"La cantidad de movimiento, también llamada momentum lineal, es una magnitud vectorial: p⃗ = m·v⃗. Depende de la masa y de la velocidad, por eso tiene la misma dirección y sentido que la velocidad. Su unidad SI es kg·m/s, equivalente dimensionalmente a N·s. Si elegís un eje, el signo de p depende del signo de v."
    },
    {
      keys:["impulso","teorema impulso","impulso cantidad movimiento","i=delta p","i = f t"],
      answer:"El impulso I⃗ mide el efecto de una fuerza durante un intervalo de tiempo y es igual al cambio de cantidad de movimiento: I⃗ = Δp⃗ = p⃗f − p⃗i. Si la fuerza neta es constante, I⃗ = F⃗neta·Δt. Su unidad es N·s, que equivale a kg·m/s."
    },
    {
      keys:["fuerza tiempo","grafica f t","gráfica f t","area bajo fuerza","área bajo fuerza","area fuerza tiempo"],
      answer:"En una gráfica fuerza-tiempo, el impulso es el área algebraica bajo la curva: I = ∫F dt. Si la fuerza es constante, el área es un rectángulo F·Δt. Si cambia con el tiempo, sumás las áreas con signo o integrás. Esa área da directamente Δp."
    },
    {
      keys:["segunda ley momentum","fuerza cambio momentum","fuerza cantidad movimiento","dp dt"],
      answer:"La segunda ley de Newton puede escribirse como F⃗neta = d p⃗/dt. Para masa constante se reduce a F⃗neta = m·a⃗. Esta forma es especialmente útil cuando analizás impulso y cambios de cantidad de movimiento."
    },
    {
      keys:["conservacion cantidad movimiento","conservación cantidad movimiento","conservacion momentum","se conserva momentum","cuando se conserva"],
      answer:"La cantidad de movimiento total de un sistema se conserva cuando el impulso externo neto sobre el sistema es cero o despreciable: Σp⃗i = Σp⃗f. Las fuerzas internas entre los cuerpos pueden ser muy grandes, pero se cancelan por pares dentro del sistema; lo que importa para la conservación es el impulso externo."
    },
    {
      keys:["sistema aislado","fuerzas internas","fuerzas externas","impulso externo"],
      answer:"Para decidir si podés conservar cantidad de movimiento, primero definí el sistema. Las fuerzas entre cuerpos del sistema son internas. Las fuerzas ejercidas desde afuera son externas. Si el impulso externo neto durante el intervalo es nulo o despreciable, el momentum total del sistema se conserva."
    },
    {
      keys:["choque","colision","colisión"],
      answer:"En un choque, si el impulso externo durante el breve intervalo de interacción es despreciable, se conserva la cantidad de movimiento total. Lo que distingue los tipos de choque es qué ocurre con la energía cinética: en un choque elástico también se conserva; en uno inelástico no; y en uno totalmente inelástico los cuerpos quedan unidos después del choque."
    },
    {
      keys:["choque elastico","choque elástico","colision elastica","colisión elástica"],
      answer:"En un choque elástico se conservan tanto la cantidad de movimiento total como la energía cinética total. En una dimensión tenés dos ecuaciones independientes: m₁v₁i + m₂v₂i = m₁v₁f + m₂v₂f y ½m₁v₁i² + ½m₂v₂i² = ½m₁v₁f² + ½m₂v₂f²."
    },
    {
      keys:["choque inelastico","choque inelástico","colision inelastica","colisión inelástica"],
      answer:"En un choque inelástico se conserva la cantidad de movimiento total del sistema aislado, pero no la energía cinética total: parte se transforma en deformación, calor, sonido u otras formas de energía. Los cuerpos no necesariamente quedan unidos."
    },
    {
      keys:["totalmente inelastico","totalmente inelástico","perfectamente inelastico","perfectamente inelástico","quedan pegados","quedan unidos"],
      answer:"En un choque totalmente inelástico los cuerpos quedan unidos y comparten una velocidad final. En una dimensión: m₁v₁ + m₂v₂ = (m₁+m₂)vf, por lo que vf = (m₁v₁+m₂v₂)/(m₁+m₂). La cantidad de movimiento se conserva, pero la energía cinética disminuye."
    },
    {
      keys:["energia cinetica choque","energía cinética choque","energia en choque","energía en choque"],
      answer:"La energía total siempre se conserva, pero la energía cinética no necesariamente. En choques elásticos, Ec,total inicial = Ec,total final. En choques inelásticos, la energía cinética final es menor; la diferencia aparece en deformación, calor, sonido u otras formas internas."
    },
    {
      keys:["retroceso","recoil","rifle","arma retroceso"],
      answer:"El retroceso es una aplicación de conservación de cantidad de movimiento. Si el sistema parte en reposo, el momentum total inicial es cero, así que después m₁v₁ + m₂v₂ = 0. Los dos cuerpos adquieren momenta iguales en módulo y opuestos en sentido; el más masivo suele tener menor rapidez."
    },
    {
      keys:["explosion","explosión","se separan","fragmentos"],
      answer:"En una explosión, las fuerzas que separan los fragmentos son internas. Si el impulso externo es despreciable, el momentum total antes y después es el mismo. Si el objeto estaba en reposo, la suma vectorial de los momenta de los fragmentos después debe ser cero."
    },
    {
      keys:["airbag","bolsa de aire","cinturon","cinturón","atrapar pelota","catch ball","lesion impulso","lesión impulso"],
      answer:"Para un mismo cambio de cantidad de movimiento, aumentar el tiempo de interacción reduce la fuerza promedio: Fprom = Δp/Δt. Por eso una bolsa de aire, un cinturón que cede, doblar los brazos al atrapar una pelota o hacer follow-through pueden disminuir fuerzas máximas o repartirlas durante más tiempo."
    },
    {
      keys:["choque dos dimensiones","choque 2d","colision dos dimensiones","colisión 2d","componentes choque"],
      answer:"En dos dimensiones la conservación de cantidad de movimiento se aplica por componentes: Σpix = Σpfx y Σpiy = Σpfy. Conviene elegir ejes, descomponer cada velocidad en x e y, conservar momentum en cada eje y resolver las incógnitas."
    },
    {
      keys:["signos choque","signo velocidad choque","direccion momentum","dirección momentum"],
      answer:"En problemas unidimensionales elegí un sentido positivo antes de empezar. Las velocidades y los momenta que apuntan en ese sentido son positivos y los que apuntan al contrario son negativos. No uses todos los módulos como positivos: perderías la información de dirección."
    },
    {
      keys:["unidad impulso","unidades impulso","unidad momentum","unidad cantidad movimiento","n s kg m s"],
      answer:"Cantidad de movimiento: kg·m/s. Impulso: N·s. Son unidades equivalentes porque 1 N = 1 kg·m/s², entonces 1 N·s = 1 kg·m/s."
    },
    {
      keys:["diferencia impulso fuerza","impulso y fuerza","impulso vs fuerza"],
      answer:"Fuerza e impulso no son lo mismo. La fuerza describe la interacción en un instante; el impulso acumula el efecto de esa fuerza durante un tiempo. Una fuerza grande durante poco tiempo y una fuerza menor durante más tiempo pueden producir el mismo impulso y el mismo Δp."
    },
    {
      keys:["diferencia impulso momentum","impulso y momentum","impulso vs cantidad"],
      answer:"La cantidad de movimiento p=m·v describe el estado de movimiento de un cuerpo en un instante. El impulso describe el cambio entre dos estados: I=Δp. Por eso impulso y momentum tienen las mismas dimensiones y unidades, aunque representan ideas distintas."
    },
    {
      keys:["grafica p t","gráfica p t","pendiente momentum tiempo","pendiente p t"],
      answer:"En una gráfica cantidad de movimiento-tiempo, la pendiente dp/dt es la fuerza neta. Una recta horizontal significa fuerza neta cero; una pendiente constante significa fuerza neta constante."
    },
    {
      keys:["centro de masa momentum","centro de masa cantidad movimiento"],
      answer:"Para un sistema de masa total M, el momentum total se relaciona con la velocidad del centro de masa por P⃗total = M·V⃗CM. Si la fuerza externa neta es cero, el centro de masa se mueve con velocidad constante."
    },
    {
      keys:["coeficiente restitucion","coeficiente de restitucion","restitucion choque","restitución choque"],
      answer:"Como extensión, el coeficiente de restitución e mide cuánta rapidez relativa de separación queda respecto de la rapidez relativa de aproximación en la línea de choque. En 1D: e = |v₂f−v₁f|/|v₁i−v₂i|. e=1 corresponde al caso elástico ideal y e=0 al totalmente inelástico ideal."
    }
  ];

  const commonMistakes=[
    "La cantidad de movimiento es vectorial: no olvides signos o componentes.",
    "En un choque se conserva el momentum total del sistema, no necesariamente el de cada cuerpo.",
    "Conservar momentum no significa conservar energía cinética.",
    "Si los cuerpos quedan pegados, la velocidad final es común a ambos.",
    "N·s y kg·m/s son unidades equivalentes.",
    "En una gráfica F–t el impulso es el área, no la pendiente.",
    "Antes de reemplazar números, elegí el sistema y un sentido positivo."
  ];

  function extractNumber(text,patterns){
    for(const re of patterns){
      const m=text.match(re);
      if(m){
        const v=Number(String(m[1]).replace(",","."));
        if(Number.isFinite(v))return v;
      }
    }
    return null;
  }

  function values(text){
    const t=norm(text);
    const mass1=extractNumber(t,[
      /(?:m1|m 1|masa 1|masa del primero|primer cuerpo|cuerpo 1)[^0-9-]*(-?\d+(?:[.,]\d+)?)/,
      /(?:masa)[^0-9-]*(-?\d+(?:[.,]\d+)?)\s*kg/
    ]);
    const mass2=extractNumber(t,[
      /(?:m2|m 2|masa 2|masa del segundo|segundo cuerpo|cuerpo 2)[^0-9-]*(-?\d+(?:[.,]\d+)?)/,
      /(?:otra masa|segunda masa)[^0-9-]*(-?\d+(?:[.,]\d+)?)/
    ]);
    const mass=extractNumber(t,[
      /(?:masa|m)[^0-9-]*(-?\d+(?:[.,]\d+)?)\s*kg/,
      /(-?\d+(?:[.,]\d+)?)\s*kg/
    ]);
    const vi=extractNumber(t,[
      /(?:vi|v inicial|velocidad inicial|parte a|inicialmente)[^0-9-]*(-?\d+(?:[.,]\d+)?)\s*(?:m\/s|m s)?/
    ]);
    const vf=extractNumber(t,[
      /(?:vf|v final|velocidad final|termina a|queda a)[^0-9-]*(-?\d+(?:[.,]\d+)?)\s*(?:m\/s|m s)?/
    ]);
    const v1=extractNumber(t,[
      /(?:v1|v 1|velocidad 1|velocidad del primero|primer cuerpo)[^0-9-]*(-?\d+(?:[.,]\d+)?)\s*(?:m\/s|m s)?/
    ]);
    const v2=extractNumber(t,[
      /(?:v2|v 2|velocidad 2|velocidad del segundo|segundo cuerpo)[^0-9-]*(-?\d+(?:[.,]\d+)?)\s*(?:m\/s|m s)?/
    ]);
    const force=extractNumber(t,[
      /(?:fuerza|f neta|fuerza neta|f)[^0-9-]*(-?\d+(?:[.,]\d+)?)\s*n\b/,
      /(-?\d+(?:[.,]\d+)?)\s*n\b/
    ]);
    const time=extractNumber(t,[
      /(?:durante|tiempo|delta t|dt|intervalo)[^0-9-]*(-?\d+(?:[.,]\d+)?)\s*s\b/,
      /(-?\d+(?:[.,]\d+)?)\s*(?:s|segundos?)\b/
    ]);
    const impulse=extractNumber(t,[
      /(?:impulso|i)[^0-9-]*(-?\d+(?:[.,]\d+)?)\s*(?:n\s*s|ns|n s)/
    ]);
    return {t,mass,mass1,mass2,vi,vf,v1,v2,force,time,impulse};
  }

  function solve(text){
    const v=values(text),t=v.t;
    const wantsSolve=has(t,["calcula","calcular","resolve","resolver","halla","hallar","cuanto vale","cuánto vale","cual es","cuál es","determina","encontra","encontrá","saca","sacame"]);

    // p = m v
    if((has(t,["cantidad de movimiento","momentum","momento lineal"])||/\bp\b/.test(t)) && v.mass!==null){
      const speed=v.vf??v.vi??extractNumber(t,[/(?:velocidad|rapidez|v)[^0-9-]*(-?\d+(?:[.,]\d+)?)\s*(?:m\/s|m s)/]);
      if(speed!==null){
        const p=v.mass*speed;
        return `Uso p = m·v. p = ${nfmt(v.mass)} kg · ${nfmt(speed)} m/s = ${nfmt(p)} kg·m/s. El signo indica el sentido según el eje que elegiste.`;
      }
    }

    // I = F dt
    if(has(t,["impulso"]) && v.force!==null && v.time!==null){
      const I=v.force*v.time;
      return `Como la fuerza neta es constante, uso I = F·Δt. I = ${nfmt(v.force)} N · ${nfmt(v.time)} s = ${nfmt(I)} N·s, equivalente a ${nfmt(I)} kg·m/s.`;
    }

    // I = m(vf-vi)
    if((has(t,["impulso","cambio de cantidad","delta p"])||wantsSolve) && v.mass!==null && v.vi!==null && v.vf!==null){
      const dp=v.mass*(v.vf-v.vi);
      return `Uso I = Δp = m(vf−vi). I = ${nfmt(v.mass)}·(${nfmt(v.vf)}−${nfmt(v.vi)}) = ${nfmt(dp)} N·s. Si da negativo, el impulso apunta en el sentido negativo del eje elegido.`;
    }

    // Favg = I/dt or mΔv/dt
    if(has(t,["fuerza promedio","fuerza media","fuerza neta"]) && v.time!==null){
      if(v.impulse!==null){
        const F=v.impulse/v.time;
        return `Uso Fprom = I/Δt. Fprom = ${nfmt(v.impulse)}/${nfmt(v.time)} = ${nfmt(F)} N.`;
      }
      if(v.mass!==null&&v.vi!==null&&v.vf!==null){
        const F=v.mass*(v.vf-v.vi)/v.time;
        return `Uso Fprom = Δp/Δt = m(vf−vi)/Δt. Fprom = ${nfmt(v.mass)}·(${nfmt(v.vf)}−${nfmt(v.vi)})/${nfmt(v.time)} = ${nfmt(F)} N.`;
      }
    }

    // perfectly inelastic
    if(has(t,["totalmente inelastico","totalmente inelástico","perfectamente inelastico","perfectamente inelástico","quedan pegados","quedan unidos","se pegan"]) &&
       v.mass1!==null&&v.mass2!==null&&v.v1!==null&&v.v2!==null){
      const out=(v.mass1*v.v1+v.mass2*v.v2)/(v.mass1+v.mass2);
      const ki=.5*v.mass1*v.v1*v.v1+.5*v.mass2*v.v2*v.v2;
      const kf=.5*(v.mass1+v.mass2)*out*out;
      return `Como quedan unidos, uso conservación de momentum: m₁v₁ + m₂v₂ = (m₁+m₂)vf. vf = [${nfmt(v.mass1)}·${nfmt(v.v1)} + ${nfmt(v.mass2)}·${nfmt(v.v2)}]/[${nfmt(v.mass1)}+${nfmt(v.mass2)}] = ${nfmt(out)} m/s. La energía cinética pasa de ${nfmt(ki)} J a ${nfmt(kf)} J; la diferencia no desaparece, se transforma en otras formas.`;
    }

    // 1D elastic collision, both final velocities unknown.
    if(has(t,["choque elastico","choque elástico","colision elastica","colisión elástica"]) &&
       v.mass1!==null&&v.mass2!==null&&v.v1!==null&&v.v2!==null){
      const den=v.mass1+v.mass2;
      const v1f=((v.mass1-v.mass2)/den)*v.v1+(2*v.mass2/den)*v.v2;
      const v2f=(2*v.mass1/den)*v.v1+((v.mass2-v.mass1)/den)*v.v2;
      return `Para un choque elástico 1D con esas velocidades iniciales, conservo momentum y energía cinética. Resulta v₁f = ${nfmt(v1f)} m/s y v₂f = ${nfmt(v2f)} m/s. Los signos indican el sentido respecto del eje elegido.`;
    }

    // Recoil/explosion from rest when one final speed is given.
    if(has(t,["retroceso","explosion","explosión","se separan"]) && v.mass1!==null&&v.mass2!==null){
      const known1=extractNumber(t,[/(?:v1f|velocidad 1 final|velocidad del primero)[^0-9-]*(-?\d+(?:[.,]\d+)?)/]);
      const known2=extractNumber(t,[/(?:v2f|velocidad 2 final|velocidad del segundo)[^0-9-]*(-?\d+(?:[.,]\d+)?)/]);
      if(known1!==null){
        const out=-(v.mass1*known1)/v.mass2;
        return `Si el sistema parte en reposo, ptotal inicial = 0. Entonces m₁v₁ + m₂v₂ = 0. Con v₁ = ${nfmt(known1)} m/s, v₂ = −m₁v₁/m₂ = ${nfmt(out)} m/s.`;
      }
      if(known2!==null){
        const out=-(v.mass2*known2)/v.mass1;
        return `Si el sistema parte en reposo, ptotal inicial = 0. Entonces m₁v₁ + m₂v₂ = 0. Con v₂ = ${nfmt(known2)} m/s, v₁ = −m₂v₂/m₁ = ${nfmt(out)} m/s.`;
      }
    }

    return null;
  }

  function answer(query){
    const t=norm(query);

    const solved=solve(t);
    if(solved)return solved;

    if(has(t,["errores comunes","errores tipicos","errores típicos","que no debo hacer","trampas del tema"])){
      return "Errores comunes: "+commonMistakes.join(" ");
    }

    if(has(t,["formulas impulso","fórmulas impulso","formulas momentum","fórmulas momentum","formulas cantidad de movimiento","resumen formulas","resumen de formulas"])){
      return "Fórmulas clave: p⃗=m·v⃗; I⃗=Δp⃗=p⃗f−p⃗i; si F es constante, I⃗=F⃗neta·Δt; en general I⃗=∫F⃗dt; conservación: Σp⃗i=Σp⃗f si el impulso externo neto es cero; choque totalmente inelástico: vf=(m₁v₁+m₂v₂)/(m₁+m₂). En choque elástico también se conserva la energía cinética.";
    }

    if(has(t,["como resolver choque","cómo resolver choque","pasos choque","resolver colision","resolver colisión"])){
      return "Para resolver un choque: 1) definí el sistema; 2) elegí un eje y signos; 3) escribí el momentum total antes; 4) escribí el momentum total después; 5) igualalos si el impulso externo es despreciable; 6) agregá la condición del tipo de choque: unidos si es totalmente inelástico o conservación de Ec si es elástico; 7) resolvé y revisá el signo físico de la respuesta.";
    }

    if(has(t,["como resolver impulso","cómo resolver impulso","pasos impulso"])){
      return "Para impulso: identificá estado inicial y final. Si conocés velocidades, usá I=Δp=m(vf−vi) para masa constante. Si conocés fuerza y tiempo, usá I=F·Δt si F es constante. Si te dan una gráfica F–t, calculá el área algebraica bajo la curva. Mantené signos y unidades.";
    }

    if(has(t,["que pasa si aumenta tiempo","aumentar tiempo de choque","mas tiempo menos fuerza","más tiempo menos fuerza"])){
      return "Si el cambio de momentum Δp es el mismo, I=Δp también es el mismo. Como Fprom=Δp/Δt, aumentar el tiempo de interacción reduce la fuerza promedio. Es la idea detrás de airbags, acolchados y doblar los brazos al atrapar una pelota.";
    }

    // More specific topics first.
    const ordered=[...topics].sort((a,b)=>Math.max(...b.keys.map(k=>k.length))-Math.max(...a.keys.map(k=>k.length)));
    for(const topic of ordered){
      if(has(t,topic.keys))return topic.answer;
    }

    return null;
  }

  // Useful prompts Robotito can understand include definitions, formula summaries,
  // comparisons, graphs, safety applications and numerical exercises.
  window.ROBOTITO_PHYSICS_MOMENTUM={
    answer,
    solve,
    commonMistakes,
    sourceNote:"Núcleo de fórmulas alineado con los apuntes de Física de la usuaria; teoría ampliada para estudio y resolución."
  };
})();