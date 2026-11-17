// P34: per-person, per-local-day and per-time-of-day birthday celebration.
(function(root){
 "use strict";
 const policy=()=>root.ROBOTITO_P33_P35;
 const translations={
 es:["¡Feliz cumpleaños, {name}! 🎉","🎁 Es para ti","¿Qué mejor regalo que yo? 😎","♫ Reproducir melodía"],
 en:["Happy birthday, {name}! 🎉","🎁 For you","What better gift than me? 😎","♫ Play tune"],
 pt:["Feliz aniversário, {name}! 🎉","🎁 É para você","Que presente melhor do que eu? 😎","♫ Tocar melodia"],
 fr:["Joyeux anniversaire, {name} ! 🎉","🎁 C'est pour toi","Quel meilleur cadeau que moi ? 😎","♫ Jouer la mélodie"],
 it:["Buon compleanno, {name}! 🎉","🎁 È per te","Quale regalo migliore di me? 😎","♫ Suona la melodia"],
 de:["Alles Gute zum Geburtstag, {name}! 🎉","🎁 Für dich","Welches Geschenk wäre besser als ich? 😎","♫ Melodie abspielen"]
 };
 let epoch=0,timeout=null,ctx=null;
 const $=s=>document.querySelector(s);
 const lang=()=>root.ROBOTITO_I18N?.getLanguage?.()||$("#quickLanguageSelect")?.value||"es";
 const phrases=()=>translations[lang()]||translations.es;
 function tune(){
  try{
   const AudioCtx=root.AudioContext||root.webkitAudioContext;
   if(!AudioCtx)return false;
   ctx?.close?.().catch(()=>{});
   const audio=ctx=new AudioCtx();
   audio.resume?.().catch(()=>{});
   // Original locally synthesized greeting melody, no streaming/copyright dependency.
   [392,440,523.25,659.25,587.33,523.25,440,523.25,659.25,783.99].forEach((hz,i)=>{
    const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.27;
    o.type="sine";o.frequency.value=hz;g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(.07,t+.025);
    g.gain.exponentialRampToValueAtTime(.0001,t+.22);
    o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.24);
   });
   setTimeout(()=>{if(ctx===audio){ctx=null;audio.close().catch(()=>{});}},3800);
   return true;
  }catch(err){console.warn("birthday tune",err);return false;}
 }
 function confetti(count=70){
  const layer=$("#confettiLayer");if(!layer)return;
  for(let i=0;i<count;i++){
   const particle=document.createElement("div");
   particle.className="confetti";particle.style.left=Math.random()*100+"vw";
   particle.style.background="hsl("+Math.random()*360+" 75% 72%)";
   particle.style.setProperty("--dx",(Math.random()*240-120)+"px");
   particle.style.animationDuration=(2+Math.random()*2.8)+"s";
   layer.appendChild(particle);setTimeout(()=>particle.remove(),5200);
  }
 }
 function celebrate(name="",{automatic=false}={}){
  const scene=$("#birthdayScene"),label=$("#birthdayText"),gift=$("#birthdayGift"),song=$("#birthdaySong");
  if(!scene||!label||!gift||!song)return false;
  const token=++epoch,p=phrases();
  label.textContent=p[0].replace("{name}",String(name||"").slice(0,90));
  gift.textContent=p[1];gift.hidden=false;song.textContent=p[3];
  scene.classList.remove("hidden","gift-opened");scene.classList.add("gift-wrapped");
  $("#robotito")?.classList.add("birthday-hidden");
  // Actual playback may require user interaction: keep the song control visible.
  if(!automatic)tune();
  clearTimeout(timeout);
  timeout=setTimeout(()=>{if(token===epoch)close();},14000);
  return true;
 }
 function close(){
  epoch++;clearTimeout(timeout);
  $("#birthdayScene")?.classList.add("hidden");
  $("#birthdayScene")?.classList.remove("gift-wrapped","gift-opened");
  $("#robotito")?.classList.remove("birthday-hidden");
 }
 function openGift(){
  const scene=$("#birthdayScene");
  if(!scene||scene.classList.contains("hidden"))return;
  scene.classList.remove("gift-wrapped");scene.classList.add("gift-opened");
  $("#birthdayGift").hidden=true;
  $("#birthdayText").textContent=phrases()[2];
  $("#robotito")?.classList.remove("birthday-hidden");
  tune();confetti(50);
 }
 function check(person,{started=false,classMode=false}={}){
  if(!started||classMode||document.hidden||!person?.birthday)return false;
  const now=new Date(),p=policy();
  if(!p?.isBirthday(person.birthday,now))return false;
  const key=p.birthdayKey(person,now);
  if(!key)return false;
  try{
   if(localStorage.getItem(key)==="1")return false;
   // Claim only when the UI exists; no duplicate after reload.
   if(!$("#birthdayScene"))return false;
   localStorage.setItem(key,"1");
  }catch(err){console.warn("birthday local ledger",err);return false;}
  return celebrate(person.name||"",{automatic:true});
 }
 function init(){
  $("#birthdayManualBtn")?.addEventListener("click",()=>celebrate(""));
  $("#birthdayGift")?.addEventListener("click",openGift);
  $("#birthdaySong")?.addEventListener("click",tune);
  $("#birthdayClose")?.addEventListener("click",close);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)close();});
  root.addEventListener("pagehide",close);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
 else init();
 root.ROBOTITO_BIRTHDAY=Object.freeze({check,celebrate,close,tune});
})(window);
