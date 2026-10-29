"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const voices=require("../voice-system.js");
const i18n=require("../i18n.js");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
let checks=0;
function eq(a,b,msg){assert.deepEqual(a,b,msg);checks++;}
function ok(value,msg){assert.ok(value,msg);checks++;}
const languages=["es","en","pt","fr","it","de"];
const presets=Object.keys(voices.styles);
eq(presets.length,10,"Exactly ten selectable audio processing profiles");
const variations=new Set(presets.map(style=>{
 const p=voices.settings(style,1,1);
 ok(p.pitch>=.5&&p.pitch<=2&&p.rate>=.5&&p.rate<=2,"Browser safe bounds "+style);
 return p.pitch+":"+p.rate+":"+p.volume;
}));
eq(variations.size,10,"Ten presets have distinct pitch/rate/volume parameters, not ten cloned voices");
ok(!html.includes("Gravedad"),"The removed visible Gravity control must not reappear");
ok(html.includes('id="voicePitch"')&&html.includes('data-i18n="pitch">Tono'),
 "Pitch remains available internally as a user-facing Tone control");
ok(html.includes('id="testVoiceBtn"'),"Users can preview the selected voice");
ok(html.includes('data-i18n="voicePresetExplanation"'),"Clearly identify presets as synthesis adjustments");
ok(html.includes('data-i18n="voiceRemotePrivacy"'),"Explain possible non-local voice processing");
ok(html.includes('id="voiceAvailability"'),"List actual browser voice availability");
const list=languages.map(lang=>({voiceURI:lang+"-local",name:lang+" Local",lang: i18n.locale(lang),localService:true}))
 .concat([{voiceURI:"en-remote",name:"Remote EN",lang:"en-US",localService:false}]);
for(const lang of languages){
 const compatible=voices.compatibleVoiceCatalog(list,lang);
 eq(compatible.length,lang==="en"?2:1,"Compatible browser voice catalog only "+lang);
 ok(compatible.every(v=>v.lang.toLowerCase().startsWith(lang)),
  "No foreign system voices listed for "+lang);
 const chosen=voices.selectVoice(list,lang,lang+"-local");
 eq(chosen?.voiceURI,lang+"-local","Explicit compatible voice choice "+lang);
 const synthesized=voices.configureUtterance({}, {style:"narrator",voices:list,
   language:lang,voiceURI:lang+"-local"});
 eq(synthesized.voice?.voiceURI,lang+"-local","Style does not replace underlying native voice "+lang);
 ok(synthesized.lang.toLowerCase().startsWith(lang),"TTS locale correct "+lang);
 for(const key of ["voicePresetExplanation","voiceBrowserCount","voiceBrowserLocal",
  "voiceBrowserRemote","voiceRemotePrivacy"])
  ok(i18n.t(key,lang)!==key,"Translated voice explanation "+key+" "+lang);
}
const store=new Map();
const read=key=>store.get(key)||null,write=(key,value)=>store.set(key,value);
for(const lang of languages){
 eq(voices.savePreferredVoice(read,write,lang,lang+"-local"),true,"Save "+lang);
 eq(voices.preferredVoiceForLanguage(read,lang),lang+"-local","Restore "+lang);
}
eq(voices.preferredVoiceForLanguage(read,"en-GB"),"en-local","Regional preference uses language group");
eq(voices.savePreferredVoice(read,write,"other","invalid"),false,"Reject unrecognized language");
eq(voices.savePreferredVoice(read,write,"es",""),false,"Reject empty voice");
eq(voices.savePreferredVoice(read,write,"fr","x".repeat(513)),false,"Reject huge URI");
eq(voices.preferredVoiceForLanguage(read,"pt"),"pt-local","Rejected writes leave other language intact");
write("robotito.voiceURIsByLang.v1","{invalid-json");
eq(voices.preferredVoiceForLanguage(read,"en"),null,"Corrupt stored JSON is ignored safely");
write("robotito.voiceURIsByLang.v1",'{"__proto__":"malicious","de":"de-local"}');
eq(voices.preferredVoiceForLanguage(read,"de"),"de-local","Valid preference still read without inherited keys");
eq(voices.preferredVoiceForLanguage(read,"__proto__"),null,"Prototype keys never used as locales");
const begin=source.indexOf("function populateVoiceSelect(){"),
 end=source.indexOf("function isMobileSpeech(){",begin);
ok(begin>=0&&end>begin,"Read actual production voice picker");
const select={disabled:false,innerHTML:"",value:""};
const availability={textContent:""};
const state={languageMode:"en",voiceURI:"es-local"};
const localeStore=new Map();
const localStorage={getItem:k=>localeStore.get(k)||null,
 setItem:(k,v)=>localeStore.set(k,String(v))};
voices.savePreferredVoice(k=>localStorage.getItem(k),(k,v)=>localStorage.setItem(k,v),"en","en-remote");
let available=[...list];
const synthesis={getVoices:()=>available};
const picker=new Function("$","window","speechSynthesis","state","responseLanguage",
 "voiceMatchesLanguage","chooseDefaultVoice","escapeHtml","localStorage",
 source.slice(begin,end)+"return populateVoiceSelect;")(
 selector=>selector==="#voiceSelect"?select:selector==="#voiceAvailability"?availability:null,
 {speechSynthesis:synthesis,ROBOTITO_VOICE_SYSTEM:voices,ROBOTITO_I18N:i18n},
 synthesis,state,()=> "de", // One-response German request must not switch the English picker.
 (v,code)=>!!v&&new RegExp("^"+code+"([-_]|$)","i").test(v.lang),
 pool=>pool[0]||null,str=>String(str).replaceAll("&","&amp;").replaceAll("<","&lt;"),
 localStorage);
picker();
eq(select.value,"en-remote","Explicit English choice restored, despite legacy Spanish voice");
ok(select.innerHTML.includes("non-local"),"Remote browser voice visibly marked");
ok(select.innerHTML.includes("on device"),"Locally reported browser voice visibly marked");
ok(availability.textContent.includes("2"),"Actual count reports two compatible English voices");
state.languageMode="de";picker();
eq(select.value,"de-local","A temporary German utterance does not overwrite chosen language preferences");
state.languageMode="fr";available=[list.find(v=>v.lang.startsWith("es"))];picker();
eq(select.disabled,true,"Unavailable browser voice disables list");
eq(state.voiceURI,"","Foreign voices rejected for an unavailable language");
eq(voices.preferredVoiceForLanguage(k=>localStorage.getItem(k),"en"),"en-remote",
 "Switching or losing voice catalog does not erase explicit English voice choice");
console.log("P06 voice catalog and style honesty:",checks,"checks");
