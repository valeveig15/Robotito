// P09 — Explicitly consented local pseudonymous visitor memory.
// No hidden biometric persistence. A 12+ character passphrase is needed to
// unlock across visits; the passphrase and decrypted face templates live only
// in memory. No images, audio, names or identifiers are sent off device.
(function(root){
"use strict";
const KEY="robotito.visitors.v1",FORMAT="robotito-p09-encrypted-vault";
const ITERATIONS=310000,MAX_PROFILES=24,MAX_BYTES=256*1024;
const AAD=new TextEncoder().encode("robotito-p09-v1|aes256gcm|pbkdf2-310000");
let key=null,salt=null,profiles=[],revision=0,unlocked=false,active=null;
let lastObservation=null,lastInteraction=new Map(),operation=Promise.resolve();
const langCodes=["es","en","pt","fr","it","de"];
const BOND_KEYS=["affection","trust","fear","irritation"];
const DELTAS={
 pet:{affection:1.2,trust:.7,fear:-.3,irritation:-.4},
 feed:{affection:.65,trust:.5,irritation:-.2},
 play:{affection:.8,trust:.45,irritation:-.3},
 highfive:{affection:.6,trust:.45,irritation:-.2},
 poke:{irritation:1.2,trust:-.5,affection:-.25},
 scare:{fear:1.5,trust:-.55,irritation:.4}
};
function clamp(x,lo,hi){return Math.min(hi,Math.max(lo,x));}
function randomBytes(n){const b=new Uint8Array(n);root.crypto.getRandomValues(b);return b;}
function b64(bytes){let str="";for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(str);}
function unb64(value,limit){
 if(typeof value!=="string"||value.length>Math.ceil(limit/3)*4||
   !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))
  throw new Error("Invalid encrypted visitor data");
 const raw=atob(value);if(raw.length>limit)throw new Error("Visitor vault exceeds the limit");
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function requireCrypto(){
 if(!root.crypto?.subtle?.encrypt||!root.crypto?.getRandomValues)
  throw new Error("Private visitor memory requires secure Web Crypto");
}
function passwordCheck(pass){
 if(typeof pass!=="string"||pass.length<12||pass.length>256)
  throw new Error("Use a passphrase of 12 to 256 characters");
}
async function derive(pass,s){
 requireCrypto();passwordCheck(pass);
 const raw=new TextEncoder().encode(pass);
 const base=await root.crypto.subtle.importKey("raw",raw,{name:"PBKDF2"},false,["deriveKey"]);
 raw.fill(0);
 return root.crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",iterations:ITERATIONS,salt:s},
  base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
function validVector(v){
 return (Array.isArray(v)||ArrayBuffer.isView(v))&&v.length===128&&
  Array.from(v).every(x=>Number.isFinite(x)&&Math.abs(x)<=10);
}
function distance(a,b){
 if(!validVector(a)||!validVector(b))return Infinity;
 let sum=0;for(let i=0;i<128;i++)sum+=(a[i]-b[i])**2;
 return Math.sqrt(sum);
}
function centroid(samples){
 const arr=new Array(128).fill(0);
 for(const v of samples)for(let i=0;i<128;i++)arr[i]+=v[i];
 return arr.map(x=>Math.round(x/samples.length*10000)/10000);
}
function template(samples){
 if(!Array.isArray(samples)||samples.length<9||samples.length>36||
   !samples.every(validVector))throw new Error("At least nine valid independent face samples are required");
 const distinct=samples.filter((v,i)=>!samples.slice(0,i).some(w=>distance(v,w)<.012));
 if(distinct.length<3)throw new Error("Face samples are not independent");
 const n=Math.floor(samples.length/3);
 return [centroid(samples.slice(0,n)),centroid(samples.slice(n,2*n)),
   centroid(samples.slice(2*n))];
}
function median(values){
 if(!values.length)return Infinity;
 const sorted=values.slice().sort((a,b)=>a-b);
 return sorted[Math.floor(sorted.length/2)];
}
function score(samples,stored){
 if(!Array.isArray(stored)||stored.length!==3||!stored.every(validVector))return Infinity;
 return median(samples.map(sample=>Math.min(...stored.map(v=>distance(sample,v)))));
}
function findCandidate(samples,entries=profiles){
 if(!Array.isArray(samples)||samples.length<2||samples.some(v=>!validVector(v)))return null;
 const sorted=entries.map(p=>({p,d:score(samples,p.templates)})).sort((a,b)=>a.d-b.d);
 const best=sorted[0],second=sorted[1];
 if(!best||!Number.isFinite(best.d)||best.d>.39||
    (second&&second.d-best.d<.10))return null;
 return {id:best.p.id,distance:best.d,margin:second?second.d-best.d:Infinity};
}
function validateProfiles(items){
 if(!Array.isArray(items)||items.length>MAX_PROFILES)throw new Error("Invalid visitor history");
 const seen=new Set();
 for(const p of items){
  if(!p||typeof p.id!=="string"||!/^[0-9a-f-]{20,40}$/i.test(p.id)||seen.has(p.id)||
     !Array.isArray(p.templates)||p.templates.length!==3||!p.templates.every(validVector)||
     !Number.isSafeInteger(p.consentAt)||p.consentAt<=0||
     !p.bond||BOND_KEYS.some(k=>!Number.isFinite(p.bond[k])||p.bond[k]<0||p.bond[k]>100))
   throw new Error("Invalid private visitor profile");
  seen.add(p.id);
 }
 return items;
}
async function seal(data){
 if(!key||!salt)throw new Error("Visitor vault locked");
 const bytes=new TextEncoder().encode(JSON.stringify(data));
 if(bytes.length>MAX_BYTES)throw new Error("Visitor history is too large");
 const iv=randomBytes(12);
 try{
  const enc=await root.crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:AAD,tagLength:128},key,bytes);
  return {format:FORMAT,schema:1,revision:revision+1,kdf:"PBKDF2-SHA256",iterations:ITERATIONS,
   cipher:"AES-256-GCM",salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(enc))};
 }finally{bytes.fill(0);}
}
async function open(passphrase){
 requireCrypto();passwordCheck(passphrase);
 const saved=await root.ROBOTITO_STORE?.get?.(KEY,null);
 // Never retain a previous decrypted vault after a failed unlock attempt.
 lock();
 if(saved){
  if(saved.format!==FORMAT||saved.schema!==1||saved.iterations!==ITERATIONS||
    saved.cipher!=="AES-256-GCM"||saved.kdf!=="PBKDF2-SHA256"||
    !Number.isSafeInteger(saved.revision)||saved.revision<1)
   throw new Error("Unsupported private visitor vault");
  const s=unb64(saved.salt,16),iv=unb64(saved.iv,12),data=unb64(saved.ciphertext,MAX_BYTES+16);
  if(s.length!==16||iv.length!==12||data.length<16)
   throw new Error("Damaged private visitor vault");
  const candidateKey=await derive(passphrase,s);
  let plain;
  try{plain=new Uint8Array(await root.crypto.subtle.decrypt(
    {name:"AES-GCM",iv,additionalData:AAD,tagLength:128},candidateKey,data));}
  catch{throw new Error("Wrong passphrase or damaged private visitor vault");}
  try{
   const parsed=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(plain));
   validateProfiles(parsed);
   salt=s;key=candidateKey;profiles=parsed;revision=saved.revision;unlocked=true;
  }finally{plain.fill(0);}
 }else{
  salt=randomBytes(16);key=await derive(passphrase,salt);
  revision=0;profiles=[];unlocked=true;
 }
 active=null;lastObservation=null;
 return {unlocked:true,count:profiles.length};
}
function locked(){return !unlocked;}
function lock(){key=null;salt=null;profiles=[];unlocked=false;active=null;lastObservation=null;lastInteraction.clear();}
function runExclusive(task){
 const current=operation.catch(()=>{}).then(task);
 operation=current;
 return current;
}
async function persist(next){
 validateProfiles(next);
 const nextEnvelope=await seal(next);
 try{await root.ROBOTITO_STORE.updateVisitorEnvelope(nextEnvelope,{expectedRevision:revision});}
 catch(error){lock();throw error;}
 profiles=next;revision=nextEnvelope.revision;
 return nextEnvelope;
}
function eligibleRegistered(samples,people){
 for(const person of people||[]){
  const refs=person?.descriptors||[];
  if(!Array.isArray(refs)||refs.length<3)continue;
  const hits=samples.filter(v=>refs.some(ref=>distance(v,ref)<=.52));
  if(hits.length>=2)return true;
 }
 return false;
}
async function remember(samples,{consent=false,people=[]}={}){
 if(!consent)throw new Error("Explicit visitor consent required");
 if(!unlocked)throw new Error("Unlock the private visitor vault first");
 const t=template(samples);
 if(eligibleRegistered(samples,people))
  throw new Error("Face resembles an existing registered profile; do not duplicate");
 if(findCandidate(samples,profiles)||profiles.some(p=>score(samples,p.templates)<.48))
  throw new Error("Visitor already enrolled or too similar to another visitor");
 if(profiles.length>=MAX_PROFILES)throw new Error("Private visitor vault at capacity");
 return runExclusive(async()=>{
  const next=profiles.slice();
  const id=root.crypto.randomUUID?.()||Array.from(randomBytes(16),x=>x.toString(16).padStart(2,"0")).join("");
  next.push({id,templates:t,consentAt:Date.now(),bond:{
   affection:50,trust:50,fear:8,irritation:8},interactions:{},lastSeenAt:Date.now()});
  await persist(next);
  return {saved:true,total:next.length};
 });
}
function observe(det,{now=Date.now(),singleFace=false,registered=false}={}){
 if(!singleFace||registered||!validVector(det?.descriptor)||
    !Number.isFinite(det?.detection?.score)||det.detection.score<.68||
    !Number.isFinite(now)){
  active=null;lastObservation=null;return null;
 }
 const raw=det.descriptor;
 const match=unlocked?findCandidate([raw,raw],profiles):null;
 // Ephemeral, per-tab candidate only when consent is absent. No raw data is persisted.
 if(!match){
  if(lastObservation?.kind==="ephemeral"&&now-lastObservation.at<2200&&
     distance(raw,lastObservation.descriptor)<.45){
    lastObservation={...lastObservation,at:now,descriptor:Array.from(raw)};
  }else{
    lastObservation={kind:"ephemeral",id:"session",descriptor:Array.from(raw),
     at:now,count:0,lastIndependent:0};
  }
  if(now-lastObservation.lastIndependent>220){
   lastObservation.count++;lastObservation.lastIndependent=now;
  }
  active=lastObservation.count>=3?{id:"session",at:now,persistent:false}:null;
  return active?.id||null;
 }
 if(lastObservation?.kind==="stored"&&lastObservation.id===match.id&&
    now-lastObservation.at<=2300&&now>=lastObservation.at){
  if(now-lastObservation.lastIndependent>=240){
   lastObservation.count++;lastObservation.lastIndependent=now;
  }
  lastObservation.at=now;
 }else{
  lastObservation={kind:"stored",id:match.id,count:1,at:now,lastIndependent:now};
 }
 active=lastObservation.count>=3?{id:match.id,at:now,persistent:true}:null;
 return active?.id||null;
}
function clearObservation(){active=null;lastObservation=null;}
function interaction(kind,{now=Date.now(),singleFace=true}={}){
 if(!DELTAS[kind]||!active||!singleFace||now-active.at>2200||now<active.at)
  return Promise.resolve(false);
 const entry=active.persistent?profiles.find(p=>p.id===active.id):null;
 // Ephemeral affection cannot live across a reload or be assigned to a name.
 if(!entry)return Promise.resolve(false);
 const throttleKey=entry.id+":"+kind;
 if(now-(lastInteraction.get(throttleKey)||0)<1600)return Promise.resolve(false);
 lastInteraction.set(throttleKey,now);
 return runExclusive(async()=>{
  const p=profiles.find(item=>item.id===entry.id);
  if(!p)return false;
  const revised={...p,bond:{...p.bond},interactions:{...p.interactions}};
  for(const [field,delta] of Object.entries(DELTAS[kind]))
   revised.bond[field]=clamp(revised.bond[field]+delta,0,100);
  revised.interactions[kind]=Math.min(20000,(revised.interactions[kind]||0)+1);
  revised.lastSeenAt=now;
  const next=profiles.map(row=>row.id===p.id?revised:row);
  await persist(next);return true;
 });
}
async function forgetAll({confirmation}={}){
 if(confirmation!=="BORRAR VISITAS")throw new Error("Explicit visitor deletion required");
 await root.ROBOTITO_STORE.deleteVisitorVault({confirmation});
 lock();return true;
}
async function offerLink(name,samples,{review}={}){
 if(!unlocked||!Array.isArray(samples)||samples.length<9||
    typeof name!=="string"||!name.trim())return false;
 const match=findCandidate(samples,profiles);
 if(!match)return false;
 const profile=profiles.find(p=>p.id===match.id);
 if(!profile||typeof review!=="function")return false;
 const chosen=await review({bond:{...profile.bond},
   interactions:{...profile.interactions},lastSeenAt:profile.lastSeenAt});
 if(chosen!==true)return false;
 return runExclusive(async()=>{
  const next=profiles.filter(p=>p.id!==match.id),nextEnvelope=await seal(next);
  const people=await root.ROBOTITO_STORE.linkVisitorProfile({
   name,bond:profile.bond,expectedRevision:revision,envelope:nextEnvelope,
   confirmation:"VINCULAR"});
  profiles=next;revision=nextEnvelope.revision;clearObservation();
  return {linked:true,people};
 });
}
function info(){return {unlocked,count:unlocked?profiles.length:null,active:active?.persistent===true};}
// A hidden page must never retain usable biometric templates or the crypto key.
if(typeof document!=="undefined"){
 document.addEventListener("visibilitychange",()=>{if(document.hidden)lock();});
 root.addEventListener?.("pagehide",lock);
}
root.ROBOTITO_VISITORS={open,lock,locked,remember,observe,clearObservation,interaction,
 forgetAll,offerLink,info,template,findCandidate,distance,score,
 requiresConsent:true,format:FORMAT};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_VISITORS;
})(typeof window!=="undefined"?window:globalThis);
