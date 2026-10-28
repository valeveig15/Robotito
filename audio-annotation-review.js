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
// A completed manual annotation review describes one particular audio file.
// Hashes live only in the user's local manifest; evaluation reports contain
// verification status, never audio fingerprints or the original file path.
const HEX_SHA256=/^[a-f0-9]{64}$/;
function verifyReviewedAnnotationDigest(review,claimed,actual,id){
 const state=normalizeAnnotationReview(review);
 if(claimed!==undefined&&!HEX_SHA256.test(claimed))
  throw Error("Invalid reviewed annotation SHA-256 for "+String(id||"unknown"));
 if(state==="draft")return false;
 if(!HEX_SHA256.test(claimed||""))
  throw Error("Reviewed session "+String(id||"unknown")+" requires reviewAnnotationsSha256");
 if(claimed!==actual)
  throw Error("Reviewed annotation SHA-256 mismatch for "+String(id||"unknown")+
   ": labels or suppressions changed after review");
 return true;
}
function verifyReviewedAudioDigest(review,claimed,actual,id){
 const state=normalizeAnnotationReview(review);
 if(claimed!==undefined&&!HEX_SHA256.test(claimed))
  throw Error("Invalid reviewed audio SHA-256 for "+String(id||"unknown"));
 if(state==="draft")return false;
 if(!HEX_SHA256.test(claimed||""))
  throw Error("Reviewed session "+String(id||"unknown")+" requires audioSha256 of the reviewed recording");
 if(!HEX_SHA256.test(actual||"")||claimed!==actual)
  throw Error("Reviewed audio SHA-256 mismatch for "+String(id||"unknown")+
   ": recording changed after annotation review");
 return true;
}
const api={normalizeAnnotationReview,requireCompleteAnnotationReview,
 verifyReviewedAudioDigest,verifyReviewedAnnotationDigest};
root.ROBOTITO_AUDIO_ANNOTATION_REVIEW=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
