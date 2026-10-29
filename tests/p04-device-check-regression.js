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
for(const id of ["speak","speechStop","micStart","micStop","voiceList","micStatus","meterFill"])
 ok(html.includes('id="'+id+'"'),"Missing manual test control "+id);
ok(embedded.includes("getUserMedia({audio:true,video:false})"),"Explicit mic permission");
ok(embedded.includes("stopTracks(microphone)"),"Stops live tracks");
ok(embedded.includes("stopTracks(granted)"),"Stops late-granted tracks");
ok(embedded.includes("requestEpoch"),"Rejects stale mic permissions");
ok(embedded.includes("pagehide"),"Shutdown on navigation");
ok(embedded.includes("visibilitychange"),"Shutdown when hidden");
ok(embedded.includes("speechSynthesis.getVoices()"),"Voice matching");
ok(embedded.includes('===code'),"No cross-language voice substitution");
ok(!/\b(fetch|XMLHttpRequest|WebSocket|MediaRecorder|localStorage|indexedDB)\b/.test(embedded),
 "Diagnostic must neither send nor store recordings");
console.log("P04 manual device diagnostic contract:",checked,"checks");
