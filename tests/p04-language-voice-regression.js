"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const i18n=require("../i18n.js"),voice=require("../voice-system.js");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
let checks=0;
function eq(actual,expected,label){assert.equal(actual,expected,label);checks++;}
function ok(value,label){assert.ok(value,label);checks++;}
const langs=["es","en","pt","fr","it","de"];
const voices=langs.map(code=>({lang:code+"-"+({es:"UY",en:"US",pt:"BR",fr:"FR",it:"IT",de:"DE"}[code]),
 voiceURI:"local-"+code,name:"Voice "+code}));
eq(i18n.languages.join(","),langs.join(","),"Six supported languages");
for(const lang of langs){
 ok(i18n.supported(lang),"Valid language "+lang);
 ok(i18n.locale(lang).startsWith(lang),"Locale "+lang);
 ok(i18n.t("voiceUnavailable",lang).length>10,"Missing voice warning "+lang);
 eq(voice.selectVoice(voices,lang,"local-es")?.voiceURI,"local-"+lang,
  "Preferred voice in other language cannot override "+lang);
 const utter=voice.configureUtterance({}, {language:lang,voices,voiceURI:"local-es"});
 ok(utter.lang.toLowerCase().startsWith(lang),"Speech locale "+lang);
 eq(utter.voice?.voiceURI,"local-"+lang,"Speech voice "+lang);
}
eq(voice.selectVoice([voices[0]],"fr"),null,"No cross-language voice fallback");
const noFrench=voice.configureUtterance({}, {language:"fr",voices:[voices[0]]});
eq(noFrench.voice,undefined,"Do not select Spanish voice for French utterance");
eq(noFrench.lang,"fr-FR","Keep explicit French locale when unavailable");
const alt=[{lang:"pt-PT",voiceURI:"pt-1",name:"Plain"},
 {lang:"pt-BR",voiceURI:"pt-2",name:"Neural Voice"}];
eq(voice.selectVoice(alt,"pt","pt-1")?.voiceURI,"pt-1","Preserve matching user preference");
eq(voice.selectVoice(alt,"pt","local-es")?.voiceURI,"pt-2","Prefer natural compatible voice");
for(const style of Object.keys(voice.styles)){
 const values=voice.settings(style,NaN,Infinity);
 ok(Number.isFinite(values.pitch)&&Number.isFinite(values.rate),
  "Invalid user input cannot make NaN Web Speech values: "+style);
}
const start=source.indexOf("async function startSenses()");
const end=source.indexOf("const mobile=isMobileSpeech();",start);
ok(start>0&&end>start,"Find real startup guard");
const guard=source.slice(start,end).replace("async function startSenses(){","");
const runGuard=new Function("window","state","toast",guard+"return true;");
for(const lang of langs){
 eq(runGuard({ROBOTITO_I18N:i18n},{started:false,languageMode:lang},()=>{}),
  true,"Can start senses in "+lang);
}
let warned=false;
eq(runGuard({ROBOTITO_I18N:i18n},{started:false,languageMode:"unknown"},
 ()=>{warned=true;}),undefined,"Invalid language rejected");
eq(warned,true,"Invalid language must explain failure");
eq(runGuard({ROBOTITO_I18N:i18n},{started:true,languageMode:"fr"},
 ()=>{}),undefined,"Double start prevented");
const voiceBegin=source.indexOf("function chooseDefaultVoice(");
const voiceEnd=source.indexOf("function populateVoiceSelect(){",voiceBegin);
ok(voiceBegin>=0&&voiceEnd>voiceBegin,"Locate legacy voice selector");
const choose=new Function("normalizeText","responseLanguage",
 source.slice(voiceBegin,voiceEnd)+"return chooseDefaultVoice;")(
 x=>String(x||"").toLowerCase(),()=> "es");
eq(choose([voices[0]],"fr"),null,"Legacy selection must not substitute Spanish for French");
eq(choose(voices,"de")?.voiceURI,"local-de","German selection in legacy adapter");
ok(source.includes("if(voices.length&&!chosen)return false;"),
 "Unavailable language voices must not be spoken with a different accent");
ok(html.includes('data-i18n="pitch"')&&!html.includes(">Gravedad <input"),
 "Old Gravedad label replaced with localized Tono");
ok(html.includes('data-i18n="speed"'),"Speed control localized");
ok(html.includes('data-start-language="de"'),"German remains in initial language choices");
ok(html.includes('data-i18n="highfive"'),"Chocar los cinco remains in the interface");
// Startup and microphone status messages must exist in all six languages.
for(const key of ["asrUnsupported","asrActivating","startupPermissions","startupRequestingMedia","startupMobileHint","startupListening","startupSpeechFailed","startupMediaActive","startupAwake","startupMediaFailed","startupAllowMedia"]){
 const outputs=langs.map(lang=>i18n.t(key,lang));
 outputs.forEach((value,index)=>ok(value.length>5&&value!==key,
  "Missing startup translation "+key+"/"+langs[index]));
 ok(new Set(outputs).size===6,"Startup messages must be individually localized: "+key);
}
ok(source.includes('startupText("startupAwake")'),"Welcome is localized");
ok(source.includes('startupText("startupMediaFailed")'),"Camera failure is localized");
ok(source.includes('startupText("startupMobileHint")'),"Mobile hint is localized");
ok(source.includes('t?.("asrUnsupported",state.languageMode)'),"Unsupported speech is localized");
// Exercise the real voice dropdown using synthetic installed voices.
const populateBegin=source.indexOf("function populateVoiceSelect(){");
const populateEnd=source.indexOf("function isMobileSpeech(){",populateBegin);
ok(populateBegin>=0&&populateEnd>populateBegin,"Locate real voice dropdown");
const dropdown={disabled:false,innerHTML:"",value:""};
const pickerState={voiceURI:"local-es"};
const pickerStorage={setItem:()=>{}};
let pickerVoices=[...voices],pickerTarget="fr";
const pickerSynthesis={getVoices:()=>pickerVoices};
const picker=new Function("$","window","speechSynthesis","state","responseLanguage",
 "voiceMatchesLanguage","chooseDefaultVoice","escapeHtml","localStorage",
 source.slice(populateBegin,populateEnd)+"return populateVoiceSelect;")(
 ()=>dropdown,{ROBOTITO_I18N:i18n,speechSynthesis:pickerSynthesis},
 pickerSynthesis,pickerState,()=>pickerTarget,
 (v,lang)=>!!v&&new RegExp("^"+lang+"([-_]|$)","i").test(v.lang),
 choose,x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;"),pickerStorage);
picker();
eq(pickerState.voiceURI,"local-fr","Old Spanish voice rejected for French dropdown");
eq(dropdown.value,"local-fr","French voice visibly selected");
ok(!dropdown.innerHTML.includes("local-es"),"French dropdown excludes Spanish voices");
eq(dropdown.disabled,false,"French voice can be chosen");
pickerVoices=[voices[0]];
picker();
eq(pickerState.voiceURI,"","Missing French voice clears active selection");
eq(dropdown.disabled,true,"No foreign voice can be selected");
ok(dropdown.innerHTML.includes(i18n.t("voiceUnavailable","fr")),
 "Missing voice offers localized explanation");
pickerVoices=[...voices];pickerTarget="de";
picker();
eq(dropdown.value,"local-de","German refreshes available voices");
// Language commands must not obey negation or reported speech.
for(const [utterance,target] of [["Spreche bitte Deutsch","de"],["Sprich Deutsch","de"],["Parla italiano","it"],["Fale português","pt"],["Speak French","fr"],["No quiero español, quiero hablar inglés","en"]]){
 eq(i18n.parseCommand(utterance)?.language,target,"Explicit language change "+utterance);
}
for(const utterance of ["Don't speak French","Please don't switch to German","Não fale português","Ne parlez pas français","Non parlare italiano","Bitte nicht auf Deutsch antworten","No me hables en francés","My teacher said speak French","La profesora dijo habla en inglés"]){
 eq(i18n.parseCommand(utterance),null,"Do not change language on negated/reported command "+utterance);
}
// Translation must never silently call a remote service.
ok(!source.includes("api.mymemory.translated.net"),"No remote unconsented translator");
ok(source.includes("window.Translator.create"),"Browser on-device translation fallback");
for(const code of langs){
 ok(source.includes('de:"danke"')&&source.includes('fr:"merci"')&&source.includes('it:"grazie"'),
  "Six-language local short-phrase dictionary present for "+code);
}
for(const key of ["voiceSampleRequesting","voiceSampleRecording","voiceSampleSaving","voiceSampleSaved","voiceSampleDiscarded","voiceSampleDeleted","voiceSampleError","voiceSampleNeedsName","voiceSampleNeedsConsent"]){
 for(const lang of langs)ok(i18n.t(key,lang).length>8,"Voice sample message "+key+"/"+lang);
}
ok(source.includes("ROBOTITO_VOICE_SAMPLE_CAPTURE"),"Private capture controller integrated");
ok(html.includes("voice-sample-capture.js"),"Private capture loaded before UI script");
ok(source.includes("voiceSamples?.cancel()"),"Consent and navigation can cancel recording");
ok(!source.includes("api.mymemory.translated.net"),"No unconsented translation service");
ok(source.includes("session.destroy?.();"),"LLM session teardown");
ok(source.includes("normalizeText(out)!==normalizeText(clean)"),"Echo rejection");
// Every available avatar must have a label in each of the six languages.
const nameSource=source.slice(source.indexOf("const AVATAR_ADDITIONAL_NAMES="),
 source.indexOf("function avatarLanguage()"));
ok(nameSource.includes("AVATAR_ADDITIONAL_NAMES"),"Extra avatar names exist");
const translatedNames=new Function(nameSource+"return AVATAR_ADDITIONAL_NAMES;")();
eq(Object.keys(translatedNames).length,50,"All 50 avatars translated in new languages");
for(const [id,translated] of Object.entries(translatedNames))
 for(const language of ["fr","it","de"])ok(translated[language]?.length>1,
  "Missing "+language+" name for "+id);
for(const key of ["avatarAvailable","avatarStepTitle","avatarStepDescription","avatarBack","avatarReady"])
 for(const language of langs)ok(i18n.t(key,language)!==key,"Missing "+key+"/"+language);
ok(source.includes('t?.("avatarReady",mode)'),"Startup ready state localized");
ok(source.includes('t?.("avatarStepTitle",lang)'),"Avatar screen localized");
for(const key of ["uiUnderstood","uiClassMode","uiSubject","uiClassTopic","uiStartClass","uiStopClass","uiSavedClasses","uiClassEdit","uiTopic","uiDateTime","uiCancel","uiSaveChanges","uiClassRecordings","uiLearned","uiRefreshSummary","uiVideoTitle","uiVideoURL","uiVideoName","uiYoutubeOpen","uiVideoStop","uiUploadMaterials","uiAskClasses","uiAsk","uiFlashcards","uiVisualMath","uiRecognizeObject","uiTasksSheet","uiConnectTasks","uiPendingTasks","uiRefresh","uiRegisterPerson","uiName","uiBirthday","uiEnroll","uiPeopleRemembered","uiMyBooks","uiReadingChoice","uiDescription","uiBookRecommendations","uiAutoMemory","uiAddMemory","uiSaveMemory","uiMemories","uiDeleteMemory","uiVoiceSampleTitle","uiRecordSample","uiDeleteSample"]){
 for(const language of langs)ok(i18n.t(key,language)!==key,
  "Static locale dictionary "+key+"/"+language);
}
for(const key of ["uiSubject","uiClassTopic","uiTopic","uiDateTime","uiVideoURL","uiVideoName","uiName","uiBirthday","uiDescription"]){
 ok(html.includes('data-i18n="'+key+'"'),"Input-bearing label localized "+key);
}
ok(html.includes('id="classSubject"'),"Class subject input preserved");
ok(html.includes('id="personBirthday"'),"Birthday field preserved");
ok(html.includes('id="youtubeUrl"')||html.includes('id="youtubeLink"')||html.includes('id="youtubeVideoUrl"')||html.includes('id="youtubeUrlInput"'),"YouTube input remains on screen");
for(const language of langs)ok(i18n.t("prepareLocalized",language).length>8,
  "Localized translation status "+language);
eq(i18n.parseCommand("Sprich Deutsch nur dieses Mal")?.scope,"once",
  "German one-turn language setting");
eq(i18n.parseCommand("Parla italiano solo questa volta")?.scope,"once",
  "Italian one-turn language setting");
eq(i18n.parseCommand("Parla italiano per questa sessione")?.scope,"session",
  "Italian session setting");
ok(source.includes('t?.("prepareLocalized",target)'),"Six-language translation progress");
ok(!source.includes("if(forcedLang)return false;"),"Forced language cannot bypass strong mismatch");
ok(source.includes("francais|french|italiano|italian|aleman|deutsch|german"),"Six-language say command vocabulary");
ok(source.includes('window.addEventListener("pagehide",()=>voiceSamples?.cancel());'),
 "BFCache return must permit a new voice sample recording");
for(const version of ["i18n.js?v=20261029-p04-finish2","script.js?v=20261029-p04-finish2","speech-fallback.js?v=20261029-p04-finish2","voice-sample-capture.js?v=20261029-p04-finish2"])
 ok(html.includes(version),"Assets load updated P04 implementation "+version);
console.log("Robotito P04 startup and voice locale regression:",checks,"checks");
