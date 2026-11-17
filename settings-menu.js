// Compact, accessible preferences menu. Reuses existing app controls and tabs.
(()=>{
"use strict";
const $=selector=>document.querySelector(selector);
const KEY="robotito.avatarSize.v1";
const messages={
 es:{title:"Ajustes",size:"Tamaño del avatar",voice:"Voz y sonido",people:"Personas y perfiles",privacy:"Memoria y privacidad",times:"Horarios y recordatorios",general:"Estado y controles",open:"Ajustes",close:"Cerrar ajustes"},
 en:{title:"Settings",size:"Avatar size",voice:"Voice and sound",people:"People and profiles",privacy:"Memory and privacy",times:"Schedules and reminders",general:"Status and controls",open:"Settings",close:"Close settings"},
 pt:{title:"Configurações",size:"Tamanho do avatar",voice:"Voz e som",people:"Pessoas e perfis",privacy:"Memória e privacidade",times:"Horários e lembretes",general:"Estado e controles",open:"Configurações",close:"Fechar configurações"},
 fr:{title:"Paramètres",size:"Taille de l'avatar",voice:"Voix et son",people:"Personnes et profils",privacy:"Mémoire et confidentialité",times:"Horaires et rappels",general:"État et contrôles",open:"Paramètres",close:"Fermer les paramètres"},
 it:{title:"Impostazioni",size:"Dimensioni avatar",voice:"Voce e suono",people:"Persone e profili",privacy:"Memoria e privacy",times:"Orari e promemoria",general:"Stato e controlli",open:"Impostazioni",close:"Chiudi impostazioni"},
 de:{title:"Einstellungen",size:"Avatargröße",voice:"Stimme und Ton",people:"Personen und Profile",privacy:"Speicher und Datenschutz",times:"Zeitpläne und Erinnerungen",general:"Status und Steuerung",open:"Einstellungen",close:"Einstellungen schließen"}
};
const limit=value=>Math.min(100,Math.max(45,Math.round((Number(value)||70)/5)*5));
function applySize(size,{persist=true}={}){
 const value=limit(size);
 document.documentElement.style.setProperty("--robotito-avatar-scale",String(value/100));
 const group=document.getElementById("approvedAvatarHost")?.shadowRoot?.getElementById("approvedAvatarScale");
 if(group){
  const scale=value/100;
  group.setAttribute("transform","translate("+((1-scale)*350)+" "+((1-scale)*580)+") scale("+scale+")");
 }
 if($("#settingsAvatarSize"))$("#settingsAvatarSize").value=String(value);
 if($("#settingsAvatarSizeValue"))$("#settingsAvatarSizeValue").textContent=value+" %";
 if(persist){try{localStorage.setItem(KEY,String(value));}catch{}}
 return value;
}
function translate(){
 const lang=$("#quickLanguageSelect")?.value||document.documentElement.lang||"es";
 const copy=messages[lang]||messages.es;
 $("#settingsTitle").textContent=copy.title;
 $("#settingsSizeText").textContent=copy.size;
 $("#settingsAvatarSize").setAttribute("aria-label",copy.size);
 $("#settingsToggle").setAttribute("aria-label",copy.open);
 $("#settingsToggle").title=copy.open;
 $("#settingsClose").setAttribute("aria-label",copy.close);
 for(const el of document.querySelectorAll("[data-settings-text]"))el.textContent=copy[el.dataset.settingsText]||"";
}
function init(){
 const toggle=$("#settingsToggle"),panel=$("#settingsPanel"),close=$("#settingsClose"),size=$("#settingsAvatarSize");
 if(!toggle||!panel||!close||!size)return;
 const setOpen=open=>{
   panel.hidden=!open;
   toggle.setAttribute("aria-expanded",String(open));
   if(open)translate();
 };
 toggle.addEventListener("click",()=>setOpen(panel.hidden));
 close.addEventListener("click",()=>{setOpen(false);toggle.focus();});
 document.addEventListener("pointerdown",event=>{
  if(!panel.hidden&&!event.target.closest(".settings-container"))setOpen(false);
 });
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!panel.hidden){setOpen(false);toggle.focus();}
 });
 $("#quickLanguageSelect")?.addEventListener("change",()=>queueMicrotask(translate));
 $("#changeAvatarBtn")?.addEventListener("click",()=>setOpen(false));
 size.addEventListener("input",()=>applySize(size.value));
 for(const btn of panel.querySelectorAll("[data-settings-target]")){
  btn.addEventListener("click",()=>{
   const target=document.getElementById(btn.dataset.settingsTarget);
   if(!target)return;
   const tab=target.closest(".tabpage");
   if(tab){
    const tabBtn=document.querySelector('[data-tab="'+tab.id.replace(/^tab-/,"")+'"]');
    tabBtn?.click();
   }
   setOpen(false);
   requestAnimationFrame(()=>{
    target.scrollIntoView({behavior:"smooth",block:"center"});
    if(target.matches("input,select,button"))target.focus({preventScroll:true});
   });
  });
 }
 let stored=70;try{stored=localStorage.getItem(KEY)??70;}catch{}
 applySize(stored,{persist:false});
 translate();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
window.ROBOTITO_SETTINGS=Object.freeze({applySize});
})();
