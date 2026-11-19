// P51: on-screen local clock, target-time countdown and explicit TTS of the time.
(function(root){
"use strict";
const P=root.ROBOTITO_CLOCK_POLICY,$=id=>document.getElementById(id);
let target=null,tick=null,utterance=null;
function locale(){const lang=$("quickLanguageSelect")?.value||document.documentElement.lang||"es";return ["es","en","pt","fr","it","de"].includes(lang)?lang:"es"}
function update(){
 const now=new Date();
 const clock=$("clockVisual"),remaining=$("clockCountdownRemaining"),date=$("clockDate");
 if(clock)clock.textContent=P.readableTime(now,locale());
 if(date)date.textContent=new Intl.DateTimeFormat(locale(),{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(now);
 if(remaining)remaining.textContent=target===null?"Sin cuenta regresiva activa":(()=>{
  const x=P.remaining(now,target);return x.days+" d · "+String(x.hours).padStart(2,"0")+" h · "+String(x.minutes).padStart(2,"0")+" min · "+String(x.seconds).padStart(2,"0")+" s"})();
 if(target!==null&&Date.now()>=target){target=null;if($("clockStatus"))$("clockStatus").textContent="Llegó la hora elegida. No se generaron notificaciones mientras el navegador estuvo cerrado.";}
}
function setCountdown(){
 const [h,m]=String($("clockTargetTime")?.value||"").split(":").map(Number);
 try{
  target=P.nextLocalTime(Date.now(),h,m);update();
  $("clockStatus").textContent="Cuenta regresiva hasta la próxima vez que el reloj local marque "+P.readableTime(target,locale())+".";
 }catch(e){$("clockStatus").textContent="Elegí una hora válida.";}
}
function sayTime(){
 if(document.hidden){$("clockStatus").textContent="Volvé a la pestaña para reproducir la hora.";return;}
 if(!root.speechSynthesis||!root.SpeechSynthesisUtterance){$("clockStatus").textContent="Este navegador no ofrece síntesis de voz.";return;}
 if(document.body.classList.contains("class-mode-indicator-active")){$("clockStatus").textContent="La lectura de hora está desactivada durante Modo Clase.";return;}
 root.speechSynthesis.cancel();
 utterance=new SpeechSynthesisUtterance(P.speakTimeText(new Date(),locale()));
 utterance.lang={es:"es-UY",en:"en-US",pt:"pt-BR",fr:"fr-FR",it:"it-IT",de:"de-DE"}[locale()];
 utterance.rate=.95;
 utterance.onerror=()=>{$("clockStatus").textContent="La voz no estuvo disponible."};
 root.speechSynthesis.speak(utterance);
}
function init(){
 $("clockSetTarget")?.addEventListener("click",setCountdown);
 $("clockClearTarget")?.addEventListener("click",()=>{target=null;update();});
 $("clockSpeak")?.addEventListener("click",sayTime);
 document.addEventListener("visibilitychange",()=>{if(document.hidden){root.speechSynthesis?.cancel?.();return;}update();});
 root.addEventListener("pagehide",()=>{clearInterval(tick);root.speechSynthesis?.cancel?.();});
 tick=setInterval(()=>{if(!document.hidden)update();},250);
 update();
}
root.ROBOTITO_CLOCK_UI={init,update,get target(){return target}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window);