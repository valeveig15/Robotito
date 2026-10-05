// Robotito vNext — restored/enhanced math, object vision, intent routing and micro-behaviours.
(function(){
  function norm(s){
    return String(s||"").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[¿?¡!]/g," ")
      .replace(/\s+/g," ").trim();
  }
  function num(s){
    const n=Number(String(s||"").replace(",","."));
    return Number.isFinite(n)?n:null;
  }
  function trimNumber(n){
    if(!Number.isFinite(n))return String(n);
    const v=Math.abs(n)<1e-10?0:Number(n.toFixed(8));
    return String(v);
  }
  function coeff(raw){
    if(raw===undefined||raw===null||raw===""||raw==="+")return 1;
    if(raw==="-")return -1;
    return num(raw);
  }
  function signTerm(variable,value){
    if(Math.abs(value)<1e-12)return variable+"²";
    return "("+variable+(value>0?" - ":" + ")+trimNumber(Math.abs(value))+")²";
  }

  function parseCirclePrompt(raw){
    const original=String(raw||"").trim();
    if(!original)return null;
    const s=original.replace(/²/g,"^2").replace(/[−–—]/g,"-");

    let m=s.match(/centro\s*\(?\s*(-?\d+(?:[.,]\d+)?)\s*[,;]\s*(-?\d+(?:[.,]\d+)?)\s*\)?.*?radio\s*(?:=|de|es)?\s*(\d+(?:[.,]\d+)?)/i);
    if(m){
      const h=num(m[1]),k=num(m[2]),r=num(m[3]);
      if(h!==null&&k!==null&&r!==null&&r>0)return {h,k,r,r2:r*r,method:"data",original};
    }

    const compact=s.replace(/\s+/g,"").replace(/\*/g,"");

    // Canonical form: (x-h)^2 + (y-k)^2 = r^2
    m=compact.match(/^\(x([+-])(\d+(?:\.\d+)?)\)\^2\+\(y([+-])(\d+(?:\.\d+)?)\)\^2=(\d+(?:\.\d+)?)$/i);
    if(m){
      const h=m[1]==="-"?Number(m[2]):-Number(m[2]);
      const k=m[3]==="-"?Number(m[4]):-Number(m[4]);
      const r2=Number(m[5]);
      if(r2>=0)return {h,k,r:Math.sqrt(r2),r2,method:"canonical",original};
    }
    m=compact.match(/^x\^2\+y\^2=(\d+(?:\.\d+)?)$/i);
    if(m){
      const r2=Number(m[1]);
      return {h:0,k:0,r:Math.sqrt(r2),r2,method:"canonical",original};
    }

    const parts=compact.split("=");
    if(parts.length!==2)return null;
    const rhs=num(parts[1]);
    if(rhs===null)return null;
    let lhs=parts[0];

    function squareCoeff(variable){
      const re=new RegExp("(^|[+\\-])((?:\\d+(?:\\.\\d+)?)?)"+variable+"\\^2","i");
      const hit=lhs.match(re);
      if(!hit)return null;
      const raw=(hit[1]||"")+(hit[2]||"");
      return {value:coeff(raw),match:hit[0]};
    }
    const sx=squareCoeff("x"),sy=squareCoeff("y");
    if(!sx||!sy||sx.value===null||sy.value===null)return null;
    if(Math.abs(sx.value-sy.value)>1e-9||Math.abs(sx.value)<1e-12)return null;
    const q=sx.value;

    lhs=lhs.replace(sx.match,"").replace(sy.match,"");
    if(lhs&&!/^[+-]/.test(lhs))lhs="+"+lhs;

    function linearCoeff(variable){
      const re=new RegExp("([+\\-])((?:\\d+(?:\\.\\d+)?)?)"+variable+"(?![a-z0-9^])","i");
      const hit=lhs.match(re);
      if(!hit)return {value:0,match:null};
      const raw=hit[1]+(hit[2]||"");
      return {value:coeff(raw),match:hit[0]};
    }
    const lx=linearCoeff("x"),ly=linearCoeff("y");
    if(lx.value===null||ly.value===null)return null;
    if(lx.match)lhs=lhs.replace(lx.match,"");
    if(ly.match)lhs=lhs.replace(ly.match,"");

    let constant=0;
    const constants=lhs.match(/[+-]\d+(?:\.\d+)?/g)||[];
    for(const token of constants)constant+=Number(token);

    const A=lx.value/q;
    const B=ly.value/q;
    const C=(constant-rhs)/q;
    const h=-A/2,k=-B/2,r2=h*h+k*k-C;
    if(r2< -1e-9)return {h,k,r:null,r2,A,B,C,q,method:"general-no-real",original};
    const safeR2=Math.max(0,r2);
    return {h,k,r:Math.sqrt(safeR2),r2:safeR2,A,B,C,q,method:"general",original};
  }

  function circleExplanation(sol){
    if(!sol)return null;
    if(sol.method==="general-no-real"){
      return "Al completar cuadrados, el valor que debería ser r² queda negativo. Por eso esta ecuación no representa una circunferencia real.";
    }
    const canonical=signTerm("x",sol.h)+" + "+signTerm("y",sol.k)+" = "+trimNumber(sol.r2);
    if(sol.method==="data"){
      return "Datos: centro C = ("+trimNumber(sol.h)+", "+trimNumber(sol.k)+") y radio r = "+trimNumber(sol.r)+". La forma canónica es "+canonical+".";
    }
    if(sol.method==="canonical"){
      return "La ecuación ya está en forma canónica. Comparo con (x - h)² + (y - k)² = r². Entonces el centro es ("+trimNumber(sol.h)+", "+trimNumber(sol.k)+") y el radio es "+trimNumber(sol.r)+".";
    }
    const halfA=sol.A/2,halfB=sol.B/2;
    return [
      "1. Parto de la forma general y dejo x², y² y los términos lineales del mismo lado.",
      "2. Para x completo cuadrado: la mitad de "+trimNumber(sol.A)+" es "+trimNumber(halfA)+" y su cuadrado es "+trimNumber(halfA*halfA)+".",
      "3. Para y completo cuadrado: la mitad de "+trimNumber(sol.B)+" es "+trimNumber(halfB)+" y su cuadrado es "+trimNumber(halfB*halfB)+".",
      "4. La ecuación queda "+canonical+".",
      "5. Comparando con (x - h)² + (y - k)² = r², el centro es ("+trimNumber(sol.h)+", "+trimNumber(sol.k)+") y el radio es "+trimNumber(sol.r)+"."
    ].join("\n");
  }

  function drawCircle(sol){
    const cv=document.querySelector("#mathCanvas");
    if(!cv||!sol||!Number.isFinite(sol.r))return;
    const ctx=cv.getContext("2d"),w=cv.width,h=cv.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle="#fffdfb";ctx.fillRect(0,0,w,h);

    const extent=Math.max(5,Math.abs(sol.h)+sol.r+2,Math.abs(sol.k)+sol.r+2);
    const scale=Math.min((w-54)/(2*extent),(h-54)/(2*extent));
    const cx=w/2,cy=h/2;
    const min=-Math.ceil(extent),max=Math.ceil(extent);

    ctx.font="11px system-ui";
    ctx.textAlign="center";ctx.textBaseline="top";
    for(let i=min;i<=max;i++){
      const x=cx+i*scale,y=cy-i*scale;
      ctx.strokeStyle=i===0?"#766d79":"#eee7ed";
      ctx.lineWidth=i===0?1.8:1;
      ctx.beginPath();ctx.moveTo(x,18);ctx.lineTo(x,h-18);ctx.stroke();
      ctx.beginPath();ctx.moveTo(18,y);ctx.lineTo(w-18,y);ctx.stroke();
      if(i!==0&&Math.abs(i)%1===0&&scale>18){
        ctx.fillStyle="#988e9a";
        ctx.fillText(String(i),x,cy+5);
        ctx.textAlign="right";ctx.textBaseline="middle";
        ctx.fillText(String(i),cx-6,y);
        ctx.textAlign="center";ctx.textBaseline="top";
      }
    }

    const px=cx+sol.h*scale,py=cy-sol.k*scale;
    ctx.strokeStyle="#d96f9c";ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(px,py,sol.r*scale,0,Math.PI*2);ctx.stroke();

    ctx.fillStyle="#4f4652";
    ctx.beginPath();ctx.arc(px,py,4.5,0,Math.PI*2);ctx.fill();
    ctx.font="700 12px system-ui";ctx.textAlign="left";ctx.textBaseline="bottom";
    ctx.fillText("C("+trimNumber(sol.h)+", "+trimNumber(sol.k)+")",px+8,py-7);

    ctx.strokeStyle="#9b8090";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+sol.r*scale,py);ctx.stroke();
    ctx.fillStyle="#7d6f7b";ctx.textAlign="center";ctx.textBaseline="bottom";
    ctx.fillText("r = "+trimNumber(sol.r),px+sol.r*scale/2,py-5);
  }

  function solveMathFromUI(rawOverride=null){
    const input=document.querySelector("#mathPrompt");
    const raw=String(rawOverride||input?.value||"").trim();
    if(!raw)return false;
    if(input&&rawOverride)input.value=raw;
    const root=document.querySelector("#mathExplanation");
    const sol=parseCirclePrompt(raw);
    if(!sol){
      if(root)root.innerHTML='<div class="study-chip">No pude reconocer esta circunferencia con seguridad. Puedo trabajar con centro y radio, forma canónica o una ecuación general como x² + y² - 6x + 4y - 12 = 0.</div>';
      return false;
    }
    const explanation=circleExplanation(sol);
    if(root){
      root.innerHTML='<div class="answer-card circle-solution"><strong>Resolución paso a paso</strong><p>'+escapeHtml(explanation).replace(/\n/g,"<br>")+'</p>'+(sol.r===null?'<div class="study-chip">No hay representación real para dibujar.</div>':'')+'</div>';
    }
    if(sol.r!==null)drawCircle(sol);
    if(typeof setMood==="function")setMood("proud","Robotito resolvió la circunferencia y comprobó la representación.");
    if(typeof say==="function")say(sol.r===null?"La ecuación no representa una circunferencia real.":"Listo. La resolví paso a paso y también hice la representación visual.",5200);
    return true;
  }

  function objectDisplay(item,label){
    if(item?.es?.[0])return item.es[0];
    return String(label||"objeto").replace(/_/g," ");
  }

  async function loadObjectModels(){
    if(!state.objectModel){
      if(!window.cocoSsd)throw new Error("COCO-SSD no cargó");
      state.objectModel=await window.cocoSsd.load({base:"lite_mobilenet_v2"});
    }
    if(!state.imageModel&&window.mobilenet){
      try{state.imageModel=await window.mobilenet.load({version:2,alpha:0.5});}catch(e){console.warn("mobilenet",e);}
    }
  }

  async function detectObjectNow(){
    if(!state.started){toast("Primero despertá los sentidos.");return false;}
    const out=document.querySelector("#objectResult");
    if(out)out.innerHTML='<div class="study-chip">Mirando el objeto…</div>';
    try{
      await loadObjectModels();
      if(camera.readyState<2)throw new Error("camera-not-ready");
      const preds=await state.objectModel.detect(camera,12,.32);
      const nonPerson=preds.filter(p=>p.class!=="person");
      let chosen=(nonPerson[0]||preds[0]||null);
      let modelLabel=chosen?.class||"";
      let confidence=chosen?.score||0;
      let item=window.ROBOTITO_OBJECTS?.findByModelLabel?.(modelLabel)||null;

      // MobileNet is a useful second opinion for objects outside COCO's 80 classes.
      if((!chosen||!item||confidence<.48)&&state.imageModel){
        const cls=await state.imageModel.classify(camera,5);
        const best=(cls||[]).find(x=>x.probability>=.18);
        if(best){
          const mapped=window.ROBOTITO_OBJECTS?.findByModelLabel?.(best.className);
          if(mapped||!chosen){
            item=mapped||item;
            modelLabel=best.className;
            confidence=Math.max(confidence,best.probability||0);
          }
        }
      }

      if(!chosen&&!item){
        if(out)out.innerHTML='<div class="study-chip">No reconozco un objeto con suficiente claridad. Acercalo, iluminá bien y dejalo quieto un segundo.</div>';
        say("No lo reconozco con suficiente claridad todavía.",4200);
        return true;
      }

      const name=objectDisplay(item,modelLabel);
      const pct=Math.round(Math.max(0,Math.min(1,confidence))*100);
      if(out)out.innerHTML='<div class="object-box"><div class="object-icon">'+escapeHtml(item?.emoji||"👀")+'</div><div><strong>Creo que es '+escapeHtml(name)+'</strong><div class="muted">Confianza aproximada: '+pct+'%</div></div></div>';
      const show=document.querySelector("#objectShowcase");
      if(show&&item){
        document.querySelector("#objectShowEmoji").textContent=item.emoji||"✨";
        document.querySelector("#objectShowName").textContent=name;
        document.querySelector("#objectShowInfo").textContent="Reconocido por cámara";
        show.classList.remove("hidden");
        clearTimeout(detectObjectNow.t);
        detectObjectNow.t=setTimeout(()=>show.classList.add("hidden"),4200);
      }
      say("Creo que es "+name+".",4200);
      return true;
    }catch(e){
      console.warn("object recognition",e);
      if(out)out.innerHTML='<div class="study-chip">No pude usar el reconocimiento visual en este momento.</div>';
      say("No pude usar bien la cámara para reconocerlo.",3800);
      return true;
    }
  }

  function responseDepth(raw){
    const q=norm(raw);
    if(/\b(paso a paso|detallad|explicame|explica|desarrolla|demostra|demuestra|como funciona|por que|porque|compara|diferencia)\b/.test(q))return "detailed";
    if(/^(que (?:es|son|significa)|que se entiende por|define|defini|definime|cual(?:es)? es la definicion|dame la definicion)\b/.test(q))return "definition";
    return "normal";
  }

  function shapeAnswer(raw,answer){
    const text=String(answer||"").replace(/\s+/g," ").trim();
    const depth=responseDepth(raw);
    if(!text)return text;
    if(depth==="detailed")return text.length>1100?text.slice(0,1097).replace(/\s+\S*$/,"")+"…":text;
    const sentences=text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text];
    if(depth==="definition"){
      const one=(sentences[0]||text).trim();
      return one.length>230?one.slice(0,227).replace(/\s+\S*$/,"")+"…":one;
    }
    const normal=sentences.slice(0,3).join(" ").trim();
    return normal.length>430?normal.slice(0,427).replace(/\s+\S*$/,"")+"…":normal;
  }

  function classify(raw){
    const q=norm(raw);
    const depth=responseDepth(raw);
    if(window.ROBOTITO_PRESIDENTS?.parseQuestion?.(raw))return {intent:"president",depth};
    if(/\b(que es esto|que objeto es|que estoy mostrando|reconoce este objeto|reconoce esto|what is this object|what am i showing)\b/.test(q))return {intent:"object",depth};
    const circle=/\b(circunferencia|circle)\b/.test(q);
    const solve=/\b(resuelve|resolve|resolver|representa|representacion|grafica|grafico|dibuja|centro|radio|ecuacion|equation)\b/.test(q)||/[xy]\s*[²^]/i.test(raw);
    if(circle&&solve)return {intent:"circle-math",depth};
    if(window.ROBOTITO_SPOKEN_MATH?.solve?.(raw,"es")?.handled)return {intent:"calculation",depth};
    if(/\b(ejercicio|problema|actividad)\b/.test(q))return {intent:"exercise",depth};
    if(depth==="definition")return {intent:"definition",depth};
    if(depth==="detailed")return {intent:"explanation",depth};
    return {intent:"other",depth};
  }

  async function handle(raw,{lang="es"}={}){
    const info=classify(raw);
    if(info.intent==="president"){
      const result=await window.ROBOTITO_PRESIDENTS.answer(raw,lang);
      if(result?.handled){
        say(result.text,Math.min(12000,readingDisplayTime?.(result.text,4500)||7000),lang);
        return true;
      }
    }
    if(info.intent==="object"){
      await detectObjectNow();
      return true;
    }
    if(info.intent==="circle-math"){
      const ok=solveMathFromUI(raw);
      if(ok){
        document.querySelector('[data-tab="class"]')?.click?.();
        document.querySelector("#mathExplanation")?.scrollIntoView?.({behavior:"smooth",block:"nearest"});
      }
      return ok;
    }
    return false;
  }

  function microMotion(){
    if(document.hidden)return;
    if(typeof state==="undefined"||typeof robot==="undefined")return;
    if(state.classMode||state.sleeping||state.speaking||state.enrollmentActive)return;
    if(Math.random()>.38)return;
    const moves=["micro-curious","micro-stretch","micro-shy","micro-bounce"];
    const cls=moves[Math.floor(Math.random()*moves.length)];
    robot.classList.add(cls);
    setTimeout(()=>robot.classList.remove(cls),cls==="micro-stretch"?1800:1200);
  }

  document.addEventListener("DOMContentLoaded",()=>{
    setInterval(microMotion,9000);
    const world=document.querySelector("#world");
    world?.addEventListener("pointermove",e=>{
      if(state.sleeping||state.classMode)return;
      const rect=world.getBoundingClientRect();
      const x=(e.clientX-rect.left)/Math.max(1,rect.width);
      const y=(e.clientY-rect.top)/Math.max(1,rect.height);
      robot.style.setProperty("--pointer-x",String((x-.5)*2));
      robot.style.setProperty("--pointer-y",String((y-.5)*2));
    },{passive:true});
  });

  window.solveMathFromUI=solveMathFromUI;
  window.detectObjectNow=detectObjectNow;
  window.ROBOTITO_CIRCLE_MATH={parse:parseCirclePrompt,explain:circleExplanation,draw:drawCircle,solve:solveMathFromUI};
  window.ROBOTITO_ROUTER={classify,responseDepth,shapeAnswer,handle};
  // Stable architectural entrypoint: understand → choose depth → retrieve/act → respond.
  window.ROBOTITO_PIPELINE={
    understand:classify,
    answerDepth:responseDepth,
    shapeAnswer,
    respond:handle
  };
})();