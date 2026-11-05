"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const begin=source.indexOf("function cleanRecognitionTranscript(");
const end=source.indexOf("\nfunction processSpeechResult(",begin);
assert.ok(begin>=0&&end>begin,"Production speech chunk functions exist");
let checked=0,clock=0;
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checked++;};
function fixture(){
 const pendingTimers=new Map(),commits=[],display={textContent:""};
 const state={started:true},document={hidden:false};
 let id=0;
 const fakeTimer=fn=>{const key=++id;pendingTimers.set(key,fn);return key;};
 const clearTimer=key=>pendingTimers.delete(key);
 const runtime=new Function("$","normalizeText","isMobileSpeech","clearTimeout","setTimeout",
  "updateDetectedLanguage","processSpeechResult","state","document",
  "let pendingRecognitionText=\"\",pendingRecognitionMeta=null,recognitionCommitTimer=null;\n"+
  source.slice(begin,end)+
  "\nreturn {cleanRecognitionTranscript,mergeRecognitionChunks,queueRecognitionChunk,flushRecognitionChunks};"
 )(()=>display,
  x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[!?.,]/g,"").trim(),
  ()=>false,clearTimer,fakeTimer,()=>{},(text,meta)=>commits.push({text,meta}),state,document);
 return {runtime,display,pendingTimers,commits,state,document,flushTimers(){
  const callbacks=[...pendingTimers.values()];pendingTimers.clear();callbacks.forEach(fn=>fn());
 }};
}
const f=fixture();
eq(f.runtime.cleanRecognitionTranscript("No no, no borres eso"),"No no, no borres eso","A repeated negation is real transcript content");
eq(f.runtime.cleanRecognitionTranscript("I had had enough"),"I had had enough","Grammatical repeated words are preserved");
eq(f.runtime.cleanRecognitionTranscript("Estou em casa"),"Estou em casa","Portuguese em is a word, not disposable noise");
for(const [a,b,expected] of [
 ["Qué es","es permutación","Qué es permutación"],
 ["¿Qué es permutación?","¿Qué es permutación?","¿Qué es permutación?"],
 ["Explain the","the chapter please","Explain the chapter please"],
 ["¿Qué es la fotosíntesis y cómo se","cómo se relaciona con la luz?",
  "¿Qué es la fotosíntesis y cómo se relaciona con la luz?"]
 ]){
 eq(f.runtime.mergeRecognitionChunks(a,b),expected,"Speech chunks must merge without duplicated overlap");
}
f.runtime.queueRecognitionChunk("¿Qué es",{startedAt:100});
f.runtime.queueRecognitionChunk("es permutación",{startedAt:120});
eq(f.display.textContent,"¿Qué es permutación …","Live text shows merged phrase");
eq(f.pendingTimers.size,1,"Debounce keeps only the latest timer");
f.flushTimers();
eq(f.commits.length,1,"Chunk fragments result in exactly one action");
eq(f.commits[0].text,"¿Qué es permutación","Audio segmentation preserves all words");
eq(f.commits[0].meta.startedAt,100,"Metadata stays attached to first segment");
f.flushTimers();
eq(f.commits.length,1,"No replay after flush");
f.runtime.queueRecognitionChunk("I had",null,{independent:true});
f.runtime.queueRecognitionChunk("had enough",null,{independent:true});
f.flushTimers();
eq(f.commits.at(-1).text,"I had had enough","Independent native final indexes cannot lose repeated boundary words");
for(const reason of ["hidden","stopped","muted","disabled","ended"]){
 const x=fixture();x.runtime.queueRecognitionChunk("old command");
 if(reason==="hidden")x.document.hidden=true;
 else if(reason==="stopped")x.state.started=false;
 else x.state.stream={getTracks:()=>[{muted:reason==="muted",enabled:reason!=="disabled",
  readyState:reason==="ended"?"ended":"live"}]};
 x.flushTimers();
 eq(x.commits.length,0,reason+": pending debounce cannot commit after capture became unavailable");
}
const cancelSource=source.slice(source.indexOf("function discardRecognition(){"),
 source.indexOf("\nfunction restartRecognitionAfterSpeech()",source.indexOf("function discardRecognition(){")));
assert.ok(cancelSource.startsWith("function discardRecognition"),"Production cancellation exists");
let canceled=false;
const cancel=new Function("state","clearTimeout",
 "let pendingRecognitionText=\"stale words\",pendingRecognitionMeta={old:true},recognitionCommitTimer=42;\n"+
 cancelSource+"\ndiscardRecognition();return {pendingRecognitionText,pendingRecognitionMeta};")(
 {recognition:{abort(){canceled=true;},onend:null,onerror:null,onresult:null}},
 x=>eq(x,42,"Debounce timer canceled on session replacement"));
const result=cancel;
eq(result.pendingRecognitionText,"","Old words cannot remain pending");
eq(result.pendingRecognitionMeta,null,"Old audio metadata is erased");
eq(canceled,true,"Prior ASR instance aborted");
console.log("P04 transcript segmentation and cancellation:",checked,"checks");
