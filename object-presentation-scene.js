// P24 — In-scene object presentation using the existing avatar and object catalogue.
// No camera inference, image download, or invented physical object is involved.
(()=>{
  "use strict";
  const norm=value=>String(value||"").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[.!?¡¿]+$/g,"").trim();
  const showCommands=[
    /^(?:(?:robotito[,:\s]+)?)(?:mostrame|muestrame|mostra|muestra|ensen[ae]me|ensename|quiero ver|puedes mostrarme|podes mostrarme|traeme|trae)\s+(.+)$/i,
    /^(?:show me|can you show me|bring me|let me see)\s+(.+)$/i,
    /^(?:mostra-me|mostre-me|me mostra|quero ver)\s+(.+)$/i,
    /^(?:montre-moi|montrez-moi|je veux voir)\s+(.+)$/i,
    /^(?:mostrami|fammi vedere|voglio vedere)\s+(.+)$/i,
    /^(?:zeig mir|zeige mir|ich mochte sehen)\s+(.+)$/i
  ];
  let epoch=0,timers=[],activeRobot=null,originalLeft="";
  let current=null;
  const reduced=()=>window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
  function parseRequest(raw,language="es"){
    const input=norm(raw);
    let match=null;
    for(const rule of showCommands){match=input.match(rule);if(match)break;}
    if(!match)return null;
    const query=match[1].replace(/^(?:(?:un|una|el|la|los|las|um|uma|o|a|the|an|a|une|le|la|un|ein|eine|der|die|das)\s+)+/i,"")
      .replace(/\s+(?:por favor|please|s'il vous plait|bitte)$/i,"").trim();
    const item=window.ROBOTITO_OBJECTS?.find?.(query,language)||null;
    return {query,item};
  }
  function cleanup(){
    for(const t of timers)clearTimeout(t);
    timers=[];
    if(activeRobot){
      activeRobot.classList.remove("object-trip-walking","object-trip-searching","object-trip-presenting");
      activeRobot.style.left=originalLeft;
      activeRobot.querySelector("#objectSceneProp")?.remove();
    }
    document.querySelector("#objectSceneStatus")?.replaceChildren();
    current=null;activeRobot=null;
  }
  function cancel(){epoch++;cleanup();}
  function later(callback,delay){const t=setTimeout(callback,delay);timers.push(t);}
  function sound(){
    // Only play from a user-activated context; silence is the safe fallback.
    if(!navigator.userActivation?.isActive||reduced())return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    try{
      const audio=new Audio(),osc=audio.createOscillator(),gain=audio.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(360,audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(460,audio.currentTime+.11);
      gain.gain.setValueAtTime(.0001,audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.018,audio.currentTime+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.14);
      osc.connect(gain);gain.connect(audio.destination);osc.start();
      osc.stop(audio.currentTime+.15);
      osc.onended=()=>{audio.close().catch(()=>{});};
    }catch{/* An unavailable audio API must never block the visual scene. */}
  }
  function present(item,language="es"){
    cancel();
    const robot=document.querySelector("#robotito");
    const world=document.querySelector("#world");
    if(!item||!robot||!world)return false;
    const token=epoch;
    current={item,language};
    activeRobot=robot;
    originalLeft=robot.style.left;
    const name=window.ROBOTITO_OBJECTS.displayName(item,language);
    const status=document.querySelector("#objectSceneStatus");
    if(status)status.textContent="Robotito va a buscar "+name+".";
    if(robot.classList.contains("sleeping")){
      if(status)status.textContent="Robotito está dormido. Despertalo para que busque "+name+".";
      cancel();
      return false;
    }
    const duration=reduced()?0:850;
    robot.classList.add("object-trip-walking");
    robot.style.left="calc(100% + 130px)";
    sound();
    later(()=>{
      if(token!==epoch||document.hidden)return;
      robot.classList.remove("object-trip-walking");
      robot.classList.add("object-trip-searching");
      if(status)status.textContent="Buscando "+name+".";
      later(()=>{
        if(token!==epoch||document.hidden)return;
        robot.classList.remove("object-trip-searching");
        robot.classList.add("object-trip-walking");
        robot.style.left="50%";
        later(()=>{
          if(token!==epoch||document.hidden)return;
          robot.classList.remove("object-trip-walking");
          robot.classList.add("object-trip-presenting");
          const prop=document.createElement("span");
          prop.id="objectSceneProp";
          prop.className="object-scene-prop";
          prop.textContent=item.emoji||"✨";
          prop.setAttribute("aria-hidden","true");
          robot.appendChild(prop);
          // The accessible status describes the prop; visually it remains attached to the avatar.
          if(status)status.textContent="Robotito volvió y está mostrando "+name+".";
          later(()=>{if(token===epoch)cancel();},5500);
        },reduced()?0:850);
      },reduced()?0:500);
    },duration);
    return true;
  }
  function request(raw,{language="es"}={}){
    const parsed=parseRequest(raw,language);
    if(!parsed)return false;
    if(!parsed.item){
      cancel();
      window.say?.("No tengo una representación confiable de ese objeto. Podés pedirme otro del catálogo.");
      return true;
    }
    if(!present(parsed.item,language)){
      window.say?.("Ahora no puedo buscarlo. Probá despertarme y pedímelo de nuevo.");
      return true;
    }
    const name=window.ROBOTITO_OBJECTS.displayName(parsed.item,language);
    window.say?.("Voy a buscar "+name+" y te lo muestro.",4200,language);
    return true;
  }
  document.addEventListener("visibilitychange",()=>{if(document.hidden)cancel();});
  window.addEventListener("pagehide",cancel);
  window.ROBOTITO_OBJECT_SCENE={parseRequest,present,request,cancel,get current(){return current;}};
})();