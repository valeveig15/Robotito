"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"..","p04-device-check.html"),"utf8");
const embedded=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(embedded,"Manual diagnostic contains executable JavaScript");
new Function(embedded);
let checked=0;
function ok(value,message){assert.ok(value,message);checked++;}
for(const code of ["es","en","pt","fr","it","de"])
 ok(html.includes('value="'+code+'"'),"Missing target language "+code);
for(const id of ["speak","speechStop","micStart","micStop","voiceList","micStatus","meterFill",
 "cameraStart","cameraStop","cameraPreview","cameraStatus","asrStart","asrStop","asrStatus","asrTranscript"])
 ok(html.includes('id="'+id+'"'),"Missing manual test control "+id);
ok(embedded.includes("getUserMedia({audio:true,video:false})"),"Explicit mic permission");
ok(embedded.includes("stopTracks(microphone)"),"Stops live tracks");
ok(embedded.includes("stopTracks(granted)"),"Stops late-granted tracks");
ok(embedded.includes("requestEpoch"),"Rejects stale mic permissions");
ok(embedded.includes("pagehide"),"Shutdown on navigation");
ok(embedded.includes("visibilitychange"),"Shutdown when hidden");
ok(embedded.includes('getUserMedia({audio:false,video:{facingMode:"user"}})'),
 "Explicit video-only permission request");
ok(embedded.includes("stopTracks(cameraStream)"),"Camera tracks are closed");
ok(embedded.includes("stopTracks(granted)"),"Late video grant is released");
ok(embedded.includes("cameraEpoch"),"Camera requests are invalidated on cancel");
ok(embedded.includes("window.SpeechRecognition||window.webkitSpeechRecognition"),
 "Uses actual native browser ASR if available");
ok(embedded.includes("rec.lang=languages[$(\"lang\").value].locale"),
 "ASR respects selected language");
ok(embedded.includes("activeRecognition=null"),"ASR lifecycle clears its engine");
ok(embedded.includes('$("asrTranscript").textContent=""'),
 "Stopping ASR erases transient transcription");
ok(!/\b(toDataURL|toBlob|ImageCapture|MediaRecorder)\b/.test(embedded),
 "No image/audio capture or recording APIs in manual diagnostic");
ok(embedded.includes("speechSynthesis.getVoices()"),"Voice matching");
ok(embedded.includes('===code'),"No cross-language voice substitution");
ok(!/\b(fetch|XMLHttpRequest|WebSocket|MediaRecorder|localStorage|indexedDB)\b/.test(embedded),
 "Diagnostic must neither send nor store recordings");
console.log("P04 manual device diagnostic contract:",checked,"checks");

// Simulate the diagnostic UI with and without installed voices.
async function fakeBrowser(voices=null,lateMic=false){
 const elements={};
 for(const id of ["lang","voiceList","speak","speechStop","speechStatus",
  "micStart","micStop","meter","meterFill","micStatus",
  "cameraStart","cameraStop","cameraPreview","cameraStatus",
  "asrStart","asrStop","asrStatus","asrTranscript"]){
   elements[id]={value:id==="lang"?"es":"",style:{},textContent:"",
    disabled:false,handlers:{},addEventListener(k,fn){this.handlers[k]=fn;},
    setAttribute(){}};
 }
 const document={getElementById:id=>elements[id],addEventListener(){}};
 const synth=voices?{getVoices:()=>voices,addEventListener(){},
  cancel(){},speak(){this.calls=(this.calls||0)+1;}}:undefined;
 const window={speechSynthesis:synth,
  SpeechSynthesisUtterance:voices?class{constructor(text){this.text=text;}}:undefined,
  addEventListener(){}};
 let resolveMic=null;
 const track={stops:0,stop(){this.stops++;}};
 const navigator={mediaDevices:{getUserMedia:async()=>lateMic
  ?new Promise(resolve=>resolveMic=()=>resolve({getTracks:()=>[track]}))
  :{getTracks:()=>[track]}}};
 new Function("window","document","navigator","speechSynthesis",
  "SpeechSynthesisUtterance","requestAnimationFrame","cancelAnimationFrame",
  embedded)(window,document,navigator,synth,window.SpeechSynthesisUtterance,()=>1,()=>{});
 return {elements,synth,track,grant:()=>resolveMic?.()};
}
return (async()=>{
 const absent=await fakeBrowser();
 absent.elements.lang.value="fr";absent.elements.lang.handlers.change();
 ok(absent.elements.speak.disabled,"No voice engine gracefully disables button");
 absent.elements.speechStop.handlers.click();
 const mixed=await fakeBrowser([{lang:"en-US",name:"English"},
  {lang:"fr-FR",name:"French"}]);
 mixed.elements.lang.value="fr";mixed.elements.lang.handlers.change();
 ok(!mixed.elements.speak.disabled,"French is selectable");
 ok(!mixed.elements.voiceList.textContent.includes("English"),"English excluded");
 mixed.elements.speak.handlers.click();
 ok(mixed.synth.calls===1,"French synthesis requested");
 mixed.elements.lang.value="de";mixed.elements.lang.handlers.change();
 ok(mixed.elements.speak.disabled,"No German voice");
 mixed.elements.speak.handlers.click();
 ok(mixed.synth.calls===1,"Never speak German with other language voice");
 const delayed=await fakeBrowser(null,true);
 delayed.elements.micStart.handlers.click();
 delayed.elements.micStop.handlers.click();
 delayed.grant();
 for(let k=0;k<7;k++)await Promise.resolve();
 ok(delayed.track.stops===1,"Cancel before permission closes late stream");
 console.log("P04 diagnostic synthetic browser: 7 checks");
})();

