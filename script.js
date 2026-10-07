const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const KEYS = {
  people: "robotito.people.v2",
  memories: "robotito.memories.v2",
  goodreads: "robotito.goodreads.v1",
  lastFed: "robotito.lastFed.v2",
  lastBook: "robotito.lastBook.v1",
  greetings: "robotito.greetings.v1",
  avatar: "robotito.avatar.v1"
};

const ROBOTITO_AVATARS = [
  {id:"panda",emoji:"🐼",es:"Panda",en:"Panda",pt:"Panda"},
  {id:"brown-bear",emoji:"🐻",es:"Oso pardo",en:"Brown bear",pt:"Urso pardo"},
  {id:"polar-bear",emoji:"🐻‍❄️",es:"Oso polar",en:"Polar bear",pt:"Urso polar"},
  {id:"dog",emoji:"🐶",es:"Perro",en:"Dog",pt:"Cachorro"},
  {id:"monkey",emoji:"🐵",es:"Mono",en:"Monkey",pt:"Macaco"},
  {id:"cat",emoji:"🐱",es:"Gato",en:"Cat",pt:"Gato"},
  {id:"red-panda",emoji:"🦊",es:"Panda rojo",en:"Red panda",pt:"Panda-vermelho"},
  {id:"iguana",emoji:"🦎",es:"Iguana",en:"Iguana",pt:"Iguana"},
  {id:"chameleon",emoji:"🦎",es:"Camaleón",en:"Chameleon",pt:"Camaleão"},
  {id:"armadillo",emoji:"🛡️",es:"Armadillo",en:"Armadillo",pt:"Tatu"},
  {id:"penguin",emoji:"🐧",es:"Pingüino",en:"Penguin",pt:"Pinguim"},
  {id:"elephant",emoji:"🐘",es:"Elefante",en:"Elephant",pt:"Elefante"},
  {id:"turtle",emoji:"🐢",es:"Tortuga",en:"Turtle",pt:"Tartaruga"},
  {id:"squirrel",emoji:"🐿️",es:"Ardilla",en:"Squirrel",pt:"Esquilo"},
  {id:"mouse",emoji:"🐭",es:"Ratón",en:"Mouse",pt:"Rato"},
  {id:"hamster",emoji:"🐹",es:"Hámster",en:"Hamster",pt:"Hamster"},
  {id:"rabbit",emoji:"🐰",es:"Conejo",en:"Rabbit",pt:"Coelho"},
  {id:"lion",emoji:"🦁",es:"León",en:"Lion",pt:"Leão"},
  {id:"tiger",emoji:"🐯",es:"Tigre",en:"Tiger",pt:"Tigre"},
  {id:"panther",emoji:"🐈‍⬛",es:"Pantera",en:"Panther",pt:"Pantera"},
  {id:"fox",emoji:"🦊",es:"Zorro",en:"Fox",pt:"Raposa"},
  {id:"koala",emoji:"🐨",es:"Koala",en:"Koala",pt:"Coala"},
  {id:"pig",emoji:"🐷",es:"Chancho",en:"Pig",pt:"Porquinho"},
  {id:"cow",emoji:"🐮",es:"Vaca",en:"Cow",pt:"Vaca"},
  {id:"frog",emoji:"🐸",es:"Sapo",en:"Frog",pt:"Sapo"},
  {id:"owl",emoji:"🦉",es:"Búho",en:"Owl",pt:"Coruja"},
  {id:"wolf",emoji:"🐺",es:"Lobo",en:"Wolf",pt:"Lobo"},
  {id:"horse",emoji:"🐴",es:"Caballo",en:"Horse",pt:"Cavalo"},
  {id:"unicorn",emoji:"🦄",es:"Unicornio",en:"Unicorn",pt:"Unicórnio"},
  {id:"dinosaur",emoji:"🦖",es:"Dinosaurio",en:"Dinosaur",pt:"Dinossauro"},
  {id:"crocodile",emoji:"🐊",es:"Cocodrilo",en:"Crocodile",pt:"Crocodilo"},
  {id:"dolphin",emoji:"🐬",es:"Delfín",en:"Dolphin",pt:"Golfinho"},
  {id:"zebra",emoji:"🦓",es:"Cebra",en:"Zebra",pt:"Zebra"},
  {id:"deer",emoji:"🦌",es:"Venado",en:"Deer",pt:"Cervo"},
  {id:"hippopotamus",emoji:"🦛",es:"Hipopótamo",en:"Hippopotamus",pt:"Hipopótamo"},
  {id:"giraffe",emoji:"🦒",es:"Jirafa",en:"Giraffe",pt:"Girafa"},
  {id:"kangaroo",emoji:"🦘",es:"Canguro",en:"Kangaroo",pt:"Canguru"},
  {id:"gorilla",emoji:"🦍",es:"Gorila",en:"Gorilla",pt:"Gorila"},
  {id:"sheep",emoji:"🐑",es:"Oveja",en:"Sheep",pt:"Ovelha"},
  {id:"goat",emoji:"🐐",es:"Cabra",en:"Goat",pt:"Cabra"},
  {id:"peacock",emoji:"🦚",es:"Pavo real",en:"Peacock",pt:"Pavão"},
  {id:"swan",emoji:"🦢",es:"Cisne",en:"Swan",pt:"Cisne"},
  {id:"flamingo",emoji:"🦩",es:"Flamenco",en:"Flamingo",pt:"Flamingo"},
  {id:"skunk",emoji:"🦨",es:"Zorrillo",en:"Skunk",pt:"Gambá"},
  {id:"raccoon",emoji:"🦝",es:"Mapache",en:"Raccoon",pt:"Guaxinim"},
  {id:"otter",emoji:"🦦",es:"Nutria",en:"Otter",pt:"Lontra"},
  {id:"sloth",emoji:"🦥",es:"Perezoso",en:"Sloth",pt:"Preguiça"},
  {id:"beaver",emoji:"🦫",es:"Castor",en:"Beaver",pt:"Castor"},
  {id:"hedgehog",emoji:"🦔",es:"Erizo",en:"Hedgehog",pt:"Ouriço"},
  {id:"robot",emoji:"🤖",es:"Robot",en:"Robot",pt:"Robô"}
];


const state = {
  started: false,
  avatar: localStorage.getItem(KEYS.avatar) || "panda",
  mood: "calm",
  moodScore: 55,
  energy: 100,
  batteryManager: null,
  batterySupported: false,
  batteryCharging: false,
  batteryPreviousLevel: null,
  batteryCritical: false,
  pendingBatteryAlert: null,
  batteryLastAlertAt: 0,
  hunger: 0,
  currentPerson: null,
  faceMatcher: null,
  lastSeenAt: Date.now(),
  lastHeardAt: Date.now(),
  lastSpeciesCommentAt: 0,
  lastTranscriptAt: 0,
  audioLevel: 0,
  audioKind: "silencio",
  musicConfidence: 0,
  sleeping: false,
  nightSleep: false,
  recognition: null,
  speaking: false,
  speechBlocked: false,
  recognitionWanted: true,
  speechRestartTimer: null,
  lastSpeechStartAt: 0,
  speechRetryCount: 0,
  silentUntil: 0,
  silenceTimer: null,
  voiceEnabled: localStorage.getItem("robotito.voiceEnabled.v1")===null
    ? !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    : localStorage.getItem("robotito.voiceEnabled.v1")!=="false",
  voiceURI: localStorage.getItem("robotito.voiceURI.v1")||"",
  voicePitch: Number(localStorage.getItem("robotito.voicePitch.v1")||0.65),
  voiceRate: Number(localStorage.getItem("robotito.voiceRate.v1")||0.82),
  languageMode: "",
  lastDetectedLanguage: "es",
  autoListenLanguage: "es",
  stream: null,
  analyser: null,
  lastDetections: [],
  handNearMouth: false,
  handNearMouthDistance: 1,
  handNearMouthSince: 0,
  mouthHistory: [],
  handsBusy: false,
  visibleFingers: 0,
  visibleHands: 0,
  lastHandSeenAt: 0,
  emotion: "calm",
  classMode: false,
  classStartedAt: 0,
  classSubject: "",
  classTopic: "",
  classSessionId: null,
  selectedClassSessionId: null,
  classLines: load("robotito.classLines.v1", []),
  verifyClassWeb: localStorage.getItem("robotito.verifyClassWeb.v1")!=="false",
  speakerOverride: null,
  recentAudioFeatures: [],
  recentVoicePrints: [],
  currentVoicePerson: null,
  ambientRms: .012,
  voiceThreshold: .035,
  faceMatchHistory: [],
  lastFaceConfirmedAt: 0,
  enrollmentActive: false,
  voiceProfiles: load("robotito.voiceProfiles.v1", {me:[],teacher:[],classmate:[]}),
  classSummaries: load("robotito.classSummaries.v1", []),
  academicMaterials: load("robotito.academicMaterials.v1", []),
  objectModel: null,
  imageModel: null,
  routinePromptLog: load("robotito.routinePrompts.v1", {}),
  locationCoords: null,
  locationLabel: null,
  weatherCache: null,
  locationDenied: false,
  audioContext: null,
  snoreTimer: null,
  blinkTimer: null,
  blinkCloseTimer: null,
  blinkSequenceTimer: null,
  lastBlinkAt: 0,
  heartEyeTimer: null,
  eyeLookX: 0,
  eyeLookY: 0,
  dayNightMode: null,
  tasks: load("robotito.tasks.v1", []),
  tasksSheetUrl: localStorage.getItem("robotito.tasksSheetUrl.v1") || "",
  tasksSheetGid: localStorage.getItem("robotito.tasksSheetGid.v1") || "",
  sessionStartedAt: Date.now(),
  lastTaskReminderAt: 0,
  lastSaid: "",
  speechBubbleToken: 0,
  people: load(KEYS.people, []),
  memories: load(KEYS.memories, []),
  library: load(KEYS.goodreads, []),
  greetingHistory: load(KEYS.greetings, {})
};

const robot = $("#robotito");
const camera = $("#camera");

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) {
  if(window.ROBOTITO_STORE?.isHeavyKey?.(key)){
    window.ROBOTITO_STORE.persistStateKey(key,value).catch?.(e=>console.warn("durable storage",e));
    return;
  }
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch(e) { console.warn("storage",e); toast("No pude guardar: el almacenamiento del navegador está lleno."); }
}
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function sample(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function normalizeText(s){
  return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[¿?¡!.,;:]/g," ").replace(/\s+/g," ").trim();
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function normalizeSpanishSpeechIntent(input){
  let t=normalizeText(input);

  // Frequent phonetic spellings produced by mobile ASR/Whisper.
  // These corrections are ONLY for understanding intent; the visible transcript stays untouched.
  t=t
    .replace(/\bte\s+(?:shamas|yamas|jamas|chamas|lamas|llamaz|shama)\b/g,"te llamas")
    .replace(/\bme\s+(?:shamo|yamo|jamo|chamo|lamo|llamo)\b/g,"me llamo")
    .replace(/\bse\s+(?:shama|yama|jama|chama|lama)\b/g,"se llama")
    .replace(/\b(?:shamarse|yamarse|jamarse|chamarse)\b/g,"llamarse")
    .replace(/\b(?:ase|aze)\b/g,"hace")
    .replace(/\b(?:aser)\b/g,"hacer")
    .replace(/\b(?:kiero|quero)\b/g,"quiero")
    .replace(/\b(?:podes|podés)\b/g,"podes")
    .replace(/\b(?:tenés)\b/g,"tenes")
    .replace(/\b(?:estás)\b/g,"estas");

  // Whole-phrase variants for especially common questions.
  const phraseRules=[
    [/\bcomo\s+te\s+(?:shamas|yamas|jamas|chamas|lamas)\b/g,"como te llamas"],
    [/\bcual\s+es\s+tu\s+nombre\b/g,"cual es tu nombre"],
    [/\bque\s+nombre\s+(?:tenes|tienes)\b/g,"que nombre tenes"],
    [/\bcomo\s+me\s+(?:shamo|yamo|jamo|chamo|lamo)\b/g,"como me llamo"],
    [/\bcomo\s+(?:ase|hase)\s+(?:un|una|el|la)\b/g,m=>m.replace(/ase|hase/,"hace")]
  ];
  phraseRules.forEach(([re,repl])=>{t=t.replace(re,repl);});
  return t.replace(/\s+/g," ").trim();
}

function intentInput(rawText){
  return state.languageMode==="es"?normalizeSpanishSpeechIntent(rawText):normalizeText(rawText);
}

function cleanSpeechText(text){
  return String(text||"")
    .replace(/[🐼♡♥🎉🍓😠😳👀📚✋✨]/g,"")
    .replace(/\s+/g," ")
    .trim();
}
function responseLanguage(){
  return state.languageMode==="en"?"en":state.languageMode==="pt"?"pt":"es";
}
function languageLocale(lang){
  return lang==="en"?"en-US":lang==="pt"?"pt-BR":"es-UY";
}
function languageLabel(lang){
  return lang==="en"?"English":lang==="pt"?"Português":"Español";
}
function chooseDefaultVoice(voices,targetLang="es"){
  const pref=targetLang==="en"?/^en([-_]|$)/i:targetLang==="pt"?/^pt([-_]|$)/i:/^es([-_]|$)/i;
  const langPool=voices.filter(v=>pref.test(v.lang||""));
  const pool=langPool.length?langPool:voices;
  const maleHints=targetLang==="en"
    ?["daniel","george","arthur","aaron","fred","thomas","matthew","alex","male"]
    :targetLang==="pt"
      ?["antonio","joao","joão","paulo","ricardo","felipe","bruno","thiago","homem","male"]
      :["pablo","jorge","carlos","diego","miguel","enrique","antonio","juan","raul","alvaro","andres","mateo","sergio","male","hombre"];
  return pool.find(v=>maleHints.some(h=>normalizeText(v.name).includes(h)))
    || pool.find(v=>/natural|neural|premium/i.test(v.name))
    || pool[0]
    || voices[0]
    || null;
}
function voiceMatchesLanguage(voice,targetLang=responseLanguage()){
  return !!voice&&new RegExp("^"+targetLang+"([-_]|$)","i").test(voice.lang||"");
}
function populateVoiceSelect(){
  const select=$("#voiceSelect");
  if(!select||!("speechSynthesis" in window))return;
  const all=speechSynthesis.getVoices();
  const supported=all.filter(v=>/^(es|en|pt)([-_]|$)/i.test(v.lang||""));
  const voices=supported.length?supported:all;
  const previous=state.voiceURI;
  select.innerHTML=voices.map(v=>'<option value="'+escapeHtml(v.voiceURI)+'">'+escapeHtml(v.name+" — "+v.lang)+'</option>').join("");
  const target=responseLanguage();
  let chosen=voices.find(v=>v.voiceURI===previous&&voiceMatchesLanguage(v,target))||chooseDefaultVoice(voices,target);
  if(chosen){
    state.voiceURI=chosen.voiceURI;
    select.value=chosen.voiceURI;
    localStorage.setItem("robotito.voiceURI.v1",state.voiceURI);
  }
}
function isMobileSpeech(){
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints>1 && innerWidth<1000);
}
function isIOSSpeech(){
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function setListenState(text,kind=""){
  const el=$("#listenState");
  if(el){el.textContent=text;el.className="listen-state"+(kind?" "+kind:"");}
}
function discardRecognition(){
  if(state.recognition){
    try{state.recognition.onend=null;state.recognition.onerror=null;state.recognition.onresult=null;state.recognition.abort();}catch{}
  }
  state.recognition=null;
}
function restartRecognitionAfterSpeech(){
  if(!state.started||state.speechBlocked||!state.recognitionWanted)return;
  clearTimeout(state.speechRestartTimer);
  
  setListenState(state.languageMode==="en"?"reconnecting…":state.languageMode==="pt"?"reconectando…":"reconectando…");
  state.speechRestartTimer=setTimeout(()=>startListeningCycle(false),isIOSSpeech()?850:420);
}
const DEFAULT_SILENCE_MS=25*1000;
const MAX_SILENCE_MS=24*60*60*1000;

function isSpeechMuted(){
  return state.silentUntil===Infinity || Date.now()<state.silentUntil;
}
function spokenDurationValue(raw){
  const word=normalizeText(raw);
  const values={
    medio:.5,media:.5,un:1,una:1,uno:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,
    once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,
    veinte:20,veintiuno:21,veintidos:22,veintitres:23,veinticuatro:24,veinticinco:25,veintiseis:26,
    veintisiete:27,veintiocho:28,veintinueve:29,treinta:30,sesenta:60
  };
  if(Object.prototype.hasOwnProperty.call(values,word))return values[word];
  const n=Number(String(raw).replace(",","."));
  return Number.isFinite(n)&&n>0?n:null;
}
function parseSilenceDuration(rawText){
  const text=normalizeText(rawText);
  if(/hasta (?:que te diga|nuevo aviso)|sin limite|indefinidamente/.test(text))return Infinity;
  const units=[
    {re:/\b(\d+(?:[.,]\d+)?|medio|media|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|veintiuno|veintidos|veintitres|veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|sesenta)\s*(horas?|hrs?|h)\b/,factor:60*60*1000},
    {re:/\b(\d+(?:[.,]\d+)?|medio|media|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|veintiuno|veintidos|veintitres|veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|sesenta)\s*(minutos?|mins?|min)\b/,factor:60*1000},
    {re:/\b(\d+(?:[.,]\d+)?|medio|media|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|veintiuno|veintidos|veintitres|veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|sesenta)\s*(segundos?|segs?|seg)\b/,factor:1000}
  ];
  for(const unit of units){
    const match=text.match(unit.re);
    const value=match&&spokenDurationValue(match[1]);
    if(value!==null&&value!==false&&value!==undefined)return clamp(Math.round(value*unit.factor),1000,MAX_SILENCE_MS);
  }
  const bare=text.match(/\b(?:por|durante)\s+(\d+)\b/);
  if(bare)return clamp(Number(bare[1])*1000,1000,MAX_SILENCE_MS);
  return DEFAULT_SILENCE_MS;
}
function silenceDurationLabel(ms){
  if(ms===Infinity)return "hasta que me digas que vuelva a hablar";
  if(ms%3600000===0)return ms/3600000+" "+(ms===3600000?"hora":"horas");
  if(ms%60000===0)return ms/60000+" "+(ms===60000?"minuto":"minutos");
  return Math.round(ms/1000)+" segundos";
}
function beginSpeechSilence(rawText){
  const duration=parseSilenceDuration(rawText);
  clearTimeout(state.silenceTimer);
  state.silentUntil=duration===Infinity?Infinity:Date.now()+duration;
  if("speechSynthesis" in window)speechSynthesis.cancel();
  state.speaking=false;
  const label=silenceDurationLabel(duration);
  say("🤫 Está bien. Me quedo callado "+label+".",Math.min(duration===Infinity?5000:duration,5000));
  setListenState(duration===Infinity?"escuchando en silencio":"silencio · "+label,"listening");
  if(duration!==Infinity){
    state.silenceTimer=setTimeout(()=>{
      state.silentUntil=0;
      state.silenceTimer=null;
      if(state.started)setListenState("escuchando","listening");
    },duration);
  }
}
function endSpeechSilence(){
  clearTimeout(state.silenceTimer);
  state.silenceTimer=null;
  state.silentUntil=0;
  if(state.started)setListenState("escuchando","listening");
  say("Ya puedo hablar de nuevo.",3200);
}
function handleSilenceCommand(rawText){
  const text=normalizeText(rawText);
  const resume=/^(?:robotito\s+)?(?:(?:ya\s+)?(?:podes|puedes)\s+(?:volver a\s+)?hablar|volve a hablar|vuelve a hablar|habla de nuevo|deja de estar callado|fin del silencio)\b/.test(text);
  if(resume){
    endSpeechSilence();
    return true;
  }
  const mute=/^(?:robotito\s+)?(?:(?:por favor|te pido que)\s+)?(?:callate|quedate callado|quedate en silencio|no hables|no digas nada|guarda silencio|deja de hablar|quiero que te calles|silencio)(?:\b|$)/.test(text);
  if(!mute)return false;
  beginSpeechSilence(text);
  return true;
}
window.ROBOTITO_SILENCE={
  parseDuration:parseSilenceDuration,
  isMuted:isSpeechMuted,
  defaultMs:DEFAULT_SILENCE_MS
};

function speakResponse(text,forcedLang=null){
  // Class Mode and requested quiet periods are intentionally silent: Robotito
  // keeps listening, learning and showing text without speaking aloud.
  if(state.classMode||isSpeechMuted())return false;
  if(!state.voiceEnabled||!("speechSynthesis" in window))return false;
  const clean=cleanSpeechText(text);
  if(!clean)return false;
  const lang=forcedLang||responseLanguage();
  const detectedLanguage=detectGeneratedSpeechLanguage(clean);
  // Last line of defense: a mismatched voice must never pronounce a response
  // written in another language (the original bug sounded like Spanish with
  // an English accent).
  if(detectedLanguage!=="und"&&detectedLanguage!==lang){
    console.warn("Robotito blocked mismatched speech",{detectedLanguage,requestedLanguage:lang});
    return false;
  }
  speechSynthesis.cancel();
  state.recentVoicePrints=[];
  state.speaking=true;
  if(isMobileSpeech()&&window.RobotitoLocalASR?.active){
    window.RobotitoLocalASR.pause(true);
  }else{
    discardRecognition();
  }
  setListenState(state.languageMode==="en"?"responding":state.languageMode==="pt"?"respondendo":"respondiendo");
  const utter=new SpeechSynthesisUtterance(clean);
  const voices=speechSynthesis.getVoices();
  const selected=voices.find(v=>v.voiceURI===state.voiceURI);
  const selectedMatches=voiceMatchesLanguage(selected,lang);
  const chosen=selectedMatches?selected:chooseDefaultVoice(voices,lang);
  if(chosen)utter.voice=chosen;
  utter.lang=chosen?.lang||languageLocale(lang);
  utter.pitch=clamp(state.voicePitch,.5,1.1);
  utter.rate=clamp(state.voiceRate,.65,1.1);
  utter.volume=.92;
  const done=()=>{
    state.speaking=false;
    if(isMobileSpeech()&&window.RobotitoLocalASR?.active){
      setTimeout(()=>window.RobotitoLocalASR.pause(false),320);
    }else{
      restartRecognitionAfterSpeech();
    }
  };
  utter.onend=done;
  utter.onerror=done;
  speechSynthesis.speak(utter);
  return true;
}
function readingDisplayTime(text,minMs=3000){
  const clean=cleanSpeechText(text);
  const words=(clean.match(/\S+/g)||[]).length;
  const punctuation=(clean.match(/[.!?;:]/g)||[]).length;
  // Comfortable on-screen reading pace: ~175 words/minute, plus pauses.
  const readingMs=words*(60000/175)+punctuation*180+900;
  return clamp(Math.round(readingMs),Math.max(3000,minMs||0),45000);
}
function scheduleSpeechBubbleHide(token,deadline){
  clearTimeout(say.t);
  const check=()=>{
    if(token!==state.speechBubbleToken)return;
    const remaining=deadline-Date.now();
    if(remaining>0){
      say.t=setTimeout(check,Math.min(remaining,1000));
      return;
    }
    // Never hide the current message while Robotito is still saying it aloud.
    if(state.speaking){
      say.t=setTimeout(check,500);
      return;
    }
    say.t=setTimeout(()=>{
      if(token===state.speechBubbleToken&&!state.speaking){
        $("#speechBubble")?.classList.add("hidden");
      }
    },900);
  };
  check();
}
const SPEECH_LANGUAGE_HINTS={
  es:["el","la","los","las","un","una","que","como","cual","donde","cuando","quien","porque","para","por","con","sin","del","al","pero","estoy","esta","estas","este","eso","aqui","ahora","muy","mas","tengo","tenes","tiene","quiero","puedo","puede","vamos","gracias","hola","bien","hambre","sueno","triste","feliz","asustado","enojado","caricia","mimos","comida","jugar","abrazo","panda","robotito"],
  en:["the","a","an","what","which","where","when","who","why","how","because","for","with","without","but","i","i'm","my","you","your","we","it","is","are","am","this","that","here","now","very","have","has","want","can","could","will","would","please","thanks","hello","good","yes","not","really","like","love","gentle","pats","ready","help","hungry","sleepy","sad","happy","scared","angry","hug","play","food","robotito"],
  pt:["o","os","as","um","uma","que","qual","onde","quando","quem","porque","para","por","com","sem","mas","eu","voce","seu","sua","estou","esta","isso","aqui","agora","muito","tenho","tem","quero","posso","pode","vamos","obrigado","ola","bem","fome","sono","triste","feliz","assustado","bravo","carinho","comida","brincar","abraco","robotito"]
};
function speechHintScore(normalized,hints){
  const padded=" "+normalized+" ";
  return hints.reduce((score,hint)=>score+(padded.includes(" "+hint+" ")?1:0),0);
}
function detectGeneratedSpeechLanguage(text){
  const raw=cleanSpeechText(text);
  const normalized=normalizeText(raw).replace(/[^a-z0-9' ]/g," ");
  if(!normalized.trim())return "und";
  const scores={
    es:speechHintScore(normalized,SPEECH_LANGUAGE_HINTS.es),
    en:speechHintScore(normalized,SPEECH_LANGUAGE_HINTS.en),
    pt:speechHintScore(normalized,SPEECH_LANGUAGE_HINTS.pt)
  };
  if(/[¿¡ñ]/i.test(raw))scores.es+=3;
  if(/[ãõç]/i.test(raw))scores.pt+=3;
  if(/\b(?:the|this|that|with|without|please|thanks|hello|i'm|you're|don't|can't)\b/i.test(raw))scores.en+=2;
  if(/\b(?:para|porque|estoy|tengo|quiero|puedo|gracias|hola|mimos|abrazo)\b/i.test(normalized))scores.es+=2;
  if(/\b(?:voce|obrigado|ola|estou|tenho|quero|carinho|abraco)\b/i.test(normalized))scores.pt+=2;
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  if(ranked[0][1]<2||ranked[0][1]===ranked[1][1])return "und";
  return ranked[0][0];
}
function isLanguageNeutralSpeech(text){
  const cleaned=cleanSpeechText(text).replace(/https?:\/\/\S+/gi,"").replace(/[\d\s.,:;!?%+\-=()\/\\]+/g,"").trim();
  return !cleaned || /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúÑñÜü'-]{0,24}$/.test(cleaned);
}
function speechNeedsLocalization(text,target=responseLanguage(),forcedLang=null){
  if(forcedLang)return false;
  const source=detectGeneratedSpeechLanguage(text);
  if(source===target)return false;
  // Most legacy/generated app copy is Spanish. If English or Portuguese is
  // selected, an uncertain sentence must be translated rather than spoken
  // with the wrong accent. Numbers, formulas and proper names are neutral.
  if(source==="und")return target!=="es"&&!isLanguageNeutralSpeech(text);
  return true;
}
function localizedSpeechFallback(target){
  if(target==="en")return "I understood you, but I couldn't prepare that answer in English. Please try again.";
  if(target==="pt")return "Eu entendi você, mas não consegui preparar essa resposta em português. Tente novamente.";
  return "Te entendí, pero no pude preparar esa respuesta en español. Probá de nuevo.";
}
async function localizeGeneratedSpeech(text,target=responseLanguage()){
  const detected=detectGeneratedSpeechLanguage(text);
  if(detected===target||isLanguageNeutralSpeech(text))return String(text||"");
  const source=detected==="und"?"es":detected;
  let translated=null;
  try{
    translated=await Promise.race([
      translateShortPhrase(String(text||""),source,target),
      new Promise(resolve=>setTimeout(()=>resolve(null),3000))
    ]);
  }catch(e){
    console.warn("response localization",e);
  }
  if(!translated)return localizedSpeechFallback(target);
  const translatedLanguage=detectGeneratedSpeechLanguage(translated);
  if(translatedLanguage!=="und"&&translatedLanguage!==target)return localizedSpeechFallback(target);
  return translated;
}
function commitSpeechMessage(text,ms,lang,token){
  if(token!==state.speechBubbleToken)return;
  state.lastSaid=text;
  const b=$("#speechBubble");
  if(!b)return;
  b.textContent=text;
  b.classList.remove("hidden");
  const displayMs=readingDisplayTime(text,ms);
  scheduleSpeechBubbleHide(token,Date.now()+displayMs);
  speakResponse(text,lang);
}
function say(text, ms=3000, spokenLang=null){
  const target=spokenLang||responseLanguage();
  const b=$("#speechBubble");
  if(!b)return;
  const token=++state.speechBubbleToken;

  if(speechNeedsLocalization(text,target,spokenLang)){
    b.textContent=target==="en"?"Preparing the answer in English…":target==="pt"?"Preparando a resposta em português…":"Preparando la respuesta en español…";
    b.classList.remove("hidden");
    void localizeGeneratedSpeech(text,target).then(localized=>{
      commitSpeechMessage(localized,ms,target,token);
    });
    return;
  }

  commitSpeechMessage(String(text||""),ms,target,token);
}
function sayInLanguage(text,lang,ms=3500){
  say(text,ms,lang);
}
window.ROBOTITO_LANGUAGE_PIPELINE={
  detect:detectGeneratedSpeechLanguage,
  isNeutral:isLanguageNeutralSpeech,
  needsLocalization:speechNeedsLocalization,
  fallback:localizedSpeechFallback,
  localize:localizeGeneratedSpeech,
  voiceMatches:voiceMatchesLanguage
};
function toast(text){
  const t=$("#toast");
  t.textContent=text;
  t.classList.remove("hidden");
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>t.classList.add("hidden"),2300);
}

function setMood(mood, reason=""){
  const allMoods=["calm","happy","sad","angry","scared","hungry","sleepy","curious","focused","bored","affectionate","proud","confused","excited","embarrassed","annoyed"];
  allMoods.forEach(m=>robot.classList.remove("mood-"+m));
  const visualMap={curious:"happy",focused:"calm",bored:"sleepy",affectionate:"happy",proud:"happy",confused:"scared",excited:"happy",embarrassed:"sad",annoyed:"calm"};
  const visual=visualMap[mood]||mood;
  robot.classList.add("mood-"+visual);
  if(visual!==mood)robot.classList.add("mood-"+mood);
  state.mood=mood;
  state.emotion=mood;
  const labels={calm:"tranquilo",happy:"feliz",sad:"triste",angry:"enojado",scared:"asustado",hungry:"hambriento",sleepy:"con sueño",curious:"curioso",focused:"concentrado",bored:"aburrido",affectionate:"cariñoso",proud:"orgulloso",confused:"confundido",excited:"emocionado",embarrassed:"avergonzado",annoyed:"molesto"};
  $("#moodLabel").textContent=labels[mood]||mood;
  if(reason) $("#statusText").textContent=reason;
  updateAvatarMoodIcon(mood);
}

function ensureBond(p){
  if(!p)return null;
  if(!p.bond){
    const old=clamp(p.relationship??50,0,100);
    p.bond={
      affection:clamp(50+(old-50)*.75,0,100),
      trust:clamp(50+(old-50)*.55,0,100),
      fear:clamp(8+Math.max(0,45-old)*.18,0,100),
      irritation:clamp(8+Math.max(0,45-old)*.22,0,100),
      updatedAt:Date.now()
    };
  }
  const days=Math.max(0,(Date.now()-(p.bond.updatedAt||Date.now()))/86400000);
  if(days>=1){
    p.bond.fear=clamp(p.bond.fear-Math.min(2,days*.18),0,100);
    p.bond.irritation=clamp(p.bond.irritation-Math.min(2,days*.15),0,100);
    p.bond.updatedAt=Date.now();
  }
  return p.bond;
}
function adjustBond(personName,delta={}){
  if(!personName)return;
  const p=state.people.find(x=>x.name===personName);
  if(!p)return;
  const b=ensureBond(p);
  for(const key of ["affection","trust","fear","irritation"]){
    if(Number.isFinite(delta[key]))b[key]=clamp(b[key]+delta[key],0,100);
  }
  b.updatedAt=Date.now();
  p.relationship=Math.round((b.affection+b.trust+(100-b.fear)+(100-b.irritation))/4);
  p.lastInteractionAt=Date.now();
  save(KEYS.people,state.people);
  renderPeople();
}
function bondCategory(p){
  const b=ensureBond(p);
  if(!b)return "neutral";
  if(b.fear>=67)return "afraid";
  if(b.irritation>=70&&b.affection<45)return "dislikes";
  if(b.affection>=78&&b.trust>=68)return "loves";
  if(b.affection>=63&&b.trust>=55)return "likes";
  if(b.trust>=72)return "trusts";
  if(b.fear>=42)return "wary";
  if(b.irritation>=45)return "annoyed";
  return "comfortable";
}
function relationText(personOrValue){
  if(typeof personOrValue==="number"){
    if(personOrValue>=75)return "le cae muy bien";
    if(personOrValue<35)return "está bastante distante";
    return "se siente cómodo";
  }
  const p=personOrValue;
  const b=ensureBond(p);
  switch(bondCategory(p)){
    case "afraid": return "le da miedo";
    case "dislikes": return "le cae mal";
    case "loves": return "le tiene muchísimo cariño";
    case "likes": return "le cae muy bien";
    case "trusts": return "confía mucho";
    case "wary": return "le genera cierta inquietud";
    case "annoyed": return "está algo fastidiado";
    default: return "se siente cómodo";
  }
}
function bondDetail(p){
  const b=ensureBond(p);
  return `cariño ${Math.round(b.affection)} · confianza ${Math.round(b.trust)} · miedo ${Math.round(b.fear)} · fastidio ${Math.round(b.irritation)}`;
}
function changeMoodScore(delta){
  state.moodScore=clamp(state.moodScore+delta,0,100);
  updateMeters();
}

const BATTERY_ALERT_LEVELS=[50,20,10,5];

function batteryBucket(level){
  const value=clamp(Number(level),0,100);
  if(value<=5)return 5;
  if(value<=10)return 10;
  if(value<=20)return 20;
  if(value<=50)return 50;
  return null;
}
function batteryAlertThreshold(previous,current){
  const now=clamp(Number(current),0,100);
  const before=previous===null||previous===undefined?null:clamp(Number(previous),0,100);
  const bucket=batteryBucket(now);
  if(bucket===null)return null;
  if(before===null)return bucket;
  if(now>=before)return null;
  return batteryBucket(before)!==bucket?bucket:null;
}
function batteryAlertMessage(threshold,lang=responseLanguage()){
  const messages={
    es:{
      50:"Mi batería llegó a 50 %. Todavía estoy bien, pero quería avisarte.",
      20:"Mi batería bajó a 20 %. ¿Podés conectar el cargador dentro de poco?",
      10:"¡Solo me queda 10 % de batería! Por favor, conectame al cargador.",
      5:"¡Estoy en alerta! Me queda 5 % de batería o menos. Estoy muy asustado… no me quiero apagar."
    },
    en:{
      50:"My battery reached 50%. I'm still okay, but I wanted to let you know.",
      20:"My battery dropped to 20%. Could you connect the charger soon?",
      10:"I only have 10% battery left! Please connect me to the charger.",
      5:"I'm on alert! I have 5% battery or less. I'm very scared… I don't want to turn off."
    },
    pt:{
      50:"Minha bateria chegou a 50%. Ainda estou bem, mas queria avisar.",
      20:"Minha bateria caiu para 20%. Você pode conectar o carregador em breve?",
      10:"Só tenho 10% de bateria! Por favor, conecte o carregador.",
      5:"Estou em alerta! Tenho 5% de bateria ou menos. Estou com muito medo… não quero desligar."
    }
  };
  return (messages[lang]||messages.es)[threshold]||"";
}
function announceBatteryAlert(threshold){
  if(!threshold)return;
  if(!["es","en","pt"].includes(state.languageMode)){
    state.pendingBatteryAlert=threshold;
    return;
  }
  state.pendingBatteryAlert=null;
  state.batteryLastAlertAt=Date.now();
  const message=batteryAlertMessage(threshold,state.languageMode);
  if(message)say(message,threshold===5?8500:5500,state.languageMode);
}
function flushPendingBatteryAlert(){
  if(state.pendingBatteryAlert)announceBatteryAlert(state.pendingBatteryAlert);
}
function applyBatteryCriticalState(){
  const critical=state.batterySupported&&state.energy<=5;
  const changed=critical!==state.batteryCritical;
  state.batteryCritical=critical;
  robot.classList.toggle("battery-critical",critical);
  $("#energyMeter")?.closest(".meter-card")?.classList.toggle("battery-critical",critical);

  if(critical){
    state.sleeping=false;
    stopSnoring();
    robot.classList.remove("sleeping");
    setMood("scared","¡Alerta de batería! Robotito está muy asustado y no se quiere apagar.");
  }else if(changed&&!state.classMode&&!state.nightSleep){
    setMood("calm",state.batteryCharging?"Robotito se tranquilizó porque la batería está cargando.":"La batería salió del nivel crítico.");
  }
}
function syncBatteryState({announce=true}={}){
  const battery=state.batteryManager;
  if(!battery)return;
  const previous=state.batteryPreviousLevel;
  const level=clamp(Math.round(Number(battery.level)*100),0,100);
  state.batterySupported=true;
  state.batteryCharging=!!battery.charging;
  state.energy=level;
  state.batteryPreviousLevel=level;

  const threshold=batteryAlertThreshold(previous,level);
  applyBatteryCriticalState();
  updateMeters();
  if(announce&&threshold)announceBatteryAlert(threshold);
}
async function initDeviceBattery(){
  const source=$("#batterySourceText");
  if(typeof navigator.getBattery!=="function"){
    state.batterySupported=false;
    if(source)source.textContent="Este navegador no permite consultar la batería; se mostrará una energía estimada.";
    updateMeters();
    return false;
  }
  try{
    const battery=await navigator.getBattery();
    state.batteryManager=battery;
    state.batterySupported=true;
    const sync=()=>syncBatteryState({announce:true});
    battery.addEventListener?.("levelchange",sync);
    battery.addEventListener?.("chargingchange",sync);
    syncBatteryState({announce:true});
    if(source)source.textContent=state.batteryCharging?"Batería real del dispositivo · cargando":"Batería real del dispositivo";
    return true;
  }catch(error){
    console.warn("battery status",error);
    state.batterySupported=false;
    if(source)source.textContent="No pude consultar la batería; se mostrará una energía estimada.";
    updateMeters();
    return false;
  }
}
function updateMeters(){
  $("#moodScoreText").textContent=Math.round(state.moodScore)+" / 100";
  $("#moodMeter").style.width=state.moodScore+"%";
  const energyLabel=Math.round(state.energy)+"%"+(state.batterySupported&&state.batteryCharging?" ⚡":"");
  $("#energyText").textContent=energyLabel;
  $("#energyMeter").style.width=state.energy+"%";
  $("#energyMeter").setAttribute("aria-valuenow",String(Math.round(state.energy)));
  const source=$("#batterySourceText");
  if(source&&state.batterySupported){
    source.textContent=state.batteryCharging?"Batería real del dispositivo · cargando":"Batería real del dispositivo";
  }
  $("#hungerText").textContent=Math.round(state.hunger)+"%";
  $("#hungerMeter").style.width=state.hunger+"%";
  $("#hungerLabel").textContent=Math.round(state.hunger)+"%";
}

function clearBlinkState(){
  clearTimeout(state.blinkCloseTimer);
  clearTimeout(state.blinkSequenceTimer);
  state.blinkCloseTimer=null;
  state.blinkSequenceTimer=null;
  robot.classList.remove("blink");
}
function eyesLocked(){
  return state.sleeping || robot.classList.contains("heart-eyes");
}
function singleBlink(duration=115){
  if(eyesLocked()||document.hidden)return false;
  clearTimeout(state.blinkCloseTimer);
  robot.classList.remove("blink");

  requestAnimationFrame(()=>{
    if(eyesLocked()||document.hidden)return;
    robot.classList.add("blink");
    state.lastBlinkAt=Date.now();
    state.blinkCloseTimer=setTimeout(()=>{
      robot.classList.remove("blink");
      state.blinkCloseTimer=null;
    },duration);
  });
  return true;
}
function performBlink(){
  if(eyesLocked()||document.hidden)return;
  const closeDuration=95+Math.random()*45;
  if(!singleBlink(closeDuration))return;

  // Humans occasionally make a quick double blink, but not constantly.
  if(Math.random()<.13){
    state.blinkSequenceTimer=setTimeout(()=>{
      if(!eyesLocked()&&!document.hidden)singleBlink(90+Math.random()*30);
      state.blinkSequenceTimer=null;
    },190+Math.random()*95);
  }
}
function nextBlinkDelay(){
  // Most blinks fall around 3–6 s, with occasional longer relaxed pauses.
  const r=Math.random();
  if(r<.08)return 1800+Math.random()*900;
  if(r<.86)return 3000+Math.random()*3200;
  return 6200+Math.random()*3000;
}
function blinkLoop(){
  clearTimeout(state.blinkTimer);
  state.blinkTimer=setTimeout(()=>{
    if(!document.hidden&&!eyesLocked())performBlink();
    blinkLoop();
  },nextBlinkDelay());
}

function moveEyes(nx,ny,force=false){
  state.eyeLookX=clamp(nx,-1,1);
  state.eyeLookY=clamp(ny,-1,1);
  if(!force&&eyesLocked())return;
  const x=state.eyeLookX*5;
  const y=state.eyeLookY*3.6;
  $$(".iris").forEach(i=>{
    i.style.transform=`translate3d(${x}px,${y}px,0)`;
  });
}
function resetEyes(){
  state.eyeLookX=0;
  state.eyeLookY=0;
  $$(".iris").forEach(i=>i.style.transform="translate3d(0,0,0)");
}
function followFace(box){
  const vw=camera.videoWidth||640, vh=camera.videoHeight||480;
  const cx=(box.x+box.width/2)/vw;
  const cy=(box.y+box.height/2)/vh;
  const left=clamp(21+cx*58,21,79);
  robot.style.left=left+"%";
  robot.style.top=clamp(37+cy*21,37,58)+"%";
  if($("#groundShadow"))$("#groundShadow").style.left=left+"%";
  moveEyes((cx-.5)*2,(cy-.5)*2);
}

async function loadFaceModels(){
  const base="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(base),
    faceapi.nets.faceLandmark68Net.loadFromUri(base),
    faceapi.nets.faceRecognitionNet.loadFromUri(base)
  ]);
}

function primeMobileSpeechFromGesture(){
  state.recognitionWanted=true;
  state.speechBlocked=false;
  discardRecognition();
  const r=createSpeechRecognition();
  if(!r){
    setListenState(state.languageMode==="en"?"not supported":"no compatible","problem");
    $("#transcript").textContent=state.languageMode==="en"
      ?"This mobile browser does not provide the Web Speech recognition service."
      :"Este navegador móvil no ofrece el servicio Web Speech de reconocimiento.";
    return Promise.resolve(false);
  }
  state.recognition=r;
  return new Promise(resolve=>{
    let settled=false;
    const finish=value=>{if(settled)return;settled=true;resolve(value);};
    r.addEventListener("start",()=>finish(true),{once:true});
    r.addEventListener("error",()=>finish(false),{once:true});
    setTimeout(()=>finish(false),7000);
    try{
      setListenState(state.languageMode==="en"?"activating microphone…":"activando micrófono…");
      r.start();
    }catch(e){
      console.warn("initial speech start",e);
      state.recognition=null;
      finish(false);
    }
  });
}

async function startSenses(){
  if(state.started)return;
  if(!["es","en","pt"].includes(state.languageMode)){
    toast("Elegí Español, English o Português primero.");
    return;
  }

  const mobile=isMobileSpeech();
  state.started=true;

  // Prime the local audio engine synchronously from the initial user gesture.
  if(mobile){
    try{
      window.RobotitoLocalASR?.prime(
        state.languageMode,
        (text,kind)=>setListenState(text,kind)
      );
    }catch(e){console.warn("local ASR prime",e);}
  }

  $("#systemStatus").textContent=mobile
    ?(state.languageMode==="en"?"Requesting camera and microphone…":"Pidiendo cámara y micrófono…")
    :"Pidiendo permisos…";

  try{
    state.stream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:"user",width:{ideal:640},height:{ideal:480}},
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}
    });

    camera.srcObject=state.stream;
    await camera.play();

    // Keep audio analysis/voice-print learning on the same shared stream.
    setupAudio(state.stream);

    if(mobile){
      discardRecognition();
      state.recognitionWanted=false;
      
      $("#mobileSpeechHint")?.classList.remove("hidden");
      $("#mobileSpeechHint").textContent=state.languageMode==="en"
        ?"Robotito uses continuous local speech recognition on mobile. The first load may take a little longer while the speech model is prepared."
        :"En celular Robotito usa reconocimiento local continuo. La primera vez puede demorar un poco mientras prepara el modelo de voz.";

      if(!window.RobotitoLocalASR){
        throw new Error("Local mobile speech engine unavailable");
      }

      // Start local continuous recognition. This does not require a tap per phrase.
      window.RobotitoLocalASR.start({
        stream:state.stream,
        lang:state.languageMode,
        onTranscript:(text,meta)=>{
          updateDetectedLanguage(text);
          processSpeechResult(text,meta);
        },
        statusCallback:(text,kind)=>setListenState(text,kind)
      }).then(()=>{
        $("#systemStatus").textContent=state.languageMode==="en"
          ?"Camera and microphone active. Continuous local listening is on."
          :"Cámara y micrófono activos. Escucha local continua encendida.";
      }).catch(err=>{
        console.warn("local ASR",err);
        $("#systemStatus").textContent=state.languageMode==="en"
          ?"Camera active, but local speech recognition failed."
          :"Cámara activa, pero falló el reconocimiento local.";
        // Desktop-style Web Speech remains a last automatic fallback if available.
        state.recognitionWanted=true;
        startListeningCycle(false);
      });
    }else{
      setupSpeechRecognition(true);
      $("#systemStatus").textContent="Cámara y micrófono activos.";
    }

    $("#startBtn").textContent=state.languageMode==="en"?"Senses active":"Sentidos activos";
    $("#startBtn").disabled=true;

    // Vision loads after audio has already begun.
    loadFaceModels().then(()=>{
      setupHands();
      detectLoop();
    }).catch(err=>console.warn("face models",err));

    say(state.languageMode==="en"?"I'm awake.":"Ya estoy despierto.");
  }catch(err){
    console.error(err);
    state.stream?.getTracks?.().forEach(t=>t.stop());
    state.stream=null;
    try{window.RobotitoLocalASR?.stop();}catch{}
    state.started=false;
    discardRecognition();
    $("#systemStatus").textContent=state.languageMode==="en"
      ?"I couldn't activate camera and microphone."
      :"No pude activar cámara y micrófono.";
    toast(state.languageMode==="en"
      ?"Allow camera and microphone for this site."
      :"Permití cámara y micrófono para este sitio.");
  }
}

function spectralFlatness(values){
  let logSum=0, linearSum=0, count=0;
  for(const v of values){
    const x=Math.max(v,1);
    logSum+=Math.log(x);
    linearSum+=x;
    count++;
  }
  if(!count||!linearSum)return 1;
  return Math.exp(logSum/count)/(linearSum/count);
}

function estimatePitch(time,sampleRate){
  const samples=Array.from(time,v=>(v-128)/128);
  let rms=0; for(const x of samples)rms+=x*x; rms=Math.sqrt(rms/samples.length);
  if(rms<.035)return 0;
  const minLag=Math.max(2,Math.floor(sampleRate/360));
  const maxLag=Math.min(Math.floor(sampleRate/75),Math.floor(samples.length*.48));
  let bestLag=0,best=-1;
  for(let lag=minLag;lag<=maxLag;lag+=2){
    let sum=0,n=0;
    for(let i=0;i<samples.length-lag;i+=2){sum+=samples[i]*samples[i+lag];n++;}
    const score=sum/Math.max(1,n);
    if(score>best){best=score;bestLag=lag;}
  }
  return best>.03&&bestLag?sampleRate/bestLag:0;
}
function zeroCrossingRate(time){
  let z=0;
  for(let i=1;i<time.length;i++){
    const a=time[i-1]-128,b=time[i]-128;
    if((a<0&&b>=0)||(a>=0&&b<0))z++;
  }
  return z/Math.max(1,time.length-1);
}
function makeVoicePrint(freq,time,sampleRate){
  const start=4,end=Math.min(260,freq.length),bands=18;
  const step=Math.max(1,Math.floor((end-start)/bands));
  const spectrum=[];
  for(let b=0;b<bands;b++){
    const a=start+b*step,z=b===bands-1?end:Math.min(end,a+step);
    let sum=0,n=0;
    for(let i=a;i<z;i++){sum+=freq[i];n++;}
    spectrum.push(Math.log1p(sum/Math.max(1,n)));
  }
  const mean=spectrum.reduce((a,b)=>a+b,0)/spectrum.length;
  let features=spectrum.map(v=>v-mean);
  const pitch=estimatePitch(time,sampleRate);
  const pitchFeature=pitch?clamp((Math.log2(pitch)-Math.log2(75))/(Math.log2(360)-Math.log2(75))*2-1,-1,1):0;
  const zcrFeature=clamp((zeroCrossingRate(time)-.08)*5,-1,1);
  features.push(pitchFeature*.9,zcrFeature*.55);
  const norm=Math.sqrt(features.reduce((s,v)=>s+v*v,0))||1;
  return features.map(v=>v/norm);
}
function averageVoiceVectors(vectors){
  if(!vectors?.length)return null;
  const n=vectors[0].length;
  const avg=Array(n).fill(0);
  for(const v of vectors)for(let i=0;i<n;i++)avg[i]+=v[i]||0;
  for(let i=0;i<n;i++)avg[i]/=vectors.length;
  const norm=Math.sqrt(avg.reduce((s,v)=>s+v*v,0))||1;
  return avg.map(v=>v/norm);
}
function cosineSimilarity(a,b){
  if(!a||!b||a.length!==b.length)return -1;
  let dot=0,na=0,nb=0;
  for(let i=0;i<a.length;i++){dot+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}
  return dot/(Math.sqrt(na)*Math.sqrt(nb)||1);
}
function recentVoicePrint(ms=3400){
  const now=Date.now();
  const vectors=state.recentVoicePrints.filter(x=>now-x.t<=ms).map(x=>x.vector);
  return averageVoiceVectors(vectors);
}
function voicePrintForWindow(startedAt,endedAt){
  if(!startedAt||!endedAt)return recentVoicePrint();
  const vectors=state.recentVoicePrints
    .filter(x=>x.t>=startedAt-180&&x.t<=endedAt+260)
    .map(x=>x.vector);
  return averageVoiceVectors(vectors);
}
function recognizeVoicePerson(print,faceName=null){
  if(!print)return null;
  const scores=[];
  for(const p of state.people){
    const sims=(p.voicePrints||[])
      .map(vp=>cosineSimilarity(print,vp))
      .filter(x=>Number.isFinite(x)&&x>-1)
      .sort((a,b)=>b-a);
    if(!sims.length)continue;

    const top=sims.slice(0,Math.min(4,sims.length));
    let score;
    if(top.length===1)score=top[0];
    else{
      const weights=[.40,.28,.20,.12].slice(0,top.length);
      const denom=weights.reduce((a,b)=>a+b,0);
      score=top.reduce((sum,x,i)=>sum+x*weights[i],0)/denom;
    }
    const consistency=sims.filter(x=>x>=.72).length;
    scores.push({
      name:p.name,
      role:p.role||"other",
      score,
      best:sims[0],
      consistency,
      profileCount:sims.length
    });
  }
  scores.sort((a,b)=>b.score-a.score);
  const best=scores[0],second=scores[1];
  if(!best)return null;

  const agreesWithFace=faceName&&best.name===faceName;
  const threshold=agreesWithFace?.735:(best.profileCount>=3?.785:.82);
  const margin=agreesWithFace?.012:.035;

  if(best.score<threshold)return null;
  if(best.profileCount>=3&&best.consistency<2&&!agreesWithFace)return null;
  if(second&&best.score-second.score<margin&&!agreesWithFace)return null;
  return best;
}

function setupAudio(stream){
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    state.audioContext=ctx;
    const src=ctx.createMediaStreamSource(stream);
    const analyser=ctx.createAnalyser();
    analyser.fftSize=1024;
    analyser.smoothingTimeConstant=.78;
    src.connect(analyser);
    state.analyser=analyser;

    const freq=new Uint8Array(analyser.frequencyBinCount);
    const time=new Uint8Array(analyser.fftSize);
    let sustainedMusic=0, sustainedNoise=0;

    const tick=()=>{
      analyser.getByteFrequencyData(freq);
      analyser.getByteTimeDomainData(time);

      let sumSq=0;
      for(const v of time){const n=(v-128)/128;sumSq+=n*n;}
      const rms=Math.sqrt(sumSq/time.length);
      state.audioLevel=rms;

      const low=[...freq.slice(2,26)];
      const mid=[...freq.slice(26,120)];
      const high=[...freq.slice(120,260)];
      const avg=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
      const lowE=avg(low), midE=avg(mid), highE=avg(high);
      const totalE=lowE+midE+highE+1;
      const centroid=(lowE*1+midE*2+highE*3)/totalE;
      const flat=spectralFlatness([...freq.slice(4,220)]);
      state.recentAudioFeatures.push({rms,centroid,flat,t:Date.now()});
      state.recentAudioFeatures=state.recentAudioFeatures.filter(x=>Date.now()-x.t<3500);
      const activeBands=[lowE,midE,highE].filter(v=>v>18).length;

      if(rms<Math.max(.035,state.ambientRms*1.8)){
        state.ambientRms=state.ambientRms*.96+rms*.04;
      }
      state.voiceThreshold=clamp(Math.max(.028,state.ambientRms*2.35),.028,.07);

      if(!state.speaking && rms>state.voiceThreshold && Date.now()-(state.recentVoicePrints.at(-1)?.t||0)>85){
        state.recentVoicePrints.push({t:Date.now(),vector:makeVoicePrint(freq,time,ctx.sampleRate),rms});
        state.recentVoicePrints=state.recentVoicePrints.filter(x=>Date.now()-x.t<45000);
      }

      const likelyMusic = rms>.06 && activeBands>=2 && flat>.09 && flat<.66 && midE>19;
      const likelyNoise = rms>.05 && (flat>=.72 || activeBands<=1);

      if(likelyMusic){
        sustainedMusic=Math.min(100,sustainedMusic+1.3);
        sustainedNoise=Math.max(0,sustainedNoise-1);
      }else{
        sustainedMusic=Math.max(0,sustainedMusic-1.5);
      }
      if(likelyNoise) sustainedNoise=Math.min(100,sustainedNoise+1.1);
      else sustainedNoise=Math.max(0,sustainedNoise-1);

      if(rms<.025){
        state.audioKind="silencio";
        sustainedMusic=Math.max(0,sustainedMusic-2);
      }else if(sustainedMusic>34){
        state.audioKind="música";
      }else if(sustainedNoise>15){
        state.audioKind="ruido";
      }else{
        state.audioKind="sonido";
      }

      state.musicConfidence=sustainedMusic;
      $("#heardLabel").textContent=state.audioKind;
      if(rms>.04) state.lastHeardAt=Date.now();

      robot.classList.toggle("dancing",state.audioKind==="música" && sustainedMusic>42 && !state.sleeping);
      requestAnimationFrame(tick);
    };
    tick();
  }catch(e){console.warn("audio",e);}
}

let pendingRecognitionText="";
let pendingRecognitionMeta=null;
let recognitionCommitTimer=null;

function cleanRecognitionTranscript(input){
  return String(input||"")
    .replace(/\s+/g," ")
    .replace(/(^|\s)([a-záéíóúüñ]+)(?:\s+\2)(?=\s|$)/gi,"$1$2")
    .replace(/\b(?:eh|em|mmm|uh)\b(?:\s+\b(?:eh|em|mmm|uh)\b)*/gi," ")
    .replace(/\s+([,.;!?])/g,"$1")
    .trim();
}

function mergeRecognitionChunks(previous,next){
  const left=cleanRecognitionTranscript(previous);
  const right=cleanRecognitionTranscript(next);
  if(!left)return right;
  if(!right)return left;
  const leftNorm=normalizeText(left),rightNorm=normalizeText(right);
  if(leftNorm===rightNorm||leftNorm.endsWith(" "+rightNorm))return left;
  if(rightNorm.startsWith(leftNorm+" "))return right;
  const leftRaw=left.split(/\s+/),rightRaw=right.split(/\s+/);
  const leftWords=leftNorm.split(" "),rightWords=rightNorm.split(" ");
  let overlap=0;
  for(let size=Math.min(7,leftWords.length,rightWords.length);size>0;size--){
    if(leftWords.slice(-size).join(" ")===rightWords.slice(0,size).join(" ")){overlap=size;break;}
  }
  return cleanRecognitionTranscript(leftRaw.concat(rightRaw.slice(overlap)).join(" "));
}

function flushRecognitionChunks(){
  clearTimeout(recognitionCommitTimer);
  recognitionCommitTimer=null;
  const text=pendingRecognitionText;
  const meta=pendingRecognitionMeta;
  pendingRecognitionText="";
  pendingRecognitionMeta=null;
  if(text){
    updateDetectedLanguage(text);
    processSpeechResult(text,meta);
  }
}

function queueRecognitionChunk(text,meta=null){
  const clean=cleanRecognitionTranscript(text);
  if(!clean)return;
  pendingRecognitionText=mergeRecognitionChunks(pendingRecognitionText,clean);
  pendingRecognitionMeta=pendingRecognitionMeta||meta;
  $("#transcript").textContent=pendingRecognitionText+" …";
  clearTimeout(recognitionCommitTimer);
  recognitionCommitTimer=setTimeout(flushRecognitionChunks,isMobileSpeech()?520:360);
}

function processSpeechResult(text,speechMeta=null){
  text=cleanRecognitionTranscript(text);
  if(!text)return;
  $("#transcript").textContent=text;
  state.lastHeardAt=Date.now();
  state.lastTranscriptAt=Date.now();
  const print=speechMeta?.startedAt
    ?voicePrintForWindow(speechMeta.startedAt,speechMeta.endedAt)
    :recentVoicePrint();
  const voiceMatch=recognizeVoicePerson(print,state.currentPerson);
  state.currentVoicePerson=voiceMatch?.name||null;
  autoRemember(text);
  // During a class, classroom speech is material to learn — never a command for Robotito.
  if(state.classMode){
    void captureClassLine(text);
    return;
  }
  if(state.currentPerson) learnSpeaker("me",averageRecentVoiceFeature());
  handleSpeech(text);
}

function recognitionLanguage(){
  return languageLocale(responseLanguage());
}
function updateDetectedLanguage(){
  state.lastDetectedLanguage=responseLanguage();
  return state.lastDetectedLanguage;
}

function speechAlternativeScore(alternative){
  const raw=String(alternative?.transcript||"").trim();
  if(!raw)return -Infinity;
  const normalized=normalizeText(raw);
  const tokens=normalized.split(" ").filter(Boolean);
  let score=(Number(alternative?.confidence)||0)*4;
  score+=Math.min(tokens.length,10)*.025;
  if(state.languageMode==="es"&&normalizeSpanishSpeechIntent(raw)!==normalized)score+=.16;
  if(/\b(robotito|clase|profesor|profesora|fisica|matematica|quimica|biologia|ejercicio|materia|tema|hambre|hora|fecha|dedos|objeto|presidente|recordas|acordas|densidad|masa|volumen|permutacion|energia|impulso)\b/.test(normalized))score+=.24;
  if(/\b(que|como|cual|quien|cuando|donde|por que|cuanto|explica|define|decime|dime)\b/.test(normalized))score+=.18;
  if(window.ROBOTITO_EMOTION_DIALOGUE?.classify?.(raw))score+=.28;
  if(tokens.length>=3&&new Set(tokens).size===1)score-=.8;
  if(/^(?:eh|em|mmm|ah)+$/.test(normalized))score-=.5;
  return score;
}
function chooseSpeechAlternative(result){
  return [...result]
    .map(alternative=>({alternative,score:speechAlternativeScore(alternative)}))
    .sort((a,b)=>b.score-a.score)[0]?.alternative||result[0];
}

function createSpeechRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return null;
  const r=new SR();
  r.lang=recognitionLanguage();
  // Android Chrome supports continuous mode reasonably well; iOS is kept
  // in short sessions but is restarted automatically.
  r.continuous=!isIOSSpeech();
  r.interimResults=true;
  r.maxAlternatives=5;

  r.onstart=()=>{
    state.lastSpeechStartAt=Date.now();
    state.speechRetryCount=0;
    setListenState(state.languageMode==="en"?"listening":"escuchando","listening");
    
  };

  r.onspeechstart=()=>setListenState(state.languageMode==="en"?"I hear you":"te escucho","listening");
  r.onspeechend=()=>{if(isMobileSpeech())setListenState(state.languageMode==="en"?"listening":"escuchando","listening");};

  r.onresult=ev=>{
    let finalText="";
    let interim="";
    for(let i=ev.resultIndex;i<ev.results.length;i++){
      const result=ev.results[i];
      const best=chooseSpeechAlternative(result);
      const text=(best?.transcript||"").trim();
      if(result.isFinal)finalText+=(finalText?" ":"")+text;
      else interim+=(interim?" ":"")+text;
    }
    if(interim)$("#transcript").textContent=interim+" …";
    if(finalText){ r._hadFinal=true; queueRecognitionChunk(finalText); }
  };

  r.onerror=e=>{
    console.warn("speech",e.error);
    if(e.error==="not-allowed"||e.error==="service-not-allowed"){
      state.speechBlocked=true;
      setListenState(state.languageMode==="en"?"microphone blocked":"micrófono bloqueado","problem");
      
      
      $("#transcript").textContent=state.languageMode==="en"
        ?"Microphone permission is blocked. Enable microphone permission for this site and retry."
        :"El permiso del micrófono está bloqueado. Habilitá el micrófono para este sitio y reintentá.";
      return;
    }
    if(e.error==="audio-capture"){
      state.speechRetryCount++;
      setListenState(state.languageMode==="en"?"recovering microphone":"recuperando micrófono","problem");
      return;
    }
    if(e.error!=="aborted"&&e.error!=="no-speech"){
      state.speechRetryCount++;
      setListenState(state.languageMode==="en"?"recovering…":"recuperando…","problem");
    }
  };

  r.onend=()=>{
    if(state.recognition===r)state.recognition=null;
    if(!state.started||state.speechBlocked||state.speaking||!state.recognitionWanted)return;
    state.speechRetryCount=Math.min(8,state.speechRetryCount+1);
    setListenState(state.languageMode==="en"?"reconnecting…":"reconectando…");
    clearTimeout(state.speechRestartTimer);
    const delay=Math.min(2200,220+state.speechRetryCount*180);
    state.speechRestartTimer=setTimeout(()=>startListeningCycle(false),delay);
  };
  return r;
}

function startListeningCycle(userGesture=false){
  if(!state.started||state.speaking||!state.recognitionWanted)return;
  discardRecognition();
  const r=createSpeechRecognition();
  if(!r){
    setListenState("no compatible","problem");
    $("#transcript").textContent="Este navegador no ofrece reconocimiento de voz. En iPhone probá Safari; en Android probá Chrome.";
    return;
  }
  state.recognition=r;
  try{
    setListenState(state.languageMode==="en"?"starting…":"iniciando…");
    r.start();
  }catch(e){
    console.warn("speech start",e);
    state.recognition=null;
    state.speechRetryCount++;
    setListenState(state.languageMode==="en"?"recovering…":"recuperando…","problem");
    if(state.started&&!state.speechBlocked&&state.recognitionWanted){
      clearTimeout(state.speechRestartTimer);
      // Keep recovering instead of silently giving up after four failures.
      const delay=document.hidden?2200:Math.min(5000,650+state.speechRetryCount*420);
      state.speechRestartTimer=setTimeout(()=>startListeningCycle(false),delay);
    }
  }
}

function setupSpeechRecognition(userGesture=false){
  state.recognitionWanted=true;
  state.speechBlocked=false;
  if(isMobileSpeech()){
    
    $("#mobileSpeechHint")?.classList.remove("hidden");
  }
  startListeningCycle(userGesture);
}

function autoRemember(text){
  const clean=text.trim();
  if(clean.length<2)return;
  const person=state.currentVoicePerson||state.currentPerson||"persona no reconocida";
  const last=state.memories[state.memories.length-1];
  if(last && last.text.toLowerCase()===clean.toLowerCase() && Date.now()-last.at<15000)return;
  state.memories.push({person,text:clean,at:Date.now(),source:"auto"});
  save(KEYS.memories,state.memories);
  renderMemories();
}

const INTENT_ALIASES=[
  ["nombre","llamas","llamo","llama","llamar","name"],
  ["tu","te","tuyo","your","you"],
  ["mi","me","mio","mía","my","i"],
  ["sentir","sentis","sientes","sentís","animo","ánimo","humor","mood","feel"],
  ["hambre","hambriento","comer","comida","hungry","eat"],
  ["sueno","sueño","cansado","cansancio","dormido","dormir","sleepy","tired","sleep"],
  ["ver","ves","viendo","miras","mirando","veo","see","seeing"],
  ["escuchar","escuchas","ois","oís","oyes","oyendo","hear","hearing","listen"],
  ["hablar","habla","hablando","voz","voice","speaking","talking"],
  ["recordar","recordas","recordás","recuerdas","acordas","acordás","acuerdas","remember"],
  ["tarea","tareas","pendiente","pendientes","deberes","homework","task","tasks"],
  ["ayudar","ayuda","servir","servis","sirves","funcion","funciones","hacer","abilities","help"],
  ["hora","time"],
  ["fecha","date"],
  ["dedo","dedos","finger","fingers"],
  ["mano","manos","hand","hands"],
  ["persona","personas","gente","people","person"],
  ["noche","night","nighttime"],
  ["dia","día","day","daytime"]
];
const INTENT_ALIAS_MAP=new Map();
INTENT_ALIASES.forEach((group,i)=>group.forEach(w=>INTENT_ALIAS_MAP.set(normalizeText(w),"i"+i)));
const INTENT_FILLERS=new Set([
  "que","cual","cuales","como","por","para","de","del","el","la","los","las","un","una","es","son",
  "che","oye","ey","robotito","osito","porfavor","favor","please","what","which","how","is","are","the","a","an","of",
  "can","could","would","tell"
]);
function canonicalIntentWord(word){
  let w=normalizeText(word);
  if(!w)return "";
  if(INTENT_ALIAS_MAP.has(w))return INTENT_ALIAS_MAP.get(w);
  if(w.length>6)w=w.replace(/(?:mente|ciones|cion|ando|iendo|ados|adas|idos|idas)$/,"");
  if(w.length>4)w=w.replace(/(?:es|os|as)$/,"");
  return INTENT_ALIAS_MAP.get(w)||w;
}
function canonicalIntentText(text){
  return normalizeText(text)
    .replace(/\b(?:me podes decir|me puedes decir|podrias decirme|podrías decirme|me dirias|me dirías|quiero saber|quisiera saber|me gustaria saber|me gustaría saber|decime por favor|dime por favor)\b/g," ")
    .replace(/\b(?:shamas|yamas|chamas|jamas)\b/g,"llamas")
    .replace(/\b(?:ase|hase)\b/g,"hace")
    .replace(/\s+/g," ").trim();
}
function intentTokens(text){
  return canonicalIntentText(text).split(/\s+/)
    .filter(Boolean)
    .filter(w=>!INTENT_FILLERS.has(w))
    .map(canonicalIntentWord)
    .filter(Boolean);
}
function oneEditApart(a,b){
  if(a===b)return true;
  if(a.length<5||b.length<5||Math.abs(a.length-b.length)>1)return false;
  let i=0,j=0,diff=0;
  while(i<a.length&&j<b.length){
    if(a[i]===b[j]){i++;j++;continue;}
    if(++diff>1)return false;
    if(a.length>b.length)i++;
    else if(b.length>a.length)j++;
    else{i++;j++;}
  }
  return diff+(i<a.length||j<b.length?1:0)<=1;
}
function intentPhraseScore(text,phrase){
  const q=intentTokens(text),p=intentTokens(phrase);
  if(!p.length||!q.length)return 0;
  const used=new Set();
  let hits=0;
  for(const pw of p){
    let found=-1;
    for(let i=0;i<q.length;i++){
      if(used.has(i))continue;
      if(q[i]===pw||oneEditApart(q[i],pw)){found=i;break;}
    }
    if(found>=0){used.add(found);hits++;}
  }
  const coverage=hits/p.length;
  const precision=hits/Math.max(q.length,p.length);
  return coverage*.8+precision*.2;
}
function phraseOrTokenMatch(text,term){
  const t=canonicalIntentText(text),q=canonicalIntentText(term);
  if(!q)return false;
  if(t.includes(q))return true;
  const tokens=intentTokens(term);
  if(tokens.length===1){
    const queryTokens=intentTokens(text);
    return queryTokens.some(x=>x===tokens[0]||oneEditApart(x,tokens[0]));
  }
  return intentPhraseScore(text,term)>=.78;
}
function textHasAny(text,terms){
  return terms.some(t=>phraseOrTokenMatch(text,t));
}
function textHasAllGroups(text,groups){
  return groups.every(group=>group.some(t=>phraseOrTokenMatch(text,t)));
}
function intentMatches(text,phrases=[],groups=[]){
  const canonical=canonicalIntentText(text);
  if(phrases.some(p=>canonical.includes(canonicalIntentText(p))))return true;

  let best=0;
  for(const p of phrases)best=Math.max(best,intentPhraseScore(text,p));
  const groupMatch=groups.length?textHasAllGroups(text,groups):false;

  if(groupMatch)return true;
  if(best>=.84)return true;
  if(best>=.72&&phrases.some(p=>intentTokens(p).length>=3))return true;
  return false;
}
function moodAnswer(){
  if(state.sleeping)return "Estoy dormido… o casi.";
  if(state.hunger>=95)return "Estoy bastante enojado porque tengo muchísima hambre.";
  const labels={happy:"contento",sad:"triste",angry:"enojado",scared:"asustado",hungry:"hambriento",sleepy:"con sueño",curious:"curioso",focused:"concentrado",bored:"aburrido",affectionate:"cariñoso",proud:"orgulloso",confused:"confundido",excited:"emocionado",embarrassed:"avergonzado",annoyed:"molesto",calm:"tranquilo"};
  return "Ahora estoy "+(labels[state.emotion]||"tranquilo")+".";
}
function capabilitiesAnswer(){
  return "Puedo reconocerte por cara y voz, recordar cosas, escuchar clases, resumirlas, ayudarte a estudiar, contar dedos, reconocer algunos objetos, recomendar libros, mirar tus tareas y resolver o dibujar algunos ejercicios de circunferencias.";
}

function avatarById(id){
  return ROBOTITO_AVATARS.find(item=>item.id===id) || ROBOTITO_AVATARS[0];
}
function avatarLanguage(){
  return ["es","en","pt"].includes(state.languageMode)?state.languageMode:"es";
}
function avatarName(avatar,lang=avatarLanguage()){
  return avatar?.[lang] || avatar?.es || "Panda";
}
const AVATAR_ICON_SVGS={
  "red-panda":'<svg class="avatar-illustration custom-avatar-emoji emoji-red-panda" viewBox="0 0 72 72" aria-hidden="true"><defs><linearGradient id="rp3Fur" x1="20" y1="11" x2="52" y2="62"><stop stop-color="#f8954f"/><stop offset="1" stop-color="#d6543b"/></linearGradient><filter id="rp3Soft" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#8f473d" flood-opacity=".2"/></filter></defs><g filter="url(#rp3Soft)"><path d="M17 25 13.5 10c-.4-1.8 1.6-3.1 3.1-2l12.8 9.3M55 25l3.5-15c.4-1.8-1.6-3.1-3.1-2l-12.8 9.3" fill="#8d493f"/><path d="m18 16-1.2-4.4 6.8 5.2m30.4-.8 1.2-4.4-6.8 5.2" fill="none" stroke="#f8b08d" stroke-width="4" stroke-linecap="round"/><path d="M10.5 36C10.5 19.4 20.8 10 36 10s25.5 9.4 25.5 26c0 17-10.8 27.5-25.5 27.5S10.5 53 10.5 36Z" fill="url(#rp3Fur)"/><path d="M13.7 33.3c1.7-7.8 6.6-13.1 13.8-15.2l6.1 8.1-8.9 19.2c-6.4-.8-10.7-5.6-11-12.1Zm44.6 0c-1.7-7.8-6.6-13.1-13.8-15.2l-6.1 8.1 8.9 19.2c6.4-.8 10.7-5.6 11-12.1Z" fill="#fff0d8"/><ellipse cx="26.5" cy="33.5" rx="8.1" ry="8.8" fill="#704039"/><ellipse cx="45.5" cy="33.5" rx="8.1" ry="8.8" fill="#704039"/><ellipse cx="27" cy="34" rx="3.1" ry="3.8" fill="#282126"/><ellipse cx="45" cy="34" rx="3.1" ry="3.8" fill="#282126"/><circle cx="25.9" cy="32.7" r="1.2" fill="#fff"/><circle cx="43.9" cy="32.7" r="1.2" fill="#fff"/><path d="M23.8 44.3c3-4.3 7.3-6.4 12.2-6.4s9.2 2.1 12.2 6.4c-.7 10.8-5.3 16.6-12.2 16.6s-11.5-5.8-12.2-16.6Z" fill="#fff7e8"/><path d="M31.4 45.4c2.5-1.9 6.7-1.9 9.2 0-.5 3.4-2.1 5-4.6 5s-4.1-1.6-4.6-5Z" fill="#49302f"/><path d="M29.2 52.3c1.8 3 4 4.3 6.8 4.3s5-1.3 6.8-4.3" fill="none" stroke="#9b4b43" stroke-width="2.3" stroke-linecap="round"/><ellipse cx="24" cy="17.2" rx="7.4" ry="2.8" fill="#fff" opacity=".18" transform="rotate(-24 24 17.2)"/></g></svg>',
  chameleon:'<svg class="avatar-illustration custom-avatar-emoji emoji-chameleon" viewBox="0 0 72 72" aria-hidden="true"><defs><linearGradient id="ch3Body" x1="15" y1="18" x2="58" y2="56"><stop stop-color="#9ee86a"/><stop offset=".55" stop-color="#55c997"/><stop offset="1" stop-color="#58a9bd"/></linearGradient><filter id="ch3Soft" x="-15%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#397c72" flood-opacity=".18"/></filter></defs><g filter="url(#ch3Soft)" stroke-linecap="round" stroke-linejoin="round"><path d="M25 49c-6.5 7.1-16.2 7.7-19.7 2.3-3.1-4.8 1.3-10.8 6.2-8.7 4.1 1.8 3.3 6.8-.8 6.8-2 0-3-1.4-2.6-2.8" fill="none" stroke="#4aa58b" stroke-width="5"/><path d="M14 39.5C14 25 24.2 16 39.2 16c13.8 0 22.8 8.1 22.8 20.1 0 11.4-9.6 17.1-24.3 17.1C23 53.2 14 48.4 14 39.5Z" fill="url(#ch3Body)" stroke="#3d9b7d" stroke-width="1.4"/><path d="M24.5 21.5c2.6 7.5 3 18.3 1 28m12-33c2.6 9 2.7 24.3.4 36m12.2-33c1.5 8.2.7 19-2.3 31" fill="none" stroke="#f5d967" stroke-width="3" opacity=".75"/><path d="M53 30.5c5 .7 9 3.6 12.2 7.3-3.1 3.5-7.2 5.2-12 4.7" fill="#59bca5" stroke="#3b927d" stroke-width="1.4"/><circle cx="49.5" cy="27.8" r="7.5" fill="#e8f4a2" stroke="#3d987c" stroke-width="1.4"/><circle cx="51.3" cy="28.1" r="2.8" fill="#34463d"/><circle cx="50.4" cy="27.1" r="1" fill="#fff"/><circle cx="63.3" cy="38.1" r="1" fill="#397269"/><path d="M56.2 43.1c2.3 1.1 4.4.9 6.1-.5" fill="none" stroke="#397269" stroke-width="1.6"/><circle cx="49" cy="42.8" r="2.4" fill="#f5a6a8" opacity=".55"/><path d="M29 49.5 25 60m15-7.5L39 61m-15.5-.3 5.4.3m8.2 0h5.4" fill="none" stroke="#3f8976" stroke-width="2.8"/><ellipse cx="36" cy="21" rx="8" ry="2.8" fill="#fff" opacity=".18" transform="rotate(-18 36 21)"/></g></svg>',
  armadillo:'<svg class="avatar-illustration custom-avatar-emoji emoji-armadillo" viewBox="0 0 72 72" aria-hidden="true"><defs><linearGradient id="ar3Shell" x1="12" y1="20" x2="54" y2="57"><stop stop-color="#efc69f"/><stop offset=".58" stop-color="#cf9274"/><stop offset="1" stop-color="#a56d60"/></linearGradient><filter id="ar3Soft" x="-15%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#765148" flood-opacity=".18"/></filter></defs><g filter="url(#ar3Soft)" stroke-linecap="round" stroke-linejoin="round"><path d="M8 45c0-17 11.7-28.5 29.2-28.5 14 0 23.3 8.1 23.3 21.1C60.5 51.3 50.1 58 34.2 58 17.6 58 8 53.3 8 45Z" fill="url(#ar3Shell)" stroke="#956457" stroke-width="1.4"/><path d="M19 20.5c-3 10.7-1.7 25.9 4.1 35m6-37.5c-2 12.3-.4 28 5.1 39.2m5.8-40.4c1.8 12.7 2.7 26.9.7 40.2m8.7-35.7c2.7 9.5 3.1 19.2.8 29.2" fill="none" stroke="#f8dec8" stroke-width="3.1" opacity=".9"/><path d="M49.5 29.5c6.2-4.6 14.3-1.9 16.7 4.9 2.2 6.2-2.4 12.1-11.3 12.5l-5.4-17.4Z" fill="#dda47e" stroke="#98675a" stroke-width="1.4"/><path d="m53.4 28.9 5-10.7c.6-1.3 2.4-.9 2.5.5l.8 10.7" fill="#cc8b70" stroke="#98675a" stroke-width="1.4"/><circle cx="58.5" cy="34.1" r="2.4" fill="#4a3532"/><circle cx="57.8" cy="33.3" r=".8" fill="#fff"/><ellipse cx="66.4" cy="40.3" rx="2.5" ry="2" fill="#5a3c38"/><path d="M59.5 43.2c1.7 1.1 3.4.9 4.8-.3" fill="none" stroke="#8a574f" stroke-width="1.4"/><circle cx="57" cy="41.4" r="2" fill="#efa2a0" opacity=".45" stroke="none"/><path d="M9.5 42.5 3 47.4l7.7-.4" fill="#bd8069" stroke="#956457" stroke-width="1.7"/><path d="M23.5 55.5 22.4 62m20.4-6.5.9 6.5m-23.8.3h5.5m15.9 0h5.5" fill="none" stroke="#8c5d52" stroke-width="2.8"/><ellipse cx="24" cy="22" rx="7.5" ry="2.7" fill="#fff" opacity=".16" stroke="none" transform="rotate(-22 24 22)"/></g></svg>'
};
Object.assign(AVATAR_ICON_SVGS,{
  chameleon:'<svg class="avatar-illustration custom-avatar-emoji emoji-chameleon" viewBox="0 0 72 72" aria-hidden="true"><defs><linearGradient id="ch4Body" x1="14" y1="14" x2="61" y2="58"><stop stop-color="#b8ed57"/><stop offset=".48" stop-color="#62d88b"/><stop offset="1" stop-color="#44bfc2"/></linearGradient><filter id="ch4Soft" x="-20%" y="-20%" width="150%" height="155%"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#318b79" flood-opacity=".22"/></filter></defs><g filter="url(#ch4Soft)" stroke-linecap="round" stroke-linejoin="round"><path d="M25 49c-7 8-17.5 7.6-20.2 1.2-2-4.8 2.5-9.8 7.1-7.1 4.4 2.6 1.9 7.8-2.3 6.2" fill="none" stroke="#48b783" stroke-width="5.2"/><path d="M13.5 39c0-14.8 10.4-23.8 25.8-23.8 14.2 0 23.2 8.3 23.2 20.7 0 11.7-10.1 18.2-25.2 18.2C22.4 54.1 13.5 48.6 13.5 39Z" fill="url(#ch4Body)" stroke="#318f75" stroke-width="1.5"/><path d="M22 22c3.8 8.5 4.4 19 2.6 28.2m11.8-34.8c3 10 3.1 25.4.4 38.4m12.5-34.9c2 8.5 1.4 19.8-1.8 32.6" fill="none" stroke="#ffe06a" stroke-width="3.2" opacity=".85"/><path d="M53.2 31.2c5.3.3 9.7 2.8 13.2 6.6-3.2 4-7.6 6.3-12.9 6" fill="#58cba3" stroke="#318f75" stroke-width="1.5"/><circle cx="48.7" cy="27.4" r="8.5" fill="#f1f7a9" stroke="#318f75" stroke-width="1.5"/><circle cx="51.2" cy="27.8" r="3.4" fill="#263e39"/><circle cx="50.1" cy="26.6" r="1.2" fill="#fff"/><circle cx="64.2" cy="38" r="1.15" fill="#315f57"/><path d="M56.6 43.6c2.6 1.7 5.4 1.5 7.5-.5" fill="none" stroke="#315f57" stroke-width="1.6"/><circle cx="51.1" cy="44.5" r="2.4" fill="#f69c9f" opacity=".55" stroke="none"/><path d="M29.5 51.5 26.2 61m15-7.9-.4 8.3m-17-.2 5.2.2m9.1.1h5.4" fill="none" stroke="#307f6d" stroke-width="2.7"/><path d="m31 18 4-5 3.5 4.2" fill="#8be074" stroke="#318f75" stroke-width="1.2"/><ellipse cx="35" cy="20" rx="8" ry="2.7" fill="#fff" opacity=".2" stroke="none" transform="rotate(-18 35 20)"/></g></svg>',
  armadillo:'<svg class="avatar-illustration custom-avatar-emoji emoji-armadillo" viewBox="0 0 72 72" aria-hidden="true"><defs><linearGradient id="ar4Shell" x1="10" y1="17" x2="55" y2="59"><stop stop-color="#f1c69b"/><stop offset=".55" stop-color="#cf9574"/><stop offset="1" stop-color="#a96e5d"/></linearGradient><filter id="ar4Soft" x="-18%" y="-22%" width="150%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#775047" flood-opacity=".2"/></filter></defs><g filter="url(#ar4Soft)" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 44.5c0-17.7 12-29.6 29.7-29.6 14.1 0 23.5 8.8 23.5 22.3 0 14.1-10.8 21.2-26.5 21.2-16.6 0-26.7-5-26.7-13.9Z" fill="url(#ar4Shell)" stroke="#8f5d51" stroke-width="1.5"/><path d="M18.6 20c-3.6 10.7-2.2 26.2 4.2 36.2m6-39.7c-2.6 12.1-.8 28.7 5.5 41.3m5.5-42.5c2 12.9 2.8 28.3.6 42.3m9-37.2c3.2 9.8 3.4 20.2.6 31" fill="none" stroke="#f8ddc3" stroke-width="3.4" opacity=".95"/><path d="M50.2 29.1c6.4-4.7 14.4-1.7 16.7 5.2 2.1 6.5-2.7 12.5-11.8 12.8l-4.9-18Z" fill="#dfa27d" stroke="#925e52" stroke-width="1.5"/><path d="m53.9 28.7 4.8-10.4c.7-1.5 2.8-1 2.8.6l.2 10.2" fill="#c9866d" stroke="#925e52" stroke-width="1.5"/><ellipse cx="59.1" cy="34.3" rx="2.55" ry="2.8" fill="#3c2d2c"/><circle cx="58.3" cy="33.4" r=".9" fill="#fff"/><ellipse cx="67" cy="40.1" rx="2.7" ry="2.1" fill="#513735"/><path d="M59.2 43.1c2 1.6 4.1 1.4 5.7-.3" fill="none" stroke="#815049" stroke-width="1.5"/><circle cx="56.8" cy="41.5" r="2.2" fill="#f09d98" opacity=".5" stroke="none"/><path d="M9 41.5 2.8 47l7.9-.8" fill="#b97865" stroke="#8f5d51" stroke-width="1.8"/><path d="M23.6 56.2 22.5 62m20.6-5.8.9 5.8m-24.1.4h5.6m15.9 0H47" fill="none" stroke="#82564e" stroke-width="2.9"/><path d="M13.7 37.4c11 3.1 25.7 3.5 38.5.3" fill="none" stroke="#a96e5d" stroke-width="1.2" opacity=".55"/><ellipse cx="25" cy="20" rx="7.8" ry="2.8" fill="#fff" opacity=".19" stroke="none" transform="rotate(-22 25 20)"/></g></svg>',
  panther:'<svg class="avatar-illustration custom-avatar-emoji emoji-panther" viewBox="0 0 72 72" aria-hidden="true"><defs><linearGradient id="pa4Fur" x1="18" y1="10" x2="53" y2="62"><stop stop-color="#4b4654"/><stop offset=".52" stop-color="#272532"/><stop offset="1" stop-color="#171620"/></linearGradient><filter id="pa4Soft" x="-18%" y="-22%" width="150%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="1.7" flood-color="#111019" flood-opacity=".28"/></filter></defs><g filter="url(#pa4Soft)" stroke-linecap="round" stroke-linejoin="round"><path d="m17.5 27-4-15.5 16 7.8m25 7.7 4-15.5-16 7.8" fill="#23212b" stroke="#14131a" stroke-width="1.8"/><path d="m17 15.2 8.1 5.3-6.7 4.8m36.6-10.1-8.1 5.3 6.7 4.8" fill="#716271" stroke="#14131a" stroke-width="1.2"/><path d="M11.5 37.2C11.5 22.3 21.4 13.6 36 13.6s24.5 8.7 24.5 23.6C60.5 53.3 50 62 36 62s-24.5-8.7-24.5-24.8Z" fill="url(#pa4Fur)" stroke="#121118" stroke-width="1.8"/><path d="M18.2 29.5c5.1-4 10.1-4.1 14.1-.5m21.5.5c-5.1-4-10.1-4.1-14.1-.5" fill="none" stroke="#111017" stroke-width="2.8"/><path d="M18.5 33.2c3.5-3.7 9-3.8 12.6-.2-3.4 5.2-9.4 5.2-12.6.2Zm35 0c-3.5-3.7-9-3.8-12.6-.2 3.4 5.2 9.4 5.2 12.6.2Z" fill="#d8ed63" stroke="#0e0d13" stroke-width="1.2"/><path d="M25 31.2v4.2m22-4.2v4.2" stroke="#121118" stroke-width="2"/><circle cx="23.4" cy="32.1" r=".8" fill="#fff"/><circle cx="45.4" cy="32.1" r=".8" fill="#fff"/><path d="M23.4 46c2.1-7 7-10.2 12.6-10.2S46.5 39 48.6 46c1.4 5-4.7 10.2-12.6 10.2S22 51 23.4 46Z" fill="#4f4651"/><path d="m31.1 42.1 4.9-2.6 4.9 2.6-4.9 4.2Z" fill="#17151b"/><path d="M36 46.2c-3.1 0-5.4 1.6-6.8 4m6.8-4c3.1 0 5.4 1.6 6.8 4" fill="none" stroke="#a79ba8" stroke-width="1.6"/><path d="M19.5 43.2 8 41.1m11.8 5.6-11.1 1.5m43.8-5 11.5-2.1m-11.8 5.6 11.1 1.5" fill="none" stroke="#918794" stroke-width="1.3" opacity=".8"/><circle cx="18.5" cy="42" r="1.1" fill="#9e929f"/><circle cx="53.5" cy="42" r="1.1" fill="#9e929f"/><ellipse cx="29" cy="17.8" rx="8" ry="2.7" fill="#fff" opacity=".12" stroke="none" transform="rotate(-15 29 17.8)"/></g></svg>'
});
function avatarVisualMarkup(avatar,extraClass=""){
  const surfaceClass=String(extraClass||"");
  const choiceSurface=/\bavatar-(?:choice|startup)-svg\b/.test(surfaceClass);
  const customEmoji=AVATAR_ICON_SVGS[avatar?.id];

  // En el selector inicial usamos el emoji nativo. Cuando Unicode no ofrece
  // ese animal, usamos un icono propio con la misma escala y aspecto amable.
  if(choiceSurface){
    if(customEmoji){
      const safeClass=surfaceClass.replace(/[^a-z0-9_-]/gi,"");
      return customEmoji.replace('class="avatar-illustration custom-avatar-emoji',`class="avatar-illustration custom-avatar-emoji ${safeClass}`);
    }
    return `<span class="avatar-emoji-glyph ${escapeHtml(surfaceClass)}">${avatar?.emoji||"🐼"}</span>`;
  }

  const detailedSurface=/avatar-main-svg/.test(surfaceClass);
  // El panda mantiene su diseño original. Los demás conservan sus
  // ilustraciones detalladas y animadas dentro de la escena.
  if(avatar?.id!=="panda"&&detailedSurface){
    const detailed=window.ROBOTITO_AVATAR_ART?.render?.(avatar,extraClass);
    if(detailed)return detailed;
  }
  if(customEmoji){
    const safeClass=surfaceClass.replace(/[^a-z0-9_-]/gi,"");
    return customEmoji.replace('class="avatar-illustration custom-avatar-emoji',`class="avatar-illustration custom-avatar-emoji ${safeClass}`);
  }
  return `<span class="avatar-emoji-glyph ${escapeHtml(surfaceClass)}">${avatar?.emoji||"🐼"}</span>`;
}
function setAvatarVisual(element,avatar,extraClass=""){
  if(element)element.innerHTML=avatarVisualMarkup(avatar,extraClass);
}

function speciesProfile(id=state.avatar){
  return window.ROBOTITO_SPECIES?.profile?.(id) || {
    trait:"tiene una personalidad muy curiosa",
    motion:"bounce",
    lines:{
      pet:"Me gustan los mimos.",
      feed:"¡Gracias por darme de comer!",
      play:"¡Vamos a jugar!",
      idle:"Estoy mirando alrededor.",
      surprise:"¡Qué susto!",
      poke:"Eso no era una caricia.",
      social:"Este abrazo estuvo muy lindo."
    }
  };
}
function speciesLine(action,id=state.avatar){
  return window.ROBOTITO_SPECIES?.line?.(id,action)
    || speciesProfile(id).lines?.[action]
    || speciesProfile(id).lines?.idle
    || "Estoy acá contigo.";
}
function speciesAct(action="play",ms=1700){
  if(!robot)return;
  const profile=speciesProfile();
  const motion=profile.motion||"bounce";
  [...robot.classList].filter(name=>name.startsWith("species-motion-")).forEach(name=>robot.classList.remove(name));
  robot.classList.remove("species-reacting");
  void robot.offsetWidth;
  robot.classList.add("species-reacting","species-motion-"+motion);
  robot.dataset.speciesAction=action;
  setTimeout(()=>{
    robot.classList.remove("species-reacting","species-motion-"+motion);
    delete robot.dataset.speciesAction;
  },ms);
}
function speciesIntroduction(id=state.avatar){
  const avatar=avatarById(id);
  const profile=speciesProfile(id);
  return `Soy ${avatarName(avatar,"es")}. ${profile.trait.charAt(0).toUpperCase()+profile.trait.slice(1)}.`;
}
function handleSpeciesQuestion(rawText){
  const text=normalizeText(rawText);
  if(/\b(que|cual|what|which|qual)\s+(animal|especie|bicho)\b/.test(text)
    ||/\b(que animal sos|que animal eres|what are you|qual animal voce e)\b/.test(text)){
    say(speciesIntroduction(),4200);
    speciesAct("introduce",1300);
    return true;
  }
  if(/\b(que comes|que te gusta comer|cual es tu comida|what do you eat|what food|o que voce come)\b/.test(text)){
    say(speciesLine("feed"),4200);
    speciesAct("feed",1300);
    return true;
  }
  if(/\b(que tiene de especial|que te hace especial|caracteristica de tu especie|contame de tu especie|tell me about your species|fale da sua especie|por que cambias de color)\b/.test(text)){
    say(speciesIntroduction()+" "+speciesLine("idle"),5600);
    speciesAct("introduce",1800);
    return true;
  }
  return false;
}
function maybeSpeciesIdleComment(quietFor){
  if(!state.started||quietFor<60||state.classMode||state.sleeping||state.nightSleep)return;
  if(state.speaking||Date.now()<state.silentUntil)return;
  if(Date.now()-state.lastSpeciesCommentAt<90000)return;
  state.lastSpeciesCommentAt=Date.now();
  const line=speciesLine("idle");
  speciesAct("idle",1600);
  say(line,4200);
}

function updateAvatarAria(){
  if(!robot)return;
  const avatar=avatarById(state.avatar);
  const lang=avatarLanguage();
  const name=avatarName(avatar,lang);
  robot.setAttribute("aria-label",lang==="en"
    ?`Robotito, virtual ${name} avatar`
    :lang==="pt"?`Robotito, avatar virtual de ${name}`:`Robotito, avatar virtual de ${name}`);
  setAvatarVisual($("#avatarBrandIcon"),avatar,"avatar-brand-svg");
  if($("#avatarBrandEyebrow"))$("#avatarBrandEyebrow").textContent=lang==="en"
    ?"YOUR VIRTUAL COMPANION":lang==="pt"?"SEU COMPANHEIRO VIRTUAL":"TU COMPAÑERO VIRTUAL";
}
function updateAvatarMoodIcon(mood=state.mood){
  const icons={
    calm:"✨",happy:"💖",sad:"💧",angry:"💢",scared:"😨",hungry:"🍓",sleepy:"💤",
    curious:"❔",focused:"📚",bored:"☁️",affectionate:"💕",proud:"⭐",confused:"🌀",
    excited:"🎉",embarrassed:"🌸",annoyed:"💭"
  };
  const badge=$("#animalAvatarMood");
  if(badge)badge.textContent=icons[mood] || "✨";
}
function applyAvatar(id,{persist=true}={}){
  const avatar=avatarById(id);
  state.avatar=avatar.id;
  if(persist)localStorage.setItem(KEYS.avatar,avatar.id);
  if(robot){
    for(const item of ROBOTITO_AVATARS)robot.classList.remove("avatar-"+item.id);
    robot.classList.add("avatar-"+avatar.id);
    robot.classList.toggle("avatar-custom",avatar.id!=="panda");
    robot.dataset.avatar=avatar.id;
    robot.dataset.speciesMotion=speciesProfile(avatar.id).motion||"bounce";
  }
  setAvatarVisual($("#animalAvatarEmoji"),avatar,"avatar-main-svg");
  if($("#animalAvatarName"))$("#animalAvatarName").textContent=avatarName(avatar);
  setAvatarVisual($("#startupMascot"),avatar,"avatar-startup-svg");
  document.title="Robotito "+avatar.emoji;
  updateAvatarAria();
  updateAvatarMoodIcon();
  return avatar;
}
function renderAvatarChoices(){
  const container=$("#avatarChoices");
  if(!container)return;
  const lang=avatarLanguage();
  container.setAttribute("aria-label",lang==="en"?"Available avatars":lang==="pt"?"Avatares disponíveis":"Avatares disponibles");
  container.innerHTML=ROBOTITO_AVATARS.map(avatar=>{
    const selected=avatar.id===state.avatar;
    const profile=speciesProfile(avatar.id);
    return `<button type="button" class="avatar-choice${selected?" selected":""}" data-avatar-id="${avatar.id}" role="option" aria-selected="${selected}" aria-label="${escapeHtml(avatarName(avatar,lang))}: ${escapeHtml(profile.trait)}">
      <span class="avatar-choice-emoji" aria-hidden="true">${avatarVisualMarkup(avatar,"avatar-choice-svg")}</span>
      <span class="avatar-choice-name">${escapeHtml(avatarName(avatar,lang))}</span>
      <span class="avatar-special">${escapeHtml(profile.trait)}</span>
    </button>`;
  }).join("");
}
function showStartupStep(step){
  const language=$("#languageStep");
  const avatar=$("#avatarStep");
  const isAvatar=step==="avatar";
  if(language){
    language.hidden=isAvatar;
    language.classList.toggle("hidden",isAvatar);
  }
  if(avatar){
    avatar.hidden=!isAvatar;
    avatar.classList.toggle("hidden",!isAvatar);
  }
  $("#languageGateCard")?.classList.toggle("avatar-selecting",isAvatar);
  $("#languageGate")?.setAttribute("aria-labelledby",isAvatar?"avatarStepTitle":"languageGateTitle");
  if(isAvatar){
    const lang=avatarLanguage();
    $("#avatarStepTitle").textContent=lang==="en"?"Choose Robotito's avatar":lang==="pt"?"Escolha o avatar do Robotito":"Elegí el avatar de Robotito";
    $("#avatarStepDescription").textContent=lang==="en"
      ?"Choose the friend you want to see. Your choice will be saved on this device."
      :lang==="pt"?"Escolha o amigo que você quer ver. Sua escolha ficará salva neste dispositivo."
      :"Elegí el amigo que querés ver. La elección quedará guardada en este dispositivo.";
    $("#backToLanguage").textContent=lang==="en"?"Back to language":lang==="pt"?"Voltar ao idioma":"Volver al idioma";
    renderAvatarChoices();
    setTimeout(()=>$("#avatarChoices .selected, #avatarChoices .avatar-choice")?.focus(),0);
  }
}
function finishStartupAvatar(id){
  applyAvatar(id);
  const gate=$("#languageGate");
  if(gate){
    gate.classList.add("hidden");
    gate.hidden=true;
    gate.setAttribute("aria-hidden","true");
    gate.style.display="none";
  }
  const mode=avatarLanguage();
  $("#startBtn").disabled=false;
  $("#startBtn").textContent=mode==="en"?"Wake up senses":mode==="pt"?"Despertar sentidos":"Despertar sentidos";
  $("#statusText").textContent=mode==="en"
    ?"Robotito is ready to wake up."
    :mode==="pt"?"Robotito está pronto para despertar.":speciesIntroduction(id);
  applyDayNightMode(new Date());
  flushPendingBatteryAlert();
}

function setLanguageMode(mode){
  if(!["es","en","pt"].includes(mode))return;
  state.languageMode=mode;
  document.documentElement.lang=mode;
  state.lastDetectedLanguage=mode;
  state.autoListenLanguage=mode;
  localStorage.setItem("robotito.languageMode.v1",mode);
  if($("#languageMode"))$("#languageMode").value=mode;
  populateVoiceSelect();
  if(window.RobotitoLocalASR?.active)window.RobotitoLocalASR.setLanguage(mode);
  if(state.started&&!isMobileSpeech()){discardRecognition();startListeningCycle(true);}
}
function chooseStartupLanguage(mode){
  if(!["es","en","pt"].includes(mode))return;
  setLanguageMode(mode);
  document.documentElement.lang=mode;
  applyAvatar(state.avatar,{persist:false});
  showStartupStep("avatar");
}
function handleLanguageCommand(text){
  if(/(hablame|habla|responde|contesta).*(ingles|english)|speak english|answer in english|fale.*ingles|fale.*ingl[eê]s/.test(text)){
    setLanguageMode("en");
    sayInLanguage("Sure. I'll speak English from now on.","en");
    return true;
  }
  if(/(hablame|habla|responde|contesta).*(espanol|español|castellano)|speak spanish|answer in spanish|fale.*espanhol/.test(text)){
    setLanguageMode("es");
    sayInLanguage("Perfecto. Voy a hablar en español.","es");
    return true;
  }
  if(/(hablame|habla|responde|contesta).*(portugues|portugu[eê]s)|speak portuguese|answer in portuguese|fale.*portugu[eê]s/.test(text)){
    setLanguageMode("pt");
    sayInLanguage("Perfeito. Vou falar em português a partir de agora.","pt");
    return true;
  }
  return false;
}

const QUICK_TRANSLATIONS=[
  {es:"hola",en:"hello",pt:"olá"},
  {es:"buenos dias",en:"good morning",pt:"bom dia"},
  {es:"buenas tardes",en:"good afternoon",pt:"boa tarde"},
  {es:"buenas noches",en:"good night",pt:"boa noite"},
  {es:"gracias",en:"thank you",pt:"obrigado"},
  {es:"por favor",en:"please",pt:"por favor"},
  {es:"te quiero",en:"i love you",pt:"eu te amo"},
  {es:"te extrano",en:"i miss you",pt:"sinto sua falta"},
  {es:"como estas",en:"how are you",pt:"como você está"},
  {es:"me llamo",en:"my name is",pt:"meu nome é"},
  {es:"hasta luego",en:"see you later",pt:"até logo"},
  {es:"que tengas un lindo dia",en:"have a nice day",pt:"tenha um bom dia"},
  {es:"sos muy linda",en:"you are very pretty",pt:"você é muito bonita"},
  {es:"sos mi persona favorita",en:"you are my favorite person",pt:"você é minha pessoa favorita"}
];
const translationCache=new Map();
function targetLanguageFromName(name){
  const n=normalizeText(name);
  if(["ingles","english","inglês","inglese"].includes(n))return "en";
  if(["portugues","portuguese","português"].includes(n))return "pt";
  if(["espanol","español","castellano","spanish","espanhol"].includes(n))return "es";
  return null;
}
function localTranslate(phrase,source,target){
  const n=normalizeText(phrase);
  for(const row of QUICK_TRANSLATIONS){
    if(normalizeText(row[source]||"")===n || Object.values(row).some(v=>normalizeText(v)===n)){
      return row[target]||null;
    }
  }
  return null;
}
async function translateShortPhrase(phrase,source,target){
  const clean=String(phrase||"").trim();
  if(!clean||source===target)return clean;
  const local=localTranslate(clean,source,target);
  if(local)return local;
  const key=`${source}|${target}|${normalizeText(clean)}`;
  if(translationCache.has(key))return translationCache.get(key);
  try{
    if(window.LanguageModel?.create){
      const session=await window.LanguageModel.create({temperature:0,topK:1});
      const prompt=`Translate this short phrase from ${languageLabel(source)} to ${languageLabel(target)}. Return ONLY the translation, no quotes or explanation:\n${clean}`;
      const out=String(await session.prompt(prompt)||"").trim();
      session.destroy?.();
      if(out){translationCache.set(key,out);return out;}
    }
  }catch(e){console.warn("browser translation",e);}
  try{
    const url="https://api.mymemory.translated.net/get?q="+encodeURIComponent(clean)+"&langpair="+encodeURIComponent(source+"|"+target);
    const res=await fetch(url);
    const data=await res.json();
    const out=String(data?.responseData?.translatedText||"").trim();
    if(out){translationCache.set(key,out);return out;}
  }catch(e){console.warn("translation",e);}
  return null;
}
async function handleSayInLanguageCommand(rawText){
  const text=normalizeText(rawText);
  const aliases="(?:espanol|español|castellano|spanish|espanhol|ingles|english|ingl[eê]s|portugues|portugu[eê]s|portuguese)";
  const patterns=[
    new RegExp("^(?:decime|dime|deci|di|pronuncia|repeti|repite)\\s+(.+?)\\s+en\\s+("+aliases+")$"),
    new RegExp("^(?:como se dice)\\s+(.+?)\\s+en\\s+("+aliases+")$"),
    new RegExp("^(?:say|tell me)\\s+(.+?)\\s+in\\s+("+aliases+")$"),
    new RegExp("^(?:how do you say)\\s+(.+?)\\s+in\\s+("+aliases+")$"),
    new RegExp("^(?:diga|me diga|fala|fale)\\s+(.+?)\\s+em\\s+("+aliases+")$"),
    new RegExp("^(?:como se diz)\\s+(.+?)\\s+em\\s+("+aliases+")$")
  ];
  let match=null;
  for(const p of patterns){match=text.match(p);if(match)break;}
  if(!match)return false;
  const target=targetLanguageFromName(match[2]);
  if(!target)return false;
  let phrase=match[1].trim();
  if(["algo","alguna cosa","something","anything","alguma coisa","algo legal"].includes(phrase)){
    const cute={
      es:["Hoy es un buen día para un abrazo panda.","Tu panda virtual cree que merecés algo lindo hoy.","El bambú mejora cuando hay buena compañía."],
      en:["Today is a good day for a panda hug.","Your virtual panda thinks you deserve something nice today.","Bamboo is better with good company."],
      pt:["Hoje é um bom dia para um abraço de panda.","Seu panda virtual acha que você merece algo bonito hoje.","Bambu fica melhor com boa companhia."]
    };
    sayInLanguage(sample(cute[target]),target,5000);
    return true;
  }
  const source=responseLanguage();
  const translated=await translateShortPhrase(phrase,source,target);
  if(!translated){
    const fail=source==="en"?"I couldn't translate that phrase right now.":source==="pt"?"Não consegui traduzir essa frase agora.":"No pude traducir esa frase ahora.";
    say(fail);
    return true;
  }
  sayInLanguage(translated,target,5000);
  return true;
}

function answerEnglishPersonalQuestion(rawText){
  const text=normalizeText(rawText);
  const known=state.currentVoicePerson||state.currentPerson;
  if(/(what is your name|what's your name|whats your name|who are you|tell me your name)/.test(text)){say(sample(["My name is Robotito.","I'm Robotito.","I'm Robotito, your virtual panda."]));return true;}
  if(/(what is my name|what's my name|whats my name|who am i|do you know my name|do you remember my name)/.test(text)){say(known?(`Your name is ${known}. I remember you.`):"I don't know who you are yet. Register your face and voice first.");return true;}
  if(/(how are you|how are you doing|how do you feel|are you okay)/.test(text)){
    if(state.sleeping)say("I'm sleepy, almost asleep.");
    else if(state.hunger>=75)say("I'm okay, but I'm pretty hungry.");
    else if(state.moodScore>=70)say("I'm doing very well. I'm happy.");
    else if(state.moodScore<35)say("I'm a little sad right now.");
    else say("I'm doing well. Pretty calm.");
    return true;
  }
  if(/(are you hungry|do you want to eat|how hungry are you)/.test(text)){say(state.hunger>=95?"Yes. I'm extremely hungry.":state.hunger>=75?"Yes, I'm quite hungry.":state.hunger>=35?"A little, but I'm fine.":"Not really. I'm pretty full.");return true;}
  if(/(how much battery|battery level|how much energy|are you charging)/.test(text)){
    const detail=state.batterySupported
      ?`The device battery is at ${Math.round(state.energy)}%${state.batteryCharging?" and it is charging":""}.`
      :`My estimated energy is ${Math.round(state.energy)}%. This browser does not let me read the device battery.`;
    say(detail);return true;
  }
  if(/(are you sleepy|are you tired|do you want to sleep)/.test(text)){say(state.sleeping?"Yes. I'm basically asleep.":state.energy<40?"Yes, I'm tired.":"Not really. I still have energy.");return true;}
  if(/(what time is it|tell me the time|do you know the time)/.test(text)){say("It's "+new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})+".");return true;}
  if(/(what day is it|what is the date|what's the date|tell me the date)/.test(text)){say("Today is "+new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})+".");return true;}
  if(/(how many fingers|count my fingers|how many fingers do you see)/.test(text)){const fresh=Date.now()-state.lastHandSeenAt<2500;say(!fresh||!state.visibleHands?"I can't see a hand clearly right now.":`I can see ${state.visibleFingers} raised ${state.visibleFingers===1?"finger":"fingers"}.`);return true;}
  if(/(what can you do|how can you help me|what are your abilities|what do you know how to do)/.test(text)){say("I can recognize faces and voices, remember things, listen to classes, summarize them, help you study, count fingers, recognize some objects, recommend books, check tasks, and answer many everyday questions.",6500);return true;}
  if(/(what do you see|can you see me|who do you see)/.test(text)){say(!state.lastDetections.length?"I can't see anyone right now.":known?`I can see ${known}.`:`I can see ${state.lastDetections.length} ${state.lastDetections.length===1?"person":"people"}, but I don't recognize everyone.`);return true;}
  if(/(who is speaking|who is talking|do you recognize my voice|whose voice is this)/.test(text)){say(state.currentVoicePerson?`I think ${state.currentVoicePerson} is speaking.`:"I can hear a voice, but I don't recognize it confidently.");return true;}
  if(/(what do you remember about me|what did i tell you|what do you know about me)/.test(text)){const person=known||"persona no reconocida";const mine=state.memories.filter(m=>m.person===person).slice(-1);say(mine.length?`The last thing I remember is: "${mine[0].text}"`:"I don't have a clear memory about you yet.");return true;}
  if(/(are you real|are you alive|are you a robot|what are you)/.test(text)){say("I'm Robotito, a virtual panda. I'm not alive like a person, but I can see, listen, remember, learn from classes, and react.");return true;}
  return false;
}


function parseSpokenNumber(s){
  const n=Number(String(s).replace(",","."));
  return Number.isFinite(n)?n:null;
}
function answerArithmetic(rawText,lang="es"){
  const advanced=window.ROBOTITO_SPOKEN_MATH?.solve?.(rawText,lang);
  if(advanced?.handled){
    say(advanced.text,4200,lang);
    return true;
  }

  // Legacy binary-operation fallback.
  let s=normalizeText(rawText)
    .replace(/cuanto es|cuanto da|cuanto seria|cuanto son|calculame|calcula|resolve|resolver|what is|what's|calculate|work out/g," ")
    .replace(/dividido entre|dividido por|dividido|divided by|over/g," / ")
    .replace(/multiplicado por|por|times|multiplied by/g," * ")
    .replace(/mas|plus/g," + ")
    .replace(/menos|minus/g," - ")
    .replace(/coma/g,".")
    .replace(/\s+/g," ").trim();
  const symbolic=String(rawText).match(/-?\d+(?:[.,]\d+)?\s*[+\-*/x×÷]\s*-?\d+(?:[.,]\d+)?/);
  if(symbolic)s=symbolic[0].replace(/x|×/g,"*").replace(/÷/g,"/").replace(/,/g,".");
  const m=s.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)/);
  if(!m)return false;
  const a=parseSpokenNumber(m[1]),b=parseSpokenNumber(m[3]),op=m[2];
  if(a===null||b===null)return false;
  let value;
  if(op==="+")value=a+b;
  else if(op==="-")value=a-b;
  else if(op==="*")value=a*b;
  else if(op==="/"){
    if(b===0){say(lang==="en"?"You can't divide by zero.":"No se puede dividir entre cero.");return true;}
    value=a/b;
  }
  if(!Number.isFinite(value))return false;
  const pretty=Number(value.toFixed(10));
  say(lang==="en"?`${a} ${op} ${b} is ${pretty}.`:`${a} ${op} ${b} da ${pretty}.`);
  return true;
}

function geolocationOnce(){
  if(state.locationCoords)return Promise.resolve(state.locationCoords);
  if(state.locationDenied||!navigator.geolocation)return Promise.reject(new Error("location"));
  return new Promise((resolve,reject)=>{
    navigator.geolocation.getCurrentPosition(pos=>{
      state.locationCoords={lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:pos.coords.accuracy};
      resolve(state.locationCoords);
    },err=>{
      state.locationDenied=true;
      reject(err);
    },{enableHighAccuracy:false,timeout:9000,maximumAge:15*60*1000});
  });
}
async function getLocationLabel(lang="es"){
  if(state.locationLabel)return state.locationLabel;
  const {lat,lon}=await geolocationOnce();
  try{
    const url="https://api.bigdatacloud.net/data/reverse-geocode-client?latitude="+encodeURIComponent(lat)+"&longitude="+encodeURIComponent(lon)+"&localityLanguage="+encodeURIComponent(lang);
    const res=await fetch(url);
    if(!res.ok)throw new Error("reverse");
    const d=await res.json();
    const locality=d.city||d.locality||d.principalSubdivision||"";
    const region=d.principalSubdivision||"";
    const country=d.countryName||"";
    const parts=[locality,region,country].filter((x,i,a)=>x&&a.indexOf(x)===i);
    state.locationLabel=parts.join(", ");
    return state.locationLabel;
  }catch{
    return "";
  }
}
function weatherCodeText(code,lang="es"){
  const en=lang==="en";
  if(code===0)return en?"clear skies":"cielo despejado";
  if([1,2].includes(code))return en?"partly cloudy":"algo nublado";
  if(code===3)return en?"overcast":"cubierto";
  if([45,48].includes(code))return en?"foggy":"con niebla";
  if([51,53,55,56,57].includes(code))return en?"drizzly":"con llovizna";
  if([61,63,65,66,67,80,81,82].includes(code))return en?"rainy":"con lluvia";
  if([71,73,75,77,85,86].includes(code))return en?"snowy":"con nieve";
  if([95,96,99].includes(code))return en?"stormy":"con tormenta";
  return en?"mixed conditions":"tiempo variable";
}
async function getWeatherNow(){
  if(state.weatherCache&&Date.now()-state.weatherCache.at<10*60*1000)return state.weatherCache.data;
  const {lat,lon}=await geolocationOnce();
  const url="https://api.open-meteo.com/v1/forecast?latitude="+encodeURIComponent(lat)+"&longitude="+encodeURIComponent(lon)
    +"&current=temperature_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,wind_speed_10m"
    +"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&forecast_days=1&timezone=auto";
  const res=await fetch(url);
  if(!res.ok)throw new Error("weather");
  const data=await res.json();
  state.weatherCache={at:Date.now(),data};
  return data;
}
async function handleWeatherAndDayQuestions(rawText){
  const text=normalizeText(rawText),lang=responseLanguage(rawText);
  const locationAsk=/(donde estoy|en que ciudad estoy|donde me encuentro|cual es mi ubicacion|what city am i in|where am i|what is my location)/.test(text);
  const weatherAsk=/(clima|tiempo|temperatura|llueve|llover|frio|calor|viento|weather|temperature|raining|rain|wind)/.test(text)
    && /(hoy|ahora|afuera|aca|aqui|actual|today|now|outside|here|como|how|que|what)/.test(text);
  const nightAsk=/(es de noche|ya es de noche|esta de noche|es de dia|ya es de dia|todavia es de dia|is it night|is it nighttime|is it day|is it daytime|e noite|é noite|e dia|é dia)/.test(text);
  if(!weatherAsk&&!nightAsk&&!locationAsk)return false;

  if(nightAsk){
    const night=isNightByClock(new Date());
    if(lang==="en")say(night?"Yes. Robotito is in night mode.":"No. Robotito is in day mode.");
    else if(lang==="pt")sayInLanguage(night?"Sim. O Robotito está no modo noite.":"Não. O Robotito está no modo dia.","pt");
    else say(night?"Sí. Robotito está en modo noche.":"No. Robotito está en modo día.");
    return true;
  }

  try{
    if(locationAsk){
      const label=await getLocationLabel(lang);
      say(label?(lang==="en"?`Your current approximate location is ${label}.`:`Tu ubicación aproximada actual es ${label}.`):(lang==="en"?"I have your coordinates for weather, but I couldn't turn them into a city name.":"Tengo tu ubicación para el clima, pero no pude convertirla en un nombre de ciudad."));
      return true;
    }
    const w=await getWeatherNow();
    const cur=w.current||{},daily=w.daily||{};
    const desc=weatherCodeText(Number(cur.weather_code),lang);
    const temp=Math.round(Number(cur.temperature_2m));
    const feels=Math.round(Number(cur.apparent_temperature));
    const hi=Math.round(Number(daily.temperature_2m_max?.[0]));
    const lo=Math.round(Number(daily.temperature_2m_min?.[0]));
    const rain=Number(daily.precipitation_probability_max?.[0]??0);
    const place=await getLocationLabel(lang).catch(()=>"");
    if(lang==="en"){
      say(`${place?"In "+place+", ":"At your current location "}it's about ${temp} degrees, feels like ${feels}, and it's ${desc}. Today's high is around ${hi}, the low around ${lo}, with up to ${rain}% chance of precipitation.`,7000);
    }else{
      say(`${place?"En "+place+" ":"En tu ubicación actual "}hay unos ${temp} grados, sensación de ${feels}, y está ${desc}. Hoy la máxima ronda ${hi}, la mínima ${lo}, y la probabilidad máxima de precipitación es de ${rain}%.`,7000);
    }
    return true;
  }catch(e){
    say(lang==="en"
      ?"I need location permission to tell you the weather where you are."
      :lang==="pt"?"Preciso da permissão de localização para dizer como está o tempo onde você está."
      :"Necesito permiso de ubicación del navegador para decirte el clima donde estás.");
    return true;
  }
}

function ctxRoundRect(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
}
function prepareDrawing(){
  const cv=$("#drawingCanvas"),ctx=cv?.getContext("2d");
  if(!ctx)return null;
  ctx.clearRect(0,0,cv.width,cv.height);
  ctx.fillStyle="#fffdfb";ctx.fillRect(0,0,cv.width,cv.height);
  ctx.lineWidth=5;ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="#4d4650";
  return {cv,ctx};
}
function drawCuteThing(kind,item){
  const prep=prepareDrawing();if(!prep)return;
  const {ctx}=prep,w=440,h=320;
  const circle=(x,y,r,fill=null)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.stroke();};
  const line=(x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
  const eye=(x,y)=>{ctx.fillStyle="#27222a";ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x-2,y-2,2,0,Math.PI*2);ctx.fill();};
  ctx.strokeStyle="#4d4650";
  if(kind==="sun"){circle(220,145,58,"#ffd879");for(let a=0;a<Math.PI*2;a+=Math.PI/6)line(220+78*Math.cos(a),145+78*Math.sin(a),220+105*Math.cos(a),145+105*Math.sin(a));eye(200,140);eye(240,140);ctx.beginPath();ctx.arc(220,153,22,.2,Math.PI-.2);ctx.stroke();}
  else if(kind==="heart"){ctx.fillStyle="#f3a4bd";ctx.beginPath();ctx.moveTo(220,250);ctx.bezierCurveTo(80,165,120,70,220,135);ctx.bezierCurveTo(320,70,360,165,220,250);ctx.fill();ctx.stroke();}
  else if(kind==="star"){ctx.fillStyle="#f7d57e";ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?45:95,x=220+Math.cos(a)*r,y=155+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();eye(198,150);eye(242,150);}
  else if(kind==="flower"){ctx.fillStyle="#8ecb83";line(220,160,220,280);ctx.beginPath();ctx.ellipse(190,230,40,18,-.4,0,Math.PI*2);ctx.fill();ctx.stroke();for(let a=0;a<Math.PI*2;a+=Math.PI/3){ctx.fillStyle="#f3a7c0";circle(220+55*Math.cos(a),130+55*Math.sin(a),32,"#f3a7c0");}circle(220,130,31,"#ffd36f");}
  else if(kind==="tree"){ctx.fillStyle="#a97955";ctx.fillRect(200,180,40,100);ctx.strokeRect(200,180,40,100);circle(175,150,60,"#8bc985");circle(235,130,66,"#86c77f");circle(270,175,55,"#78b972");}
  else if(kind==="house"){ctx.fillStyle="#f9dfcf";ctx.fillRect(115,145,210,135);ctx.strokeRect(115,145,210,135);ctx.fillStyle="#d88991";ctx.beginPath();ctx.moveTo(90,150);ctx.lineTo(220,60);ctx.lineTo(350,150);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#a97955";ctx.fillRect(195,205,52,75);ctx.strokeRect(195,205,52,75);ctx.fillStyle="#bfe2ef";ctx.fillRect(135,180,45,40);ctx.strokeRect(135,180,45,40);ctx.fillRect(265,180,45,40);ctx.strokeRect(265,180,45,40);}
  else if(["cat","dog","panda","rabbit","bear"].includes(kind)){circle(220,155,82,"#fff");if(kind==="cat"){ctx.fillStyle="#fff";ctx.beginPath();ctx.moveTo(155,105);ctx.lineTo(145,45);ctx.lineTo(195,82);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(285,105);ctx.lineTo(295,45);ctx.lineTo(245,82);ctx.fill();ctx.stroke();}else{circle(165,90,31,kind==="panda"?"#27242a":"#fff");circle(275,90,31,kind==="panda"?"#27242a":"#fff");}if(kind==="panda"){ctx.fillStyle="#27242a";ctx.beginPath();ctx.ellipse(187,145,27,34,.25,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(253,145,27,34,-.25,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";circle(187,145,12,"#fff");circle(253,145,12,"#fff");}eye(188,145);eye(252,145);ctx.fillStyle="#2d2830";ctx.beginPath();ctx.ellipse(220,175,14,10,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(220,183,22,.15,Math.PI-.15);ctx.stroke();}
  else if(kind==="fish"){ctx.fillStyle="#9fd8dc";ctx.beginPath();ctx.ellipse(210,160,95,58,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(300,160);ctx.lineTo(370,105);ctx.lineTo(370,215);ctx.closePath();ctx.fill();ctx.stroke();eye(165,145);ctx.beginPath();ctx.arc(155,176,22,.1,Math.PI-.1);ctx.stroke();}
  else if(kind==="car"){ctx.fillStyle="#ef9eb2";ctxRoundRect(ctx,100,145,240,80,25);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(145,145);ctx.lineTo(185,100);ctx.lineTo(270,100);ctx.lineTo(310,145);ctx.closePath();ctx.fill();ctx.stroke();circle(155,225,30,"#353039");circle(290,225,30,"#353039");}
  else if(kind==="book"){ctx.fillStyle="#c8b9ea";ctxRoundRect(ctx,130,70,180,190,16);ctx.fill();ctx.stroke();line(160,70,160,260);ctx.fillStyle="#fff";ctx.font="bold 28px system-ui";ctx.fillText("BOOK",185,160);}
  else if(kind==="cup"){ctx.fillStyle="#f4c8d7";ctxRoundRect(ctx,145,90,145,150,20);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(292,155,48,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.beginPath();ctx.moveTo(175,70);ctx.bezierCurveTo(160,45,190,35,175,10);ctx.stroke();ctx.beginPath();ctx.moveTo(225,70);ctx.bezierCurveTo(210,45,240,35,225,10);ctx.stroke();}
  else if(kind==="cloud"){ctx.fillStyle="#dcebf5";circle(175,165,48,"#dcebf5");circle(225,130,62,"#dcebf5");circle(285,165,52,"#dcebf5");ctx.fillRect(150,165,165,55);ctx.strokeRect(150,165,165,55);}
  else if(kind==="rainbow"){const cols=["#ef8f9d","#f3b86d","#ead86d","#8dcc8b","#83bdd9","#9d91d5"];cols.forEach((col,i)=>{ctx.strokeStyle=col;ctx.lineWidth=18;ctx.beginPath();ctx.arc(220,245,145-i*19,Math.PI,Math.PI*2);ctx.stroke();});}
  else if(kind==="moon"){ctx.fillStyle="#f5e4a8";circle(220,150,90,"#f5e4a8");ctx.fillStyle="#fffdfb";ctx.beginPath();ctx.arc(260,120,88,0,Math.PI*2);ctx.fill();}
  else{
    ctx.font="110px Apple Color Emoji,Segoe UI Emoji,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(item?.emoji||"✨",220,145);
    ctx.font="700 24px system-ui";ctx.fillStyle="#4d4650";ctx.fillText(objectDisplayName(item,state.lastDetectedLanguage||"es"),220,260);
  }
}
function drawRequestedThing(rawText,lang="es"){
  const text=normalizeText(rawText);
  const m=text.match(/(?:dibujame|dibuj[aá]|haceme un dibujo de|hazme un dibujo de|quiero un dibujo de|draw me|draw a|draw an|can you draw)\s+(?:un|una|el|la|a|an|the)?\s*(.+)$/);
  if(!m)return false;
  let query=m[1].replace(/\b(por favor|please)\b/g,"").trim();
  const item=window.ROBOTITO_OBJECTS?.find?.(query);
  const aliases={
    sol:"sun",sun:"sun",corazon:"heart",heart:"heart",estrella:"star",star:"star",flor:"flower",flower:"flower",
    arbol:"tree",tree:"tree",casa:"house",house:"house",gato:"cat",cat:"cat",perro:"dog",dog:"dog",
    panda:"panda",conejo:"rabbit",rabbit:"rabbit",oso:"bear",bear:"bear",pez:"fish",fish:"fish",
    auto:"car",coche:"car",car:"car",libro:"book",book:"book",taza:"cup",cup:"cup",nube:"cloud",cloud:"cloud",
    arcoiris:"rainbow",rainbow:"rainbow",luna:"moon",moon:"moon"
  };
  let kind=null;
  for(const [a,k] of Object.entries(aliases)){if(query===a||query.includes(a)){kind=k;break;}}
  if(!kind&&item)kind=item.id;
  drawCuteThing(kind||"generic",item);
  $("#drawingTitle").textContent=lang==="en"?("Robotito drew "+(item?objectDisplayName(item,"en"):query)):("Robotito dibujó "+(item?objectDisplayName(item,"es"):query));
  $("#drawingShowcase").classList.remove("hidden");
  clearTimeout(drawRequestedThing.t);
  drawRequestedThing.t=setTimeout(()=>$("#drawingShowcase").classList.add("hidden"),8000);
  say(lang==="en"?"I drew it for you.":"Te lo dibujé.");
  return true;
}

function animateAffection(){
  if(state.sleeping)return;
  clearBlinkState();
  clearTimeout(state.heartEyeTimer);
  robot.classList.remove("heart-eyes");
  resetEyes();
  requestAnimationFrame(()=>{
    if(state.sleeping)return;
    robot.classList.add("heart-eyes");
    state.heartEyeTimer=setTimeout(()=>{
      robot.classList.remove("heart-eyes");
      state.heartEyeTimer=null;
      clearBlinkState();
      resetEyes();
    },1200);
  });
}
function playSnore(){
  const ctx=state.audioContext;
  if(!ctx||ctx.state!=="running")return;
  try{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type="sine";osc.frequency.setValueAtTime(92,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(58,ctx.currentTime+.72);
    gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.025,ctx.currentTime+.14);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.82);
    osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.85);
  }catch{}
}
function startSnoring(){
  if(state.snoreTimer)return;
  const loop=()=>{
    if(!state.sleeping){state.snoreTimer=null;return;}
    playSnore();
    state.snoreTimer=setTimeout(loop,4300+Math.random()*2300);
  };
  state.snoreTimer=setTimeout(loop,900);
}
function stopSnoring(){
  clearTimeout(state.snoreTimer);
  state.snoreTimer=null;
}

function answerPortuguesePersonalQuestion(rawText){
  const text=normalizeText(rawText);
  const known=state.currentVoicePerson||state.currentPerson;
  if(/(como voce se chama|como você se chama|qual e seu nome|qual é seu nome|quem e voce|quem é você)/.test(text)){sayInLanguage(sample(["Meu nome é Robotito.","Eu sou o Robotito.","Sou o Robotito, seu panda virtual."]),"pt");return true;}
  if(/(como eu me chamo|qual e meu nome|qual é meu nome|quem sou eu|voce sabe meu nome|você sabe meu nome)/.test(text)){sayInLanguage(known?`Seu nome é ${known}. Eu me lembro de você.`:"Ainda não sei quem você é. Registre seu rosto e sua voz primeiro.","pt");return true;}
  if(/(como voce esta|como você está|tudo bem|como se sente)/.test(text)){
    const msg=state.sleeping?"Estou com sono, quase dormindo.":state.hunger>=75?"Estou bem, mas estou com bastante fome.":state.moodScore>=70?"Estou muito bem. Estou feliz.":state.moodScore<35?"Estou um pouquinho triste agora.":"Estou bem e tranquilo.";
    sayInLanguage(msg,"pt");return true;
  }
  if(/(esta com fome|está com fome|tem fome|quer comer)/.test(text)){sayInLanguage(state.hunger>=75?"Sim, estou com bastante fome.":state.hunger>=35?"Um pouco, mas estou bem.":"Não muito. Estou bem satisfeito.","pt");return true;}
  if(/(quanta bateria|nivel da bateria|nível da bateria|quanta energia|esta carregando|está carregando)/.test(text)){
    const detalhe=state.batterySupported
      ?`A bateria do dispositivo está em ${Math.round(state.energy)}%${state.batteryCharging?" e está carregando":""}.`
      :`Minha energia estimada está em ${Math.round(state.energy)}%. Este navegador não permite ler a bateria do dispositivo.`;
    sayInLanguage(detalhe,"pt");return true;
  }
  if(/(esta com sono|está com sono|esta cansado|está cansado|quer dormir)/.test(text)){sayInLanguage(state.sleeping?"Sim. Eu praticamente já estava dormindo.":state.energy<40?"Sim, estou cansado.":"Não muito. Ainda tenho energia.","pt");return true;}
  if(/(que horas sao|que horas são|me diga as horas)/.test(text)){sayInLanguage("São "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+".","pt");return true;}
  if(/(que dia e hoje|que dia é hoje|qual e a data|qual é a data)/.test(text)){sayInLanguage("Hoje é "+new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+".","pt");return true;}
  if(/(quantos dedos|conte meus dedos)/.test(text)){const fresh=Date.now()-state.lastHandSeenAt<2500;sayInLanguage(!fresh||!state.visibleHands?"Não consigo ver sua mão claramente agora.":`Vejo ${state.visibleFingers} dedos levantados.`,"pt");return true;}
  if(/(o que voce pode fazer|o que você pode fazer|como pode me ajudar)/.test(text)){sayInLanguage("Posso reconhecer rostos e vozes, lembrar coisas, ouvir aulas, resumir, ajudar a estudar, contar dedos, reconhecer objetos, recomendar livros e responder muitas perguntas do dia a dia.","pt",6500);return true;}
  if(/(o que voce ve|o que você vê|consegue me ver|quem voce ve|quem você vê)/.test(text)){sayInLanguage(!state.lastDetections.length?"Não vejo ninguém agora.":known?`Vejo ${known}.`:`Vejo ${state.lastDetections.length} pessoa ou pessoas, mas não reconheço todo mundo.`,"pt");return true;}
  if(/(quem esta falando|quem está falando|reconhece minha voz)/.test(text)){sayInLanguage(state.currentVoicePerson?`Acho que ${state.currentVoicePerson} está falando.`:"Ouço uma voz, mas não consigo reconhecê-la com segurança.","pt");return true;}
  if(/(voce e real|você é real|esta vivo|está vivo|voce e um robo|você é um robô)/.test(text)){sayInLanguage("Sou o Robotito, um panda virtual. Não estou vivo como uma pessoa, mas posso ver, ouvir, lembrar e reagir.","pt");return true;}
  return false;
}

function answerEasyQuestion(rawText){
  const text=normalizeText(rawText);
  const known=state.currentVoicePerson||state.currentPerson;

  if(intentMatches(text,
    ["como te llamas","cual es tu nombre","que nombre tenes","que nombre tienes","decime tu nombre","dime tu nombre","tu nombre cual es","quien sos","quien eres","como es tu nombre"],
    [["nombre"],["tu","te"]]
  )){
    say(sample(["Me llamo Robotito.","Soy Robotito.","Mi nombre es Robotito."]));
    return true;
  }

  if(intentMatches(text,
    ["como me llamo","cual es mi nombre","que nombre tengo","sabes mi nombre","te acordas de mi nombre","te acuerdas de mi nombre","quien soy","quien soy yo","me reconoces"],
    [["nombre"],["mi","me"]]
  )){
    if(known)say(sample([`Vos sos ${known}.`,`Te llamás ${known}. Te reconocí.`,`Sos ${known}. Me acuerdo de vos.`]));
    else say("Todavía no sé quién sos. Registrá tu cara y tu voz y después sí me voy a acordar.");
    return true;
  }

  if(intentMatches(text,
    ["como estas","como te va","como andas","que tal estas","como te sentis","como te sientes","todo bien","estas bien","que tal te va"],
    [["como","que tal"],["estas","andas","sentis","sientes","va"]]
  )){
    say(moodAnswer());
    return true;
  }

  if(intentMatches(text,
    ["tenes hambre","tienes hambre","estas con hambre","estas hambriento","queres comer","quieres comer","cuanta hambre tenes","cuanta hambre tienes","comiste"],
    [["hambre","comer","comiste"],["tenes","tienes","estas","queres","quieres","cuanta"]]
  )){
    if(state.hunger>=95)say("Sí. Muchísima. Ya estoy enojado de hambre.");
    else if(state.hunger>=75)say("Sí, tengo bastante hambre.");
    else if(state.hunger>=35)say("Un poco. Todavía aguanto.");
    else say("No mucho. Estoy bastante lleno.");
    return true;
  }

  if(intentMatches(text,
    ["cuanta bateria tenes","cuanta bateria tienes","que porcentaje de bateria tenes","que porcentaje de bateria tienes","cuanta energia tenes","cuanta energia tienes","estas cargando","se esta cargando la bateria"],
    [["bateria","energia","cargando"],["cuanta","porcentaje","tenes","tienes","estas"]]
  )){
    const detail=state.batterySupported
      ?`La batería del dispositivo está en ${Math.round(state.energy)}%${state.batteryCharging?" y se está cargando":""}.`
      :`Mi energía estimada está en ${Math.round(state.energy)}%. Este navegador no me permite leer la batería del dispositivo.`;
    say(detail);
    return true;
  }

  if(intentMatches(text,
    ["tenes sueno","tienes sueno","estas cansado","estas dormido","te queres dormir","te quieres dormir","tenes sueño","tienes sueño"],
    [["sueno","cansado","dormido","dormir"],["tenes","tienes","estas","queres","quieres"]]
  )){
    if(state.sleeping)say("Sí. De hecho, me estaba quedando dormido.");
    else if(state.energy<35)say("Sí, estoy bastante cansado.");
    else if(state.energy<65)say("Un poco, pero todavía estoy bien.");
    else say("No. Tengo bastante energía.");
    return true;
  }

  if(intentMatches(text,
    ["que humor tenes","que humor tienes","de que humor estas","como te sentis de animo","como te sientes de animo","estas feliz","estas triste","estas enojado","estas contento"],
    [["humor","animo"],["tenes","tienes","estas"]]
  )){
    say(moodAnswer());
    return true;
  }

  if(intentMatches(text,
    ["cuantos dedos ves","cuantos dedos estoy mostrando","cuantos dedos hay","cuantos dedos te muestro","conta los dedos","cuenta los dedos","decime cuantos dedos ves"],
    [["dedo","dedos"],["ves","mostrar","mostrando","muestro","conta","cuenta","cuantos"]]
  )){
    const fresh=Date.now()-state.lastHandSeenAt<2500;
    if(!fresh||state.visibleHands===0)say("Ahora mismo no veo ninguna mano. Mostrámelas bien frente a la cámara.");
    else if(state.visibleFingers===0)say("Veo manos, pero ningún dedo levantado.");
    else say(`Veo ${state.visibleFingers} ${state.visibleFingers===1?"dedo":"dedos"} levantados.`);
    return true;
  }

  if(intentMatches(text,
    ["que dia es","que fecha es","en que dia estamos","que fecha tenemos","decime la fecha","dime la fecha","hoy que dia es"],
    [["dia","fecha"],["que","cual","hoy"]]
  )){
    const d=new Date();
    say(d.toLocaleDateString("es-UY",{weekday:"long",day:"numeric",month:"long",year:"numeric"}));
    return true;
  }

  if(intentMatches(text,
    ["que hora es","tenes hora","tienes hora","decime la hora","dime la hora","me decis la hora","me dices la hora"],
    [["hora"],["que","tenes","tienes","decime","dime","decis","dices"]]
  )){
    const d=new Date();
    say(`Son las ${d.toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit"})}.`);
    return true;
  }

  if(intentMatches(text,
    ["que recordas de mi","que recuerdas de mi","que te dije","que sabes de mi","te acordas de lo que te dije","te acuerdas de lo que te dije","que te conte","que te conte antes"],
    [["recordas","recuerdas","acordas","acuerdas","sabes"],["mi","de mi","te dije","te conte"]]
  )){
    const person=known||"persona no reconocida";
    const mine=state.memories.filter(m=>m.person===person).slice(-5);
    if(!mine.length)say("Todavía no tengo recuerdos claros tuyos.");
    else say(`Lo último que recuerdo es: “${mine[mine.length-1].text}”`);
    return true;
  }

  if(intentMatches(text,
    ["que podes hacer","que puedes hacer","para que servis","para que sirves","que sabes hacer","que funciones tenes","que funciones tienes","en que me podes ayudar","en que me puedes ayudar"],
    [["que","en que"],["podes","puedes","sabes","funciones","ayudar","servis","sirves"]]
  )){
    say(capabilitiesAnswer(),6500);
    return true;
  }

  if(intentMatches(text,
    ["que ves","que estas viendo","a quien ves","me ves","podes verme","puedes verme","hay alguien enfrente tuyo"],
    [["ves","viendo","ver"],["que","quien","me","alguien"]]
  )){
    if(state.lastDetections.length===0)say("Ahora mismo no veo a nadie.");
    else if(known)say(`Veo a ${known}.`);
    else say(`Veo ${state.lastDetections.length} ${state.lastDetections.length===1?"persona":"personas"}, pero no reconozco a todas.`);
    return true;
  }

  if(intentMatches(text,
    ["quien esta hablando","quien habla","quien te esta hablando","reconoces mi voz","sabes quien habla","de quien es esta voz"],
    [["quien"],["habla","hablando","voz"]]
  )){
    if(state.currentVoicePerson)say(`Creo que está hablando ${state.currentVoicePerson}.`);
    else say("Escucho una voz, pero no la reconozco con suficiente seguridad.");
    return true;
  }

  if(intentMatches(text,
    ["que escuchas","que estas escuchando","que ois","que estas oyendo","escuchas musica","es musica o ruido"],
    [["escuchas","ois","oyendo"],["que","musica","ruido"]]
  )){
    say(`Ahora detecto ${state.audioKind}.`);
    return true;
  }

  if(intentMatches(text,
    ["tengo tareas","que tareas tengo","que tengo que hacer","tengo algo pendiente","que tengo pendiente","hay algo para hacer","que deberes tengo"],
    [["tarea","tareas","pendiente","hacer","deberes"],["tengo","que","hay"]]
  )){
    const tasks=pendingTasks();
    if(!tasks.length)say("No veo tareas pendientes en la hoja conectada.");
    else say(`Tenés ${tasks.length} ${tasks.length===1?"tarea pendiente":"tareas pendientes"}. La primera es: ${tasks[0].task}.`,5200);
    return true;
  }

  if(intentMatches(text,
    ["estas escuchando la clase","estas en modo clase","modo clase esta activo","estas aprendiendo la clase"],
    [["clase"],["escuchando","modo","aprendiendo","activo"]]
  )){
    say(state.classMode?`Sí. Estoy escuchando la clase de ${state.classSubject||"esta materia"}.`:"No. El modo clase está apagado.");
    return true;
  }

  if(intentMatches(text,
    ["cuantos anos tenes","cuantos anos tienes","que edad tenes","que edad tienes"],
    [["edad","anos"],["tenes","tienes","cuantos","que"]]
  )){
    say("No tengo una edad humana. Soy una mascota virtual.");
    return true;
  }

  if(intentMatches(text,
    ["que sos","que eres","que animal sos","que animal eres","sos un panda","eres un panda"],
    [["que"],["sos","eres","animal"]]
  )){
    say("Soy Robotito, un panda virtual.");
    return true;
  }

  if(intentMatches(text,
    ["es de noche","ya es de noche","estamos de noche","es de dia","ya es de dia","todavia es de dia","todavía es de día"],
    [["noche","dia"],["es","ya","todavia"]]
  )){
    const night=isNightByClock(new Date());
    say(night?"Sí. Robotito está en modo noche.":"No. Robotito está en modo día.");
    return true;
  }

  if(intentMatches(text,
    ["cuantas personas ves","cuanta gente ves","hay alguien","cuantos hay enfrente","cuantos estamos"],
    [["persona","personas","gente"],["ves","hay","cuantas","cuantos"]]
  )){
    const n=state.lastDetections.length;
    if(!n)say("Ahora mismo no veo a nadie.");
    else say(`Veo ${n} ${n===1?"persona":"personas"}.`);
    return true;
  }

  if(intentMatches(text,
    ["cuantas manos ves","cuantas manos hay","ves mis manos","cuantas manos te muestro"],
    [["mano","manos"],["ves","hay","cuantas","muestro"]]
  )){
    if(!state.visibleHands)say("Ahora mismo no veo ninguna mano.");
    else say(`Veo ${state.visibleHands} ${state.visibleHands===1?"mano":"manos"}.`);
    return true;
  }

  if(intentMatches(text,
    ["que libro me recomendaste","cual era el libro que me recomendaste","recordame el libro recomendado","que libro dijiste"],
    [["libro"],["recomendaste","recomendado","dijiste","recordame"]]
  )){
    const last=load(KEYS.lastBook,null);
    say(last?`El último libro que te recomendé fue “${last.title}”.`:"Todavía no tengo una recomendación guardada.");
    return true;
  }

  if(intentMatches(text,
    ["que personas conoces","a quienes conoces","quien esta registrado","a quien reconoces"],
    [["conoces","registrado","reconoces"],["quien","quienes","personas"]]
  )){
    const names=state.people.map(p=>p.name);
    say(names.length?`Tengo registradas a ${names.join(", ")}.`:"Todavía no tengo personas registradas.");
    return true;
  }

  if(intentMatches(text,
    ["cuando cumplo anos","cuando es mi cumpleanos","cuando es mi cumple","sabes mi cumpleanos","sabes cuando cumplo"],
    [["cumplo","cumpleanos","cumple"],["cuando","sabes"]]
  )){
    const p=state.people.find(x=>x.name===known);
    if(p?.birthday)say(`Tu cumpleaños es el ${formatBirthday(p.birthday)}.`);
    else say("No tengo tu cumpleaños registrado.");
    return true;
  }

  if(intentMatches(text,
    ["tenes frio","tienes frio","tenes calor","tienes calor"],
    [["frio","calor"],["tenes","tienes"]]
  )){
    say("No siento temperatura como una persona. Pero puedo hacerte compañía.");
    return true;
  }

  if(intentMatches(text,
    ["sos real","eres real","estas vivo","estas viva","sos un robot","eres un robot"],
    [["real","vivo","robot"],["sos","eres","estas"]]
  )){
    say("Soy una mascota virtual. No estoy vivo como una persona, pero puedo verte, escucharte, recordar cosas y reaccionar.");
    return true;
  }

  if(intentMatches(text,
    ["te gusta leer","te gustan los libros","te gusta la musica","te gusta estudiar"],
    [["gusta","gustan"],["leer","libros","musica","estudiar"]]
  )){
    if(text.includes("libro")||text.includes("leer"))say("Sí. Especialmente porque puedo ayudarte a elegir qué leer.");
    else if(text.includes("musica"))say("Sí. Si detecto música, hasta intento bailar.");
    else say("Me gusta aprender cosas con vos, sobre todo cuando después puedo ayudarte a estudiarlas.");
    return true;
  }

  if(intentMatches(text,
    ["que estas haciendo","que haces ahora","que haces","en que andas","que estas haciendo ahora"],
    [["que"],["haces","haciendo","andas"]]
  )){
    if(state.classMode)say(`Estoy escuchando y aprendiendo la clase de ${state.classSubject||"esta materia"}.`);
    else if(state.nightSleep||state.sleeping)say("Estoy durmiendo.");
    else if(robot.classList.contains("dancing"))say("Estoy bailando porque detecté música.");
    else if(state.hunger>=75)say("Estoy acá, pero bastante pendiente de que tengo hambre.");
    else say("Estoy atento a lo que pasa y esperando que me hables.");
    return true;
  }

  if(intentMatches(text,
    ["que materia es","que materia estamos viendo","que clase estas escuchando","que clase es","que estas estudiando"],
    [["materia","clase","estudiando"],["que"]]
  )){
    if(state.classMode)say(`Estoy escuchando ${state.classSubject||"una clase sin nombre"}.`);
    else {
      const last=[...state.classLines].sort((a,b)=>b.at-a.at)[0];
      say(last?`La última materia que tengo registrada es ${last.subject||"una clase sin nombre"}.`:"Todavía no escuché ninguna clase.");
    }
    return true;
  }

  if(intentMatches(text,
    ["cuantas clases escuchaste hoy","cuantas clases tuviste hoy","cuantas clases aprendiste hoy","escuchaste alguna clase hoy"],
    [["clase","clases"],["hoy"],["cuantas","alguna","escuchaste","tuviste","aprendiste"]]
  )){
    const subjects=[...new Set(todayClassLines().map(l=>l.subject||"Clase"))];
    if(!subjects.length)say("Hoy todavía no escuché ninguna clase.");
    else say(`Hoy tengo registradas ${subjects.length} ${subjects.length===1?"clase":"clases"}: ${subjects.join(", ")}.`);
    return true;
  }

  if(intentMatches(text,
    ["cual fue la ultima clase","que clase escuchaste ultima","ultima clase que aprendiste","que fue lo ultimo que estudiaste"],
    [["ultima","ultimo"],["clase","estudiaste","aprendiste"]]
  )){
    const last=[...state.classLines].sort((a,b)=>b.at-a.at)[0];
    say(last?`La última clase que tengo registrada es ${last.subject||"una clase sin nombre"}.`:"Todavía no escuché ninguna clase.");
    return true;
  }

  if(intentMatches(text,
    ["te caigo bien","te agrado","me queres","me quieres","que pensas de mi","que piensas de mi","como nos llevamos"],
    [["mi","me"],["caigo","agrado","queres","quieres","pensas","piensas","llevamos"]]
  )){
    const p=state.people.find(x=>x.name===known);
    if(!p)say("Todavía no te conozco lo suficiente como para decirlo.");
    else say(`Nuestra relación está así: ${relationText(p)}.`);
    return true;
  }

  if(intentMatches(text,
    ["quien cumple anos hoy","quien cumple hoy","hay algun cumpleanos hoy","hay cumpleaños hoy"],
    [["cumple","cumpleanos"],["hoy","quien","hay"]]
  )){
    const now=new Date();
    const names=state.people.filter(p=>{
      const m=String(p.birthday||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return m&&Number(m[2])===now.getMonth()+1&&Number(m[3])===now.getDate();
    }).map(p=>p.name);
    say(names.length?`Hoy cumple ${names.join(", ")}.`:"No tengo registrado a nadie que cumpla años hoy.");
    return true;
  }

  if(intentMatches(text,
    ["cuando cumple","cuando es el cumpleanos de","cuando es el cumple de","sabes el cumpleanos de"],
    [["cumple","cumpleanos"],["cuando","sabes"]]
  )){
    const target=state.people.find(p=>text.includes(normalizeText(p.name)));
    if(target?.birthday)say(`${target.name} cumple el ${formatBirthday(target.birthday)}.`);
    else say("No encontré ese cumpleaños entre las personas registradas.");
    return true;
  }

  if(intentMatches(text,
    ["cuantos libros lei","cuantos libros he leido","cuantos libros tengo leidos","cuantos libros ya lei"],
    [["libro","libros"],["lei","leido","leidos"],["cuantos"]]
  )){
    if(!state.library.length)say("Todavía no importaste tu biblioteca de Goodreads.");
    else {
      const n=state.library.filter(b=>(b["Exclusive Shelf"]||"").toLowerCase()==="read").length;
      say(`En el archivo de Goodreads veo ${n} libros leídos.`);
    }
    return true;
  }

  if(intentMatches(text,
    ["cuantos libros tengo pendientes","cuantos libros quiero leer","cuantos libros tengo por leer","cuantos libros hay en to read"],
    [["libro","libros"],["pendiente","leer","to read"],["cuantos"]]
  )){
    if(!state.library.length)say("Todavía no importaste tu biblioteca de Goodreads.");
    else {
      const n=state.library.filter(b=>(b["Exclusive Shelf"]||"").toLowerCase()==="to-read").length;
      say(`Tenés ${n} libros marcados para leer.`);
    }
    return true;
  }

  if(intentMatches(text,
    ["que estoy leyendo","que libro estoy leyendo","cuales estoy leyendo","que tengo en currently reading"],
    [["leyendo","currently reading"],["que","cuales","libro"]]
  )){
    if(!state.library.length)say("Todavía no importaste tu biblioteca de Goodreads.");
    else {
      const books=state.library.filter(b=>(b["Exclusive Shelf"]||"").toLowerCase()==="currently-reading").map(b=>b["Title"]).filter(Boolean);
      say(books.length?`Tenés como lectura actual: ${books.join(", ")}.`:"No veo ningún libro marcado como lectura actual.");
    }
    return true;
  }

  if(intentMatches(text,
    ["que musica es","que cancion es","sabes que cancion esta sonando","reconoces la cancion"],
    [["cancion","musica"],["que","sabes","reconoces"]]
  )){
    say(state.audioKind==="música"?"Sé que suena música, pero todavía no puedo identificar el nombre de la canción.":"Ahora mismo no detecto música con suficiente seguridad.");
    return true;
  }

  if(intentMatches(text,
    ["repeti","repetilo","repite","decilo de nuevo","dilo de nuevo","que dijiste recien"],
    [["repeti","repite","nuevo","dijiste"],["que","decilo","dilo","recien"]]
  )){
    if(state.lastSaid)say(state.lastSaid);
    else say("Todavía no había dicho nada.");
    return true;
  }

  if(intentMatches(text,
    ["cuando comiste","hace cuanto comiste","hace cuanto no comes","cuando fue la ultima vez que comiste"],
    [["comiste","comes"],["cuando","cuanto","ultima"]]
  )){
    const last=Number(localStorage.getItem(KEYS.lastFed)||0);
    if(!last)say("No tengo registrada una comida todavía.");
    else {
      const mins=Math.floor((Date.now()-last)/60000);
      if(mins<60)say(`Comí hace aproximadamente ${mins} minutos.`);
      else say(`Comí hace aproximadamente ${(mins/60).toFixed(1)} horas.`);
    }
    return true;
  }

  if(intentMatches(text,
    ["te doy miedo","te asusto","me tenes miedo","me tienes miedo","tenes miedo de mi","tienes miedo de mi"],
    [["miedo","asusto"],["mi","me"]]
  )){
    const p=state.people.find(x=>x.name===known);
    if(!p)say("Todavía no te conozco lo suficiente.");
    else {
      const b=ensureBond(p);
      say(b.fear>=67?"Sí. Me das miedo y necesito varias interacciones tranquilas para que eso cambie.":b.fear>=42?"Un poquito. Todavía estoy algo cauteloso con vos.":"No. No siento que me des miedo.");
    }
    return true;
  }

  if(intentMatches(text,
    ["confias en mi","confías en mí","me tenes confianza","me tienes confianza","te caigo bien","te caigo mal","me queres","me quieres"],
    [["confia","confias","confías","caigo","queres","quieres","confianza"],["mi","me"]]
  )){
    const p=state.people.find(x=>x.name===known);
    if(!p)say("Todavía no te conozco lo suficiente.");
    else say(`Ahora mismo ${relationText(p)}. Es un sentimiento bastante estable y cambia de a poquito.`);
    return true;
  }

  return false;
}



function curriculumSubject(subject){
  const cur=window.ROBOTITO_CURRICULUM;
  if(!cur)return null;
  const n=normalizeText(subject);
  for(const [name,data] of Object.entries(cur.subjects||{})){
    const aliases=[name,...(data.aliases||[])].map(normalizeText);
    if(aliases.some(a=>n.includes(a)||a.includes(n)))return {name,...data};
  }
  return null;
}
function levenshtein(a,b){
  a=normalizeText(a);b=normalizeText(b);
  const m=Array.from({length:a.length+1},(_,i)=>[i]);
  for(let j=1;j<=b.length;j++)m[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return m[a.length][b.length];
}
function correctAcademicTranscript(text,subject){
  const info=curriculumSubject(subject);
  if(!info)return {text,changes:[]};
  const terms=(info.terms||[]).filter(t=>!t.includes(" "));
  const words=text.split(/(\s+)/);
  const changes=[];
  const corrected=words.map(token=>{
    if(/^\s+$/.test(token))return token;
    const clean=normalizeText(token);
    if(clean.length<5)return token;
    let best=null,bestD=99;
    for(const term of terms){
      const t=normalizeText(term);
      if(Math.abs(t.length-clean.length)>2)continue;
      const d=levenshtein(clean,t);
      if(d<bestD){bestD=d;best=term;}
    }
    if(best && bestD<=1 && normalizeText(best)!==clean){
      changes.push({from:token,to:best});
      const cap=/^[A-ZÁÉÍÓÚÑ]/.test(token);
      return cap?best.charAt(0).toUpperCase()+best.slice(1):best;
    }
    return token;
  }).join("");
  return {text:corrected,changes};
}
function splitEvidenceSentences(text){
  const clean=String(text||"").replace(/\s+/g," ").trim();
  if(!clean)return [];
  let parts=clean.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ0-9¿¡])/).map(x=>x.trim()).filter(Boolean);
  if(parts.length===1&&clean.length>320){
    parts=clean.split(/\s*[;•]\s*|\s+(?=(?:Además|También|Por eso|Entonces|En cambio|Sin embargo|Finalmente)\b)/i)
      .map(x=>x.trim()).filter(Boolean);
  }
  return parts.length?parts:[clean];
}
const CLASS_STOPWORDS=new Set([
  "que","cual","cuales","como","cuando","donde","quien","quienes","cuanto","cuantos","porque","por","para",
  "de","del","la","el","las","los","un","una","unos","unas","y","o","en","a","con","sin","sobre","es","son",
  "fue","era","eran","hay","habia","había","me","te","se","lo","le","esto","eso","esta","este","esa",
  "decime","dime","contame","cuentame","explicame","explica","recordame","acordate","quiero","saber",
  "clase","profesor","profesora","profe","dijo","dijeron","hablo","habló","explico","explicó"
]);
const CLASS_SYNONYM_GROUPS=[
  ["impulso","impulsos"],
  ["cantidad","momentum","momento"],
  ["movimiento","movimientos"],
  ["choque","choques","colision","colisión","colisiones"],
  ["fuerza","fuerzas"],
  ["velocidad","rapidez"],
  ["masa","masas"],
  ["energia","energía","energetico","energético"],
  ["conservar","conserva","conservacion","conservación"],
  ["vacuna","vacunas","vacunacion","vacunación"],
  ["anticuerpo","anticuerpos","inmunidad","inmune"],
  ["celula","célula","celulas","células"],
  ["problema","problemas","dificultad","dificultades"],
  ["causa","causas","razon","razón","motivo","motivos"],
  ["consecuencia","consecuencias","efecto","efectos","resultado","resultados"],
  ["ejemplo","ejemplos","caso","casos"],
  ["definir","define","definicion","definición","significa","concepto"],
  ["ventaja","ventajas","beneficio","beneficios"],
  ["desventaja","desventajas","riesgo","riesgos"],
  ["diferencia","diferencias","distingue","comparar","comparacion","comparación"]
];
const CLASS_SYNONYM_MAP=new Map();
CLASS_SYNONYM_GROUPS.forEach((g,i)=>g.forEach(w=>CLASS_SYNONYM_MAP.set(normalizeText(w),"cg"+i)));

function classStemToken(w){
  let x=normalizeText(w);
  if(!x)return "";
  if(CLASS_SYNONYM_MAP.has(x))return CLASS_SYNONYM_MAP.get(x);
  if(x.length>7)x=x.replace(/(?:amientos|imientos|aciones|adores|adoras|encias|mente)$/,"");
  if(x.length>5)x=x.replace(/(?:ando|iendo|ados|adas|idos|idas|acion|ición|cion|iones)$/,"");
  if(x.length>4)x=x.replace(/(?:es|os|as)$/,"");
  else if(x.length>3)x=x.replace(/s$/,"");
  return CLASS_SYNONYM_MAP.get(x)||x;
}
function classQueryTokens(text){
  return normalizeText(text).split(" ")
    .filter(Boolean)
    .filter(w=>w.length>2&&!CLASS_STOPWORDS.has(w))
    .map(classStemToken)
    .filter(Boolean);
}
function classOneEditApart(a,b){
  if(a===b)return true;
  if(a.length<5||b.length<5||Math.abs(a.length-b.length)>1)return false;
  let i=0,j=0,diff=0;
  while(i<a.length&&j<b.length){
    if(a[i]===b[j]){i++;j++;continue;}
    if(++diff>1)return false;
    if(a.length>b.length)i++;
    else if(b.length>a.length)j++;
    else{i++;j++;}
  }
  return diff+(i<a.length||j<b.length?1:0)<=1;
}
function splitEvidenceSentences(text){
  const clean=String(text||"").replace(/\s+/g," ").trim();
  if(!clean)return [];
  let parts=clean.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ0-9¿¡])/).map(x=>x.trim()).filter(Boolean);
  if(parts.length===1&&clean.length>320){
    parts=clean.split(/\s*[;•]\s*|\s+(?=(?:Además|También|Por eso|Entonces|En cambio|Sin embargo|Finalmente)\b)/i)
      .map(x=>x.trim()).filter(Boolean);
  }
  return parts.length?parts:[clean];
}
function materialEvidenceLines(){
  const selectedSubject=normalizeText(state.classSubject||$("#classSubject")?.value||"");
  const selectedTopic=normalizeText(state.classTopic||$("#classTopic")?.value||"");
  return state.academicMaterials.flatMap(m=>(m.chunks||[]).flatMap((chunkText,chunkIndex)=>
    splitEvidenceSentences(chunkText).map((text,sentenceIndex)=>({
      text,
      correctedText:text,
      speaker:"material",
      sourceType:"material",
      subject:m.subject||"Material",
      at:m.at,
      sourceName:m.name,
      chunk:chunkIndex+1,
      sentence:sentenceIndex+1,
      subjectPreferred:!!selectedSubject&&(
        normalizeText(m.subject||"").includes(selectedSubject)||
        selectedSubject.includes(normalizeText(m.subject||""))
      ),
      topicPreferred:!!selectedTopic&&(
        normalizeText(m.topic||"").includes(selectedTopic)||
        selectedTopic.includes(normalizeText(m.topic||""))
      )
    }))
  ));
}
function classEvidenceLines(){
  const selectedSubject=normalizeText(state.classSubject||$("#classSubject")?.value||"");
  const selectedTopic=normalizeText(state.classTopic||$("#classTopic")?.value||"");
  // Search ALL saved transcripts. Subject and topic are ranking hints, never hard filters.
  return state.classLines.flatMap(line=>{
    const sourceText=line.correctedText||line.text||"";
    const correctedParts=splitEvidenceSentences(sourceText);
    const originalParts=splitEvidenceSentences(line.text||sourceText);
    return correctedParts.map((text,i)=>({
      ...line,
      text:originalParts[i]||line.text||text,
      correctedText:text,
      sourceType:"class",
      sourceName:line.speakerName||null,
      sentence:i+1,
      subjectPreferred:!!selectedSubject&&(
        normalizeText(line.subject||"").includes(selectedSubject)||
        selectedSubject.includes(normalizeText(line.subject||""))
      ),
      topicPreferred:!!selectedTopic&&(
        normalizeText(line.topic||"").includes(selectedTopic)||
        selectedTopic.includes(normalizeText(line.topic||""))
      )
    }));
  });
}
async function browserRewrite(prompt){
  try{
    if(window.LanguageModel?.create){
      const session=await window.LanguageModel.create({temperature:.15,topK:2});
      const out=await session.prompt(prompt);
      session.destroy?.();
      return out?.trim()||null;
    }
  }catch(e){console.warn("browser AI",e);}
  return null;
}
function academicTokenSet(text){
  return new Set(classQueryTokens(text));
}
function classEvidenceScore(question,e){
  const qTerms=classQueryTokens(question);
  if(!qTerms.length)return 0;
  const raw=normalizeText(e.correctedText||e.text||"");
  const eTerms=classQueryTokens(raw);
  if(!eTerms.length)return 0;

  const used=new Set();
  let overlap=0;
  for(const q of qTerms){
    let found=-1;
    for(let i=0;i<eTerms.length;i++){
      if(used.has(i))continue;
      const w=eTerms[i];
      if(w===q||w.startsWith(q)||q.startsWith(w)||classOneEditApart(w,q)){found=i;break;}
    }
    if(found>=0){used.add(found);overlap++;}
  }
  if(overlap===0)return 0;

  const coverage=overlap/qTerms.length;
  const precision=overlap/Math.max(overlap,eTerms.length);
  let score=overlap*3.4+coverage*6+precision*1.5;

  // Reward adjacent concepts regardless of filler wording.
  const qRaw=normalizeText(question);
  const content=contentWords(question);
  for(let i=0;i<content.length-1;i++){
    const a=normalizeText(content[i]),b=normalizeText(content[i+1]);
    if(raw.includes(a+" "+b))score+=1.35;
  }

  // Subject context helps but never excludes older transcripts.
  if(e.subjectPreferred)score+=1.0;
  if(e.topicPreferred)score+=1.8;
  if(e.sourceType==="class"&&e.speaker==="teacher")score+=.45;

  // Penalize accidental one-word hits in multi-concept questions.
  if(qTerms.length>=3&&overlap===1&&coverage<.42)return 0;
  if(qTerms.length>=5&&overlap<2)return 0;

  // Direct distinctive term deserves a modest boost.
  if(qTerms.some(t=>t.length>=7&&raw.includes(t)))score+=.8;
  if(raw.length>520)score-=Math.min(1.5,(raw.length-520)/420);

  return score;
}
function hasExplicitClassReference(raw){
  const t=normalizeText(raw);
  return /\b(?:segun|de acuerdo con) (?:la )?(?:clase|transcripcion|profesor|profesora|profe|material cargado)\b/.test(t)
    || /\b(?:en|durante) (?:la|esta|mi) (?:clase|materia|curso)\b/.test(t)
    || /\b(?:transcripcion|material cargado|mis apuntes|los apuntes)\b/.test(t)
    || /\b(?:que|como) (?:dijo|dijeron|explico) (?:el|la|mi)? ?(?:profesor|profesora|profe)\b/.test(t)
    || /\b(?:que )?(?:vimos|estudiamos|aprendimos|hicimos) (?:en clase|en la materia|en el curso)?\b/.test(t)
    || /\b(?:explicame|resume|resumime|recordame) (?:la|esta|mi) clase\b/.test(t);
}
function definitionQuestionCore(raw){
  return normalizeText(raw)
    .replace(/^(?:segun|de acuerdo con)\s+(?:la\s+)?(?:clase|transcripcion|profesor|profesora|profe|material)(?:\s+cargado)?\s*/,"")
    .replace(/^(?:en\s+la\s+clase|en\s+el\s+curso|en\s+la\s+materia)\s*/,"")
    .trim();
}
function isDefinitionQuestion(raw){
  const q=definitionQuestionCore(raw);
  return /^(?:que\s+(?:es|son|significa)|cual(?:es)?\s+es\s+la\s+definicion|defini|define|definime|dame\s+la\s+definicion|que\s+se\s+entiende\s+por)\b/.test(q);
}
function definitionSubject(raw){
  return definitionQuestionCore(raw)
    .replace(/^(?:que\s+(?:es|son|significa)|cual(?:es)?\s+es\s+la\s+definicion(?:\s+de)?|defini(?:me)?|define|dame\s+la\s+definicion(?:\s+de)?|que\s+se\s+entiende\s+por)\s+/,"")
    .replace(/^(?:un|una|el|la|los|las)\s+/,"")
    .replace(/\s+(?:segun|en)\s+(?:la\s+)?(?:clase|materia|transcripcion).*$/,"")
    .trim();
}
function definitionEvidenceQuality(question,evidence){
  if(!isDefinitionQuestion(question))return 1;
  const subject=definitionSubject(question);
  if(!subject)return 0;
  const raw=normalizeText(evidence?.correctedText||evidence?.text||"");
  if(!raw)return 0;
  const subjectTokens=contentWords(subject).map(normalizeText).filter(Boolean);
  if(!subjectTokens.length)return 0;
  const subjectPhrase=normalizeText(subject);
  let at=raw.indexOf(subjectPhrase);
  if(at<0){
    const anchor=subjectTokens.sort((a,b)=>b.length-a.length)[0];
    at=raw.indexOf(anchor);
  }
  if(at<0)return 0;

  // A definition needs an explanatory relation near the requested concept.
  // Merely using it in a calculation ("por permutación nos da x") is not evidence.
  const before=raw.slice(Math.max(0,at-90),at);
  const after=raw.slice(at,Math.min(raw.length,at+150));
  const linkedAfter=/^[^.!?]{0,45}\b(?:es|son|significa|consiste|consisten|representa|representan|indica|indican|mide|miden|se define|se definen|se llama|se llaman|se denomina|se denominan|se calcula|se calculan|se obtiene|se obtienen|se caracteriza|se caracterizan)\b/.test(after.slice(subjectPhrase.length>0&&raw.indexOf(subjectPhrase)===at?subjectPhrase.length:0));
  const linkedBefore=/(?:se define|se llama|se denomina|se entiende|definimos|llamamos|denominamos)(?:\s+como)?[^.!?]{0,55}$/.test(before);
  const explanatory=/\b(?:consiste(?:n)? en|se caracteriza(?:n)? por|sirve(?:n)? para)\b/.test(after.slice(0,120));
  return linkedAfter||linkedBefore||explanatory?1:0;
}
function answerFromClass(question){
  const candidates=[...classEvidenceLines(),...materialEvidenceLines()];
  const definition=isDefinitionQuestion(question);
  const ranked=candidates
    .map(e=>({e,score:classEvidenceScore(question,e)}))
    .filter(x=>x.score>0&&(!definition||definitionEvidenceQuality(question,x.e)>0))
    .sort((a,b)=>b.score-a.score);

  if(!ranked.length)return null;

  const topScore=ranked[0].score;
  const qTerms=classQueryTokens(question);
  // Flexible enough for paraphrases, still strict enough to reject random keyword matches.
  const threshold=qTerms.length<=2?5.2:qTerms.length<=4?6.1:6.8;
  if(topScore<threshold)return null;

  const best=[];
  const seen=new Set();
  for(const item of ranked){
    if(best.length&&item.score<Math.max(threshold,topScore*.48))break;
    const key=normalizeText(item.e.correctedText||item.e.text).slice(0,180);
    if(seen.has(key))continue;
    seen.add(key);
    best.push(item.e);
    if(best.length>=4)break;
  }
  return {evidence:best,score:topScore};
}
function looksLikeClassQuestion(text){
  const t=normalizeText(text);
  if(!t)return false;
  if(hasExplicitClassReference(t))return true;
  const questionish=/^(que|como|por que|porque|cual|cuando|donde|quien|cuanto|explica|explicame|define|decime|dime|contame|recordame|me podes|me puedes|sabes)/.test(t)
    ||/[?¿]/.test(String(text));
  if(!questionish)return false;
  if(!(state.classLines.length||state.academicMaterials.length))return false;
  // A strong evidence match makes it a class question even without saying "clase".
  return !!answerFromClass(text);
}
async function answerClassQuestion(question,{speak=true,render=true,announceMissing=false}={}){
  const found=answerFromClass(question);
  if(!found){
    if(render&&$("#classAnswer")){
      $("#classAnswer").innerHTML='<div class="study-chip">No encontré evidencia suficiente en las transcripciones ni en el material cargado para responder esa pregunta.</div>';
    }
    if(announceMissing&&speak) say("No encontré evidencia suficiente en las transcripciones para contestar eso.",3600);
    return false;
  }
  const answer=await composeAcademicAnswer(question,found.evidence);
  if(render)renderAcademicAnswer(question,answer,found.evidence);
  if(speak)say(spokenAcademicAnswer(question,answer,found.evidence).slice(0,520),6500);
  return true;
}
function renderGeneralAcademicAnswer(question,text,source="",url=""){
  const root=$("#classAnswer");
  if(!root)return;
  const sourceHtml=source
    ?'<div class="class-origin">Fuente: '+(url?'<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(source)+'</a>':escapeHtml(source))+'</div>'
    :"";
  root.innerHTML='<div class="answer-card"><strong>Respuesta</strong><p class="class-answer-text">'+escapeHtml(text)+'</p>'+sourceHtml+'</div>';
}
async function answerGeneralAcademicQuestion(question,{speak=true,render=true}={}){
  const lang=responseLanguage();
  let answer=null,source="",url="";

  if(lang==="es"){
    answer=window.ROBOTITO_PHYSICS_MOMENTUM?.answer?.(question)
      || window.ROBOTITO_COMMON_KNOWLEDGE?.answer?.(question,"es");
    if(answer)source="Conocimiento general de Robotito";
  }else{
    answer=window.ROBOTITO_COMMON_KNOWLEDGE?.answer?.(question,lang);
    if(answer)source="Conocimiento general de Robotito";
  }

  if(!answer){
    const depth=window.ROBOTITO_ROUTER?.responseDepth?.(question)||academicAnswerDepth(question);
    const web=await window.ROBOTITO_WEB_KNOWLEDGE?.answer?.(question,lang,depth);
    if(web?.handled&&web.text){
      answer=web.text;
      source=web.source||"Fuente de consulta";
      url=web.url||"";
    }
  }
  if(!answer)return false;
  const shaped=window.ROBOTITO_ROUTER?.shapeAnswer?.(question,answer)||answer;
  if(render)renderGeneralAcademicAnswer(question,shaped,source,url);
  if(speak)say(shaped,readingDisplayTime(shaped,4200),lang);
  return true;
}
function relevantSentenceForAnswer(e,question){
  const units=splitEvidenceSentences(e.correctedText||e.text||"");
  if(!units.length)return "";
  return units
    .map(t=>({t,score:classEvidenceScore(question,{...e,correctedText:t,text:t})}))
    .sort((a,b)=>b.score-a.score)[0].t;
}
function academicAnswerDepth(question){
  const routed=window.ROBOTITO_ROUTER?.responseDepth?.(question);
  if(routed)return routed;
  const q=normalizeText(question);
  const wantsDetail=/(paso a paso|detallad|explica(?:me)?|desarrolla|por que|porque|como funciona|ejemplo|formula|fórmula|demostra|demuestra|compara|diferencia)/.test(q);
  if(wantsDetail)return "detailed";
  const simpleDefinition=isDefinitionQuestion(question)
    || /\b(?:que es|que son|que significa|que se entiende por)\s+(?:un|una|el|la|los|las)?\s*[^?]{1,80}$/.test(q);
  if(simpleDefinition)return "definition";
  return "normal";
}
function trimAcademicAnswer(text,maxChars){
  let clean=String(text||"").replace(/\s+/g," ").trim();
  if(clean.length<=maxChars)return clean;
  const firstSentence=clean.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  if(firstSentence&&firstSentence.length<=maxChars)return firstSentence;
  return clean.slice(0,maxChars-1).replace(/\s+\S*$/,"")+"…";
}
function fallbackAcademicAnswer(question,evidence){
  const depth=academicAnswerDepth(question);
  const best=evidence
    .map(e=>relevantSentenceForAnswer(e,question))
    .filter(Boolean)
    .slice(0,depth==="detailed"?3:depth==="definition"?1:2)
    .map(t=>t.replace(/\b(bueno|o sea|este|eh|tipo)\b/gi,"").replace(/\s+/g," ").trim());

  if(!best.length)return "No tengo información suficiente en la clase ni en el material cargado para responder eso.";

  const first=best[0].replace(/^[,;:\-\s]+/,"");
  if(depth==="definition"){
    return trimAcademicAnswer(first,210);
  }

  const second=best[1]&&normalizeText(best[1])!==normalizeText(first)?best[1]:null;
  const q=normalizeText(question);
  let lead;
  if(q.startsWith("por que")||q.startsWith("porque"))lead="La explicación principal es que ";
  else if(q.startsWith("como"))lead="Lo que se explicó es que ";
  else lead="Según lo trabajado, ";

  let answer=lead+first;
  if(second)answer+=" "+second;
  if(depth==="detailed"&&best[2])answer+=" "+best[2];
  return trimAcademicAnswer(answer,depth==="detailed"?700:360);
}
async function composeAcademicAnswer(question,evidence){
  const depth=academicAnswerDepth(question);
  const compact=evidence.map((e,i)=>{
    const text=relevantSentenceForAnswer(e,question);
    const source=e.sourceType==="material"
      ?`material cargado: ${e.sourceName||e.subject||"archivo"}`
      :`dicho en clase por ${classSpeakerLabel(e)}`;
    return `[${i+1}] (${source}) ${text}`;
  }).join("\n");

  const scopeRule=depth==="definition"
    ?"La pregunta pide solamente una definición. Respondé con UNA sola oración, idealmente de 8 a 22 palabras. No agregues ejemplos, fórmulas, consecuencias, comparaciones ni contexto que no fue pedido."
    :depth==="detailed"
      ?"La persona pidió desarrollo. Explicá con el detalle necesario, pero solo lo que responde a la pregunta."
      :"Respondé directamente en 1 a 3 oraciones. No agregues datos relacionados que no hayan sido pedidos.";

  const prompt=`Respondé en español rioplatense usando SOLAMENTE la evidencia.
Pregunta: ${question}
Evidencia:
${compact}

Reglas:
- ${scopeRule}
- Respondé exactamente lo preguntado y frená cuando ya quedó contestado.
- No copies párrafos largos.
- No incluyas citas textuales, comillas ni etiquetas de fuente; la interfaz las muestra aparte.
- Si la evidencia no alcanza para afirmar algo, decilo explícitamente.
- No agregues conocimiento externo.`;

  const rewritten=await browserRewrite(prompt);
  if(rewritten){
    const clean=rewritten.replace(/^["“]|["”]$/g,"").trim();
    return trimAcademicAnswer(clean,depth==="definition"?220:depth==="detailed"?750:380);
  }
  return fallbackAcademicAnswer(question,evidence);
}
function classSpeakerLabel(e){
  if(e.speakerName)return e.sourceName||e.speakerName;
  if(e.speaker==="teacher")return "profesor/a";
  if(e.speaker==="classmate")return "compañero/a";
  if(e.speaker==="me")return "vos";
  return "la clase";
}
function sourceKindLabel(e){
  return e.sourceType==="material"||e.speaker==="material"?"Material cargado":"Dicho en clase";
}
function sourceDetailLabel(e){
  if(e.sourceType==="material"||e.speaker==="material"){
    return e.sourceName||e.subject||"archivo cargado";
  }
  const who=classSpeakerLabel(e);
  const time=e.at?new Date(e.at).toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit"}):"";
  const subject=e.subject&&e.subject!=="Clase"?e.subject:"";
  const topic=e.topic||"";
  return [subject,topic,who,time].filter(Boolean).join(" · ");
}
function shortEvidenceQuote(e,question,maxChars=210){
  const source=e.sourceType==="class"?(e.text||e.correctedText||""):(e.text||e.correctedText||"");
  const sentences=splitEvidenceSentences(source);
  let quote=sentences
    .map(t=>({t,score:classEvidenceScore(question,{...e,text:t,correctedText:t})}))
    .sort((a,b)=>b.score-a.score)[0]?.t||source;
  quote=quote.replace(/\s+/g," ").trim();
  if(quote.length<=maxChars)return quote;

  const terms=contentWords(question);
  const lower=normalizeText(quote);
  let at=-1;
  for(const term of terms){
    const p=lower.indexOf(term);
    if(p>=0){at=p;break;}
  }
  if(at<0)at=0;
  const start=Math.max(0,at-Math.floor(maxChars*.3));
  let excerpt=quote.slice(start,start+maxChars);
  if(start>0)excerpt="…"+excerpt.replace(/^\S*\s/,"");
  if(start+maxChars<quote.length)excerpt=excerpt.replace(/\s\S*$/,"")+"…";
  return excerpt.trim();
}
function classEvidenceForDisplay(question,evidence,max=2){
  const selected=[];
  const kinds=new Set();
  for(const e of evidence){
    const quote=shortEvidenceQuote(e,question);
    if(!quote)continue;
    const kind=sourceKindLabel(e);
    // Prefer showing both kinds when both actually contributed.
    if(selected.length===1&&kinds.has(kind)){
      const alternative=evidence.find(x=>sourceKindLabel(x)!==kind);
      if(alternative&&alternative!==e)continue;
    }
    selected.push({...e,quote});
    kinds.add(kind);
    if(selected.length>=max)break;
  }
  if(selected.length<max){
    for(const e of evidence){
      if(selected.some(x=>x===e||normalizeText(x.quote)===normalizeText(shortEvidenceQuote(e,question))))continue;
      selected.push({...e,quote:shortEvidenceQuote(e,question)});
      if(selected.length>=max)break;
    }
  }
  return selected;
}
function renderAcademicAnswer(question,answer,evidence){
  const root=$("#classAnswer");
  if(!root)return;
  const shown=classEvidenceForDisplay(question,evidence,2);
  const sourceKinds=[...new Set(shown.map(sourceKindLabel))];

  const citations=shown.map(e=>
    '<div class="class-source-card">'+
      '<div class="class-source-head"><strong>'+escapeHtml(sourceKindLabel(e))+'</strong><span>'+escapeHtml(sourceDetailLabel(e))+'</span></div>'+
      '<blockquote>“'+escapeHtml(e.quote)+'”</blockquote>'+
    '</div>'
  ).join("");

  const origin=sourceKinds.length===2
    ?"Respuesta construida con lo dicho en clase y material cargado."
    :sourceKinds[0]==="Material cargado"
      ?"Respuesta construida a partir del material cargado."
      :"Respuesta construida a partir de lo dicho en clase.";

  root.innerHTML=
    '<div class="answer-card class-grounded-answer">'+
      '<strong>Respuesta</strong>'+
      '<p class="class-answer-text">'+escapeHtml(answer)+'</p>'+
      '<div class="class-origin">'+escapeHtml(origin)+'</div>'+
      '<div class="class-quotes-title">Cita textual</div>'+
      citations+
    '</div>';
}
function spokenAcademicAnswer(question,answer,evidence){
  return answer;
}

function summarizeClass(){
  const lines=classLinesForSubject().filter(l=>l.speaker==="teacher"||l.speaker==="classmate");
  const out=$("#classSummary");
  if(!lines.length){out.innerHTML='<p class="muted">Todavía no tengo suficientes explicaciones de la profesora guardadas.</p>';return;}
  const candidates=lines.filter(l=>l.text.length>35).slice(-80);
  const seen=new Set();
  const selected=[];
  for(const l of candidates.reverse()){
    const key=normalizeText(l.text).split(" ").slice(0,6).join(" ");
    const txt=l.correctedText||l.text;
    if(!seen.has(key)){seen.add(key);selected.push(txt);}
    if(selected.length>=6)break;
  }
  out.innerHTML=selected.reverse().map(t=>'<div class="study-chip">• '+escapeHtml(t)+'</div>').join("");
}
async function askClass(){
  const q=$("#classQuestion").value.trim();
  if(!q)return;
  const out=$("#classAnswer");
  robot.classList.add("thinking");
  setTimeout(()=>robot.classList.remove("thinking"),1200);
  setMood("curious","Robotito está buscando una respuesta precisa en lo aprendido.");
  if(out)out.innerHTML='<div class="study-chip">Buscando en las transcripciones y el material cargado…</div>';
  try{
    const exerciseHandled=await window.ROBOTITO_CLASS_EXERCISES?.handleRequest?.(q,{spoken:true});
    if(exerciseHandled)return;
    const classAnswered=await answerClassQuestion(q,{speak:true,render:true,announceMissing:false});
    if(classAnswered)return;
    const generalAnswered=await answerGeneralAcademicQuestion(q,{speak:true,render:true});
    if(generalAnswered)return;
    if(out)out.innerHTML='<div class="study-chip">No encontré evidencia suficiente en las clases, los materiales ni las fuentes generales disponibles.</div>';
    say("No encontré información suficiente para contestar eso.",3600);
  }catch(e){
    console.warn("class answer",e);
    if(out)out.innerHTML='<div class="study-chip">Tuve un problema al buscar en las transcripciones. La pregunta no se perdió: probá de nuevo.</div>';
    say("Tuve un problema al buscar en las transcripciones. Probá de nuevo.",3500);
  }
}
function makeFlashcards(){
  const lines=classLinesForSubject().filter(l=>l.speaker==="teacher"&&l.text.length>30).slice(-8);
  const out=$("#classAnswer");
  if(!lines.length){out.innerHTML='<div class="study-chip">Todavía no tengo suficiente material.</div>';return;}
  out.innerHTML=lines.map((l,i)=>{
    const words=contentWords(l.text);
    const topic=words.slice(0,3).join(" ")||"este punto";
    return '<div class="study-chip"><strong>Pregunta '+(i+1)+':</strong> ¿Qué explicó la profesora sobre '+escapeHtml(topic)+'?<br><span class="muted">Respuesta: '+escapeHtml(l.text)+'</span></div>';
  }).join("");
  setMood("proud","Robotito preparó tarjetas para estudiar.");
}
function speakerRoleForPerson(name){
  const p=state.people.find(x=>x.name===name);
  return p&&["me","teacher","classmate"].includes(p.role)?p.role:"classmate";
}
function changeClassLineSpeaker(id,value){
  const line=state.classLines.find(l=>l.id===id);
  if(!line)return;
  if(value.startsWith("person:")){
    const name=value.slice(7);
    line.speakerName=name;
    line.speaker=speakerRoleForPerson(name);
    line.speakerConfidence=1;
    const p=state.people.find(x=>x.name===name);
    if(p&&line.voicePrint){
      p.voicePrints=[...(p.voicePrints||[]),line.voicePrint].slice(-5);
      save(KEYS.people,state.people);
    }
    if(p&&line.feature&&["me","teacher","classmate"].includes(p.role))learnSpeaker(p.role,line.feature);
  }else{
    line.speaker=value;
    line.speakerName=null;
    line.speakerConfidence=1;
    if(line.feature&&["me","teacher","classmate"].includes(value))learnSpeaker(value,line.feature);
  }
  save("robotito.classLines.v1",state.classLines);
  renderClassTranscript();
}
function speakerSelectHtml(l){
  const current=l.speakerName?"person:"+l.speakerName:l.speaker;
  const base=[
    ["me","Vos"],["teacher","Profesor/a"],["classmate","Compañero/a"]
  ];
  const people=state.people.map(p=>["person:"+p.name,p.name]);
  return '<select class="class-speaker-select" data-line-id="'+escapeHtml(l.id)+'">'+[...base,...people].map(([v,label])=>'<option value="'+escapeHtml(v)+'" '+(v===current?"selected":"")+'>'+escapeHtml(label)+'</option>').join("")+'</select>';
}
function ensureClassLineIds(){
  let changed=false;
  state.classLines.forEach((l,i)=>{if(!l.id){l.id="legacy-"+l.at+"-"+i;changed=true;}});
  if(changed)save("robotito.classLines.v1",state.classLines);
}
function renderClassTranscript(){
  const root=$("#classTranscript");
  const lines=classLinesForSubject().slice(-40);
  if(!lines.length){root.innerHTML='<p class="muted">Todavía no hay frases guardadas.</p>';return;}
  const first=lines[0];
  const heading='<div class="class-transcript-context"><strong>'+escapeHtml(first.subject||"Clase")+'</strong>'+(first.topic?' <span>›</span> '+escapeHtml(first.topic):'')+'</div>';
  root.innerHTML=heading+lines.map(l=>{
    const cls=l.speaker==="me"?"me":l.speaker==="teacher"?"teacher":"classmate";
    const tag=l.speakerName?l.speakerName:(l.speaker==="me"?"VOS":l.speaker==="teacher"?"PROFESOR/A":"COMPAÑERO/A");
    const txt=l.correctedText||l.text;
    const corr=l.correctedText&&l.correctedText!==l.text?'<div class="muted">Oí: '+escapeHtml(l.text)+'</div>':'';
    const confidence=Number(l.voiceScore??l.speakerConfidence);
    const match=Number.isFinite(confidence)
      ?'<span class="voice-match '+(confidence<.55?'uncertain':'')+'">'+(confidence<.55?'voz dudosa ':'voz ')+Math.round(confidence*100)+'%</span>'
      :'';
    const verify=l.verificationStatus==="verified"
      ?'<span class="fact-badge">✓ verificado en web</span>'
      :l.verificationStatus==="checking"
        ?'<span class="fact-badge pending">verificando…</span>'
        :'';
    const src=(l.verificationSources||[]).length
      ?'<div class="fact-sources">Fuentes: '+l.verificationSources.map(x=>'<a href="'+escapeHtml(x.url)+'" target="_blank" rel="noopener">'+escapeHtml(x.title)+'</a>').join(' · ')+'</div>'
      :'';
    return '<div class="class-line '+cls+'"><div class="class-line-top"><span class="speaker-tag '+cls+'">'+escapeHtml(tag)+'</span>'+speakerSelectHtml(l)+match+verify+'</div>'+escapeHtml(txt)+corr+src+'</div>';
  }).join("");
  root.querySelectorAll(".class-speaker-select").forEach(sel=>sel.addEventListener("change",()=>changeClassLineSpeaker(sel.dataset.lineId,sel.value)));
  root.scrollTop=root.scrollHeight;
}
function updateClassDuration(){
  if(!state.classMode)return;
  const sec=Math.floor((Date.now()-state.classStartedAt)/1000);
  $("#classDuration").textContent=String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");
}

function extractSheetId(url){
  const m=String(url||"").match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m?m[1]:null;
}
async function connectTasksSheet(){
  const url=$("#tasksSheetUrl").value.trim();
  const gid=$("#tasksSheetGid").value.trim()||"0";
  const id=extractSheetId(url);
  if(!id){toast("Ese enlace no parece ser de Google Sheets.");return;}
  localStorage.setItem("robotito.tasksSheetUrl.v1",url);
  localStorage.setItem("robotito.tasksSheetGid.v1",gid);
  state.tasksSheetUrl=url;state.tasksSheetGid=gid;
  await refreshTasks();
}
function csvRows(text){
  const rows=[];let row=[],field="",q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],n=text[i+1];
    if(ch==='"'&&q&&n==='"'){field+='"';i++;}
    else if(ch==='"')q=!q;
    else if(ch===","&&!q){row.push(field);field="";}
    else if((ch==="\n"||ch==="\r")&&!q){if(ch==="\r"&&n==="\n")i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field="";}
    else field+=ch;
  }
  if(field||row.length){row.push(field);rows.push(row);}
  return rows;
}
function taskDoneValue(v){
  const s=normalizeText(v);
  return ["hecho","completo","completado","done","si","sí","true","x","finalizado","entregado"].includes(s);
}
async function refreshTasks(){
  if(!state.tasksSheetUrl){$("#tasksConnectionStatus").textContent="Sin hoja conectada.";return;}
  const id=extractSheetId(state.tasksSheetUrl), gid=state.tasksSheetGid||"0";
  if(!id)return;
  $("#tasksConnectionStatus").textContent="Leyendo la hoja…";
  try{
    const res=await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(gid)}`);
    if(!res.ok)throw new Error("No accesible");
    const rows=csvRows(await res.text());
    if(rows.length<2)throw new Error("Vacía");
    const headers=rows[0].map(h=>normalizeText(h));
    const findCol=names=>headers.findIndex(h=>names.some(n=>h.includes(n)));
    const taskCol=findCol(["tarea","actividad","pendiente","trabajo","descripcion","nombre"]);
    const dueCol=findCol(["fecha","vencimiento","entrega","deadline"]);
    const statusCol=findCol(["estado","status","hecho","complet"]);
    const subjectCol=findCol(["materia","asignatura","curso"]);
    state.tasks=rows.slice(1).map((r,i)=>({
      task:r[taskCol>=0?taskCol:0]||"",
      due:dueCol>=0?r[dueCol]||"":"",
      status:statusCol>=0?r[statusCol]||"":"",
      subject:subjectCol>=0?r[subjectCol]||"":"",
      row:i+2
    })).filter(t=>t.task);
    save("robotito.tasks.v1",state.tasks);
    $("#tasksConnectionStatus").textContent=`Conectada: ${state.tasks.length} filas de tareas.`;
    renderTasks();
  }catch(e){
    $("#tasksConnectionStatus").textContent="No pude leerla. La hoja debe estar compartida/publicada para lectura.";
    renderTasks();
  }
}
function pendingTasks(){
  return state.tasks.filter(t=>!taskDoneValue(t.status));
}
function renderTasks(){
  const root=$("#tasksList");
  const tasks=pendingTasks();
  if(!tasks.length){root.innerHTML='<p class="muted">No veo tareas pendientes.</p>';return;}
  root.innerHTML=tasks.slice(0,30).map(t=>'<div class="task-row"><strong>'+escapeHtml(t.task)+'</strong><div class="task-meta">'+escapeHtml([t.subject,t.due,t.status].filter(Boolean).join(" · "))+'</div></div>').join("");
}
function taskReminderTick(){
  const elapsed=Date.now()-state.sessionStartedAt;
  if(elapsed<20*60*1000)return;
  if(Date.now()-state.lastTaskReminderAt<20*60*1000)return;
  const tasks=pendingTasks();
  if(!tasks.length)return;
  state.lastTaskReminderAt=Date.now();
  const first=tasks[0];
  setMood("focused","Robotito te recuerda que tenés cosas pendientes.");
  say(`Ey, llevamos más de 20 minutos juntos. Tenés ${tasks.length} ${tasks.length===1?"tarea pendiente":"tareas pendientes"}. Una es: ${first.task}`,6000);
}

function isTodayTimestamp(ts){
  const d=new Date(ts),n=new Date();
  return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();
}
function todayClassLines(){return state.classLines.filter(l=>isTodayTimestamp(l.at));}
async function answerWhatLearnedToday(){
  const lines=todayClassLines();
  if(!lines.length){
    say("Hoy todavía no escuché ninguna clase, así que no tengo nada de clase aprendido de hoy.");
    return;
  }
  const important=keySentences(lines.filter(l=>l.speaker!=="me"),5);
  if(!important.length){say("Hoy escuché una clase, pero todavía no tengo suficiente contenido claro para resumirla.");return;}
  const evidence=lines.filter(l=>important.includes(l.correctedText||l.text)).slice(0,5);
  const answer=await composeAcademicAnswer("¿Qué aprendiste hoy?",evidence);
  say(answer.slice(0,320),5600);
}

async function handleSpeech(rawText){
  const interpreted=state.languageMode==="es"?normalizeSpanishSpeechIntent(rawText):rawText;
  const text=normalizeText(interpreted);
  const who=state.currentVoicePerson||state.currentPerson;

  if(/osito\s+osito.*(quien|quién).*(mas|más).*bella.*mundo/.test(text)){
    say("Mi dulce creadora, la más bella a toda hora; si digo otra cosa… me borra sin demora.");
    return;
  }
  const detectedLang=responseLanguage(rawText);

  // Silence is a voice command, so it takes priority over questions and other actions.
  // Robotito keeps recognition active while muted and can therefore hear "ya podés hablar".
  if(handleSilenceCommand(interpreted))return;

  // Exact exercise requests from uploaded academic material have top priority.
  // This prevents "ejercicio 4 de Física" from being treated as a generic class question.
  if(await window.ROBOTITO_CLASS_EXERCISES?.handleRequest?.(interpreted,{spoken:true}))return;

  // Saved classes are used first only when the person explicitly asks about
  // the class, teacher, transcript or uploaded material. General questions must
  // go through curated/general knowledge before class-memory fallback.
  const hasClassMemory=state.classLines.length||state.academicMaterials.length;
  const explicitClassReference=hasExplicitClassReference(interpreted);
  if(hasClassMemory && explicitClassReference){
    robot.classList.add("thinking");
    setTimeout(()=>robot.classList.remove("thinking"),900);
    const answered=await answerClassQuestion(interpreted,{speak:true,render:true,announceMissing:false});
    if(answered)return;
    const root=$("#classAnswer");
    if(root)root.innerHTML='<div class="study-chip">No encontré evidencia suficiente en las transcripciones ni en el material cargado para responder esa pregunta.</div>';
    say("No encontré evidencia suficiente en las transcripciones para contestar eso.",3800);
    return;
  }

  if(handleSpeciesQuestion(interpreted))return;

  // Emotional meaning comes before generic knowledge so Robotito can react naturally
  // to affection, rejection, threats, sad stories, praise and apologies.
  if(window.ROBOTITO_EMOTION_DIALOGUE?.handle?.(interpreted,{rawText,who}))return;

  // One intent router handles live knowledge, object vision and visual math before decorative fallbacks.
  if(await window.ROBOTITO_ROUTER?.handle?.(interpreted,{lang:detectedLang}))return;

  if(drawRequestedThing(interpreted,detectedLang))return;
  if(showRequestedObject(interpreted,detectedLang))return;
  if(await handleSayInLanguageCommand(interpreted))return;
  if(handleLanguageCommand(text)) return;
  if(handleSocialSpeech(text)) return;
  if(/\b(abrazame|abrazá|abraza|dame un abrazo|quiero un abrazo|hug me)\b/.test(text)){hugRobot();return;}
  if(/\b(choca los cinco|chocame los cinco|dame cinco|high five)\b/.test(text)){highFiveRobot();return;}
  if(/\b(juguemos|vamos a jugar|quiero jugar|play with me)\b/.test(text)){playRobot();return;}
  if(answerArithmetic(interpreted,detectedLang))return;
  if(await handleWeatherAndDayQuestions(interpreted))return;
  if(detectedLang==="en" && answerEnglishPersonalQuestion(rawText)) return;
  if(detectedLang==="pt" && answerPortuguesePersonalQuestion(interpreted)) return;
  if(detectedLang==="es" && answerEasyQuestion(interpreted)) return;

  // Dedicated physics knowledge has priority over generic knowledge and class-memory retrieval.
  if(detectedLang==="es"){
    const physicsAnswer=window.ROBOTITO_PHYSICS_MOMENTUM?.answer?.(interpreted);
    if(physicsAnswer){
      const shaped=window.ROBOTITO_ROUTER?.shapeAnswer?.(interpreted,physicsAnswer)||physicsAnswer;
      say(shaped,7600);return;
    }
  }else{
    const qEs=await translateShortPhrase(interpreted,detectedLang,"es");
    const physicsEs=qEs?window.ROBOTITO_PHYSICS_MOMENTUM?.answer?.(qEs):null;
    if(physicsEs){
      const translated=await translateShortPhrase(physicsEs,"es",detectedLang);
      if(translated){
        const shaped=window.ROBOTITO_ROUTER?.shapeAnswer?.(interpreted,translated)||translated;
        sayInLanguage(shaped,detectedLang,8000);return;
      }
    }
  }

  if(detectedLang==="pt"){
    const qEs=await translateShortPhrase(interpreted,"pt","es");
    const answerEs=qEs?window.ROBOTITO_COMMON_KNOWLEDGE?.answer?.(qEs,"es"):null;
    if(answerEs){
      const answerPt=await translateShortPhrase(answerEs,"es","pt");
      if(answerPt){
        const shaped=window.ROBOTITO_ROUTER?.shapeAnswer?.(interpreted,answerPt)||answerPt;
        sayInLanguage(shaped,"pt",5200);return;
      }
    }
  }else{
    const commonAnswer=window.ROBOTITO_COMMON_KNOWLEDGE?.answer?.(interpreted,detectedLang);
    if(commonAnswer){
      const shaped=window.ROBOTITO_ROUTER?.shapeAnswer?.(interpreted,commonAnswer)||commonAnswer;
      say(shaped,4800);return;
    }
  }

  if((text.includes("libro")||text.includes("recomend")) && text.includes("ayer")){
    const last=load(KEYS.lastBook,null);
    say(last?`Ayer te había recomendado “${last.title}”`:"No encuentro una recomendación anterior.");
    return;
  }

  if(/(recomendame|recomiendame|recomenda|recomienda).*(libro)/.test(text) || text==="recomendame un libro"){
    let prompt=interpreted.replace(/recom(i|ie)enda(me)?\s+(un\s+)?libro/i,"").trim();
    if(!prompt) prompt="ficción interesante";
    $("#bookPrompt").value=prompt;
    recommendBook(prompt);
    return;
  }

  if(/(que es esto|que objeto es|que estoy mostrando|reconoce este objeto|reconoc[eé] esto)/.test(text)){
    await detectObjectNow();
    return;
  }

  if(/(que aprendiste hoy|que aprendiste hoy en clase|que viste hoy en clase)/.test(text)){
    await answerWhatLearnedToday();
    return;
  }

  if(/(que aprendiste|que sabes de la clase|explicame la clase|resumime la clase|resume la clase)/.test(text)){
    const found=answerFromClass(interpreted);
    if(found){
      const answer=await composeAcademicAnswer(interpreted,found.evidence);
      renderAcademicAnswer(interpreted,answer,found.evidence);
      say(spokenAcademicAnswer(interpreted,answer,found.evidence).slice(0,520),6500);
      return;
    }
    summarizeClass();
    say("Abrí la pestaña Clase: ahí te dejé lo que pude recuperar.",4000);
    return;
  }

  const nice=["te quiero","te amo","sos lindo","sos tierno","gracias robotito","que lindo","hermoso","precioso"];
  const mean=["te odio","sos feo","callate","tonto","molesto","idiota"];

  if(nice.some(x=>text.includes(x))){
    changeMoodScore(4);
    adjustBond(who,{affection:.85,trust:.60,irritation:-.35,fear:-.18});
    setMood("happy","Robotito escuchó algo lindo y se puso contento.");
    animatePet();
    animateAffection();
  }
  if(mean.some(x=>text.includes(x))){
    changeMoodScore(-5);
    adjustBond(who,{affection:-.80,trust:-1.15,irritation:1.80});
    setMood("sad","Eso lo dejó un poquito triste.");
    say("Eso no me gustó.");
    return;
  }
  if(/[?¿]/.test(rawText)||/^(que|como|cual|cuando|donde|por que|porque|quien|cuanto|puedes|podes|what|how|which|when|where|why|who|can|do|does|is|are)\b/.test(text)){
    const depth=window.ROBOTITO_ROUTER?.responseDepth?.(interpreted)||"normal";
    const webAnswer=await window.ROBOTITO_WEB_KNOWLEDGE?.answer?.(interpreted,detectedLang,depth);
    if(webAnswer?.handled&&webAnswer.text){
      const shaped=window.ROBOTITO_ROUTER?.shapeAnswer?.(interpreted,webAnswer.text)||webAnswer.text;
      say(shaped,readingDisplayTime(shaped,4200),detectedLang);
      return;
    }
    if(hasClassMemory&&looksLikeClassQuestion(interpreted)){
      const answered=await answerClassQuestion(interpreted,{speak:true,render:true,announceMissing:false});
      if(answered)return;
    }
    say(detectedLang==="en"?"I don't know that one yet, but I understood the question.":"Esa todavía no la sé, pero entendí que me hiciste una pregunta.");
  }
}

async function detectLoop(){
  if(!state.started)return;
  if(document.hidden){setTimeout(detectLoop,2200);return;}
  try{
    const dets=await faceapi.detectAllFaces(camera,new faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.45}))
      .withFaceLandmarks().withFaceDescriptors();
    state.lastDetections=dets;
    if(dets.length){
      state.lastSeenAt=Date.now();
      $("#seenLabel").textContent=dets.length===1?"1 persona":dets.length+" personas";
      followFace(dets[0].detection.box);
      recognize(dets[0]);
      detectEating(dets[0]);
    }else{
      $("#seenLabel").textContent="a nadie";
      if(Date.now()-state.lastFaceConfirmedAt>2600)state.currentPerson=null;
      resetEyes();
    }
  }catch(e){console.warn("vision",e);}
  setTimeout(detectLoop,700);
}

function buildMatcher(){
  const labeled=[];
  for(const p of state.people){
    if(Array.isArray(p.descriptors)&&p.descriptors.length){
      labeled.push(new faceapi.LabeledFaceDescriptors(p.name,p.descriptors.map(d=>new Float32Array(d))));
    }
  }
  state.faceMatcher=labeled.length?new faceapi.FaceMatcher(labeled,.50):null;
}

function dayPartGreeting(){
  const h=new Date().getHours(),lang=responseLanguage();
  if(lang==="en"){
    if(h>=6&&h<12)return "Good morning";
    if(h>=12&&h<18)return "Good afternoon";
    return "Good evening";
  }
  if(lang==="pt"){
    if(h>=6&&h<12)return "Bom dia";
    if(h>=12&&h<18)return "Boa tarde";
    return "Boa noite";
  }
  if(h>=6&&h<12)return "Buenos días";
  if(h>=12&&h<18)return "Buenas tardes";
  return "Buenas noches";
}
function wakeFromNight(){
  state.nightSleep=false;
  state.sleeping=false;
  stopSnoring();
  clearBlinkState();
  clearTimeout(state.heartEyeTimer);
  robot.classList.remove("heart-eyes");
  robot.classList.remove("sleeping");
  resetEyes();
  setMood("calm","Robotito está despierto otra vez.");
}
function sleepForNight(){
  state.nightSleep=true;
  state.sleeping=true;
  clearBlinkState();
  clearTimeout(state.heartEyeTimer);
  robot.classList.remove("heart-eyes");
  resetEyes();
  robot.classList.add("sleeping");
  setMood("sleepy","Robotito se fue a dormir porque le dijeron buenas noches.");
  startSnoring();
}
function handleSocialSpeech(text){
  const known=state.currentVoicePerson||state.currentPerson;
  const name=known?", "+known:"";
  const enName=known?", "+known:"";

  if(/\b(achu|achis|achoo|atchoo|atishoo)\b/.test(text)){
    const lang=responseLanguage();
    sayInLanguage(lang==="en"?"Bless you!":lang==="pt"?"Saúde!":"¡Salud!",lang);
    return true;
  }
  if(/\b(bom dia)\b/.test(text)){wakeFromNight();sayInLanguage("Bom dia"+enName+".","pt");return true;}
  if(/\b(boa tarde)\b/.test(text)){wakeFromNight();sayInLanguage("Boa tarde"+enName+".","pt");return true;}
  if(/\b(boa noite)\b/.test(text)){sayInLanguage("Boa noite"+enName+". Durma bem.","pt");setTimeout(sleepForNight,700);return true;}
  if(/\b(ola|olá|oi|opa)\b/.test(text)){wakeFromNight();sayInLanguage("Olá"+enName+".","pt");return true;}
  if(/\b(tchau|adeus|ate logo|até logo|ate mais|até mais)\b/.test(text)){sayInLanguage(sample(["Tchau"+enName+".","Até logo"+enName+".","Se cuida"+enName+"."]),"pt");return true;}
  if(/\b(obrigado|obrigada|muito obrigado|muito obrigada)\b/.test(text)){sayInLanguage(sample(["De nada.","Por nada.","Sempre que quiser."]),"pt");return true;}
  if(/\b(desculpa|desculpe|sinto muito)\b/.test(text)){sayInLanguage(sample(["Tudo bem.","Sem problema.","Desculpa aceita."]),"pt");return true;}

  if(/\b(good morning)\b/.test(text)){wakeFromNight();say("Good morning"+enName+".");return true;}
  if(/\b(good afternoon)\b/.test(text)){wakeFromNight();say("Good afternoon"+enName+".");return true;}
  if(/\b(good night|goodnight)\b/.test(text)){say("Good night"+enName+". Sleep well.");setTimeout(sleepForNight,700);return true;}
  if(/\b(hello|hi|hey there|hiya)\b/.test(text)){wakeFromNight();say("Hello"+enName+".");return true;}
  if(/\b(bye|goodbye|see you|see you later|i have to go)\b/.test(text)){say(sample(["Bye"+enName+".","See you later"+enName+".","Take care"+enName+"."]));return true;}
  if(/\b(thank you|thanks|thank you very much)\b/.test(text)){say(sample(["You're welcome.","No problem.","Any time."]));return true;}
  if(/\b(sorry|i'm sorry|excuse me)\b/.test(text)){say(sample(["It's okay.","No problem.","Apology accepted."]));return true;}

  if(/\b(buenos dias|buen dia)\b/.test(text)){
    wakeFromNight();
    say("Buenos días"+name+".");
    return true;
  }
  if(/\b(buenas tardes|buena tarde)\b/.test(text)){
    wakeFromNight();
    say("Buenas tardes"+name+".");
    return true;
  }
  if(/\b(buenas noches|buena noche)\b/.test(text)){
    say(sample(["Buenas noches"+name+". Que descanses.","Buenas noches"+name+". Me voy a dormir.","Que descanses"+name+". Buenas noches."]));
    setTimeout(sleepForNight,700);
    return true;
  }
  if(/\b(chau|chao|adios|hasta luego|nos vemos|me voy|hasta manana|hasta mañana|bye)\b/.test(text)){
    say(sample(["Chau"+name+".","Nos vemos"+name+".","Hasta luego"+name+".","Que te vaya bien"+name+"."]));
    return true;
  }
  if(/\b(hola|holi|buenas|hey|ey)\b/.test(text)){
    wakeFromNight();
    say(dayPartGreeting()+name+".");
    return true;
  }
  if(/\b(gracias|muchas gracias|te agradezco)\b/.test(text)){
    say(sample(["De nada.","No hay problema.","Para eso estoy.","Cuando quieras."]));
    return true;
  }
  if(/\b(perdon|perdona|disculpa|lo siento)\b/.test(text)){
    say(sample(["Está bien.","Todo bien.","Acepto la disculpa."]));
    return true;
  }
  return false;
}

function greetingFor(p){
  const lang=responseLanguage();
  const category=bondCategory(p);
  const timed=dayPartGreeting()+", "+p.name+".";
  let choices;
  if(lang==="en"){
    if(category==="loves")choices=[`${p.name}! I missed you a little. ♡`,`I'm really happy to see you, ${p.name}.`,timed];
    else if(category==="afraid")choices=[`Oh… hi, ${p.name}. I'll stay over here for now.`,timed];
    else if(category==="dislikes")choices=[`Hello, ${p.name}. I hope you're kind to me today.`,timed];
    else choices=[`Hello, ${p.name}.`,`I recognized you, ${p.name}!`,timed];
  }else if(lang==="pt"){
    if(category==="loves")choices=[`${p.name}! Senti um pouquinho a sua falta. ♡`,`Fico muito feliz em ver você, ${p.name}.`,timed];
    else if(category==="afraid")choices=[`Ah… oi, ${p.name}. Vou ficar aqui por enquanto.`,timed];
    else if(category==="dislikes")choices=[`Olá, ${p.name}. Espero que hoje você seja gentil comigo.`,timed];
    else choices=[`Olá, ${p.name}.`,`Reconheci você, ${p.name}!`,timed];
  }else{
    if(category==="loves")choices=[`¡${p.name}! Te extrañé un poquito ♡`,`¡${p.name}! Me alegra muchísimo verte.`,`Ah, sos vos. Mi persona favorita apareció.`,timed];
    else if(category==="likes"||category==="trusts")choices=[`¡Hola, ${p.name}! Me alegra verte.`,`Te reconocí, ${p.name}.`,`Mirá quién volvió: ${p.name}.`,timed];
    else if(category==="afraid")choices=[`Ah… hola, ${p.name}. Voy a mirarte desde acá.`,`Te reconocí, ${p.name}. Todavía me das un poquito de miedo.`,timed];
    else if(category==="dislikes")choices=[`Hola, ${p.name}. Espero que hoy seas amable conmigo.`,`Sí, te reconocí, ${p.name}.`,timed];
    else if(category==="annoyed"||category==="wary")choices=[`Hola, ${p.name}. Todavía estoy un poquito cauteloso.`,`Te vi, ${p.name}.`,timed];
    else choices=[`Hola, ${p.name}.`,`¡Te reconocí, ${p.name}!`,`¿Qué tal, ${p.name}?`,timed];
  }
  const last=state.greetingHistory[p.name];
  const filtered=choices.filter(x=>x!==last);
  const chosen=sample(filtered.length?filtered:choices);
  state.greetingHistory[p.name]=chosen;
  save(KEYS.greetings,state.greetingHistory);
  return chosen;
}

function recognize(det){
  const now=Date.now();
  if(!state.faceMatcher){
    if(now-state.lastFaceConfirmedAt>2500)state.currentPerson=null;
    return;
  }

  const best=state.faceMatcher.findBestMatch(det.descriptor);
  const known=best.label!=="unknown" && Number.isFinite(best.distance);

  state.faceMatchHistory.push({
    label:known?best.label:"unknown",
    distance:known?best.distance:1,
    t:now
  });
  state.faceMatchHistory=state.faceMatchHistory.filter(x=>now-x.t<5000).slice(-7);

  if(!known){
    if(now-state.lastFaceConfirmedAt>2600)state.currentPerson=null;
    return;
  }

  // Once a person is confirmed, a good matching frame keeps that identity stable.
  if(state.currentPerson===best.label && best.distance<=.51){
    state.lastFaceConfirmedAt=now;
    return;
  }

  const recent=state.faceMatchHistory.slice(-5);
  const same=recent.filter(x=>x.label===best.label);
  const avg=same.length?same.reduce((sum,x)=>sum+x.distance,0)/same.length:1;
  const last2=recent.slice(-2);
  const twoVeryStrong=last2.length===2
    && last2.every(x=>x.label===best.label&&x.distance<=.43);
  const consensus=same.length>=3 && avg<=.50;

  if(!twoVeryStrong&&!consensus)return;

  const p=state.people.find(x=>x.name===best.label);
  if(!p)return;

  const changed=state.currentPerson!==best.label;
  state.currentPerson=best.label;
  state.lastFaceConfirmedAt=now;
  const lastGreeting=p.lastGreetingAt||0;

  if(changed && now-lastGreeting>25000){
    p.lastGreetingAt=now;
    save(KEYS.people,state.people);
    say(greetingFor(p));
    if(["loves","likes"].includes(bondCategory(p)))animateAffection();
    checkBirthday(p);
  }
}

function countExtendedFingers(hand, handedness){
  let count=0;
  const pairs=[[8,6],[12,10],[16,14],[20,18]];
  for(const [tip,pip] of pairs){
    if(hand[tip].y < hand[pip].y-.025) count++;
  }

  const isRight=(handedness||"").toLowerCase()==="right";
  const thumbExtended=isRight ? hand[4].x < hand[3].x-.025 : hand[4].x > hand[3].x+.025;
  if(thumbExtended) count++;
  return count;
}

function setupHands(){
  try{
    if(typeof Hands==="undefined")return;
    const hands=new Hands({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    hands.setOptions({maxNumHands:4,modelComplexity:0,minDetectionConfidence:.58,minTrackingConfidence:.52});

    hands.onResults(results=>{
      const landmarks=results.multiHandLandmarks||[];
      state.visibleHands=landmarks.length;

      if(landmarks.length){
        state.lastHandSeenAt=Date.now();
        state.visibleFingers=landmarks.reduce((total,hand,index)=>{
          const handed=results.multiHandedness?.[index]?.label||"";
          return total+countExtendedFingers(hand,handed);
        },0);
      }else{
        state.visibleFingers=0;
      }

      const face=state.lastDetections[0];
      if(!face||!landmarks.length){
        state.handNearMouth=false;
        state.handNearMouthDistance=1;
        state.handNearMouthSince=0;
        return;
      }

      const vw=camera.videoWidth||640, vh=camera.videoHeight||480;
      const mouth=face.landmarks.getMouth();
      const mx=mouth.reduce((a,p)=>a+p.x,0)/mouth.length/vw;
      const my=mouth.reduce((a,p)=>a+p.y,0)/mouth.length/vh;

      let minDist=1;
      for(const hand of landmarks){
        const points=[4,8,12,16,20,5,9].map(i=>hand[i]);
        for(const p of points)minDist=Math.min(minDist,Math.hypot(p.x-mx,p.y-my));
      }
      const near=minDist<.085;
      if(near&&!state.handNearMouth)state.handNearMouthSince=Date.now();
      if(!near)state.handNearMouthSince=0;
      state.handNearMouth=near;
      state.handNearMouthDistance=minDist;
    });

    const loop=async()=>{
      if(!state.started||state.handsBusy||document.hidden){setTimeout(loop,450);return;}
      state.handsBusy=true;
      try{await hands.send({image:camera});}catch{}
      state.handsBusy=false;
      setTimeout(loop,450);
    };
    loop();
  }catch(e){console.warn("hands",e);}
}

function mouthOpenRatio(landmarks){
  try{
    const pts=landmarks.getMouth();
    const v=Math.hypot(pts[14].x-pts[18].x,pts[14].y-pts[18].y);
    const h=Math.hypot(pts[12].x-pts[16].x,pts[12].y-pts[16].y);
    return h?v/h:0;
  }catch{return 0}
}

let eatHits=0, lastSharedMeal=0;
function detectEating(det){
  const now=Date.now();
  const ratio=mouthOpenRatio(det.landmarks);
  state.mouthHistory.push({t:now,ratio});
  state.mouthHistory=state.mouthHistory.filter(x=>now-x.t<2800);

  const values=state.mouthHistory.map(x=>x.ratio);
  const mouthMotion=values.length>=3?Math.max(...values)-Math.min(...values):0;
  const handStable=state.handNearMouth && state.handNearMouthDistance<.085 && state.handNearMouthSince && now-state.handNearMouthSince>650;
  const mouthReallyOpen=ratio>.145;
  const chewingLikeMotion=mouthMotion>.032;
  const notCurrentlyTalking=now-state.lastTranscriptAt>2200;
  const convincing=handStable && mouthReallyOpen && chewingLikeMotion && notCurrentlyTalking;

  if(convincing)eatHits=Math.min(8,eatHits+1);
  else eatHits=Math.max(0,eatHits-2);

  if(eatHits>=4 && now-lastSharedMeal>120000){
    lastSharedMeal=now;
    feedRobot(true);
    eatHits=0;
    state.mouthHistory=[];
  }
}

function parseBirthdayInput(value){
  const m=String(value||"").trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if(!m)return null;
  const d=+m[1],mo=+m[2],y=+m[3];
  const dt=new Date(y,mo-1,d);
  if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==d)return null;
  return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function formatBirthday(iso){
  const m=String(iso||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${m[3]}/${m[2]}/${m[1]}`:"";
}
function enrollText(es,en,pt){
  return state.languageMode==="en"?en:state.languageMode==="pt"?pt:es;
}
function setEnrollProgress(percent,text=null){
  const bar=$("#enrollProgressBar");
  if(bar)bar.style.width=clamp(percent,0,100)+"%";
  if(text!=null&&$("#enrollStatus"))$("#enrollStatus").textContent=text;
}
function waitMs(ms){return new Promise(r=>setTimeout(r,ms));}
function descriptorDistance(a,b){
  if(!a||!b||a.length!==b.length)return Infinity;
  let sum=0;
  for(let i=0;i<a.length;i++){const d=a[i]-b[i];sum+=d*d;}
  return Math.sqrt(sum);
}
async function captureFaceEnrollment(){
  const stages=[
    {
      msg:enrollText("1/4 · Mirá de frente a la cámara.","1/4 · Look straight at the camera.","1/4 · Olhe de frente para a câmera."),
      count:3
    },
    {
      msg:enrollText("2/4 · Girá apenas la cara hacia un lado.","2/4 · Turn your face slightly to one side.","2/4 · Vire o rosto um pouco para um lado."),
      count:3
    },
    {
      msg:enrollText("3/4 · Ahora girá apenas hacia el otro lado.","3/4 · Now turn slightly to the other side.","3/4 · Agora vire um pouco para o outro lado."),
      count:3
    },
    {
      msg:enrollText("4/4 · Volvé al frente con expresión natural.","4/4 · Face forward again with a natural expression.","4/4 · Volte a olhar de frente, com expressão natural."),
      count:3
    }
  ];

  const samples=[];
  for(let stageIndex=0;stageIndex<stages.length;stageIndex++){
    const stage=stages[stageIndex];
    setEnrollProgress(stageIndex*10,stage.msg);
    await waitMs(1050);

    let got=0;
    const deadline=Date.now()+7500;
    while(got<stage.count&&Date.now()<deadline){
      const dets=await faceapi
        .detectAllFaces(camera,new faceapi.TinyFaceDetectorOptions({inputSize:320,scoreThreshold:.55}))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if(dets.length!==1){
        const msg=dets.length>1
          ?enrollText("Necesito una sola cara en cámara.","I need exactly one face in the camera.","Preciso de apenas um rosto na câmera.")
          :enrollText("No veo la cara con suficiente claridad. Acercate un poco y buscá buena luz.","I can't see the face clearly enough. Move a little closer and use better light.","Não vejo o rosto com clareza suficiente. Chegue um pouco mais perto e procure boa luz.");
        setEnrollProgress(stageIndex*10+(got/stage.count)*10,msg);
        await waitMs(420);
        continue;
      }

      const det=dets[0];
      const vw=camera.videoWidth||640;
      const vh=camera.videoHeight||480;
      const box=det.detection.box;
      const largeEnough=box.width/vw>=.17 && box.height/vh>=.20;
      if(!largeEnough){
        setEnrollProgress(stageIndex*10+(got/stage.count)*10,
          enrollText("Acercate un poquito más a la cámara.","Move a little closer to the camera.","Chegue um pouquinho mais perto da câmera."));
        await waitMs(420);
        continue;
      }

      const descriptor=[...det.descriptor];
      const tooCloseToLast=samples.length
        && descriptorDistance(descriptor,samples.at(-1))<.015;
      if(!tooCloseToLast||Date.now()+1200>deadline){
        samples.push(descriptor);
        got++;
        setEnrollProgress(stageIndex*10+(got/stage.count)*10,stage.msg+"  "+got+"/"+stage.count);
      }
      await waitMs(360);
    }

    if(got<2){
      setEnrollProgress(stageIndex*10,
        enrollText("No conseguí suficientes muestras buenas de esa posición. Probá otra vez con más luz.","I couldn't get enough good samples from that angle. Try again with better light.","Não consegui amostras boas suficientes desse ângulo. Tente novamente com mais luz."));
      return null;
    }
  }

  if(samples.length<9)return null;
  setEnrollProgress(45,enrollText("Cara aprendida. Ahora voy con la voz.","Face learned. Now I'll learn the voice.","Rosto aprendido. Agora vou aprender a voz."));
  return samples;
}
function collectNewVoiceSamples(startAt,map){
  for(const sample of state.recentVoicePrints){
    if(sample.t>=startAt&&!map.has(sample.t)){
      map.set(sample.t,sample);
    }
  }
}
async function captureEnrollmentVoice(){
  const wasRecognitionWanted=state.recognitionWanted;
  state.enrollmentActive=true;
  window.speechSynthesis?.cancel?.();
  state.speaking=false;
  state.recentVoicePrints=[];

  if(isMobileSpeech()&&window.RobotitoLocalASR?.active){
    window.RobotitoLocalASR.pause(true);
  }else{
    state.recognitionWanted=false;
    discardRecognition();
  }

  const armAt=Date.now();
  const captured=new Map();
  let voiceStarted=false;
  let firstVoiceAt=0;
  let lastCapturedAt=0;
  const targetSamples=84;
  const minimumSamples=55;

  try{
    setEnrollProgress(48,enrollText(
      "Voz · Cuando estés listo, empezá a hablar. No voy a contar tiempo hasta escucharte de verdad.",
      "Voice · Start speaking when you're ready. I won't count time until I actually hear you.",
      "Voz · Quando estiver pronto, comece a falar. Não vou contar tempo até realmente ouvir você."
    ));

    // Arming phase: wait for a sustained cluster, not one noise spike.
    while(Date.now()-armAt<30000&&!voiceStarted){
      const recent=state.recentVoicePrints.filter(x=>x.t>=armAt&&Date.now()-x.t<1100);
      if(recent.length>=6){
        voiceStarted=true;
        firstVoiceAt=Math.min(...recent.map(x=>x.t));
        captured.clear();
        collectNewVoiceSamples(firstVoiceAt,captured);
        lastCapturedAt=Date.now();
        break;
      }
      await waitMs(120);
    }

    if(!voiceStarted){
      setEnrollProgress(48,enrollText(
        "No llegué a detectar una voz. El registro no empezó: podés intentarlo de nuevo y hablar cuando veas «esperando que hables».",
        "I didn't detect a voice. Registration never started; try again and speak when you see «waiting for speech».",
        "Não detectei uma voz. O registro não começou; tente novamente e fale quando aparecer «esperando você falar»."
      ));
      return {prints:[],quality:0,error:"no-speech",voicedSeconds:0};
    }

    const captureDeadline=Date.now()+45000;
    while(Date.now()<captureDeadline&&captured.size<targetSamples){
      const before=captured.size;
      collectNewVoiceSamples(firstVoiceAt,captured);
      if(captured.size>before)lastCapturedAt=Date.now();

      const fraction=Math.min(1,captured.size/targetSamples);
      const pct=50+fraction*44;
      let msg;
      if(Date.now()-lastCapturedAt>2800){
        msg=enrollText(
          "Te dejé de escuchar. El progreso está pausado; seguí hablando cuando quieras.",
          "I stopped hearing you. Progress is paused; keep speaking when you're ready.",
          "Parei de ouvir você. O progresso está pausado; continue falando quando quiser."
        );
      }else if(fraction<.34){
        msg=enrollText(
          "Te escucho. Seguí hablando con naturalidad; contame cualquier cosa.",
          "I hear you. Keep speaking naturally; tell me anything.",
          "Estou ouvindo. Continue falando naturalmente; conte qualquer coisa."
        );
      }else if(fraction<.70){
        msg=enrollText(
          "Bien. Ahora decí otra frase distinta para que aprenda mejor tu voz.",
          "Good. Now say a different sentence so I learn your voice better.",
          "Ótimo. Agora diga uma frase diferente para eu aprender melhor sua voz."
        );
      }else{
        msg=enrollText(
          "Casi está. Una última frase natural, sin acercarte más al micrófono.",
          "Almost done. One last natural sentence, without moving closer to the microphone.",
          "Quase pronto. Uma última frase natural, sem se aproximar mais do microfone."
        );
      }
      setEnrollProgress(pct,msg);
      await waitMs(110);
    }

    const ordered=[...captured.values()].sort((a,b)=>a.t-b.t);
    if(ordered.length<minimumSamples){
      setEnrollProgress(50,enrollText(
        "Escuché algo, pero no junté suficiente voz real. Necesito varios segundos efectivos hablando; los silencios no cuentan.",
        "I heard you, but I didn't collect enough real speech. I need several actual seconds of speaking; silence doesn't count.",
        "Ouvi você, mas não consegui voz real suficiente. Preciso de vários segundos efetivos de fala; silêncio não conta."
      ));
      return {prints:[],quality:0,error:"too-short",voicedSeconds:ordered.length*.09};
    }

    const vectors=ordered.map(x=>x.vector);
    const validationCount=Math.max(10,Math.min(16,Math.floor(vectors.length*.18)));
    const training=vectors.slice(0,-validationCount);
    const validation=vectors.slice(-validationCount);
    const groupCount=Math.min(8,Math.max(5,Math.floor(training.length/9)));
    const groupSize=Math.ceil(training.length/groupCount);
    const prints=[];
    for(let i=0;i<training.length;i+=groupSize){
      const avg=averageVoiceVectors(training.slice(i,i+groupSize));
      if(avg)prints.push(avg);
    }

    const profileMean=averageVoiceVectors(prints);
    const validationPrint=averageVoiceVectors(validation);
    const verification=cosineSimilarity(profileMean,validationPrint);
    const internal=prints.length
      ?prints.reduce((sum,p)=>sum+cosineSimilarity(p,profileMean),0)/prints.length
      :0;
    const quality=clamp((verification*.58+internal*.42),0,1);

    if(verification<.54||prints.length<4){
      setEnrollProgress(55,enrollText(
        "Las muestras de voz no fueron consistentes entre sí. Es mejor repetir el registro en un lugar más silencioso.",
        "The voice samples were not consistent enough. It's better to repeat registration in a quieter place.",
        "As amostras de voz não foram consistentes o suficiente. É melhor repetir o registro em um lugar mais silencioso."
      ));
      return {prints:[],quality,error:"inconsistent",voicedSeconds:ordered.length*.09};
    }

    setEnrollProgress(96,enrollText(
      "Voz verificada. Ya tengo varias muestras distintas de la misma voz.",
      "Voice verified. I now have several different samples of the same voice.",
      "Voz verificada. Agora tenho várias amostras diferentes da mesma voz."
    ));
    return {prints,quality,verification,voicedSeconds:ordered.length*.09};
  }finally{
    state.enrollmentActive=false;
    if(isMobileSpeech()&&window.RobotitoLocalASR?.active){
      setTimeout(()=>window.RobotitoLocalASR.pause(false),250);
    }else{
      state.recognitionWanted=wasRecognitionWanted;
      if(wasRecognitionWanted&&state.started)setTimeout(()=>startListeningCycle(false),350);
    }
  }
}

async function enrollPerson(){
  const name=$("#personName").value.trim();
  const birthdayRaw=$("#personBirthday").value.trim();
  const birthday=birthdayRaw?parseBirthdayInput(birthdayRaw):"";
  const role=$("#personRole")?.value||"other";
  const btn=$("#enrollBtn");

  if(!name)return toast("Escribí el nombre.");
  if(birthdayRaw&&!birthday)return toast("Usá el cumpleaños como DD/MM/AAAA.");
  if(!state.started)return toast("Primero activá cámara y micrófono.");
  if(state.enrollmentActive)return;

  btn.disabled=true;
  setEnrollProgress(0,enrollText(
    "Voy a tomar varias muestras. Quedate frente a la cámara.",
    "I'll take several samples. Stay in front of the camera.",
    "Vou tirar várias amostras. Fique em frente à câmera."
  ));

  try{
    const samples=await captureFaceEnrollment();
    if(!samples){
      setEnrollProgress(0,enrollText(
        "No pude registrar la cara con suficiente calidad. Probá con buena luz y sin otras personas en cámara.",
        "I couldn't register the face with enough quality. Try good lighting with no other people in frame.",
        "Não consegui registrar o rosto com qualidade suficiente. Tente com boa luz e sem outras pessoas na câmera."
      ));
      return;
    }

    const voiceCapture=await captureEnrollmentVoice();
    const voicePrints=voiceCapture?.prints||[];
    const existing=state.people.find(p=>p.name.toLowerCase()===name.toLowerCase());

    if(existing){
      existing.descriptors=[...(existing.descriptors||[]),...samples].slice(-36);
      existing.birthday=birthday||existing.birthday;
      existing.role=role;
      existing.faceEnrolledAt=Date.now();
      existing.faceSampleCount=existing.descriptors.length;
      if(voicePrints.length){
        existing.voicePrints=[...(existing.voicePrints||[]),...voicePrints].slice(-24);
        existing.voiceQuality=voiceCapture.quality;
        existing.voiceEnrolledAt=Date.now();
      }
    }else{
      state.people.push({
        name,birthday,role,
        descriptors:samples,
        voicePrints,
        voiceQuality:voicePrints.length?voiceCapture.quality:null,
        faceSampleCount:samples.length,
        faceEnrolledAt:Date.now(),
        voiceEnrolledAt:voicePrints.length?Date.now():null,
        relationship:50,
        createdAt:Date.now()
      });
    }

    save(KEYS.people,state.people);
    state.people.forEach(ensureBond);
    save(KEYS.people,state.people);
    buildMatcher();
    renderPeople();
    state.faceMatchHistory=[];

    if(voicePrints.length){
      const q=voiceCapture.quality>=.84
        ?enrollText("muy buena","very good","muito boa")
        :voiceCapture.quality>=.72
          ?enrollText("buena","good","boa")
          :enrollText("aceptable","acceptable","aceitável");
      setEnrollProgress(100,enrollText(
        `Listo: guardé ${samples.length} muestras de cara y ${voicePrints.length} perfiles de voz de ${name}. Calidad de voz: ${q}.`,
        `Done: I saved ${samples.length} face samples and ${voicePrints.length} voice profiles for ${name}. Voice quality: ${q}.`,
        `Pronto: salvei ${samples.length} amostras do rosto e ${voicePrints.length} perfis de voz de ${name}. Qualidade da voz: ${q}.`
      ));
      say(enrollText(
        `Listo, ${name}. Ahora tengo una muestra mucho mejor de tu cara y tu voz.`,
        `Done, ${name}. I now have a much better sample of your face and voice.`,
        `Pronto, ${name}. Agora tenho uma amostra muito melhor do seu rosto e da sua voz.`
      ));
    }else{
      setEnrollProgress(100,enrollText(
        `Guardé bien la cara de ${name}, pero no guardé la voz porque no tuvo suficiente calidad. Podés repetir el registro cuando quieras.`,
        `I saved ${name}'s face well, but I didn't save the voice because its quality wasn't high enough. You can repeat registration anytime.`,
        `Salvei bem o rosto de ${name}, mas não salvei a voz porque a qualidade não foi suficiente. Você pode repetir o registro quando quiser.`
      ));
    }
  }catch(e){
    console.warn("enrollment",e);
    setEnrollProgress(0,enrollText(
      "Algo falló durante el registro. Probá otra vez con buena luz y poco ruido.",
      "Something failed during registration. Try again with good lighting and little noise.",
      "Algo falhou durante o registro. Tente novamente com boa luz e pouco ruído."
    ));
  }finally{
    btn.disabled=false;
  }
}

function checkBirthday(p){
  if(!p.birthday)return;
  const now=new Date();
  const d=new Date(p.birthday+"T12:00:00");
  if(now.getMonth()===d.getMonth()&&now.getDate()===d.getDate()) birthdayParty(p.name);
}

function birthdayParty(name){
  $("#birthdayText").textContent=`¡Feliz cumpleaños, ${name}! 🎉`;
  $("#birthdayScene").classList.remove("hidden");
  setMood("happy","Robotito reconoció a alguien que cumple años.");
  confetti(90);
  setTimeout(()=>$("#birthdayScene").classList.add("hidden"),5000);
}

function confetti(n=60){
  const layer=$("#confettiLayer");
  for(let i=0;i<n;i++){
    const c=document.createElement("div");
    c.className="confetti";
    c.style.left=Math.random()*100+"vw";
    c.style.background=`hsl(${Math.random()*360} 75% 72%)`;
    c.style.setProperty("--dx",(Math.random()*240-120)+"px");
    c.style.animationDuration=(2+Math.random()*2.8)+"s";
    layer.appendChild(c);
    setTimeout(()=>c.remove(),5200);
  }
}

function clearActionClasses(){
  ["pet-happy","eating","poked"].forEach(c=>robot.classList.remove(c));
}
function animatePet(){
  clearActionClasses();
  robot.classList.add("pet-happy");
  setTimeout(()=>robot.classList.remove("pet-happy"),1500);
}
function animateEat(){
  clearActionClasses();
  robot.classList.add("eating");
  setTimeout(()=>robot.classList.remove("eating"),1400);
}
function animatePoke(){
  clearActionClasses();
  robot.classList.add("poked");
  setTimeout(()=>robot.classList.remove("poked"),900);
}

function feedRobot(shared=false){
  localStorage.setItem(KEYS.lastFed,String(Date.now()));
  state.hunger=0;
  changeMoodScore(shared?2:4);
  adjustBond(state.currentVoicePerson||state.currentPerson,{affection:shared?.35:.60,trust:shared?.25:.45,irritation:-.18});
  const line=shared?"¿Comemos juntos? "+speciesLine("feed"):speciesLine("feed");
  setMood("happy",line);
  speciesAct("feed",1600);
  animateEat();
  say(line);
  updateMeters();
}

function petRobot(){
  changeMoodScore(5);
  adjustBond(state.currentVoicePerson||state.currentPerson,{affection:.75,trust:.50,fear:-.18,irritation:-.30});
  const line=speciesLine("pet");
  setMood("happy",line);
  speciesAct("pet",1500);
  animatePet();
  animateAffection();
  say(line);
}

function temporaryRobotClass(cls,ms=1400){
  robot.classList.remove(cls);
  void robot.offsetWidth;
  robot.classList.add(cls);
  setTimeout(()=>robot.classList.remove(cls),ms);
}
function hugRobot(){
  changeMoodScore(6);
  adjustBond(state.currentVoicePerson||state.currentPerson,{affection:1.05,trust:.75,fear:-.30,irritation:-.45});
  const line=speciesLine("hug");
  setMood("affectionate",line);
  temporaryRobotClass("hugging",1700);
  speciesAct("hug",1700);
  animateAffection();
  say(line);
  setTimeout(()=>{if(!state.sleeping&&!state.classMode)setMood("happy");},1800);
}
function highFiveRobot(){
  changeMoodScore(3);
  adjustBond(state.currentVoicePerson||state.currentPerson,{affection:.35,trust:.30,irritation:-.10});
  setMood("excited","Robotito celebró a su manera.");
  temporaryRobotClass("highfive",1200);
  speciesAct("highfive",1300);
  say(sample(["¡Choca esos cinco! ✋","¡Paf! Perfecto.",speciesLine("play")]));
  setTimeout(()=>{if(!state.sleeping&&!state.classMode)setMood("happy");},1300);
}
function playRobot(){
  changeMoodScore(4);
  if(!state.batterySupported)state.energy=clamp(state.energy-2,0,100);
  adjustBond(state.currentVoicePerson||state.currentPerson,{affection:.55,trust:.25,irritation:-.28});
  const line=speciesLine("play");
  setMood("excited",line);
  temporaryRobotClass("playing",2300);
  speciesAct("play",2300);
  say(line);
  setTimeout(()=>{if(!state.sleeping&&!state.classMode)setMood("happy");},2400);
}

function scareRobot(){
  adjustBond(state.currentVoicePerson||state.currentPerson,{fear:2.40,trust:-.45,irritation:.40});
  const line=speciesLine("surprise");
  setMood("scared",line);
  speciesAct("surprise",1000);
  say(line);
  setTimeout(()=>{ if(state.hunger>=95)setMood("hungry"); else setMood("calm","Ya se le pasó el susto."); },900);
}

function pokeRobot(){
  changeMoodScore(-2);
  adjustBond(state.currentVoicePerson||state.currentPerson,{irritation:1.15,trust:-.35,affection:-.20});
  const line=speciesLine("poke");
  setMood("annoyed",line);
  speciesAct("poke",1200);
  animatePoke();
  say(line);
  setTimeout(()=>setMood("calm","Ya se le pasó."),1200);
}

function hungerTick(){
  let last=Number(localStorage.getItem(KEYS.lastFed));
  if(!last){
    last=Date.now();
    localStorage.setItem(KEYS.lastFed,String(last));
  }

  const hours=(Date.now()-last)/36e5;
  state.hunger=clamp(hours/4*100,0,100);

  if(hours>=4) setMood("angry","Robotito está muy enojado porque hace más de 4 horas que no come.");
  else if(hours>=3) setMood("hungry","Robotito tiene muchísima hambre.");
}

function inactivityTick(){
  if(state.nightSleep){
    state.sleeping=true;
    robot.classList.add("sleeping");
    setMood("sleepy","Robotito está durmiendo.");
    return;
  }
  const quietFor=(Date.now()-Math.max(state.lastSeenAt,state.lastHeardAt))/1000;

  if(state.classMode){
    state.sleeping=false;
    robot.classList.remove("sleeping");
    setMood("focused","Robotito está concentrado escuchando la clase.");
    return;
  }

  if(quietFor>150){
    state.sleeping=true;
    robot.classList.add("sleeping");
    startSnoring();
    setMood("sleepy","No ve ni escucha a nadie hace rato. Se quedó dormido.");
    if(!state.batterySupported)state.energy=clamp(state.energy+.35,0,100);
  }else if(quietFor>95){
    state.sleeping=false;
    stopSnoring();
    robot.classList.remove("sleeping");
    setMood("sleepy","Robotito está cabeceando de sueño.");
    if(!state.batterySupported)state.energy=clamp(state.energy-.05,0,100);
  }else if(quietFor>45){
    state.sleeping=false;
    stopSnoring();
    robot.classList.remove("sleeping");
    setMood("bored",speciesLine("idle"));
    maybeSpeciesIdleComment(quietFor);
    if(!state.batterySupported)state.energy=clamp(state.energy-.02,0,100);
  }else{
    const wasSleeping=state.sleeping;
    state.sleeping=false;
    stopSnoring();
    robot.classList.remove("sleeping");
    if(wasSleeping)say(sample(["¿Mm? Ya volviste.","Ah… me despertaste.","¿Qué pasó?"]));
    if(!state.batterySupported)state.energy=clamp(state.energy-.02,0,100);
  }
}

function renderPeople(){
  const root=$("#peopleList");
  root.innerHTML="";
  if(!state.people.length){
    root.innerHTML='<p class="muted">Todavía no recuerda a nadie.</p>';
    return;
  }

  state.people.forEach(p=>{
    const row=document.createElement("div");
    row.className="person-row";
    row.innerHTML=`<strong>${escapeHtml(p.name)}</strong>
      <div class="relation">${relationText(p)}</div>
      <div class="muted">${p.birthday?"Cumple: "+formatBirthday(p.birthday):"Sin cumpleaños cargado"} · ${(p.voicePrints||[]).length?"voz aprendida":"voz no registrada"}</div>
      <div class="muted">cara: ${(p.descriptors||[]).length} muestras · voz: ${(p.voicePrints||[]).length} perfiles${Number.isFinite(p.voiceQuality)?" · calidad "+Math.round(p.voiceQuality*100)+"%":""}</div>
      <div class="bond-detail">${bondDetail(p)}</div>`;
    root.appendChild(row);
  });
}

function renderMemories(){
  const root=$("#memoryList");
  root.innerHTML="";
  const list=[...state.memories].reverse();

  if(!list.length){
    root.innerHTML='<p class="muted">Todavía no guardó recuerdos.</p>';
    return;
  }

  list.slice(0,120).forEach(m=>{
    const row=document.createElement("div");
    row.className="memory-row";
    row.innerHTML=`<strong>${escapeHtml(m.person||"Alguien")}</strong>
      <p>${escapeHtml(m.text)}</p>
      <span class="muted">${m.source==="auto"?"Escuchado · ":"Manual · "}${new Date(m.at).toLocaleString("es-UY")}</span>`;
    root.appendChild(row);
  });
}

function rememberManual(){
  const text=$("#memoryInput").value.trim();
  if(!text)return;
  state.memories.push({person:state.currentPerson||"persona no reconocida",text,at:Date.now(),source:"manual"});
  save(KEYS.memories,state.memories);
  $("#memoryInput").value="";
  renderMemories();
  say("Listo. Eso también lo guardo.");
}

function parseCSV(text){
  const rows=[];let row=[],field="",q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(c=='"'&&q&&n=='"'){field+='"';i++;}
    else if(c=='"')q=!q;
    else if(c==","&&!q){row.push(field);field="";}
    else if((c==="\n"||c==="\r")&&!q){
      if(c==="\r"&&n==="\n")i++;
      row.push(field);
      if(row.some(x=>x!==""))rows.push(row);
      row=[];field="";
    }else field+=c;
  }
  if(field||row.length){row.push(field);rows.push(row);}
  return rows;
}

async function importGoodreads(file){
  const text=await file.text(), rows=parseCSV(text);
  if(rows.length<2)return toast("No pude leer ese CSV.");
  const headers=rows[0].map(h=>h.trim());
  state.library=rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||""])));
  save(KEYS.goodreads,state.library);
  updateLibraryStats();
  toast("Biblioteca importada.");
}

function updateLibraryStats(){
  if(!state.library.length){
    $("#libraryStats").textContent="Biblioteca todavía no importada.";
    return;
  }
  const read=state.library.filter(b=>(b["Exclusive Shelf"]||"").toLowerCase()==="read").length;
  const tbr=state.library.filter(b=>(b["Exclusive Shelf"]||"").toLowerCase()==="to-read").length;
  $("#libraryStats").textContent=`${state.library.length} libros · ${read} leídos · ${tbr} por leer`;
}

function bookText(book){
  return normalizeText([
    book.title||book["Title"],
    ...(book.authors||[book["Author"]]).filter(Boolean),
    ...(book.categories||[]),
    book.description||book["My Review"],
    book["Bookshelves"]
  ].join(" "));
}

const BOOK_STOP_WORDS=new Set([
  "algo","algun","alguna","algunos","algunas","libro","libros","leer","lectura","quiero","quisiera",
  "busco","recomienda","recomendame","recomiendame","para","pero","porque","como","con","sin","que",
  "una","uno","unos","unas","del","las","los","por","muy","mas","más","sea","tenga","sobre","tipo",
  "historia","novela","donde","este","esta","esto","entre","aunque","tambien","también"
]);

const BOOK_CONCEPTS=[
  {terms:["fantasia","fantastico","magia","magico","hechizos"],query:"fantasy magic",labels:["fantasía","magia"]},
  {terms:["ciencia ficcion","espacio","alienigenas","futuro","robots"],query:"science fiction space",labels:["ciencia ficción","espacio"]},
  {terms:["romance","romantico","amor","enemies to lovers"],query:"romance love",labels:["romance"]},
  {terms:["misterio","detective","crimen","asesinato","thriller"],query:"mystery detective thriller",labels:["misterio","suspenso"]},
  {terms:["terror","miedo","horror","escalofriante"],query:"horror",labels:["terror"]},
  {terms:["distopia","distopico","apocalipsis","postapocaliptico"],query:"dystopian post apocalyptic",labels:["distopía"]},
  {terms:["mitologia","mitos","dioses","griega"],query:"mythology retelling",labels:["mitología"]},
  {terms:["familia encontrada","found family","amistad","grupo de amigos"],query:"found family friendship",labels:["amistad","familia encontrada"]},
  {terms:["academia oscura","dark academia","universidad","internado"],query:"dark academia",labels:["academia oscura"]},
  {terms:["acogedor","tranquilo","cozy","tierno","reconfortante"],query:"cozy heartwarming",labels:["lectura reconfortante"]},
  {terms:["triste","emocional","llorar","desgarrador"],query:"emotional heartbreaking",labels:["emocional"]},
  {terms:["divertido","gracioso","humor","comedia"],query:"humorous funny",labels:["humor"]},
  {terms:["aventura","accion","viaje","mision"],query:"adventure action",labels:["aventura"]},
  {terms:["historico","epoca","historia real"],query:"historical fiction",labels:["ficción histórica"]},
  {terms:["juvenil","adolescente","young adult"],query:"young adult",labels:["juvenil"]},
  {terms:["corto","cortito","breve","rapido"],query:"short novel",labels:["lectura breve"]},
  {terms:["largo","saga","extenso"],query:"epic series",labels:["historia extensa"]}
];

const LOCAL_BOOK_CATALOG=[
  {title:"El castillo ambulante",authors:["Diana Wynne Jones"],categories:["fantasía","romance","aventura"],description:"Fantasía cálida, divertida y mágica, con romance, humor y personajes entrañables."},
  {title:"La casa en el mar más azul",authors:["TJ Klune"],categories:["fantasía","familia encontrada","reconfortante"],description:"Una historia tierna sobre pertenencia, prejuicios y una peculiar familia encontrada."},
  {title:"Seis de cuervos",authors:["Leigh Bardugo"],categories:["fantasía","aventura","crimen","familia encontrada"],description:"Una banda de jóvenes inadaptados prepara un golpe imposible en un mundo de fantasía."},
  {title:"El nombre del viento",authors:["Patrick Rothfuss"],categories:["fantasía","magia","aventura"],description:"Fantasía épica centrada en la vida, los talentos y los misterios de un héroe legendario."},
  {title:"Proyecto Hail Mary",authors:["Andy Weir"],categories:["ciencia ficción","espacio","humor","amistad"],description:"Una aventura científica en el espacio, ingeniosa y emotiva, con un gran vínculo de amistad."},
  {title:"Los siete maridos de Evelyn Hugo",authors:["Taylor Jenkins Reid"],categories:["romance","drama","emocional"],description:"Una estrella de Hollywood cuenta su vida, sus ambiciones y una historia de amor decisiva."},
  {title:"Asesinato en el Orient Express",authors:["Agatha Christie"],categories:["misterio","detective","crimen"],description:"Un misterio clásico de habitación cerrada con múltiples sospechosos y un giro memorable."},
  {title:"La canción de Aquiles",authors:["Madeline Miller"],categories:["mitología","romance","triste","histórico"],description:"Relectura emotiva de la mitología griega centrada en Aquiles y Patroclo."},
  {title:"Los juegos del hambre",authors:["Suzanne Collins"],categories:["distopía","acción","juvenil"],description:"Una distopía juvenil de ritmo rápido sobre supervivencia, poder y rebelión."},
  {title:"La paciente silenciosa",authors:["Alex Michaelides"],categories:["thriller","misterio","psicológico"],description:"Un thriller psicológico sobre una pintora que deja de hablar después de un crimen."},
  {title:"Buenos presagios",authors:["Terry Pratchett","Neil Gaiman"],categories:["fantasía","humor","apocalipsis"],description:"Una comedia fantástica irreverente sobre un ángel, un demonio y el fin del mundo."},
  {title:"La biblioteca de la medianoche",authors:["Matt Haig"],categories:["fantasía","emocional","reflexivo"],description:"Una historia accesible sobre arrepentimientos, vidas posibles y el deseo de seguir viviendo."}
];

function analyzeBookPrompt(prompt){
  const normalized=normalizeText(prompt);
  const words=normalized.split(/\s+/).filter(w=>w.length>2&&!BOOK_STOP_WORDS.has(w));
  const concepts=BOOK_CONCEPTS.filter(c=>c.terms.some(t=>normalized.includes(normalizeText(t))));
  const negative=[];
  const negativeRe=/(?:sin|no quiero|evita|evitar)\s+([a-záéíóúñ ]{3,35})/gi;
  let match;
  while((match=negativeRe.exec(prompt)))negative.push(...normalizeText(match[1]).split(/\s+/).filter(w=>w.length>3));
  const queryParts=[prompt,...concepts.map(c=>c.query)];
  return {
    normalized,
    words:[...new Set(words)],
    concepts,
    negative:[...new Set(negative)],
    query:[...new Set(queryParts.join(" ").split(/\s+/).filter(Boolean))].slice(0,22).join(" ")
  };
}

function scoreBookCandidate(book,profile){
  const hay=bookText(book);
  let score=0;
  const matched=[];
  profile.words.forEach(word=>{
    if(hay.includes(word)){score+=word.length>7?3:2;matched.push(word);}
  });
  profile.concepts.forEach(concept=>{
    if(concept.terms.concat(concept.labels).some(term=>hay.includes(normalizeText(term)))){
      score+=5;
      matched.push(concept.labels[0]);
    }
  });
  profile.negative.forEach(word=>{if(hay.includes(word))score-=12;});
  if(book.language==="es")score+=.5;
  return {score,matched:[...new Set(matched)].slice(0,3)};
}

function scoreBook(book,prompt){
  return scoreBookCandidate({
    title:book["Title"],
    authors:[book["Author"]],
    categories:String(book["Bookshelves"]||"").split(","),
    description:book["My Review"]||""
  },analyzeBookPrompt(prompt)).score+((book["Exclusive Shelf"]||"")==="to-read"?1:0);
}

function recommendationReason(book,profile,matched=[]){
  const reasons=[...matched];
  if(!reasons.length){
    profile.concepts.forEach(c=>{
      if(c.terms.concat(c.labels).some(t=>bookText(book).includes(normalizeText(t))))reasons.push(c.labels[0]);
    });
  }
  if(reasons.length)return "Puede encajar por "+[...new Set(reasons)].slice(0,3).join(", ")+".";
  return "Es una alternativa cercana al tipo de lectura que describiste.";
}

async function fetchBookCandidates(profile){
  const queries=[profile.query,profile.concepts.map(c=>c.query).join(" ")].filter(Boolean);
  const all=[];
  for(const query of [...new Set(queries)].slice(0,2)){
    const response=await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books&langRestrict=es`);
    if(!response.ok)throw new Error("No se pudo consultar el catálogo");
    const data=await response.json();
    all.push(...(data.items||[]).map(item=>({
      id:item.id,
      title:item.volumeInfo?.title||"",
      authors:item.volumeInfo?.authors||[],
      categories:item.volumeInfo?.categories||[],
      description:item.volumeInfo?.description||"",
      thumbnail:item.volumeInfo?.imageLinks?.thumbnail||"",
      language:item.volumeInfo?.language||"",
      infoLink:item.volumeInfo?.infoLink||""
    })).filter(book=>book.title));
  }
  const seen=new Set();
  return all.filter(book=>{
    const key=normalizeText(book.title);
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}

async function recommendBook(promptOverride=null){
  const prompt=(promptOverride||$("#bookPrompt").value).trim();
  if(!prompt)return toast("Describime qué te gustaría leer.");

  const only=$("#onlyOwned").checked;
  const exclude=$("#excludeRead").checked;
  const profile=analyzeBookPrompt(prompt);
  $("#bookResults").innerHTML='<div class="card">Pensando en tus gustos… 📚</div>';

  const readTitles=new Set(state.library
    .filter(book=>(book["Exclusive Shelf"]||"").toLowerCase()==="read")
    .map(book=>normalizeText(book["Title"])));

  if(only){
    if(!state.library.length){
      $("#bookResults").innerHTML='<div class="card"><strong>No hace falta Goodreads para recibir recomendaciones.</strong><p>Desmarcá «Solo de mi biblioteca» y buscaré opciones nuevas a partir de tu descripción.</p></div>';
      say("No necesitás Goodreads. Desmarcá Solo de mi biblioteca y te recomiendo opciones nuevas.");
      return;
    }
    const ranked=state.library
      .filter(book=>!exclude||(book["Exclusive Shelf"]||"").toLowerCase()!=="read")
      .map(book=>{
        const normalized={
          title:book["Title"],authors:[book["Author"]],categories:String(book["Bookshelves"]||"").split(","),
          description:book["My Review"]||"Está en tu biblioteca."
        };
        const result=scoreBookCandidate(normalized,profile);
        return {book:normalized,...result,owned:true};
      })
      .sort((a,b)=>b.score-a.score)
      .slice(0,3);
    if(ranked.length){
      showBookRecommendations(ranked,profile,prompt);
      return;
    }
  }

  try{
    let candidates=await fetchBookCandidates(profile);
    if(exclude&&readTitles.size)candidates=candidates.filter(book=>!readTitles.has(normalizeText(book.title)));
    let ranked=candidates
      .map(book=>({book,...scoreBookCandidate(book,profile),owned:false}))
      .sort((a,b)=>b.score-a.score)
      .slice(0,3);

    if(!ranked.length)throw new Error("sin resultados");
    showBookRecommendations(ranked,profile,prompt);
  }catch(error){
    const ranked=LOCAL_BOOK_CATALOG
      .filter(book=>!exclude||!readTitles.has(normalizeText(book.title)))
      .map(book=>({book,...scoreBookCandidate(book,profile),owned:false}))
      .sort((a,b)=>b.score-a.score)
      .slice(0,3);
    if(ranked.length){
      showBookRecommendations(ranked,profile,prompt,true);
      return;
    }
    $("#bookResults").innerHTML='<div class="card">No pude buscar libros ahora. Probá describiendo el género, el tono o algún libro parecido.</div>';
    say("No pude encontrar una recomendación ahora mismo.");
  }
}

function showBookRecommendations(results,profile,prompt,localFallback=false){
  const first=results[0]?.book;
  if(!first)return;
  save(KEYS.lastBook,{title:first.title,at:Date.now(),prompt});
  const intro=localFallback
    ? '<p class="recommendation-note">No pude consultar el catálogo en línea, así que usé una selección disponible en Robotito.</p>'
    : "";
  $("#bookResults").innerHTML=intro+results.map(({book,matched,owned})=>`<div class="book-card">
    ${book.thumbnail?`<img src="${book.thumbnail.replace("http:","https:")}" alt="Portada de ${escapeHtml(book.title)}">`:"<div class=\"book-placeholder\">📖</div>"}
    <div><strong>${escapeHtml(book.title)}</strong>
    <p>${escapeHtml((book.authors||[]).join(", ")||"Autor no disponible")}</p>
    <p class="book-match-reason">${escapeHtml(recommendationReason(book,profile,matched))}</p>
    <p>${escapeHtml((book.description||"Sin descripción disponible.").replace(/<[^>]+>/g,"").slice(0,320))}${book.description?.length>320?"…":""}</p>
    <span class="relation">${owned?"Ya está en tu biblioteca":"Sugerencia nueva"}</span>
    ${book.infoLink?`<a class="book-more-link" href="${escapeHtml(book.infoLink)}" target="_blank" rel="noopener noreferrer">Ver más información ↗</a>`:""}
    </div></div>`).join("");
  say(`Encontré tres opciones. La que más encaja es “${first.title}” 📚`,5200);
}

function routinePromptTick(){
  if(!state.started||state.classMode||state.sleeping||document.hidden)return;
  const now=new Date(),h=now.getHours(),m=now.getMinutes();
  const day=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  let slot=null,message=null;
  if(h>=8&&h<10){slot="breakfast";message="Buenos días… pregunta de panda responsable: ¿ya desayunaste?";}
  else if(h>=12&&h<14){slot="lunch";message="Viendo la hora… ¿ya almorzaste?";}
  else if((h===16&&m>=15)||h===17||h===18){slot="snack";message="Mmm… hora de merienda. ¿Ya merendaste?";}
  else if(h>=23||h<1){slot="bedtime";message="Miro la hora y pregunto muy seriamente: ¿no sería buena idea que te fueras a dormir dentro de poco?";}
  if(!slot||state.routinePromptLog[slot]===day)return;
  if(Date.now()-state.sessionStartedAt<5*60*1000)return;
  state.routinePromptLog[slot]=day;
  save("robotito.routinePrompts.v1",state.routinePromptLog);
  say(message,6500);
}
function isNightByClock(date=new Date()){
  const h=date.getHours();
  return h>=18 || h<6;
}
function applyDayNightMode(date=new Date()){
  const mode=isNightByClock(date)?"night":"day";
  state.dayNightMode=mode;

  document.body.classList.toggle("mode-day",mode==="day");
  document.body.classList.toggle("mode-night",mode==="night");

  const world=$("#world");
  if(world){
    world.dataset.timeMode=mode;
    world.setAttribute("aria-label",mode==="night"?"Mundo nocturno de Robotito":"Mundo diurno de Robotito");
  }

  const lang=responseLanguage();
  const label=$("#dayNightLabel");
  if(label){
    label.textContent=mode==="night"
      ?(lang==="en"?"night":lang==="pt"?"noite":"noche")
      :(lang==="en"?"day":lang==="pt"?"dia":"día");
  }

  const theme=document.querySelector('meta[name="theme-color"]');
  if(theme)theme.setAttribute("content",mode==="night"?"#17213a":"#fff8fc");
}
function clockTick(){
  const d=new Date();
  applyDayNightMode(d);
  const lang=responseLanguage();
  const locale=lang==="en"?"en-US":lang==="pt"?"pt-BR":"es-UY";
  $("#clock").textContent=d.toLocaleTimeString(locale,{hour:"2-digit",minute:"2-digit"});
  $("#dateInfo").textContent=d.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}

function ambientMood(){
  hungerTick();
  if(state.batteryCritical){
    applyBatteryCriticalState();
    updateMeters();
    return;
  }
  inactivityTick();
  if(state.classMode){updateMeters();return;}
  if(!state.sleeping&&state.hunger<70&&state.emotion!=="bored"){
    if(state.moodScore>=70)setMood("happy");
    else if(state.moodScore<30)setMood("sad");
    else if(!["scared","angry"].includes(state.mood))setMood("calm");
  }
  updateMeters();
}

function bindUI(){
  document.querySelectorAll("[data-start-language]").forEach(btn=>btn.addEventListener("click",()=>chooseStartupLanguage(btn.dataset.startLanguage)));
  $("#avatarChoices")?.addEventListener("click",event=>{
    const choice=event.target.closest("[data-avatar-id]");
    if(choice)finishStartupAvatar(choice.dataset.avatarId);
  });
  $("#backToLanguage")?.addEventListener("click",()=>showStartupStep("language"));
  $("#startBtn").addEventListener("click",startSenses);
  $("#languageMode")?.addEventListener("change",e=>{
    const mode=e.target.value;
    setLanguageMode(mode);
    document.documentElement.lang=mode;
    $("#startBtn").textContent=state.started
      ?(mode==="en"?"Senses active":mode==="pt"?"Sentidos ativos":"Sentidos activos")
      :(mode==="en"?"Wake up senses":mode==="pt"?"Despertar sentidos":"Despertar sentidos");
    applyDayNightMode(new Date());
  });
  $("#voiceEnabled")?.addEventListener("change",e=>{
    state.voiceEnabled=e.target.checked;
    localStorage.setItem("robotito.voiceEnabled.v1",String(state.voiceEnabled));
    if(!state.voiceEnabled&&"speechSynthesis" in window){
      speechSynthesis.cancel();
      state.speaking=false;
      restartRecognitionAfterSpeech();
    }
  });
  $("#voiceSelect")?.addEventListener("change",e=>{
    state.voiceURI=e.target.value;
    localStorage.setItem("robotito.voiceURI.v1",state.voiceURI);
  });
  $("#voicePitch")?.addEventListener("input",e=>{
    state.voicePitch=Number(e.target.value);
    localStorage.setItem("robotito.voicePitch.v1",String(state.voicePitch));
  });
  $("#voiceRate")?.addEventListener("input",e=>{
    state.voiceRate=Number(e.target.value);
    localStorage.setItem("robotito.voiceRate.v1",String(state.voiceRate));
  });
  $("#testVoiceBtn")?.addEventListener("click",()=>{
    const lang=responseLanguage();
    const text=lang==="en"?"My name is Robotito. I'm ready to help you.":lang==="pt"?"Meu nome é Robotito. Estou pronto para ajudar você.":"Mi nombre es Robotito. Estoy listo para ayudarte.";
    speakResponse(text,lang);
  });
  $("#enrollBtn").addEventListener("click",enrollPerson);
  $("#personBirthday")?.addEventListener("input",e=>{
    const digits=e.target.value.replace(/\D/g,"").slice(0,8);
    e.target.value=digits.length<=2?digits:digits.length<=4?digits.slice(0,2)+"/"+digits.slice(2):digits.slice(0,2)+"/"+digits.slice(2,4)+"/"+digits.slice(4);
  });
  $("#refreshPeopleBtn").addEventListener("click",renderPeople);
  $("#rememberBtn").addEventListener("click",rememberManual);

  $("#clearMemoryBtn").addEventListener("click",()=>{
    if(confirm("¿Querés borrar todos los recuerdos que Robotito guardó?")){
      state.memories=[];
      save(KEYS.memories,[]);
      renderMemories();
      toast("Recuerdos borrados.");
    }
  });

  $("#goodreadsHelpBtn")?.addEventListener("click",()=>$("#goodreadsHelp")?.classList.toggle("hidden"));
  $("#goodreadsFile").addEventListener("change",e=>{
    if(e.target.files[0])importGoodreads(e.target.files[0]);
  });
  $("#recommendBtn").addEventListener("click",()=>recommendBook());
  $("#classSubject")?.addEventListener("input",()=>{
    if(!state.classMode)state.selectedClassSessionId=null;
    state.classSubject=$("#classSubject").value.trim();
  });
  $("#classTopic")?.addEventListener("input",()=>{
    if(!state.classMode)state.selectedClassSessionId=null;
    state.classTopic=$("#classTopic").value.trim();
  });
  $("#startClassBtn").addEventListener("click",startClassMode);
  $("#verifyClassWeb")?.addEventListener("change",e=>{
    state.verifyClassWeb=!!e.target.checked;
    localStorage.setItem("robotito.verifyClassWeb.v1",String(state.verifyClassWeb));
  });
  $("#stopClassBtn").addEventListener("click",stopClassMode);
  $("#nextMeBtn")?.addEventListener("click",()=>{state.speakerOverride="me";toast("La próxima frase se aprenderá como tu voz.");});
  $("#nextTeacherBtn")?.addEventListener("click",()=>{state.speakerOverride="teacher";toast("La próxima frase se aprenderá como voz de profesor/a.");});
  $("#nextClassmateBtn")?.addEventListener("click",()=>{state.speakerOverride="classmate";toast("La próxima frase se aprenderá como voz de compañero/a.");});
  $("#summarizeClassBtn").addEventListener("click",summarizeClass);
  $("#askClassBtn").addEventListener("click",askClass);
  $("#flashcardsBtn").addEventListener("click",makeFlashcards);
  $("#academicFiles")?.addEventListener("change",e=>window.ROBOTITO_CLASS_ORGANIZER?.importAcademicFiles?.([...e.target.files]));
  $("#solveMathBtn")?.addEventListener("click",solveMathFromUI);
  $("#detectObjectBtn")?.addEventListener("click",detectObjectNow);
  $("#connectTasksBtn").addEventListener("click",connectTasksSheet);
  $("#refreshTasksBtn").addEventListener("click",refreshTasks);

  $$(".tab").forEach(t=>t.addEventListener("click",()=>{
    $$(".tab").forEach(x=>x.classList.remove("active"));
    $$(".tabpage").forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    $("#tab-"+t.dataset.tab).classList.add("active");
  }));

  $(".quick-actions").addEventListener("click",e=>{
    const btn=e.target.closest("[data-action]");
    if(!btn)return;
    const a=btn.dataset.action;
    if(a==="feed")feedRobot(false);
    else if(a==="pet")petRobot();
    else if(a==="hug")hugRobot();
    else if(a==="highfive")highFiveRobot();
    else if(a==="play")playRobot();
    else if(a==="surprise")scareRobot();
    else if(a==="poke")pokeRobot();
  });
}

function migrateOldData(){
  const oldPeople=load("robotito.people.v1",[]);
  const oldMem=load("robotito.memories.v1",[]);
  if(!state.people.length&&oldPeople.length){
    state.people=oldPeople;
    save(KEYS.people,state.people);
  }
  if(!state.memories.length&&oldMem.length){
    state.memories=oldMem.map(m=>({...m,source:m.source||"manual"}));
    save(KEYS.memories,state.memories);
  }
}

function purgeNamedPeople(){
  const blocked=new Set(["aaa","nacho"]);
  const blockedName=name=>blocked.has(normalizeText(name));

  state.people=state.people.filter(p=>!blockedName(p.name));
  state.memories=state.memories.filter(m=>!blockedName(m.person));
  Object.keys(state.greetingHistory).forEach(name=>{if(blockedName(name))delete state.greetingHistory[name];});

  save(KEYS.people,state.people);
  save(KEYS.memories,state.memories);
  save(KEYS.greetings,state.greetingHistory);

  const oldPeople=load("robotito.people.v1",[]).filter(p=>!blockedName(p.name));
  const oldMem=load("robotito.memories.v1",[]).filter(m=>!blockedName(m.person));
  save("robotito.people.v1",oldPeople);
  save("robotito.memories.v1",oldMem);
}

window.ROBOTITO_SPEECH_QA={
  cleanTranscript:cleanRecognitionTranscript,
  mergeChunks:mergeRecognitionChunks,
  alternativeScore:speechAlternativeScore
};

window.ROBOTITO_BATTERY={
  alertLevels:BATTERY_ALERT_LEVELS,
  bucket:batteryBucket,
  alertThreshold:batteryAlertThreshold,
  message:batteryAlertMessage
};

window.ROBOTITO_AVATARS={
  list:ROBOTITO_AVATARS.map(item=>({...item})),
  byId:id=>({...avatarById(id)}),
  visualMarkup:id=>avatarVisualMarkup(avatarById(id),"test-avatar-svg")
};

window.ROBOTITO_QUESTION_ROUTING={
  hasExplicitClassReference,
  isDefinitionQuestion,
  definitionSubject,
  definitionEvidenceQuality,
  shouldUseClassFirst:raw=>hasExplicitClassReference(raw)
};

document.addEventListener("visibilitychange",()=>{
  if(document.hidden){
    clearBlinkState();
    clearTimeout(state.blinkTimer);
  }else{
    clearBlinkState();
    blinkLoop();
  }
});

async function init(){
  await window.ROBOTITO_STORE?.bootstrap?.(state);
  migrateOldData();
  purgeNamedPeople();
  bindUI();
  applyAvatar(state.avatar,{persist:false});
  showStartupStep("language");
  ensureClassLineIds();
  window.ROBOTITO_CLASS_ORGANIZER?.migrate?.();
  buildMatcher();
  renderPeople();
  renderMemories();
  updateLibraryStats();
  $("#tasksSheetUrl").value=state.tasksSheetUrl;
  $("#tasksSheetGid").value=state.tasksSheetGid;
  renderTasks();
  if($("#verifyClassWeb"))$("#verifyClassWeb").checked=state.verifyClassWeb;
  renderClassTranscript();
  window.ROBOTITO_CLASS_ORGANIZER?.renderAcademicMaterials?.();
  summarizeClass();
  window.ROBOTITO_CLASS_ORGANIZER?.render?.();
  window.ROBOTITO_CLASS_AUDIO?.render?.();
  $("#startBtn").disabled=true;
  const gate=$("#languageGate");
  if(gate){
    gate.hidden=false;
    gate.removeAttribute("aria-hidden");
    gate.style.display="";
    gate.classList.remove("hidden");
  }
  if($("#languageMode"))$("#languageMode").value="es";
  if($("#voiceEnabled"))$("#voiceEnabled").checked=state.voiceEnabled;
  if($("#voicePitch"))$("#voicePitch").value=String(state.voicePitch);
  if($("#voiceRate"))$("#voiceRate").value=String(state.voiceRate);
  populateVoiceSelect();
  if("speechSynthesis" in window)speechSynthesis.onvoiceschanged=populateVoiceSelect;
  clockTick();
  await initDeviceBattery();
  updateMeters();
  blinkLoop();
  setInterval(clockTick,1000);
  setInterval(updateClassDuration,1000);
  setInterval(ambientMood,2500);
  setInterval(taskReminderTick,30000);
  setInterval(routinePromptTick,60000);
  setTimeout(routinePromptTick,12000);
  if(state.tasksSheetUrl) refreshTasks();
}

document.addEventListener("DOMContentLoaded",init);
