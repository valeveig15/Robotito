(function(root){
"use strict";
// A labelled human event cannot overlap an interval whose PCM must never
// be evaluated (Modo Clase, own speech, etc.). Treat times as half-open:
// touching at an endpoint is valid; positive-duration overlap is not.
// Reusable in both browser collection and direct Node evaluation.
function assertNoMaskedEvents(annotations,suppressions){
 if(!Array.isArray(annotations)||!Array.isArray(suppressions))
  throw Error("Annotations and suppressions must be arrays");
 function normalize(rows){
  return rows.map(row=>{
   if(!row||!Number.isFinite(row.startSeconds)||!Number.isFinite(row.endSeconds)||
      row.startSeconds<0||row.endSeconds<=row.startSeconds)
    throw Error("Invalid annotated/suppressed time interval");
   return [row.startSeconds,row.endSeconds];
  }).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 }
 const events=normalize(annotations),blocked=normalize(suppressions);
 let i=0,j=0;
 while(i<events.length&&j<blocked.length){
  const event=events[i],mask=blocked[j];
  if(event[0]<mask[1]&&mask[0]<event[1])
   throw Error("Ground-truth event overlaps suppressed audio; correct annotations or exclusion intervals");
  if(event[1]<=mask[1])i++;else j++;
 }
 return true;
}
const api={assertNoMaskedEvents};
root.ROBOTITO_AUDIO_ANNOTATION_INTEGRITY=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
