// Web Speech voice profiles. Pitch/rate presets are NOT voice cloning.
(function(root){
"use strict";
const STYLES={
 natural:{pitch:1,rate:1,volume:1},
 deep:{pitch:.65,rate:.87,volume:1},
 high:{pitch:1.42,rate:1.04,volume:1},
 cute:{pitch:1.32,rate:.94,volume:.9},
 energetic:{pitch:1.2,rate:1.22,volume:1},
 funny:{pitch:1.45,rate:1.15,volume:1},
 robotic:{pitch:.73,rate:.79,volume:.95},
 strange:{pitch:.55,rate:1.15,volume:.85},
 calm:{pitch:.88,rate:.83,volume:.8},
 narrator:{pitch:.92,rate:.88,volume:1}
};
const LABELS={natural:"Natural",deep:"Grave",high:"Aguda",cute:"Tierna",energetic:"Energética",funny:"Graciosa",robotic:"Robótica",strange:"Extraña",calm:"Calmada",narrator:"Narradora"};
const SAMPLE_ID="voice-profile-local", BLOB_ID="voice-sample-local";
const VOICE_PREF_KEY="robotito.voiceURIsByLang.v1";
const LANGUAGE_CODES=["es","en","pt","fr","it","de"];
function voiceLanguage(language){
 const code=String(language||"").toLowerCase().split(/[-_]/)[0];
 return LANGUAGE_CODES.includes(code)?code:null;
}
// Persist actual browser voice identifiers *separately* from the ten synthetic
// tone/rate profiles. Never treat an unavailable URI as an installed voice.
function readVoicePreferences(read){
 let raw;
 try{raw=read(VOICE_PREF_KEY);}catch{return {};}
 if(typeof raw!=="string"||raw.length>12000)return {};
 try{
  const decoded=JSON.parse(raw);
  if(!decoded||typeof decoded!=="object"||Array.isArray(decoded))return {};
  const safe=Object.create(null);
  for(const code of LANGUAGE_CODES){
   const value=Object.prototype.hasOwnProperty.call(decoded,code)?decoded[code]:null;
   if(typeof value==="string"&&value.length>0&&value.length<=512)safe[code]=value;
  }
  return safe;
 }catch{return {};}
}
function preferredVoiceForLanguage(read,language){
 const code=voiceLanguage(language);
 return code?readVoicePreferences(read)[code]||null:null;
}
function savePreferredVoice(read,write,language,uri){
 const code=voiceLanguage(language);
 if(!code||typeof uri!=="string"||!uri||uri.length>512)return false;
 const prefs=readVoicePreferences(read);
 prefs[code]=uri;
 try{write(VOICE_PREF_KEY,JSON.stringify(prefs));return true;}catch{return false;}
}
function compatibleVoiceCatalog(voices,language){
 const code=voiceLanguage(language);
 if(!code)return [];
 return Array.from(voices||[]).filter(v=>v&&typeof v.lang==="string"&&
  v.lang.toLowerCase().split(/[-_]/)[0]===code&&typeof v.voiceURI==="string");
}
function clamp(x,a,b){return Math.min(b,Math.max(a,x));}
function settings(style,basePitch=1,baseRate=1){
 const s=STYLES[style]||STYLES.natural;
 const pitch=Number.isFinite(basePitch)&&basePitch>0?basePitch:1;
 const rate=Number.isFinite(baseRate)&&baseRate>0?baseRate:1;
 return {pitch:clamp(s.pitch*pitch,.5,2),rate:clamp(s.rate*rate,.5,2),volume:s.volume};
}
function selectVoice(voices,language,preferredURI){
 // Do not pronounce one language using an unrelated system voice.
 const requested=String(language||"es").toLowerCase().split(/[-_]/)[0];
 const pool=compatibleVoiceCatalog(voices,requested);
 const requestedLocale=String(language||"es").toLowerCase().replace(/_/g,"-");
 return pool.find(v=>v.voiceURI===preferredURI)
  ||pool.find(v=>v.lang.toLowerCase().replace(/_/g,"-")===requestedLocale&&/natural|neural/i.test(v.name||""))
  ||pool.find(v=>v.lang.toLowerCase().replace(/_/g,"-")===requestedLocale)
  ||pool.find(v=>/natural|neural/i.test(v.name||""))
  ||pool[0]||null;
}
function configureUtterance(utter,{style="natural",language="es",voices=[],voiceURI,basePitch=1,baseRate=1}={}){
 const p=settings(style,basePitch,baseRate);
 const voice=selectVoice(voices,language,voiceURI);
 const base=String(language||"es").toLowerCase().split(/[-_]/)[0];
 utter.lang=voice?.lang||({es:"es-UY",en:"en-US",pt:"pt-BR",fr:"fr-FR",it:"it-IT",de:"de-DE"}[base]||"es-UY");
 if(voice)utter.voice=voice;
 utter.pitch=p.pitch;utter.rate=p.rate;utter.volume=p.volume;
 return utter;
}
async function saveProfileFromRecording(blob,{owner="local",subject="self",explicitConsent=false,consentLabel=""}={}){
 if(!(blob instanceof Blob)||blob.size<50)throw new TypeError("Recorded audio is required");
 if(subject!=="self"&&!explicitConsent)throw new Error("Explicit consent required for another person's recording");
 if(subject!=="self"&&!String(consentLabel).trim())throw new Error("Document the consenting person's name");
 const db=root.ROBOTITO_STORE;
 if(!db?.putRecordWithBlob)throw new Error("Atomic voice storage is unavailable");
 return db.putRecordWithBlob({id:SAMPLE_ID,type:"preferences",owner,source:"voice-opt-in",blobId:BLOB_ID,
  data:{subject,consentRecorded:subject==="self"||Boolean(explicitConsent),consentLabel:subject==="self"?"self":String(consentLabel),
   createdAt:new Date().toISOString(),synthesized:true,cloned:false}},blob,{type:"audio"});
}
async function deleteProfile(){
 const db=root.ROBOTITO_STORE;
 if(!db?.deleteRecord||!db?.deleteBlob)throw new Error("Storage not available");
 await db.deleteRecord(SAMPLE_ID);
 // Earlier versions could leave an orphan if saving the metadata failed.
 // Remove the known sample blob even when no profile record exists.
 await db.deleteBlob(BLOB_ID);
 return true;
}
function syntheticNotice(language="es"){
 return root.ROBOTITO_I18N?.t("synthesised",language)||"Voz sintetizada, no clonación.";
}
root.ROBOTITO_VOICE_SYSTEM={styles:STYLES,labels:LABELS,settings,selectVoice,configureUtterance,
 compatibleVoiceCatalog,readVoicePreferences,preferredVoiceForLanguage,savePreferredVoice,
 saveProfileFromRecording,deleteProfile,syntheticNotice};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_VOICE_SYSTEM;
})(typeof window!=="undefined"?window:globalThis);