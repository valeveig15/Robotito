(function(root){
"use strict";
// "annotations: []" alone cannot certify an event-free recording.
// Legacy manifests remain readable as drafts, never automatically reviewed.
const VALUES=new Set(["draft","complete"]);
function normalizeAnnotationReview(value){
 if(value===undefined)return "draft";
 if(typeof value!=="string"||!VALUES.has(value))
  throw Error("annotationReview must be draft or complete");
 return value;
}
function requireCompleteAnnotationReview(value,id){
 const state=normalizeAnnotationReview(value);
 if(state!=="complete")
  throw Error("Audio session "+String(id||"unknown")+
   " requires annotationReview=complete after listening to the entire recording and reviewing all target events");
 return state;
}
const api={normalizeAnnotationReview,requireCompleteAnnotationReview};
root.ROBOTITO_AUDIO_ANNOTATION_REVIEW=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
