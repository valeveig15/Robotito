const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const KEYS = {
  people: "robotito.people.v2",
  memories: "robotito.memories.v2",
  goodreads: "robotito.goodreads.v1",
  lastFed: "robotito.lastFed.v2",
  lastBook: "robotito.lastBook.v1",
  greetings: "robotito.greetings.v1"
};

const state = {
  started: false,
  mood: "calm",
  moodScore: 55,
  energy: 100,
  hunger: 0,
  currentPerson: null,
  faceMatcher: null,
  lastSeenAt: Date.now(),
  lastHeardAt: Date.now(),
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
  classLines: load("robotito.classLines.v1", []),
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
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) { console.warn("storage",e); toast("No pude guardar: el almacenamiento del navegador está lleno."); } }
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
function populateVoiceSelect(){
  const select=$("#voiceSelect");
  if(!select||!("speechSynthesis" in window))return;
  const all=speechSynthesis.getVoices();
  const supported=all.filter(v=>/^(es|en|pt)([-_]|$)/i.test(v.lang||""));
  const voices=supported.length?supported:all;
  const previous=state.voiceURI;
  select.innerHTML=voices.map(v=>'<option value="'+escapeHtml(v.voiceURI)+'">'+escapeHtml(v.name+" — "+v.lang)+'</option>').join("");
  const target=responseLanguage();
  let chosen=voices.find(v=>v.voiceURI===previous)||chooseDefaultVoice(voices,target);
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
function speakResponse(text,forcedLang=null){
  if(!state.voiceEnabled||!("speechSynthesis" in window))return;
  const clean=cleanSpeechText(text);
  if(!clean)return;
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
  const lang=forcedLang||responseLanguage();
  const selected=voices.find(v=>v.voiceURI===state.voiceURI);
  const selectedMatches=selected && new RegExp("^"+lang+"([-_]|$)","i").test(selected.lang||"");
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
}
function say(text, ms=3000, spokenLang=null){
  state.lastSaid=text;
  const b=$("#speechBubble");
  b.textContent=text;
  b.classList.remove("hidden");
  clearTimeout(say.t);
  say.t=setTimeout(()=>b.classList.add("hidden"),ms);
  speakResponse(text,spokenLang);
}
function sayInLanguage(text,lang,ms=3500){
  say(text,ms,lang);
}
function toast(text){
  const t=$("#toast");
  t.textContent=text;
  t.classList.remove("hidden");
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>t.classList.add("hidden"),2300);
}

function setMood(mood, reason=""){
  const base = ["calm","happy","sad","angry","scared","hungry","sleepy"];
  base.forEach(m=>robot.classList.remove("mood-"+m));
  const visualMap={curious:"happy",focused:"calm",bored:"sleepy",affectionate:"happy",proud:"happy",confused:"scared",excited:"happy",embarrassed:"sad",annoyed:"calm"};
  robot.classList.add("mood-"+(visualMap[mood]||mood));
  robot.classList.add("mood-"+mood);
  state.mood=mood;
  state.emotion=mood;
  const labels={calm:"tranquilo",happy:"feliz",sad:"triste",angry:"enojado",scared:"asustado",hungry:"hambriento",sleepy:"con sueño",curious:"curioso",focused:"concentrado",bored:"aburrido",affectionate:"cariñoso",proud:"orgulloso",confused:"confundido",excited:"emocionado",embarrassed:"avergonzado",annoyed:"molesto"};
  $("#moodLabel").textContent=labels[mood]||mood;
  if(reason) $("#statusText").textContent=reason;
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

function updateMeters(){
  $("#moodScoreText").textContent=Math.round(state.moodScore)+" / 100";
  $("#moodMeter").style.width=state.moodScore+"%";
  $("#energyText").textContent=Math.round(state.energy)+"%";
  $("#energyMeter").style.width=state.energy+"%";
  $("#hungerText").textContent=Math.round(state.hunger)+"%";
  $("#hungerMeter").style.width=state.hunger+"%";
  $("#hungerLabel").textContent=Math.round(state.hunger)+"%";
}

function clearBlinkState(){
  clearTimeout(state.blinkCloseTimer);
  state.blinkCloseTimer=null;
  robot.classList.remove("blink");
}
function eyesLocked(){
  return state.sleeping || robot.classList.contains("heart-eyes");
}
function performBlink(){
  if(eyesLocked()||document.hidden)return;
  clearBlinkState();
  requestAnimationFrame(()=>{
    if(eyesLocked())return;
    robot.classList.add("blink");
    state.blinkCloseTimer=setTimeout(()=>{
      robot.classList.remove("blink");
      state.blinkCloseTimer=null;
    },125);
  });
}
function blinkLoop(){
  clearTimeout(state.blinkTimer);
  state.blinkTimer=setTimeout(()=>{
    performBlink();
    blinkLoop();
  },2800+Math.random()*3900);
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

function processSpeechResult(text,speechMeta=null){
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
  if(!state.classMode && state.currentPerson) learnSpeaker("me",averageRecentVoiceFeature());
  handleSpeech(text);
  if(state.classMode) captureClassLine(text);
}

function recognitionLanguage(){
  return languageLocale(responseLanguage());
}
function updateDetectedLanguage(){
  state.lastDetectedLanguage=responseLanguage();
  return state.lastDetectedLanguage;
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
  r.maxAlternatives=3;

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
      const best=[...result].sort((a,b)=>(b.confidence||0)-(a.confidence||0))[0]||result[0];
      const text=(best?.transcript||"").trim();
      if(result.isFinal)finalText+=(finalText?" ":"")+text;
      else interim+=(interim?" ":"")+text;
    }
    if(interim)$("#transcript").textContent=interim+" …";
    if(finalText){ r._hadFinal=true; updateDetectedLanguage(finalText); processSpeechResult(finalText); }
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
    if(state.speechRetryCount>=4){
      
      
    }else if(state.started&&!state.speechBlocked){
      clearTimeout(state.speechRestartTimer);
      state.speechRestartTimer=setTimeout(()=>startListeningCycle(false),600+state.speechRetryCount*250);
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
  if(state.memories.length>500) state.memories=state.memories.slice(-500);
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
function setLanguageMode(mode){
  if(!["es","en","pt"].includes(mode))return;
  state.languageMode=mode;
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
  const gate=$("#languageGate");
  if(gate){
    gate.classList.add("hidden");
    gate.hidden=true;
    gate.setAttribute("aria-hidden","true");
    gate.style.display="none";
  }
  document.documentElement.lang=mode;
  $("#startBtn").disabled=false;
  $("#startBtn").textContent=mode==="en"?"Wake up senses":mode==="pt"?"Despertar sentidos":"Despertar sentidos";
  $("#statusText").textContent=mode==="en"
    ?"Robotito is ready to wake up."
    :mode==="pt"?"Robotito está pronto para despertar.":"Robotito está listo para despertar.";
  applyDayNightMode(new Date());
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
function materialEvidenceLines(){
  const subj=normalizeText(state.classSubject||$("#classSubject")?.value||"");
  return state.academicMaterials
    .filter(m=>!subj||normalizeText(m.subject||"").includes(subj)||subj.includes(normalizeText(m.subject||"")))
    .flatMap(m=>(m.chunks||[]).flatMap((chunkText,chunkIndex)=>
      splitEvidenceSentences(chunkText).map((text,sentenceIndex)=>({
        text,
        correctedText:text,
        speaker:"material",
        sourceType:"material",
        subject:m.subject||"Material",
        at:m.at,
        sourceName:m.name,
        chunk:chunkIndex+1,
        sentence:sentenceIndex+1
      }))
    ));
}
function classEvidenceLines(){
  return classLinesForSubject().flatMap(line=>{
    const sourceText=line.correctedText||line.text||"";
    const correctedParts=splitEvidenceSentences(sourceText);
    const originalParts=splitEvidenceSentences(line.text||sourceText);
    return correctedParts.map((text,i)=>({
      ...line,
      text:originalParts[i]||line.text||text,
      correctedText:text,
      sourceType:"class",
      sourceName:line.speakerName||null,
      sentence:i+1
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
  return new Set(contentWords(text).map(w=>w.replace(/(mente|ciones|cion|ando|iendo|ados|adas|ido|ida|es|s)$/,"")).filter(w=>w.length>2));
}
function classEvidenceScore(question,e){
  const qTerms=[...academicTokenSet(question)];
  if(!qTerms.length)return 0;
  const raw=normalizeText(e.correctedText||e.text||"");
  const eTerms=academicTokenSet(raw);
  let overlap=0;
  for(const q of qTerms){
    if(eTerms.has(q)||[...eTerms].some(w=>w.startsWith(q)||q.startsWith(w)))overlap++;
  }
  const coverage=overlap/qTerms.length;
  if(overlap===0)return 0;

  let score=overlap*3+coverage*5;
  const phrase=contentWords(question).slice(0,5).join(" ");
  if(phrase.length>8&&raw.includes(phrase))score+=5;

  const qBigrams=[];
  const qw=contentWords(question);
  for(let i=0;i<qw.length-1;i++)qBigrams.push(qw[i]+" "+qw[i+1]);
  for(const bg of qBigrams)if(raw.includes(bg))score+=1.5;

  if(e.sourceType==="class"&&e.speaker==="teacher")score+=.35;
  if(raw.length>420)score-=Math.min(2,(raw.length-420)/300);

  // For longer questions, one accidental shared word is not enough.
  if(qTerms.length>=3&&overlap===1&&coverage<.45)return 0;
  return score;
}
function answerFromClass(question){
  const candidates=[...classEvidenceLines(),...materialEvidenceLines()];
  const ranked=candidates
    .map(e=>({e,score:classEvidenceScore(question,e)}))
    .filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score);

  if(!ranked.length)return null;

  const best=[];
  const seen=new Set();
  for(const item of ranked){
    const key=normalizeText(item.e.correctedText||item.e.text).slice(0,160);
    if(seen.has(key))continue;
    seen.add(key);
    best.push(item.e);
    if(best.length>=3)break;
  }

  const topScore=ranked[0].score;
  // Reject very weak matches instead of pretending a random keyword is an answer.
  if(topScore<4.2)return null;
  return {evidence:best,score:topScore};
}
function relevantSentenceForAnswer(e,question){
  const units=splitEvidenceSentences(e.correctedText||e.text||"");
  if(!units.length)return "";
  return units
    .map(t=>({t,score:classEvidenceScore(question,{...e,correctedText:t,text:t})}))
    .sort((a,b)=>b.score-a.score)[0].t;
}
function fallbackAcademicAnswer(question,evidence){
  const best=evidence
    .map(e=>relevantSentenceForAnswer(e,question))
    .filter(Boolean)
    .slice(0,2)
    .map(t=>t.replace(/\b(bueno|o sea|este|eh|tipo)\b/gi,"").replace(/\s+/g," ").trim());

  if(!best.length)return "No tengo información suficiente en la clase ni en el material cargado para responder eso.";

  const first=best[0].replace(/^[,;:\-\s]+/,"");
  const second=best[1]&&normalizeText(best[1])!==normalizeText(first)?best[1]:null;
  const q=normalizeText(question);

  let lead;
  if(q.startsWith("por que")||q.startsWith("porque"))lead="La explicación principal es que ";
  else if(q.startsWith("como"))lead="Lo que se explicó es que ";
  else if(q.startsWith("que es")||q.startsWith("que significa")||q.startsWith("define"))lead="";
  else lead="Según lo trabajado, ";

  let answer=lead+first;
  if(second&&answer.length<330)answer+=" "+second;
  answer=answer.replace(/\s+/g," ").trim();
  if(answer.length>430)answer=answer.slice(0,427).replace(/\s+\S*$/,"")+"…";
  return answer;
}
async function composeAcademicAnswer(question,evidence){
  const compact=evidence.map((e,i)=>{
    const text=relevantSentenceForAnswer(e,question);
    const source=e.sourceType==="material"
      ?`material cargado: ${e.sourceName||e.subject||"archivo"}`
      :`dicho en clase por ${classSpeakerLabel(e)}`;
    return `[${i+1}] (${source}) ${text}`;
  }).join("\n");

  const prompt=`Respondé en español rioplatense usando SOLAMENTE la evidencia.
Pregunta: ${question}
Evidencia:
${compact}

Reglas:
- Contestá primero la pregunta de manera directa, fluida y comprensible.
- Máximo 2 a 4 oraciones y aproximadamente 80 palabras.
- Sintetizá: no copies párrafos ni enumeres las fuentes.
- No incluyas citas textuales, comillas ni etiquetas de fuente en la respuesta; la interfaz las muestra aparte.
- Si la evidencia no alcanza para afirmar algo, decilo explícitamente.
- No agregues conocimiento externo.`;

  const rewritten=await browserRewrite(prompt);
  if(rewritten){
    const clean=rewritten.replace(/^["“]|["”]$/g,"").trim();
    return clean.length>520?clean.slice(0,517).replace(/\s+\S*$/,"")+"…":clean;
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
  return time?who+" · "+time:who;
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
  const first=classEvidenceForDisplay(question,evidence,1)[0];
  if(!first)return answer;
  const kind=sourceKindLabel(first).toLowerCase();
  const quote=first.quote.length>125?first.quote.slice(0,122).replace(/\s+\S*$/,"")+"…":first.quote;
  return `${answer} Cita textual, ${kind}: “${quote}”`;
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
  robot.classList.add("thinking");setTimeout(()=>robot.classList.remove("thinking"),1200);
  setMood("curious","Robotito está buscando una respuesta precisa en lo aprendido.");
  const found=answerFromClass(q);
  if(!found){
    $("#classAnswer").innerHTML='<div class="study-chip">No encontré evidencia suficiente para responder eso en lo dicho en clase ni en el material cargado.</div>';
    say("No encontré evidencia suficiente para responder eso en mis apuntes.",3500);
    return;
  }
  const answer=await composeAcademicAnswer(q,found.evidence);
  renderAcademicAnswer(q,answer,found.evidence);
  say(spokenAcademicAnswer(q,answer,found.evidence).slice(0,520),6500);
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
    const p=state.people.find(x=>x.name===name);
    if(p&&line.voicePrint){
      p.voicePrints=[...(p.voicePrints||[]),line.voicePrint].slice(-5);
      save(KEYS.people,state.people);
    }
    if(p&&line.feature&&["me","teacher","classmate"].includes(p.role))learnSpeaker(p.role,line.feature);
  }else{
    line.speaker=value;
    line.speakerName=null;
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
  root.innerHTML=lines.map(l=>{
    const cls=l.speaker==="me"?"me":l.speaker==="teacher"?"teacher":"classmate";
    const tag=l.speakerName?l.speakerName:(l.speaker==="me"?"VOS":l.speaker==="teacher"?"PROFESOR/A":"COMPAÑERO/A");
    const txt=l.correctedText||l.text;
    const corr=l.correctedText&&l.correctedText!==l.text?'<div class="muted">Oí: '+escapeHtml(l.text)+'</div>':'';
    const match=l.voiceScore?'<span class="voice-match">voz '+Math.round(l.voiceScore*100)+'%</span>':'';
    return '<div class="class-line '+cls+'"><div class="class-line-top"><span class="speaker-tag '+cls+'">'+escapeHtml(tag)+'</span>'+speakerSelectHtml(l)+match+'</div>'+escapeHtml(txt)+corr+'</div>';
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
  if(drawRequestedThing(interpreted,detectedLang))return;
  if(showRequestedObject(interpreted,detectedLang))return;
  if(await handleSayInLanguageCommand(interpreted))return;
  if(handleLanguageCommand(text)) return;
  if(handleSocialSpeech(text)) return;
  if(answerArithmetic(interpreted,detectedLang))return;
  if(await handleWeatherAndDayQuestions(interpreted))return;
  if(detectedLang==="en" && answerEnglishPersonalQuestion(rawText)) return;
  if(detectedLang==="pt" && answerPortuguesePersonalQuestion(interpreted)) return;
  if(detectedLang==="es" && answerEasyQuestion(interpreted)) return;

  // Dedicated physics knowledge has priority over generic knowledge and class-memory retrieval.
  if(detectedLang==="es"){
    const physicsAnswer=window.ROBOTITO_PHYSICS_MOMENTUM?.answer?.(interpreted);
    if(physicsAnswer){say(physicsAnswer,7600);return;}
  }else{
    const qEs=await translateShortPhrase(interpreted,detectedLang,"es");
    const physicsEs=qEs?window.ROBOTITO_PHYSICS_MOMENTUM?.answer?.(qEs):null;
    if(physicsEs){
      const translated=await translateShortPhrase(physicsEs,"es",detectedLang);
      if(translated){sayInLanguage(translated,detectedLang,8000);return;}
    }
  }

  if(detectedLang==="pt"){
    const qEs=await translateShortPhrase(interpreted,"pt","es");
    const answerEs=qEs?window.ROBOTITO_COMMON_KNOWLEDGE?.answer?.(qEs,"es"):null;
    if(answerEs){
      const answerPt=await translateShortPhrase(answerEs,"es","pt");
      if(answerPt){sayInLanguage(answerPt,"pt",5200);return;}
    }
  }else{
    const commonAnswer=window.ROBOTITO_COMMON_KNOWLEDGE?.answer?.(interpreted,detectedLang);
    if(commonAnswer){say(commonAnswer,4800);return;}
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

  if((state.classLines.length||state.academicMaterials.length) && /^(que|como|por que|porque|cual|cuando|donde|explica|define)/.test(text)){
    const found=answerFromClass(interpreted);
    if(found){
      const answer=await composeAcademicAnswer(interpreted,found.evidence);
      renderAcademicAnswer(interpreted,answer,found.evidence);
      say(spokenAcademicAnswer(interpreted,answer,found.evidence).slice(0,520),6500);
      return;
    }
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
      existing.descriptors=[...(existing.descriptors||[]),...samples].slice(-24);
      existing.birthday=birthday||existing.birthday;
      existing.role=role;
      existing.faceEnrolledAt=Date.now();
      existing.faceSampleCount=existing.descriptors.length;
      if(voicePrints.length){
        existing.voicePrints=[...(existing.voicePrints||[]),...voicePrints].slice(-16);
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
  setMood("happy",shared?"Robotito cree que están comiendo juntos.":"Robotito comió y quedó contentísimo.");
  animateEat();
  say(shared?sample(["¿Comemos juntos? 🐼🍓","Ñam… yo también quiero.","Comida compartida = mejor comida."]):sample(["¡Ñam! 🍓","Eso estaba buenísimo.","Gracias por darme de comer 🐼"]));
  updateMeters();
}

function petRobot(){
  changeMoodScore(5);
  adjustBond(state.currentVoicePerson||state.currentPerson,{affection:.75,trust:.50,fear:-.18,irritation:-.30});
  setMood("happy","Robotito recibió mimos.");
  animatePet();
  animateAffection();
  say(sample(["Mmm… más mimitos.","Eso sí me gusta.","Me encantan los mimos."]));
}

function scareRobot(){
  adjustBond(state.currentVoicePerson||state.currentPerson,{fear:2.40,trust:-.45,irritation:.40});
  setMood("scared","Robotito se asustó por un instante.");
  say(sample(["¡AH!","¡No hagas eso! 😳","…casi me da algo."]));
  setTimeout(()=>{ if(state.hunger>=95)setMood("hungry"); else setMood("calm","Ya se le pasó el susto."); },900);
}

function pokeRobot(){
  changeMoodScore(-2);
  adjustBond(state.currentVoicePerson||state.currentPerson,{irritation:1.15,trust:-.35,affection:-.20});
  setMood("annoyed","Robotito se molestó un poco.");
  animatePoke();
  say(sample(["Ey.","No me pinches.","Eso no era una caricia.","Mmm…"]));
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
    state.energy=clamp(state.energy+.35,0,100);
  }else if(quietFor>95){
    state.sleeping=false;
    stopSnoring();
    robot.classList.remove("sleeping");
    setMood("sleepy","Robotito está cabeceando de sueño.");
    state.energy=clamp(state.energy-.05,0,100);
  }else if(quietFor>45){
    state.sleeping=false;
    stopSnoring();
    robot.classList.remove("sleeping");
    setMood("bored","Robotito se está aburriendo un poquito y mira alrededor.");
    state.energy=clamp(state.energy-.02,0,100);
  }else{
    const wasSleeping=state.sleeping;
    state.sleeping=false;
    stopSnoring();
    robot.classList.remove("sleeping");
    if(wasSleeping)say(sample(["¿Mm? Ya volviste.","Ah… me despertaste.","¿Qué pasó?"]));
    state.energy=clamp(state.energy-.02,0,100);
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

function scoreBook(book,prompt){
  const words=normalizeText(prompt).split(/\s+/).filter(x=>x.length>3);
  const hay=normalizeText([book["Title"],book["Author"],book["Bookshelves"],book["My Review"]].join(" "));
  let s=0;
  words.forEach(w=>{if(hay.includes(w))s+=2;});
  if((book["Exclusive Shelf"]||"")==="to-read")s+=1;
  return s;
}

async function recommendBook(promptOverride=null){
  const prompt=(promptOverride||$("#bookPrompt").value).trim();
  if(!prompt)return toast("Decime qué tipo de libro querés.");

  const only=$("#onlyOwned").checked;
  const exclude=$("#excludeRead").checked;
  $("#bookResults").innerHTML='<div class="card">Pensando… 📚</div>';

  if(state.library.length){
    let pool=state.library.filter(b=>!exclude||(b["Exclusive Shelf"]||"").toLowerCase()!=="read");
    const ranked=pool.map(b=>({b,s:scoreBook(b,prompt)})).sort((a,b)=>b.s-a.s);
    const goodMatch=ranked[0]&&ranked[0].s>0;

    if((only||goodMatch)&&ranked[0]){
      const choice=ranked[0].b;
      showBook({title:choice["Title"],authors:[choice["Author"]],description:choice["My Review"]||"Está en tu biblioteca.",thumbnail:""},true);
      return;
    }
  }

  try{
    const res=await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(prompt)}&maxResults=12&printType=books`);
    const data=await res.json();
    const readTitles=new Set(state.library.filter(b=>(b["Exclusive Shelf"]||"").toLowerCase()==="read").map(b=>normalizeText(b["Title"])));
    const items=(data.items||[]).map(x=>x.volumeInfo).filter(v=>v.title);
    const filtered=exclude?items.filter(v=>!readTitles.has(normalizeText(v.title))):items;
    const v=filtered[0]||items[0];
    if(!v)throw new Error("sin resultados");
    showBook({title:v.title,authors:v.authors||[],description:v.description||"Sin descripción disponible.",thumbnail:v.imageLinks?.thumbnail||""},false);
  }catch{
    $("#bookResults").innerHTML='<div class="card">No pude buscar libros ahora. Si importaste Goodreads, probá “Solo de mi biblioteca”.</div>';
    say("No pude encontrar una recomendación ahora mismo.");
  }
}

function showBook(book,owned){
  save(KEYS.lastBook,{title:book.title,at:Date.now()});
  $("#bookResults").innerHTML=`<div class="book-card">
    ${book.thumbnail?`<img src="${book.thumbnail.replace("http:","https:")}" alt="">`:"<div></div>"}
    <div><strong>${escapeHtml(book.title)}</strong>
    <p>${escapeHtml(book.authors.join(", "))}</p>
    <p>${escapeHtml((book.description||"").replace(/<[^>]+>/g,"").slice(0,280))}${book.description?.length>280?"…":""}</p>
    <span class="relation">${owned?"Ya está en tu biblioteca":"Sugerencia nueva"}</span></div></div>`;
  say(`Yo probaría con “${book.title}” 📚`,4500);
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
  $$("[data-start-language]").forEach(btn=>btn.addEventListener("click",()=>chooseStartupLanguage(btn.dataset.startLanguage)));
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
  $("#startClassBtn").addEventListener("click",startClassMode);
  $("#stopClassBtn").addEventListener("click",stopClassMode);
  $("#summarizeClassBtn").addEventListener("click",summarizeClass);
  $("#askClassBtn").addEventListener("click",askClass);
  $("#flashcardsBtn").addEventListener("click",makeFlashcards);
  $("#academicFiles")?.addEventListener("change",e=>importAcademicFiles([...e.target.files]));
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

function init(){
  migrateOldData();
  purgeNamedPeople();
  bindUI();
  ensureClassLineIds();
  buildMatcher();
  renderPeople();
  renderMemories();
  updateLibraryStats();
  $("#tasksSheetUrl").value=state.tasksSheetUrl;
  $("#tasksSheetGid").value=state.tasksSheetGid;
  renderTasks();
  renderClassTranscript();
  renderAcademicMaterials();
  summarizeClass();
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