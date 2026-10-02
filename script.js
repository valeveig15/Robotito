const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const KEYS = {
  people: "robotito.people.v1",
  memories: "robotito.memories.v1",
  goodreads: "robotito.goodreads.v1",
  lastFed: "robotito.lastFed.v1",
  lastBook: "robotito.lastBook.v1"
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
  audioLevel: 0,
  musicFrames: 0,
  sleeping: false,
  speaking: false,
  recognition: null,
  stream: null,
  analyser: null,
  lastDetections: [],
  lastBookRecommendation: null,
  people: load(KEYS.people, []),
  memories: load(KEYS.memories, []),
  library: load(KEYS.goodreads, []),
};

const robot = $("#robotito");
const camera = $("#camera");
const canvas = $("#visionCanvas");

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

function say(text, ms=3200){
  const b=$("#speechBubble");
  b.textContent=text;
  b.classList.remove("hidden");
  clearTimeout(say.t);
  say.t=setTimeout(()=>b.classList.add("hidden"),ms);
}
function toast(text){
  const t=$("#toast"); t.textContent=text; t.classList.remove("hidden");
  clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.add("hidden"),2500);
}

function setMood(mood, reason=""){
  const moods=["calm","happy","sad","angry","scared","hungry","sleepy"];
  moods.forEach(m=>robot.classList.remove("mood-"+m));
  robot.classList.add("mood-"+m);
  state.mood=mood;
  const labels={calm:"tranquilo",happy:"feliz",sad:"triste",angry:"enojado",scared:"asustado",hungry:"hambriento",sleepy:"con sueño"};
  $("#moodLabel").textContent=labels[mood]||mood;
  if(reason) $("#statusText").textContent=reason;
}

function changeMoodScore(delta, personName=null){
  state.moodScore=clamp(state.moodScore+delta,0,100);
  if(personName){
    const p=state.people.find(x=>x.name===personName);
    if(p){ p.relationship=clamp((p.relationship??50)+delta,0,100); save(KEYS.people,state.people); renderPeople(); }
  }
}

function relationText(v){
  if(v>=80)return "te adora";
  if(v>=65)return "confía mucho en esta persona";
  if(v>=50)return "se lleva bien";
  if(v>=35)return "está desconfiado";
  return "no le cae nada bien";
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
  const delay=2200+Math.random()*4500;
  setTimeout(()=>{
    if(!state.sleeping){robot.classList.add("blink");setTimeout(()=>robot.classList.remove("blink"),150);}
    blinkLoop();
  },delay);
}
function moveEyes(nx,ny){
  const x=clamp(nx,-1,1)*7,y=clamp(ny,-1,1)*5;
  $$(".iris").forEach(i=>i.style.transform=`translate(${x}px,${y}px)`);
}
function followFace(box){
  const vw=camera.videoWidth||640, vh=camera.videoHeight||480;
  const cx=(box.x+box.width/2)/vw;
  const cy=(box.y+box.height/2)/vh;
  const left=clamp(18+cx*64,18,82);
  const top=clamp(30+cy*32,30,62);
  robot.style.left=left+"%";
  robot.style.top=top+"%";
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
    state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}},audio:true});
    camera.srcObject=state.stream;
    await camera.play();
    await loadFaceModels();
    setupAudio(state.stream);
    setupSpeechRecognition();
    state.started=true;
    $("#startBtn").textContent="Sentidos activos";
    $("#startBtn").disabled=true;
    $("#systemStatus").textContent="Cámara y micrófono activos.";
    say("¡Hola! Ya te puedo ver y escuchar 👀");
    detectLoop();
  }catch(err){
    console.error(err);
    $("#systemStatus").textContent="No pude activar cámara/micrófono.";
    toast("Necesito permiso de cámara y micrófono.");
  }
}

function setupAudio(stream){
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const src=ctx.createMediaStreamSource(stream);
    const analyser=ctx.createAnalyser(); analyser.fftSize=512;
    src.connect(analyser); state.analyser=analyser;
    const data=new Uint8Array(analyser.frequencyBinCount);
    const tick=()=>{
      analyser.getByteFrequencyData(data);
      const avg=data.reduce((a,b)=>a+b,0)/data.length;
      state.audioLevel=avg;
      $("#heardLabel").textContent=avg>18?"sonido":"silencio";
      if(avg>22){state.lastHeardAt=Date.now();}
      if(avg>34){state.musicFrames++;} else {state.musicFrames=Math.max(0,state.musicFrames-2);}
      robot.classList.toggle("dancing",state.musicFrames>18&&!state.sleeping);
      requestAnimationFrame(tick);
    }; tick();
  }catch(e){console.warn(e);}
}

function setupSpeechRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return;
  const r=new SR(); r.lang="es-UY"; r.continuous=true; r.interimResults=false;
  r.onresult=(ev)=>{
    const text=ev.results[ev.results.length-1][0].transcript.trim();
    $("#transcript").textContent=text;
    state.lastHeardAt=Date.now();
    handleSpeech(text.toLowerCase());
  };
  r.onend=()=>{if(state.started)try{r.start()}catch{}};
  try{r.start();state.recognition=r;}catch{}
}

function handleSpeech(text){
  const who=state.currentPerson;
  const nice=["lindo","linda","te quiero","te amo","bien robotito","gracias","precioso","preciosa","tierno","tierna"];
  const mean=["feo","fea","odio","callate","cállate","molesto","molesta","tonto","tonta"];
  if(nice.some(x=>text.includes(x))){
    changeMoodScore(5,who); setMood("happy","Robotito escuchó algo lindo y se puso contento."); say("♡");
  }
  if(mean.some(x=>text.includes(x))){
    changeMoodScore(-7,who); setMood("sad","Eso no le gustó nada a Robotito."); say("…");
  }
  if(text.includes("qué día")||text.includes("que dia")){
    const d=new Date(); say(d.toLocaleDateString("es-UY",{weekday:"long",day:"numeric",month:"long",year:"numeric"}));
  }
  if((text.includes("libro")||text.includes("recomend"))&&text.includes("ayer")){
    const last=load(KEYS.lastBook,null);
    say(last?`Ayer te había recomendado “${last.title}”`:"No encuentro una recomendación anterior.");
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
  setTimeout(detectLoop,650);
}

function buildMatcher(){
  const labeled=[];
  for(const p of state.people){
    if(Array.isArray(p.descriptors)&&p.descriptors.length){
      const ds=p.descriptors.map(d=>new Float32Array(d));
      labeled.push(new faceapi.LabeledFaceDescriptors(p.name,ds));
    }
  }
  state.faceMatcher=labeled.length?new faceapi.FaceMatcher(labeled,.52):null;
}

function recognize(det){
  if(!state.faceMatcher){state.currentPerson=null;return;}
  const best=state.faceMatcher.findBestMatch(det.descriptor);
  if(best.label==="unknown"){state.currentPerson=null;return;}
  if(state.currentPerson!==best.label){
    state.currentPerson=best.label;
    const p=state.people.find(x=>x.name===best.label);
    if(p){
      say(`¡Hola ${p.name}! ${relationText(p.relationship??50)}.`);
      checkBirthday(p);
    }
  }
}

function mouthOpenRatio(landmarks){
  try{
    const pts=landmarks.getMouth();
    const v=Math.hypot(pts[14].x-pts[18].x,pts[14].y-pts[18].y);
    const h=Math.hypot(pts[12].x-pts[16].x,pts[12].y-pts[16].y);
    return h?v/h:0;
  }catch{return 0}
}
let eatHits=0;
function detectEating(det){
  const ratio=mouthOpenRatio(det.landmarks);
  if(ratio>.18&&state.audioLevel>8)eatHits++;else eatHits=Math.max(0,eatHits-1);
  if(eatHits>4){
    robot.classList.add("eating");
    if(state.hunger>3) feedRobot(true);
    setTimeout(()=>robot.classList.remove("eating"),1600);
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
  for(let i=0;i<3;i++){
    const det=await faceapi.detectSingleFace(camera,new faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.5}))
      .withFaceLandmarks().withFaceDescriptor();
    if(det)samples.push([...det.descriptor]);
    await new Promise(r=>setTimeout(r,450));
  }
  if(samples.length<2){$("#enrollStatus").textContent="No pude ver bien la cara. Probá con más luz.";return;}
  const existing=state.people.find(p=>p.name.toLowerCase()===name.toLowerCase());
  if(existing){existing.descriptors=samples;existing.birthday=birthday||existing.birthday;}
  else state.people.push({name,birthday,descriptors:samples,relationship:50,createdAt:Date.now()});
  save(KEYS.people,state.people);buildMatcher();renderPeople();
  $("#enrollStatus").textContent=`Listo: ahora recuerdo a ${name}.`;
  say(`¡Ya sé quién sos, ${name}!`);
}

function checkBirthday(p){
  if(!p.birthday)return;
  const now=new Date(), d=new Date(p.birthday+"T12:00:00");
  if(now.getMonth()===d.getMonth()&&now.getDate()===d.getDate()){
    birthdayParty(p.name);
  }
}
function birthdayParty(name){
  $("#birthdayText").textContent=`¡Feliz cumpleaños, ${name}! 🎉`;
  $("#birthdayScene").classList.remove("hidden");
  setMood("happy","¡Robotito reconoció a alguien que cumple años!");
  confetti(90);
  setTimeout(()=>$("#birthdayScene").classList.add("hidden"),6500);
}
function confetti(n=60){
  const layer=$("#confettiLayer");
  for(let i=0;i<n;i++){
    const c=document.createElement("div"); c.className="confetti";
    c.style.left=Math.random()*100+"vw";
    c.style.background=`hsl(${Math.random()*360} 80% 60%)`;
    c.style.setProperty("--dx",(Math.random()*240-120)+"px");
    c.style.animationDuration=(2+Math.random()*2.8)+"s";
    layer.appendChild(c); setTimeout(()=>c.remove(),5200);
  }
}

function feedRobot(shared=false){
  localStorage.setItem(KEYS.lastFed,String(Date.now()));
  state.hunger=0; changeMoodScore(4,state.currentPerson);
  setMood("happy",shared?"Robotito cree que están comiendo juntos.":"¡Banana! Robotito está feliz y lleno.");
  say(shared?"¿Estamos comiendo juntos? 🍌":"¡Ñam! 🍌");
  robot.classList.add("eating");setTimeout(()=>robot.classList.remove("eating"),1300);
}

function hungerTick(){
  const last=Number(localStorage.getItem(KEYS.lastFed)||Date.now());
  if(!localStorage.getItem(KEYS.lastFed))localStorage.setItem(KEYS.lastFed,String(last));
  const hours=(Date.now()-last)/36e5;
  state.hunger=clamp(hours/4*100,0,100);
  if(hours>=4){setMood("angry","Robotito está MUY enojado: hace más de 4 horas que no come.");}
  else if(hours>=3){setMood("hungry","Robotito tiene mucha hambre. Ya pasaron 3 horas.");}
}

function inactivityTick(){
  const quietFor=(Date.now()-Math.max(state.lastSeenAt,state.lastHeardAt))/1000;
  if(quietFor>85){
    state.sleeping=true;robot.classList.add("sleeping");setMood("sleepy","No ve ni escucha a nadie hace rato. Se quedó dormido.");
    state.energy=clamp(state.energy+.3,0,100);
  }else if(quietFor>55){
    state.sleeping=false;robot.classList.remove("sleeping");setMood("sleepy","Robotito está cabeceando…");
    state.energy=clamp(state.energy-.1,0,100);
  }else{
    if(state.sleeping){say("¡Ah! Me despertaste 👀");}
    state.sleeping=false;robot.classList.remove("sleeping");
    state.energy=clamp(state.energy-.03,0,100);
  }
}

function renderPeople(){
  const root=$("#peopleList");root.innerHTML="";
  if(!state.people.length){root.innerHTML='<p class="muted">Todavía no recuerda a nadie.</p>';return;}
  for(const p of state.people){
    const row=document.createElement("div");row.className="person-row";
    row.innerHTML=`<strong>${escapeHtml(p.name)}</strong><div class="relation">${relationText(p.relationship??50)}</div><div class="muted">${p.birthday?"Cumple: "+new Date(p.birthday+"T12:00:00").toLocaleDateString("es-UY"):"Sin cumpleaños cargado"}</div>`;
    root.appendChild(row);
  }
}
function renderMemories(){
  const root=$("#memoryList");root.innerHTML="";
  const list=[...state.memories].reverse();
  if(!list.length){root.innerHTML='<p class="muted">Todavía no guardó recuerdos.</p>';return;}
  list.forEach(m=>{
    const row=document.createElement("div");row.className="memory-row";
    row.innerHTML=`<strong>${escapeHtml(m.person||"Alguien")}</strong><p>${escapeHtml(m.text)}</p><span class="muted">${new Date(m.at).toLocaleString("es-UY")}</span>`;
    root.appendChild(row);
  });
}
function remember(){
  const text=$("#memoryInput").value.trim();if(!text)return;
  state.memories.push({person:state.currentPerson||"persona no reconocida",text,at:Date.now()});
  save(KEYS.memories,state.memories);$("#memoryInput").value="";renderMemories();say("Lo voy a recordar.");
}

function parseCSV(text){
  const rows=[];let row=[],field="",q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(c=='"'&&q&&n=='"'){field+='"';i++;}
    else if(c=='"')q=!q;
    else if(c==","&&!q){row.push(field);field="";}
    else if((c=="\n"||c=="\r")&&!q){if(c=="\r"&&n=="\n")i++;row.push(field);if(row.some(x=>x!==""))rows.push(row);row=[];field="";}
    else field+=c;
  }
  if(field||row.length){row.push(field);rows.push(row);}
  return rows;
}
async function importGoodreads(file){
  const text=await file.text(),rows=parseCSV(text);if(rows.length<2)return;
  const headers=rows[0].map(h=>h.trim());
  state.library=rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||""])));
  save(KEYS.goodreads,state.library);updateLibraryStats();toast("Biblioteca importada.");
}
function updateLibraryStats(){
  if(!state.library.length){$("#libraryStats").textContent="Biblioteca todavía no importada.";return;}
  const read=state.library.filter(b=>(b["Exclusive Shelf"]||"").toLowerCase()==="read").length;
  const tbr=state.library.filter(b=>(b["Exclusive Shelf"]||"").toLowerCase()==="to-read").length;
  $("#libraryStats").textContent=`${state.library.length} libros · ${read} leídos · ${tbr} por leer`;
}

function norm(s){return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function scoreBook(book,prompt){
  const p=norm(prompt), hay=norm([book["Title"],book["Author"],book["Bookshelves"],book["My Review"]].join(" "));
  let s=0;
  p.split(/\s+/).filter(x=>x.length>3).forEach(w=>{if(hay.includes(w))s+=2;});
  if((book["Exclusive Shelf"]||"")==="to-read")s+=1;
  return s;
}
async function recommendBook(){
  const prompt=$("#bookPrompt").value.trim();
  if(!prompt)return toast("Decime qué tipo de libro querés.");
  const only=$("#onlyOwned").checked, exclude=$("#excludeRead").checked;
  $("#bookResults").innerHTML='<div class="card">Pensando… 📚</div>';

  if(only&&state.library.length){
    let pool=state.library.filter(b=>!exclude||(b["Exclusive Shelf"]||"").toLowerCase()!=="read");
    pool=pool.map(b=>({b,s:scoreBook(b,prompt)})).sort((a,b)=>b.s-a.s);
    const choice=pool[0]?.b;
    if(choice){showBook({title:choice["Title"],authors:[choice["Author"]],description:choice["My Review"]||"Está en tu biblioteca.",thumbnail:""},true);return;}
  }

  try{
    const q=encodeURIComponent(prompt);
    const res=await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=12&printType=books`);
    const data=await res.json();
    const readTitles=new Set(state.library.filter(b=>(b["Exclusive Shelf"]||"").toLowerCase()==="read").map(b=>norm(b["Title"])));
    const items=(data.items||[]).map(x=>x.volumeInfo).filter(v=>v.title);
    const filtered=exclude?items.filter(v=>!readTitles.has(norm(v.title))):items;
    const v=filtered[0]||items[0];
    if(!v)throw new Error("sin resultados");
    showBook({title:v.title,authors:v.authors||[],description:v.description||"Sin descripción disponible.",thumbnail:v.imageLinks?.thumbnail||""},false);
  }catch(e){
    $("#bookResults").innerHTML='<div class="card">No pude buscar libros ahora. Si importaste Goodreads, probá “Solo de mi biblioteca”.</div>';
  }
}
function showBook(book,owned){
  state.lastBookRecommendation={title:book.title,at:Date.now()};save(KEYS.lastBook,state.lastBookRecommendation);
  $("#bookResults").innerHTML=`<div class="book-card">${book.thumbnail?`<img src="${book.thumbnail.replace("http:","https:")}" alt="">`:"<div></div>"}<div><strong>${escapeHtml(book.title)}</strong><p>${escapeHtml(book.authors.join(", "))}</p><p>${escapeHtml((book.description||"").replace(/<[^>]+>/g,"").slice(0,280))}${book.description?.length>280?"…":""}</p><span class="relation">${owned?"Ya está en tu biblioteca":"Sugerencia nueva"}</span></div></div>`;
  say(`Yo probaría con “${book.title}” 📚`);
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function clockTick(){
  const d=new Date();
  $("#clock").textContent=d.toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit"});
  $("#dateInfo").textContent=d.toLocaleDateString("es-UY",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}
function ambientMood(){
  hungerTick(); inactivityTick();
  if(!state.sleeping&&state.hunger<70){
    if(state.moodScore>=70)setMood("happy");
    else if(state.moodScore<30)setMood("sad");
    else if(!["scared","angry"].includes(state.mood))setMood("calm");
  }
  updateMeters();
}
function bindUI(){
  $("#startBtn").onclick=startSenses;
  $("#enrollBtn").onclick=enrollPerson;
  $("#refreshPeopleBtn").onclick=renderPeople;
  $("#rememberBtn").onclick=remember;
  $("#clearMemoryBtn").onclick=()=>{if(confirm("¿Borrar todos los recuerdos guardados?")){state.memories=[];save(KEYS.memories,[]);renderMemories();}};
  $("#goodreadsFile").onchange=e=>{if(e.target.files[0])importGoodreads(e.target.files[0]);};
  $("#recommendBtn").onclick=recommendBook;
  $$(".tab").forEach(t=>t.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));$$(".tabpage").forEach(x=>x.classList.remove("active"));t.classList.add("active");$("#tab-"+t.dataset.tab).classList.add("active");});
  $$("[data-action]").forEach(b=>b.onclick=()=>{
    const a=b.dataset.action;
    if(a==="feed")feedRobot(false);
    if(a==="pet"){changeMoodScore(6,state.currentPerson);setMood("happy","Le hiciste mimos y se puso feliz.");say("♡♡♡");}
    if(a==="surprise"){setMood("scared","¡Lo asustaste!");say("!!!");setTimeout(()=>ambientMood(),2600);}
    if(a==="poke"){changeMoodScore(-5,state.currentPerson);setMood("angry","No le gustó que lo molestaran.");say("😠");setTimeout(()=>ambientMood(),3000);}
  });
}
function init(){
  bindUI();buildMatcher();renderPeople();renderMemories();updateLibraryStats();clockTick();updateMeters();blinkLoop();
  setInterval(clockTick,1000);setInterval(ambientMood,2500);
}
document.addEventListener("DOMContentLoaded",init);
