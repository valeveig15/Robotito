// P10: real temporal actions. Reuse existing class recordings, typed memory,
// shared clock and literal speech. Never claim to play a missing file.
(function(root){
"use strict";
const pending=new Map();
let audio=null,objectUrl=null,currentOwner=null;
const LANGS=["es","en","pt","fr","it","de"];
const MESSAGES={
 arm:{es:"Te escucho. Decí una frase y la repetiré literalmente, sin interpretarla como orden.",en:"I'm listening. Say a phrase and I'll repeat it literally without treating it as a command.",pt:"Estou ouvindo. Diga uma frase e vou repeti-la literalmente.",fr:"Je t'écoute. Dis une phrase et je la répéterai sans l'exécuter.",it:"Ti ascolto. Di' una frase e la ripeterò letteralmente.",de:"Ich höre zu. Sage einen Satz, ich wiederhole ihn wörtlich."},
 missing:{es:"No encontré una grabación guardada para esa fecha o materia.",en:"I couldn't find a saved recording for that date or subject.",pt:"Não encontrei gravação salva nessa data ou matéria.",fr:"Je n'ai trouvé aucun enregistrement pour cette date ou matière.",it:"Non ho trovato una registrazione per quella data o materia.",de:"Ich habe keine Aufnahme für dieses Datum oder Fach gefunden."},
 found:{es:"Encontré la grabación. Podés reproducirla en el panel de Clase.",en:"I found the recording. You can play it in the Class panel.",pt:"Encontrei a gravação. Você pode reproduzi-la no painel Aula.",fr:"J'ai trouvé l'enregistrement. Tu peux le lire dans l'onglet Cours.",it:"Ho trovato la registrazione. Puoi riprodurla nel pannello Lezione.",de:"Ich habe die Aufnahme gefunden. Du kannst sie im Unterrichtsbereich abspielen."},
 ambiguous:{es:"Encontré varias grabaciones posibles. Elegí la correcta en Clase; no voy a adivinar cuál es.",en:"I found several recordings. Choose one in Class; I won't guess.",pt:"Encontrei várias gravações. Escolha a correta no painel Aula.",fr:"J'ai trouvé plusieurs enregistrements. Choisis le bon dans Cours.",it:"Ho trovato più registrazioni. Scegli quella giusta in Lezione.",de:"Ich habe mehrere Aufnahmen gefunden. Bitte wähle eine im Unterrichtsbereich."},
 noAudio:{es:"Ese registro no tiene un archivo de audio que pueda reproducir.",en:"That record doesn't contain playable audio.",pt:"Esse registro não contém áudio reproduzível.",fr:"Cet enregistrement ne contient pas d'audio lisible.",it:"Quella registrazione non contiene audio riproducibile.",de:"Dieser Eintrag enthält keine abspielbare Audiodatei."},
 noBook:{es:"No encontré una recomendación de libro guardada para esa fecha.",en:"I couldn't find a saved book recommendation for that date.",pt:"Não encontrei recomendação de livro salva para essa data.",fr:"Je n'ai pas trouvé de recommandation de livre enregistrée pour cette date.",it:"Non ho trovato consigli di libri salvati per quella data.",de:"Ich habe keine gespeicherte Buchempfehlung für dieses Datum gefunden."},
 manyBooks:{es:"Hay varias recomendaciones para esa fecha; revisá cuál querías.",en:"There are several recommendations for that date; please select the one you meant.",pt:"Há várias recomendações para essa data; escolha qual você queria.",fr:"Il y a plusieurs recommandations pour cette date ; précise laquelle.",it:"Ci sono più consigli per questa data; scegli quello desiderato.",de:"Es gibt mehrere Empfehlungen für dieses Datum; wähle die passende."},
 confirmPlay:{es:"La reproducción automática fue bloqueada. Tocá Reproducir en el control de audio.",en:"Autoplay was blocked. Tap Play on the audio control.",pt:"A reprodução automática foi bloqueada. Toque em Reproduzir.",fr:"La lecture automatique est bloquée. Appuie sur Lecture.",it:"Riproduzione automatica bloccata. Premi Riproduci.",de:"Automatische Wiedergabe blockiert. Bitte Wiedergabe anklicken."},
 askLiteral:{es:"¿Qué querés que diga exactamente?",en:"What exactly should I say?",pt:"O que você quer que eu diga exatamente?",fr:"Que veux-tu que je dise exactement ?",it:"Che cosa vuoi che dica esattamente?",de:"Was soll ich genau sagen?"},
 limit:{es:"Esa frase es demasiado larga para repetirla de una vez.",en:"That phrase is too long to repeat at once.",pt:"Essa frase é longa demais para repetir de uma vez.",fr:"Cette phrase est trop longue à répéter d'un coup.",it:"La frase è troppo lunga per essere ripetuta tutta.",de:"Der Satz ist zu lang, um ihn auf einmal zu wiederholen."},
 stopped:{es:"Detuve la reproducción o repetición.",en:"Playback or repetition stopped.",pt:"Reprodução ou repetição interrompida.",fr:"Lecture ou répétition arrêtée.",it:"Riproduzione o ripetizione interrotta.",de:"Wiedergabe oder Wiederholung angehalten."}
};
function msg(key,lang){return MESSAGES[key]?.[lang]||MESSAGES[key]?.es||key;}
function fold(value){return String(value||"").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();}
function clean(raw){return String(raw||"").trim().replace(/^(?:(?:robotito|osito|hey robotito|por favor|please|bitte)\s*[,!:]?\s*)+/i,"").trim();}
function parse(raw){
 const input=clean(raw),q=fold(input);
 if(!q||q.length>2000||/^(?:no|nunca|don'?t|do not|ne|non|nao|nicht)\b/.test(q)||
    /^(?:que significa|what does|what is|explicame|explain|por que|why|como se dice)\b/.test(q))
  return null;
 if(/^(?:cancela|cancelar|para|deten|detene|stop|cancel|arrete|stopp|ferma|pare)\b.*(?:repet|audio|grabaci|play|reprodu|record|lecture|wiedergabe)?$/.test(q))
  return {action:"stop"};
 let m=q.match(/^(?:repeti|repite|repita|repete|repeta|repeat|repetez|ripeti|wiederhole)\s+(?:despues de mi|depois de mim|after me|apres moi|dopo di me|nach mir)\s*[:,-]?\s*(.*)$/);
 if(m){
  const exact=input.slice(input.length-m[1].length).replace(/^\s*[:,-]?\s*/,"");
  return exact?{action:"say",literal:exact}:{action:"arm"};
 }
 m=input.match(/^(?:dec[ií]|d[ií]|dime|repet[ií]|repite|say|repeat|diz|repete|dis|r[eé]p[eè]te|ripeti|sag|wiederhole)\s+(?:(?:esto|this|isso|ceci|questo|das)\s*[:,-]?\s*)?(.+)?$/iu);
 if(m&&/^(?:dec[ií]|d[ií]|dime|say|diz|dis|sag|repet[ií]|repite|repeat|repete|r[eé]p[eè]te|ripeti|wiederhole)\b/iu.test(input))
  return m[1]?.trim()?{action:"say",literal:m[1].trim()}:{action:"ask-literal"};
 const play=/^(?:pon[eé]|pon|ponme|reproduc[ií]|reproduce|escuch[aá]|quiero escuchar|mostrame|mu[eé]strame|play|listen to|show me|reproduz|toque|mostre|joue|lance|montre|riproduci|fammi ascoltare|spiele|spiel|zeig)\b/i;
 const hasRecording=/(?:grabacion|grabaci[oó]n|recording|recorded class|audio de|class audio|grava[cç][aã]o|enregistrement|registrazione|aufnahme|clase grabada|aula gravada|cours enregistr[eé]|lezione registrata)/i.test(q);
 if(play.test(input)&&hasRecording)return {action:"play-class",query:input};
 const book=/\b(?:libro|livro|book|livre|buch|b[uü]cher)\b/;
 const recommend=/\b(?:recomen|recomend|recommend|suger|suggest|conseill|empfehl|consigli)/;
 const show=/^(?:mostrame|mu[eé]strame|mostra|mostrar|show|what|cual|qu[eé]|dime|decime|montre|mostre|zeige|zeig|dimmi|qual|quale|welche|quel|which)/i;
 if(show.test(input)&&book.test(q)&&recommend.test(q))return {action:"show-book",query:input};
 return null;
}
function stop(){
 if(audio){try{audio.pause();audio.removeAttribute("src");audio.load?.();}catch{}audio=null;}
 if(objectUrl){try{URL.revokeObjectURL(objectUrl);}catch{}objectUrl=null;}
 currentOwner=null;
}
function clearPending(owner){if(owner)pending.delete(owner);else pending.clear();}
function hasPending(owner,at=Date.now()){return !!pending.get(owner)&&at<=pending.get(owner);}
function consumePending(text,{owner="local",lang="es",speak=()=>{},at=Date.now()}={}){
 const deadline=pending.get(owner);
 if(!deadline)return false;
 pending.delete(owner);
 if(at>deadline)return false;
 const q=fold(text);
 if(/^(?:cancel|cancela|para|stop|no|anula)\b/.test(q)){speak(msg("stopped",lang));return true;}
 const exact=String(text||"").trim();
 if(!exact){speak(msg("askLiteral",lang));return true;}
 if(exact.length>500){speak(msg("limit",lang));return true;}
 speak(exact);return true;
}
function interval(raw,clock,at,lang){
 return clock?.resolve?.(raw,{now:at,language:lang})||null;
}
function dateMatches(at,period){
 return !period||period.start==null||
    (Number.isFinite(at)&&at>=period.start&&at<period.end);
}
function describeRecording(row,lang){
 const t=Number(row.startedAt),date=Number.isFinite(t)
  ?new Date(t).toLocaleString(({es:"es-UY",en:"en-GB",pt:"pt-BR",fr:"fr-FR",it:"it-IT",de:"de-DE"})[lang]||"es-UY")
  :"";
 return [row.subject||"",row.topic||"",date].filter(Boolean).join(" · ")||"Clase";
}
function renderRecordings(rows,{container,lang,owner,speak,activeOwner,autoplay}){
 if(!container||typeof document==="undefined")return false;
 stop();
 const nodes=[],heading=document.createElement("p");
 heading.textContent=rows.length===1?msg("found",lang):msg("ambiguous",lang);
 nodes.push(heading);
 let played=false;
 const prepare=row=>{
  if(activeOwner&&activeOwner()!==owner)return false;
  if(!(row.blob instanceof Blob)||!row.blob.size){speak(msg("noAudio",lang));return false;}
  stop();const player=document.createElement("audio");
  objectUrl=URL.createObjectURL(row.blob);player.src=objectUrl;
  player.controls=true;player.preload="metadata";player.dataset.classAudioPlayback="true";
  currentOwner=owner;audio=player;
  const label=document.createElement("p");label.textContent=describeRecording(row,lang);
  container.replaceChildren(label,player);
  if(autoplay){
   Promise.resolve(player.play()).then(()=>{played=true;}).catch(()=>{
    speak(msg("confirmPlay",lang));
   });
  }
  return true;
 };
 if(rows.length===1){prepare(rows[0]);return true;}
 for(const row of rows.slice(0,12)){
  const btn=document.createElement("button");btn.type="button";btn.className="ghost";
  btn.textContent=describeRecording(row,lang);
  btn.addEventListener("click",()=>prepare(row));
  nodes.push(btn);
 }
 container.replaceChildren(...nodes);
 return false;
}
async function handle(raw,{owner="local",lang="es",store=root.ROBOTITO_STORE,
 classAudio=root.ROBOTITO_CLASS_AUDIO,clock=root.ROBOTITO_TEMPORAL,
 speak=()=>{},container=null,at=new Date(),activeOwner=null,classMode=false}={}){
 const command=parse(raw);if(!command)return false;
 if(classMode)return false;
 if(command.action==="stop"){
  clearPending(owner);stop();speak(msg("stopped",lang));return true;
 }
 if(command.action==="arm"){
  pending.set(owner,Number(at)+45000);speak(msg("arm",lang));return true;
 }
 if(command.action==="ask-literal"){speak(msg("askLiteral",lang));return true;}
 if(command.action==="say"){
  if(command.literal.length>500)speak(msg("limit",lang));
  else speak(command.literal);
  return true;
 }
 if(command.action==="play-class"){
  if(!classAudio?.listRecordings){speak(msg("missing",lang));return true;}
  let rows=[];
  try{rows=await classAudio.listRecordings();}catch{rows=[];}
  if(activeOwner&&activeOwner()!==owner)return true;
  const period=interval(command.query,clock,at,lang);
  rows=(rows||[]).filter(row=>row&&Number.isFinite(Number(row.startedAt))&&
    dateMatches(Number(row.startedAt),period)&&row.blob instanceof Blob&&row.blob.size>0);
  // If the subject was explicitly named, never silently pick a different subject.
  const q=fold(command.query);
  const namedSubject=(q.match(/(?:de|of|da|do|di|von)\s+(?:la\s+|the\s+|a\s+)?(?:clase\s+de\s+|class\s+on\s+|aula\s+de\s+|cours\s+de\s+)?(fisica|quimica|biologia|matematicas|historia|physics|chemistry|biology|math|history)\b/)||[])[1];
  if(namedSubject){
   const aliases={fisica:["fisica","physics"],quimica:["quimica","chemistry"],
    biologia:["biologia","biology"],matematicas:["matematicas","math"],
    historia:["historia","history"],physics:["fisica","physics"],
    chemistry:["quimica","chemistry"],biology:["biologia","biology"],
    math:["matematicas","math"],history:["historia","history"]};
   rows=rows.filter(row=>aliases[namedSubject].some(s=>fold(row.subject).includes(s)));
  }
  rows.sort((a,b)=>Number(b.startedAt)-Number(a.startedAt));
  if(!rows.length){speak(msg("missing",lang));return true;}
  const last=/\b(?:ultima|ultimo|last|latest|newest|letzte|derniere|ultima)\b/.test(q);
  if(last)rows=rows.slice(0,1);
  if(container)renderRecordings(rows,{container,lang,owner,speak,activeOwner,autoplay:false});
  speak(msg(rows.length>1?"ambiguous":"found",lang));
  return true;
 }
 if(command.action==="show-book"){
  if(!store?.queryRecords){speak(msg("noBook",lang));return true;}
  const period=interval(command.query,clock,at,lang);
  const options={type:"recommendations",owner,limit:50};
  if(period?.start!=null){options.after=period.start;options.before=period.end-1;}
  const rows=(await store.queryRecords(options)).filter(r=>r.type==="recommendations"&&
    r.owner===owner&&r.data?.title&&dateMatches(Number(r.timestamp),period));
  if(activeOwner&&activeOwner()!==owner)return true;
  if(!rows.length){speak(msg("noBook",lang));return true;}
  rows.sort((a,b)=>b.timestamp-a.timestamp);
  if(rows.length>1&&!/\b(?:ultima|ultimo|last|latest|letzte|derniere)\b/.test(fold(raw))){
   speak(msg("manyBooks",lang));return true;
  }
  speak(String(rows[0].data.title).slice(0,160));return true;
 }
 return false;
}
root.ROBOTITO_TEMPORAL_COMMANDS={parse,handle,stop,clearPending,hasPending,consumePending,msg,
 interval,dateMatches};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_TEMPORAL_COMMANDS;
})(typeof window!=="undefined"?window:globalThis);
