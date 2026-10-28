(function(root){
"use strict";
// Canonical versioned review payload shared by browser studio and Node CLI.
// SHA-256 is computed outside this pure module with Web Crypto or Node crypto.
// This detects accidental post-review changes; it is NOT a signed human
// identity, review-quality guarantee, or proof of consent.
function canonicalReviewedAnnotations(session){
 if(!session||!Array.isArray(session.annotations)||
    !Array.isArray(session.suppressions))
  throw Error("Review integrity requires annotation and suppression arrays");
 const annotations=session.annotations.map(x=>({
  kind:x.kind,startSeconds:x.startSeconds,endSeconds:x.endSeconds
 })).sort((a,b)=>a.startSeconds-b.startSeconds||
  a.endSeconds-b.endSeconds||String(a.kind).localeCompare(String(b.kind),"en"));
 const suppressions=session.suppressions.map(x=>({
  startSeconds:x.startSeconds,endSeconds:x.endSeconds
 })).sort((a,b)=>a.startSeconds-b.startSeconds||a.endSeconds-b.endSeconds);
 // JSON object keys and number encodings are the same in browser and Node.
 return JSON.stringify({version:1,audioSha256:session.audioSha256,
  annotations,suppressions});
}
const api={canonicalReviewedAnnotations};
root.ROBOTITO_AUDIO_REVIEW_PAYLOAD=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
