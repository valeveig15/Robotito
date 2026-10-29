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
ok(source.includes("if(!chosen)return false;"),
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
for(const version of ["i18n.js?v=20261029-p04-release9","script.js?v=20261029-p04-release9","speech-fallback.js?v=20261029-p04-release3","voice-sample-capture.js?v=20261029-p04-release3"])
 ok(html.includes(version),"Assets load updated P04 implementation "+version);
// Frequent class, tasks and library messages work without a downloaded model.
for(const original of ["Ya puedo hablar de nuevo.","Todavía no importaste tu biblioteca de Goodreads.","No tengo tu cumpleaños registrado.","Hoy todavía no escuché ninguna clase.","Ahora mismo no veo a nadie.","Ahora mismo no veo ninguna mano.","No tengo una edad humana. Soy una mascota virtual.","Soy Robotito, un panda virtual.","Estoy durmiendo.","Estoy bailando porque detecté música.","No encontré información suficiente para contestar eso.","No encontré evidencia suficiente en las transcripciones para contestar eso.","No encontré ese cumpleaños entre las personas registradas.","No veo tareas pendientes en la hoja conectada.","No tengo registrada una comida todavía.","No pude encontrar una recomendación ahora mismo.","Entendido, no voy a hacer eso.","Todavía no había dicho nada."]){
 for(const language of langs){
  const translated=i18n.fixedReply(original,language);
  ok(typeof translated==="string"&&translated.length>5,"Missing fixed response "+original+"/"+language);
 }
}
eq(i18n.fixedReply("Unknown private class sentence","de"),null,
 "Do not invent unknown translations");
ok(source.includes('fixedReply?.(text,target)'),"Known responses used before language model");
for(const key of ["voiceThirdParty","voiceThirdPartyName","voiceConsent","voiceLanguageHelp"]){
 ok(html.includes('data-i18n="'+key+'"'),"Translated consent label "+key);
 for(const code of langs)ok(i18n.t(key,code).length>10,"Translated consent "+key+"/"+code);
}
ok(html.includes('id="voiceSampleConsent" type="checkbox"'),"Consent input preserved");
ok(html.includes('id="voiceSampleName"'),"Name field preserved");
for(const key of ["uiAskIntro","uiAskExamples","uiClassTopicHelp","uiClassSavedHelp","uiNoClasses","uiClassEditorHelp","uiClassAudioHelp","uiClassEmptyAudio","uiClassFinishHint","uiClassMaterialHelp","uiTaskReminderHelp","uiPeoplePrivacy","uiBooksHelp","uiMemoryHelp","uiSystemOff","uiLocalPrivacy","uiNoTaskSheet","uiNoLibrary"])
 for(const code of langs)ok(i18n.t(key,code).length>4,"Missing module copy "+key+"/"+code);
for(const key of ["uiAskIntro","uiAskExamples","uiClassTopicHelp","uiClassSavedHelp","uiNoClasses","uiClassEditorHelp","uiClassAudioHelp","uiClassEmptyAudio","uiClassFinishHint","uiClassMaterialHelp","uiTaskReminderHelp","uiPeoplePrivacy","uiBooksHelp","uiMemoryHelp","uiSystemOff","uiLocalPrivacy","uiNoTaskSheet","uiNoLibrary"])
 ok(html.includes('data-i18n="'+key+'"'),"Visible academic/help copy localized "+key);
// Numeric and named responses must be translated without external models.
for(const code of langs){
 const args={count:2,first:"A+B",subjects:"Biología",hours:"2.5"};
 for(const key of ["pendingTaskSummary","taskReminder","peopleSeen","handsSeen","fingersSeen","classesToday","booksRead","booksToRead","mealMinutes","mealHours"]){
  const value=i18n.message(key,code,args);
  ok(typeof value==="string"&&value.length>=12,"Dynamic response "+key+"/"+code);
  ok(!value.includes("{count}")&&!value.includes("{first}")&&!value.includes("{subjects}")&&!value.includes("{hours}"),
   "All dynamic placeholders expanded "+key+"/"+code);
 }
 eq(i18n.message("peopleSeen",code,{count:1}).includes("1"),true,"Single person "+code);
 eq(i18n.message("pendingTaskSummary",code,{count:2,first:"History"}).includes("History"),true,"Task content "+code);
}
eq(i18n.message("unknownKey","fr",{count:2}),null,"No invented dynamic keys");
ok(source.includes('sayDynamic("pendingTaskSummary"'),"Pending-task flow uses locale template");
ok(source.includes('sayDynamic("classesToday"'),"Class counting uses locale template");
ok(source.includes('sayDynamic("taskReminder"'),"Timed task reminder uses locale template");
for(const lang of langs){
 for(const key of ["timeNow","yourBirthday","personBirthday","classListening","classLearning","rememberLast"]){
  const value=i18n.message(key,lang,{time:"15:30",date:"30/10/2026",person:"Ana",subject:"Biología",memory:"x"});
  ok(typeof value==="string"&&value.length>=5&&!value.includes("{"),"Locale dynamic "+key+"/"+lang);
 }
}
ok(source.includes("const locale=languageLocale(lang)"),"Clock formats six languages");
ok(source.includes('sayDynamic("personBirthday"'),"Birthday localized directly");
// Localized speech must not be blocked by the wrong-language safety check.
const langDetectStart=source.indexOf("const SPEECH_LANGUAGE_HINTS=");
const langDetectEnd=source.indexOf("function speechNeedsLocalization(",langDetectStart);
ok(langDetectStart>=0&&langDetectEnd>langDetectStart,"Language detector present");
const speechLanguage=new Function("cleanSpeechText","normalizeText",
  source.slice(langDetectStart,langDetectEnd)+"return detectGeneratedSpeechLanguage;")(
   phrase=>String(phrase||""),
   phrase=>String(phrase||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""));
const dynamicVoiceKeys=["pendingTaskSummary","taskReminder","peopleSeen","handsSeen",
 "fingersSeen","classesToday","booksRead","booksToRead","mealMinutes","mealHours",
 "timeNow","yourBirthday","personBirthday","classListening","classLearning","rememberLast"];
for(const lang of langs)for(const key of dynamicVoiceKeys){
 const phrase=i18n.message(key,lang,{count:3,first:"Estudio",subjects:"Biología",
  hours:"3.5",time:"15:30",date:"30/10/2026",person:"Ana",subject:"Física",memory:"recordatorio"});
 const detected=speechLanguage(phrase);
 ok(detected==="und"||detected===lang,
  "False voice-language mismatch for "+lang+"/"+key+": "+detected);
}
for(const key of ["uiClassSpeakerHint","uiClassConsentHint","uiVideoIntro","uiVideoSharePrivacy","uiAcademicNoFiles","uiMathHelp","uiObjectHelp","uiTaskSheetHelp","uiNoTasksHelp","uiEnrollHelp","uiGoodreadsButton","uiGoodreadsHow","uiGoodreadsData","uiBookDescriptionHelp","uiClassEmptyText","uiClassSummaryHelp"]){
 for(const lang of langs)ok(i18n.t(key,lang).length>5,"Locale instructional text "+lang+"/"+key);
}
for(const key of ["uiClassSpeakerHint","uiClassConsentHint","uiVideoIntro","uiVideoSharePrivacy","uiAcademicNoFiles","uiMathHelp","uiObjectHelp","uiTaskSheetHelp","uiNoTasksHelp","uiEnrollHelp","uiGoodreadsButton","uiGoodreadsHow","uiGoodreadsData","uiBookDescriptionHelp","uiClassEmptyText","uiClassSummaryHelp"])
 ok(html.includes('data-i18n="'+key+'"'),"Translated DOM instructions "+key);
// All voice/face enrollment prompts must be translated in 6-language mode.
const enrollBegin=source.indexOf("const ENROLL_LOCALES=");
const enrollEnd=source.indexOf("function setEnrollProgress(",enrollBegin);
ok(enrollBegin>=0&&enrollEnd>enrollBegin,"Enrollment locale contract");
for(const language of ["fr","it","de"]){
 const translated=new Function("state","window",
  source.slice(enrollBegin,enrollEnd)+"return enrollText;")(
  {languageMode:language},{ROBOTITO_I18N:i18n});
 for(const phrase of ["1/4 · Mirá de frente a la cámara.","2/4 · Girá apenas la cara hacia un lado.","3/4 · Ahora girá apenas hacia el otro lado.","4/4 · Volvé al frente con expresión natural.","Necesito una sola cara en cámara.","No veo la cara con suficiente claridad. Acercate un poco y buscá buena luz.","Acercate un poquito más a la cámara.","No conseguí suficientes muestras buenas de esa posición. Probá otra vez con más luz.","Cara aprendida. Ahora voy con la voz.","Voz · Cuando estés listo, empezá a hablar. No voy a contar tiempo hasta escucharte de verdad.","No llegué a detectar una voz. El registro no empezó: podés intentarlo de nuevo y hablar cuando veas «esperando que hables».","Te dejé de escuchar. El progreso está pausado; seguí hablando cuando quieras.","Te escucho. Seguí hablando con naturalidad; contame cualquier cosa.","Bien. Ahora decí otra frase distinta para que aprenda mejor tu voz.","Casi está. Una última frase natural, sin acercarte más al micrófono.","Escuché algo, pero no junté suficiente voz real. Necesito varios segundos efectivos hablando; los silencios no cuentan.","Las muestras de voz no fueron consistentes entre sí. Es mejor repetir el registro en un lugar más silencioso.","Voz verificada. Ya tengo varias muestras distintas de la misma voz.","Voy a tomar varias muestras. Quedate frente a la cámara.","No pude registrar la cara con suficiente calidad. Probá con buena luz y sin otras personas en cámara.","muy buena","buena","aceptable","Algo falló durante el registro. Probá otra vez con buena luz y poco ruido."]){
  const result=translated(phrase,"English","Português");
  ok(result!==phrase&&result!=="English"&&result.length>=2,
   "Missing translated enrollment step "+language+"/"+phrase);
 }
}
// Standard spoken status replies must work offline in all six languages.
for(const phrase of ["Todavía no sé quién sos. Registrá tu cara y tu voz y después sí me voy a acordar.","Sí. Muchísima. Ya estoy enojado de hambre.","Sí, tengo bastante hambre.","Un poco. Todavía aguanto.","No mucho. Estoy bastante lleno.","Sí. De hecho, me estaba quedando dormido.","Sí, estoy bastante cansado.","Un poco, pero todavía estoy bien.","No. Tengo bastante energía.","Ahora mismo no veo ninguna mano. Mostrámelas bien frente a la cámara.","Veo manos, pero ningún dedo levantado.","Todavía no tengo recuerdos claros tuyos.","Escucho una voz, pero no la reconozco con suficiente seguridad.","No siento temperatura como una persona. Pero puedo hacerte compañía.","Estoy acá, pero bastante pendiente de que tengo hambre.","Estoy atento a lo que pasa y esperando que me hables.","Todavía no te conozco lo suficiente.","Tuve un problema al buscar en las transcripciones. Probá de nuevo.","Hoy todavía no escuché ninguna clase, así que no tengo nada de clase aprendido de hoy.","Hoy escuché una clase, pero todavía no tengo suficiente contenido claro para resumirla.","Abrí la pestaña Clase: ahí te dejé lo que pude recuperar.","Eso no me gustó.","Listo. Eso también lo guardo.","No necesitás Goodreads. Desmarcá Solo de mi biblioteca y te recomiendo opciones nuevas."])
 for(const lang of langs){
  const result=i18n.fixedReply(phrase,lang);
  ok(typeof result==="string"&&result.length>4,
   "Fixed offline response absent "+lang+"/"+phrase);
 }
for(const phrase of ["Soy una mascota virtual. No estoy vivo como una persona, pero puedo verte, escucharte, recordar cosas y reaccionar.","Sí. Especialmente porque puedo ayudarte a elegir qué leer.","Sí. Si detecto música, hasta intento bailar.","Me gusta aprender cosas con vos, sobre todo cuando después puedo ayudarte a estudiarlas.","Todavía no te conozco lo suficiente como para decirlo.","I'm sleepy, almost asleep.","I'm okay, but I'm pretty hungry.","I'm doing very well. I'm happy.","I'm a little sad right now.","I'm doing well. Pretty calm.","I'm Robotito, a virtual panda. I'm not alive like a person, but I can see, listen, remember, learn from classes, and react.","I can recognize faces and voices, remember things, listen to classes, summarize them, help you study, count fingers, recognize some objects, recommend books, check tasks, and answer many everyday questions."]){
 for(const code of langs)ok(i18n.fixedReply(phrase,code)?.length>9,
   "Missing offline translation for "+code+"/"+phrase);
}
for(const english of ["I'm sleepy, almost asleep.","I'm okay, but I'm pretty hungry.","I'm doing very well. I'm happy.","I'm a little sad right now.","I'm doing well. Pretty calm.","I'm Robotito, a virtual panda. I'm not alive like a person, but I can see, listen, remember, learn from classes, and react.","I can recognize faces and voices, remember things, listen to classes, summarize them, help you study, count fingers, recognize some objects, recommend books, check tasks, and answer many everyday questions."]){
 const spanish=i18n.fixedReply(english,"es");
 ok(spanish&&spanish!==english,"English-source answer must translate into Spanish");
}
for(const lang of langs){
 ok(i18n.t("voiceResponding",lang).length>=5,"Localized speech status "+lang);
}
ok(source.includes('setListenState(window.ROBOTITO_I18N?.t?.("voiceResponding",lang)'),
 "Active speech uses target language rather than base session language");
ok(source.includes("!window.speechSynthesis?.getVoices"),
 "No available Web Speech engine must fail safely");
ok(source.includes("window.speechSynthesis.onvoiceschanged=populateVoiceSelect"),
 "Voice enumeration refresh waits for available engine");
for(const lang of langs)for(const key of ["asrListening","asrHeard","asrMicBlocked","asrMicHelp","asrRecoverMic","asrRecover","asrReconnect","asrStarting","asrNoCompatible","asrBrowserHelp"]){
 const translated=i18n.t(key,lang);
 ok(translated.length>4,"Missing "+lang+"/"+key);
}
for(const key of ["asrListening","asrHeard","asrMicBlocked","asrMicHelp","asrRecoverMic","asrRecover","asrReconnect","asrStarting","asrBrowserHelp"])
 ok(source.includes('asrMessage("'+key+'")'),"Browser ASR status wiring "+key);
// Intent negation cannot accidentally activate an unwanted language.
for(const [command,target] of [["No quiero hablar en inglés",null],["No quiero cambiar a alemán",null],["No deseo hablar en italiano",null],["Je ne veux pas parler français",null],["Je ne souhaite pas parler allemand",null],["No pienso cambiar al portugués",null],["No quiero hablar en inglés, quiero italiano","it"],["No quiero hablar en francés, pero hablame en italiano","it"],["No quiero español, quiero hablar inglés","en"]]){
 const parsed=i18n.parseCommand(command);
 eq(parsed?.language||null,target,"Refused-language command "+command);
}
console.log("Robotito P04 startup and voice locale regression:",checks,"checks");
