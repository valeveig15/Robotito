// P76–P78: pure class bookmark and audio-timestamp policy.
(function(root){
"use strict";
const colors=Object.freeze(["yellow","green","blue","pink"]);
function sanitize(value,max=200){return String(value??"").replace(/[\u0000-\u001f]+/g," ").replace(/\s+/g," ").trim().slice(0,max);}
function marker(input){
 const sessionId=sanitize(input?.sessionId,120),note=sanitize(input?.note,240),color=colors.includes(input?.color)?input.color:"yellow";
 const millis=Number(input?.offsetMs);
 if(!sessionId)throw Error("Cannot bookmark without a class session");
 if(!Number.isFinite(millis)||millis<0||millis>24*3600000)throw RangeError("Invalid class offset");
 return {id:input.id||"mark:"+crypto.randomUUID(),sessionId,offsetMs:Math.round(millis),
  color,note,at:Number(input.at)||Date.now()};
}
function align(transcriptLines,positionMs){
 const lines=(transcriptLines||[]).filter(x=>Number.isFinite(Number(x?.offsetMs))).sort((a,b)=>a.offsetMs-b.offsetMs);
 let closest=null;
 for(const line of lines){if(line.offsetMs<=positionMs)closest=line;else break;}
 return closest;
}
function clock(ms){
 const s=Math.max(0,Math.floor(Number(ms)/1000)||0);
 return String(Math.floor(s/3600)).padStart(2,"0")+":"+
  String(Math.floor(s%3600/60)).padStart(2,"0")+":"+
  String(s%60).padStart(2,"0");
}
const api=Object.freeze({colors,sanitize,marker,align,clock});
root.ROBOTITO_CLASS_MARK_POLICY=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
