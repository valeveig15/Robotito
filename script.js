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
  recognition: null,
  stream: null,
  analyser: null,
  lastDetections: [],
  handNearMouth: false,
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
  voiceProfiles: load("robotito.voiceProfiles.v1", {me:[],teacher:[]}),
  tasks: load("robotito.tasks.v1", []),
  tasksSheetUrl: localStorage.getItem("robotito.tasksSheetUrl.v1") || "",
  tasksSheetGid: localStorage.getItem("robotito.tasksSheetGid.v1") || "",
  sessionStartedAt: Date.now(),
  lastTaskReminderAt: 0,
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
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function sample(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function normalizeText(s){
  return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[¿?¡!.,;:]/g," ").replace(/\s+/g," ").trim();
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function say(text, ms=3000){
  const b=$("#speechBubble");
  b.textContent=text;
  b.classList.remove("hidden");
  clearTimeout(say.t);
  say.t=setTimeout(()=>b.classList.add("hidden"),ms);
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
  const visualMap={curious:"happy",focused:"calm",bored:"sleepy",affectionate:"happy",proud:"happy",confused:"scared",excited:"happy",embarrassed:"sad"};
  robot.classList.add("mood-"+(visualMap[mood]||mood));
  robot.classList.add("mood-"+mood);
  state.mood=mood;
  state.emotion=mood;
  const labels={calm:"tranquilo",happy:"feliz",sad:"triste",angry:"enojado",scared:"asustado",hungry:"hambriento",sleepy:"con sueño",curious:"curioso",focused:"concentrado",bored:"aburrido",affectionate:"cariñoso",proud:"orgulloso",confused:"confundido",excited:"emocionado",embarrassed:"avergonzado"};
  $("#moodLabel").textContent=labels[mood]||mood;
  if(reason) $("#statusText").textContent=reason;
}

function changeMoodScore(delta, personName=null){
  state.moodScore=clamp(state.moodScore+delta,0,100);
  if(personName){
    const p=state.people.find(x=>x.name===personName);
    if(p){
      p.relationship=clamp((p.relationship??50)+delta,0,100);
      p.lastInteractionAt=Date.now();
      save(KEYS.people,state.people);
      renderPeople();
    }
  }
  updateMeters();
}

function relationText(v){
  if(v>=82)return "te tiene muchísimo cariño";
  if(v>=66)return "confía mucho";
  if(v>=50)return "se siente cómodo";
  if(v>=34)return "todavía está cauteloso";
  return "está bastante molesto";
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

function blinkLoop(){
  setTimeout(()=>{
    if(!state.sleeping){
      robot.classList.add("blink");
      setTimeout(()=>robot.classList.remove("blink"),145);
    }
    blinkLoop();
  },2300+Math.random()*4200);
}

function moveEyes(nx,ny){
  const x=clamp(nx,-1,1)*5.5;
  const y=clamp(ny,-1,1)*4;
  $$(".iris").forEach(i=>i.style.transform=`translate(${x}px,${y}px)`);
}

function followFace(box){
  const vw=camera.videoWidth||640, vh=camera.videoHeight||480;
  const cx=(box.x+box.width/2)/vw;
  const cy=(box.y+box.height/2)/vh;
  robot.style.left=clamp(21+cx*58,21,79)+"%";
  robot.style.top=clamp(37+cy*21,37,58)+"%";
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

async function startSenses(){
  if(state.started)return;
  $("#systemStatus").textContent="Pidiendo permisos…";
  try{
    state.stream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:"user",width:{ideal:640},height:{ideal:480}},
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}
    });
    camera.srcObject=state.stream;
    await camera.play();
    await loadFaceModels();
    setupHands();
    setupAudio(state.stream);
    setupSpeechRecognition();
    state.started=true;
    $("#startBtn").textContent="Sentidos activos";
    $("#startBtn").disabled=true;
    $("#systemStatus").textContent="Cámara y micrófono activos.";
    say("Ya estoy despierto 🐼");
    detectLoop();
  }catch(err){
    console.error(err);
    $("#systemStatus").textContent="No pude activar cámara o micrófono.";
    toast("Necesito permiso de cámara y micrófono.");
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

function setupAudio(stream){
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
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
      state.recentAudioFeatures.push({rms,centroid,flat,t:Date.now()});
      state.recentAudioFeatures=state.recentAudioFeatures.filter(x=>Date.now()-x.t<3500);
      const flat=spectralFlatness([...freq.slice(4,220)]);
      const activeBands=[lowE,midE,highE].filter(v=>v>18).length;

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

function setupSpeechRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    $("#transcript").textContent="Tu navegador no ofrece reconocimiento de voz continuo.";
    return;
  }

  const r=new SR();
  r.lang="es-UY";
  r.continuous=true;
  r.interimResults=false;
  r.maxAlternatives=1;

  r.onresult=ev=>{
    const result=ev.results[ev.results.length-1];
    if(!result.isFinal)return;
    const text=result[0].transcript.trim();
    if(!text)return;
    $("#transcript").textContent=text;
    state.lastHeardAt=Date.now();
    state.lastTranscriptAt=Date.now();
    autoRemember(text);
    handleSpeech(text);
    if(state.classMode) captureClassLine(text);
  };
  r.onerror=e=>console.warn("speech",e.error);
  r.onend=()=>{ if(state.started){try{r.start();}catch{}} };
  try{r.start(); state.recognition=r;}catch{}
}

function autoRemember(text){
  const clean=text.trim();
  if(clean.length<2)return;
  const person=state.currentPerson||"persona no reconocida";
  const last=state.memories[state.memories.length-1];
  if(last && last.text.toLowerCase()===clean.toLowerCase() && Date.now()-last.at<15000)return;
  state.memories.push({person,text:clean,at:Date.now(),source:"auto"});
  if(state.memories.length>500) state.memories=state.memories.slice(-500);
  save(KEYS.memories,state.memories);
  renderMemories();
}

function answerEasyQuestion(rawText){
  const text=normalizeText(rawText);

  if(/(como te llamas|cual es tu nombre|quien sos|quien eres)/.test(text)){
    say(sample(["Me llamo Robotito 🐼","Soy Robotito.","Robotito. Ese soy yo 🐼"]));
    return true;
  }

  if(/(yo como me llamo|como me llamo yo|cual es mi nombre|quien soy yo)/.test(text)){
    if(state.currentPerson) say(sample([
      `Vos sos ${state.currentPerson}.`,
      `Te llamás ${state.currentPerson}. Te reconocí.`,
      `${state.currentPerson} 🐼. Me acuerdo de vos.`
    ]));
    else say("Todavía no sé quién sos. Registrá tu cara y después sí me voy a acordar.");
    return true;
  }

  if(/(como te va|como estas|como andas|todo bien)/.test(text)){
    if(state.sleeping) say("Tengo muchísimo sueño… zzz.");
    else if(state.hunger>=95) say("Tengo tanta hambre que estoy bastante enojado.");
    else if(state.hunger>=70) say("Estoy bien, pero tengo mucha hambre.");
    else if(state.mood==="happy"||state.moodScore>=70) say(sample(["¡Muy bien! Estoy contento 🐼","Bien. Hoy estoy de muy buen humor.","Súper bien ♡"]));
    else if(state.mood==="sad"||state.moodScore<35) say("Más o menos… estoy un poquito triste.");
    else say(sample(["Bien, tranquilo.","Todo bien por acá 🐼","Bastante bien."]));
    return true;
  }

  if(/(tenes hambre|tienes hambre|estas hambriento|cuanta hambre)/.test(text)){
    if(state.hunger>=95) say("¡Sí! Muchísima. Ya estoy enojado de hambre.");
    else if(state.hunger>=75) say("Sí. Tengo bastante hambre.");
    else if(state.hunger>=35) say("Un poquito. Todavía aguanto.");
    else say("No mucho. Estoy bastante lleno.");
    return true;
  }

  if(/(cuantos dedos ves|cuantos dedos estoy mostrando|cuantos dedos hay)/.test(text)){
    const fresh=Date.now()-state.lastHandSeenAt<2200;
    if(!fresh||state.visibleHands===0) say("Ahora mismo no veo ninguna mano. Mostrámela bien frente a la cámara.");
    else if(state.visibleFingers===0) say("Veo una mano, pero no veo ningún dedo levantado.");
    else say(`Veo ${state.visibleFingers} ${state.visibleFingers===1?"dedo":"dedos"} levantados.`);
    return true;
  }

  if(/(que dia es|que fecha es|en que dia estamos)/.test(text)){
    const d=new Date();
    say(d.toLocaleDateString("es-UY",{weekday:"long",day:"numeric",month:"long",year:"numeric"}));
    return true;
  }

  if(/(que hora es|tenes hora|tienes hora)/.test(text)){
    const d=new Date();
    say(`Son las ${d.toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit"})}.`);
    return true;
  }

  if(/(que recuerdas de mi|que te dije|que sabes de mi)/.test(text)){
    const person=state.currentPerson||"persona no reconocida";
    const mine=state.memories.filter(m=>m.person===person).slice(-5);
    if(!mine.length) say("Todavía no tengo recuerdos tuyos.");
    else say(`Lo último que recuerdo es: “${mine[mine.length-1].text}”`);
    return true;
  }

  return false;
}


function averageRecentVoiceFeature(){
  const arr=state.recentAudioFeatures.filter(x=>Date.now()-x.t<2200);
  if(!arr.length)return {rms:0,centroid:0,flat:0};
  const avg=k=>arr.reduce((s,x)=>s+x[k],0)/arr.length;
  return {rms:avg("rms"),centroid:avg("centroid"),flat:avg("flat")};
}
function featureDistance(a,b){
  return Math.abs(a.rms-b.rms)*8 + Math.abs(a.centroid-b.centroid)*1.6 + Math.abs(a.flat-b.flat)*1.2;
}
function profileMean(list){
  if(!list?.length)return null;
  const avg=k=>list.reduce((s,x)=>s+x[k],0)/list.length;
  return {rms:avg("rms"),centroid:avg("centroid"),flat:avg("flat")};
}
function learnSpeaker(label,feature){
  if(!feature)return;
  const arr=state.voiceProfiles[label]||[];
  arr.push(feature);
  state.voiceProfiles[label]=arr.slice(-20);
  save("robotito.voiceProfiles.v1",state.voiceProfiles);
}
function classifySpeaker(feature){
  if(state.speakerOverride){
    const label=state.speakerOverride;
    state.speakerOverride=null;
    learnSpeaker(label,feature);
    return label;
  }
  const me=profileMean(state.voiceProfiles.me);
  const teacher=profileMean(state.voiceProfiles.teacher);
  if(me&&teacher) return featureDistance(feature,me)<=featureDistance(feature,teacher)?"me":"teacher";
  if(me) return featureDistance(feature,me)<.55?"me":"teacher";
  if(teacher) return featureDistance(feature,teacher)<.55?"teacher":"me";
  // Until profiles exist, assume classroom speech is the teacher unless Robotito
  // recognizes the user and the phrase explicitly addresses him.
  return "teacher";
}
function captureClassLine(text){
  const feature=averageRecentVoiceFeature();
  const speaker=classifySpeaker(feature);
  const line={text:text.trim(),speaker,subject:state.classSubject||"Clase",at:Date.now(),feature};
  state.classLines.push(line);
  state.classLines=state.classLines.slice(-1000);
  save("robotito.classLines.v1",state.classLines);
  if(speaker==="teacher" && state.voiceProfiles.teacher.length<2) learnSpeaker("teacher",feature);
  renderClassTranscript();
  $("#speakerPill").classList.remove("hidden");
  $("#speakerLabel").textContent=speaker==="me"?"vos":"profesora";
}
function startClassMode(){
  if(!state.started){toast("Primero despertá los sentidos.");return;}
  state.classMode=true;
  state.classStartedAt=Date.now();
  state.classSubject=$("#classSubject").value.trim()||"Clase";
  $("#classBadge").textContent="escuchando";
  $("#classBadge").classList.add("on");
  $("#speakerPill").classList.remove("hidden");
  setMood("focused","Robotito está concentrado escuchando la clase.");
  say("Modo clase activado. Voy a escuchar y aprender.");
}
function stopClassMode(){
  if(!state.classMode)return;
  state.classMode=false;
  $("#classBadge").textContent="apagado";
  $("#classBadge").classList.remove("on");
  $("#speakerPill").classList.add("hidden");
  setMood("proud","Robotito terminó de escuchar la clase y guardó lo que entendió.");
  say("Listo. Guardé la clase para estudiar después.");
  summarizeClass();
}
function classLinesForSubject(){
  const subj=normalizeText(state.classSubject||$("#classSubject").value||"");
  if(!subj)return state.classLines.slice(-250);
  const matched=state.classLines.filter(l=>normalizeText(l.subject).includes(subj)||subj.includes(normalizeText(l.subject)));
  return (matched.length?matched:state.classLines).slice(-250);
}
function contentWords(text){
  const stop=new Set(["que","como","para","por","una","uno","unos","unas","del","las","los","con","sin","sobre","esto","esta","este","son","fue","era","hay","muy","mas","pero","porque","cuando","donde","cual","cuales","quien","profesora","clase"]);
  return normalizeText(text).split(" ").filter(w=>w.length>3&&!stop.has(w));
}
function answerFromClass(question){
  const words=contentWords(question);
  const lines=classLinesForSubject();
  const ranked=lines.map(l=>{
    const norm=normalizeText(l.text);
    let score=0;
    words.forEach(w=>{if(norm.includes(w))score+=2;});
    if(l.speaker==="teacher")score+=.5;
    return {l,score};
  }).sort((a,b)=>b.score-a.score);
  const best=ranked.filter(x=>x.score>0).slice(0,3);
  if(!best.length)return null;
  return best.map(x=>x.l.text).join(" ");
}
function summarizeClass(){
  const lines=classLinesForSubject().filter(l=>l.speaker==="teacher");
  const out=$("#classSummary");
  if(!lines.length){out.innerHTML='<p class="muted">Todavía no tengo suficientes explicaciones de la profesora guardadas.</p>';return;}
  const candidates=lines.filter(l=>l.text.length>35).slice(-80);
  const seen=new Set();
  const selected=[];
  for(const l of candidates.reverse()){
    const key=normalizeText(l.text).split(" ").slice(0,6).join(" ");
    if(!seen.has(key)){seen.add(key);selected.push(l.text);}
    if(selected.length>=6)break;
  }
  out.innerHTML=selected.reverse().map(t=>'<div class="study-chip">• '+escapeHtml(t)+'</div>').join("");
}
function askClass(){
  const q=$("#classQuestion").value.trim();
  if(!q)return;
  robot.classList.add("thinking");setTimeout(()=>robot.classList.remove("thinking"),1200);
  setMood("curious","Robotito está buscando en lo que aprendió de clase.");
  const ans=answerFromClass(q);
  $("#classAnswer").innerHTML=ans?'<div class="study-chip">'+escapeHtml(ans)+'</div>':'<div class="study-chip">No encontré eso en lo que escuché. Puede que no lo haya entendido bien o que todavía no se haya explicado.</div>';
  say(ans?ans.slice(0,220):"No encontré eso en mis apuntes de clase.",4200);
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
function renderClassTranscript(){
  const root=$("#classTranscript");
  const lines=classLinesForSubject().slice(-40);
  if(!lines.length){root.innerHTML='<p class="muted">Todavía no hay frases guardadas.</p>';return;}
  root.innerHTML=lines.map(l=>'<div class="class-line '+(l.speaker==="me"?"me":"teacher")+'"><span class="speaker-tag">'+(l.speaker==="me"?"VOS":"PROFESORA")+'</span>'+escapeHtml(l.text)+'</div>').join("");
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

function handleSpeech(rawText){
  const text=normalizeText(rawText);
  const who=state.currentPerson;

  if((text.includes("libro")||text.includes("recomend")) && text.includes("ayer")){
    const last=load(KEYS.lastBook,null);
    say(last?`Ayer te había recomendado “${last.title}”`:"No encuentro una recomendación anterior.");
    return;
  }

  if(/(recomendame|recomiendame|recomenda|recomienda).*(libro)/.test(text) || text==="recomendame un libro"){
    let prompt=rawText.replace(/recom(i|ie)enda(me)?\s+(un\s+)?libro/i,"").trim();
    if(!prompt) prompt="ficción interesante";
    $("#bookPrompt").value=prompt;
    recommendBook(prompt);
    return;
  }

  if(/(que aprendiste hoy|que aprendiste|que sabes de la clase|explicame la clase)/.test(text)){
    const ans=answerFromClass(rawText);
    if(ans){say(ans.slice(0,260),5000);return;}
    summarizeClass();say("Abrí la pestaña Clase: ahí te dejé lo que pude aprender.",4000);return;
  }
  if(state.classLines.length && /^(que|como|por que|porque|cual|cuando|donde)/.test(text)){
    const ans=answerFromClass(rawText);
    if(ans){say(ans.slice(0,280),5200);return;}
  }
  if(answerEasyQuestion(rawText)) return;

  const nice=["te quiero","te amo","sos lindo","sos tierno","gracias robotito","que lindo","hermoso","precioso"];
  const mean=["te odio","sos feo","callate","tonto","molesto","idiota"];

  if(nice.some(x=>text.includes(x))){
    changeMoodScore(4,who);
    setMood("happy","Robotito escuchó algo lindo y se puso contento.");
    animatePet();
  }
  if(mean.some(x=>text.includes(x))){
    changeMoodScore(-5,who);
    setMood("sad","Eso lo dejó un poquito triste.");
    say("…");
  }
}

async function detectLoop(){
  if(!state.started)return;
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
      state.currentPerson=null;
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
  state.faceMatcher=labeled.length?new faceapi.FaceMatcher(labeled,.52):null;
}

function greetingFor(p){
  const rel=p.relationship??50;
  let choices;

  if(rel>=75){
    choices=[
      `¡${p.name}! Justo quería verte ♡`,
      `Mirá quién llegó 🐼 Hola, ${p.name}.`,
      `¡${p.name}! *mini saltito feliz*`,
      `Holaaa, ${p.name} 🐼♡`,
      `Ah, sos vos. Eso me pone de buen humor.`,
      `¡Volviste, ${p.name}! Me alegra verte.`
    ];
  }else if(rel>=50){
    choices=[
      `Hola, ${p.name} 🐼`,
      `¡Te reconocí, ${p.name}!`,
      `Ey, ${p.name}. Volviste.`,
      `Hola de nuevo, ${p.name}.`,
      `Mmm… esa cara la conozco. Hola, ${p.name}.`,
      `¿Qué tal, ${p.name}?`
    ];
  }else{
    choices=[
      `Ah… hola, ${p.name}.`,
      `Te vi, ${p.name}. Estoy observando 👀`,
      `Hola. Todavía me acuerdo de vos.`,
      `Mmm, ${p.name}… veremos cómo te portás hoy.`
    ];
  }

  const last=state.greetingHistory[p.name];
  const filtered=choices.filter(x=>x!==last);
  const chosen=sample(filtered.length?filtered:choices);
  state.greetingHistory[p.name]=chosen;
  save(KEYS.greetings,state.greetingHistory);
  return chosen;
}

function recognize(det){
  if(!state.faceMatcher){state.currentPerson=null;return;}
  const best=state.faceMatcher.findBestMatch(det.descriptor);
  if(best.label==="unknown"){state.currentPerson=null;return;}

  const p=state.people.find(x=>x.name===best.label);
  if(!p)return;

  const changed=state.currentPerson!==best.label;
  state.currentPerson=best.label;
  const lastGreeting=p.lastGreetingAt||0;

  if(changed && Date.now()-lastGreeting>25000){
    p.lastGreetingAt=Date.now();
    save(KEYS.people,state.people);
    say(greetingFor(p));
    if((p.relationship??50)>=68) animatePet();
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
    hands.setOptions({maxNumHands:2,modelComplexity:0,minDetectionConfidence:.6,minTrackingConfidence:.55});

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
        return;
      }

      const vw=camera.videoWidth||640, vh=camera.videoHeight||480;
      const mouth=face.landmarks.getMouth();
      const mx=mouth.reduce((a,p)=>a+p.x,0)/mouth.length/vw;
      const my=mouth.reduce((a,p)=>a+p.y,0)/mouth.length/vh;

      state.handNearMouth=landmarks.some(hand=>{
        const tips=[4,8,12,16,20].map(i=>hand[i]);
        return tips.some(p=>Math.hypot(p.x-mx,p.y-my)<.15);
      });
    });

    const loop=async()=>{
      if(!state.started||state.handsBusy){setTimeout(loop,450);return;}
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
  const ratio=mouthOpenRatio(det.landmarks);
  if(ratio>.15&&state.handNearMouth) eatHits++;
  else eatHits=Math.max(0,eatHits-1);

  if(eatHits>4 && Date.now()-lastSharedMeal>45000){
    lastSharedMeal=Date.now();
    feedRobot(true);
    eatHits=0;
  }
}

async function enrollPerson(){
  const name=$("#personName").value.trim();
  const birthday=$("#personBirthday").value;
  if(!name)return toast("Escribí el nombre.");
  if(!state.started)return toast("Primero activá cámara y micrófono.");

  $("#enrollStatus").textContent="Mirando la cara…";
  const samples=[];
  for(let i=0;i<4;i++){
    const det=await faceapi.detectSingleFace(camera,new faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.5}))
      .withFaceLandmarks().withFaceDescriptor();
    if(det)samples.push([...det.descriptor]);
    await new Promise(r=>setTimeout(r,420));
  }

  if(samples.length<3){
    $("#enrollStatus").textContent="No pude ver bien la cara. Probá con más luz y mirá al frente.";
    return;
  }

  const existing=state.people.find(p=>p.name.toLowerCase()===name.toLowerCase());
  if(existing){
    existing.descriptors=samples;
    existing.birthday=birthday||existing.birthday;
  }else{
    state.people.push({name,birthday,descriptors:samples,relationship:50,createdAt:Date.now()});
  }

  save(KEYS.people,state.people);
  buildMatcher();
  renderPeople();
  $("#enrollStatus").textContent=`Listo: ahora recuerdo a ${name}.`;
  say(sample([
    `Ya sé quién sos, ${name} 🐼`,
    `Listo, ${name}. Esa cara queda guardada.`,
    `Te voy a reconocer la próxima vez, ${name}.`
  ]));
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
  changeMoodScore(shared?2:4,state.currentPerson);
  setMood("happy",shared?"Robotito cree que están comiendo juntos.":"Robotito comió y quedó contentísimo.");
  animateEat();
  say(shared?sample(["¿Comemos juntos? 🐼🍓","Ñam… yo también quiero.","Comida compartida = mejor comida."]):sample(["¡Ñam! 🍓","Eso estaba buenísimo.","Gracias por darme de comer 🐼"]));
  updateMeters();
}

function petRobot(){
  changeMoodScore(5,state.currentPerson);
  setMood("happy","Robotito recibió mimos.");
  animatePet();
  say(sample(["♡","Mmm… más mimitos.","Eso sí me gusta 🐼","*se acerca un poquito*"]));
}

function scareRobot(){
  setMood("scared","Robotito se asustó por un instante.");
  say(sample(["¡AH!","¡No hagas eso! 😳","…casi me da algo."]));
  setTimeout(()=>{ if(state.hunger>=95)setMood("hungry"); else setMood("calm","Ya se le pasó el susto."); },900);
}

function hugRobot(){
  changeMoodScore(4,state.currentPerson);
  robot.classList.add("hugging");
  setMood("affectionate","Robotito recibió un abrazo y está especialmente cariñoso.");
  say(sample(["Abrazo panda 🐼♡","Ok… este abrazo sí lo acepto.","*te abraza de vuelta*"]));
  setTimeout(()=>robot.classList.remove("hugging"),1700);
}
function highFiveRobot(){
  robot.classList.add("highfive");
  setMood("excited","Robotito chocó los cinco.");
  say(sample(["¡Cinco! ✋","Eso salió bien.","Otra vez 😌"]));
  setTimeout(()=>robot.classList.remove("highfive"),1300);
}
function playRobot(){
  robot.classList.add("playing");
  setMood("excited","Robotito está jugando.");
  say(sample(["¡Jugamos!","Ok, mini recreo 🐼","*saltitos panda*"]));
  setTimeout(()=>{robot.classList.remove("playing");setMood("calm");},2300);
}
function pokeRobot(){
  changeMoodScore(-3,state.currentPerson);
  setMood("angry","Robotito se molestó un poco.");
  animatePoke();
  say(sample(["Ey 😠","No me pinches.","Eso no era una caricia.","Te estoy mirando…"]));
  setTimeout(()=>ambientMood(),2500);
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
  const quietFor=(Date.now()-Math.max(state.lastSeenAt,state.lastHeardAt))/1000;

  if(quietFor>100){
    if(!state.sleeping) say("Zzz…");
    state.sleeping=true;
    robot.classList.add("sleeping");
    setMood("sleepy","No ve ni escucha a nadie hace rato. Se quedó dormido.");
    state.energy=clamp(state.energy+.35,0,100);
  }else if(quietFor>65){
    state.sleeping=false;
    robot.classList.remove("sleeping");
    setMood("sleepy","Robotito está cabeceando de sueño.");
    state.energy=clamp(state.energy-.08,0,100);
  }else{
    if(state.sleeping) say(sample(["¿Mm? Ya volviste.","Ah… me despertaste.","¿Qué pasó? 👀"]));
    state.sleeping=false;
    robot.classList.remove("sleeping");
    state.energy=clamp(state.energy-.025,0,100);
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
      <div class="relation">${relationText(p.relationship??50)}</div>
      <div class="muted">${p.birthday?"Cumple: "+new Date(p.birthday+"T12:00:00").toLocaleDateString("es-UY"):"Sin cumpleaños cargado"}</div>`;
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

function clockTick(){
  const d=new Date();
  $("#clock").textContent=d.toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit"});
  $("#dateInfo").textContent=d.toLocaleDateString("es-UY",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}

function ambientMood(){
  hungerTick();
  inactivityTick();
  if(!state.sleeping&&state.hunger<70){
    if(state.moodScore>=70)setMood("happy");
    else if(state.moodScore<30)setMood("sad");
    else if(!["scared","angry"].includes(state.mood))setMood("calm");
  }
  updateMeters();
}

function bindUI(){
  $("#startBtn").addEventListener("click",startSenses);
  $("#enrollBtn").addEventListener("click",enrollPerson);
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

  $("#goodreadsFile").addEventListener("change",e=>{
    if(e.target.files[0])importGoodreads(e.target.files[0]);
  });
  $("#recommendBtn").addEventListener("click",()=>recommendBook());
  $("#startClassBtn").addEventListener("click",startClassMode);
  $("#stopClassBtn").addEventListener("click",stopClassMode);
  $("#summarizeClassBtn").addEventListener("click",summarizeClass);
  $("#askClassBtn").addEventListener("click",askClass);
  $("#flashcardsBtn").addEventListener("click",makeFlashcards);
  $("#nextMeBtn").addEventListener("click",()=>{state.speakerOverride="me";toast("La próxima frase se aprenderá como tu voz.");});
  $("#nextTeacherBtn").addEventListener("click",()=>{state.speakerOverride="teacher";toast("La próxima frase se aprenderá como voz de profesora.");});
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

function purgeAAA(){
  const isAAA=name=>normalizeText(name)==="aaa";

  state.people=state.people.filter(p=>!isAAA(p.name));
  state.memories=state.memories.filter(m=>!isAAA(m.person));
  Object.keys(state.greetingHistory).forEach(name=>{if(isAAA(name))delete state.greetingHistory[name];});

  save(KEYS.people,state.people);
  save(KEYS.memories,state.memories);
  save(KEYS.greetings,state.greetingHistory);

  const oldPeople=load("robotito.people.v1",[]).filter(p=>!isAAA(p.name));
  const oldMem=load("robotito.memories.v1",[]).filter(m=>!isAAA(m.person));
  save("robotito.people.v1",oldPeople);
  save("robotito.memories.v1",oldMem);
}

function init(){
  migrateOldData();
  purgeAAA();
  bindUI();
  buildMatcher();
  renderPeople();
  renderMemories();
  updateLibraryStats();
  $("#tasksSheetUrl").value=state.tasksSheetUrl;
  $("#tasksSheetGid").value=state.tasksSheetGid;
  renderTasks();
  renderClassTranscript();
  summarizeClass();
  clockTick();
  updateMeters();
  blinkLoop();
  setInterval(clockTick,1000);
  setInterval(updateClassDuration,1000);
  setInterval(ambientMood,2500);
  setInterval(taskReminderTick,30000);
  if(state.tasksSheetUrl) refreshTasks();
}

document.addEventListener("DOMContentLoaded",init);