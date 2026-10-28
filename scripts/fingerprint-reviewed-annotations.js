"use strict";
// Intentionally explicit migration utility: never mutates existing manifests,
// marks audio as reviewed, verifies a person's identity, or publishes hashes.
// Reviewer must have listened to and checked labels/suppressions personally.
const fs=require("node:fs"),crypto=require("node:crypto");
const {canonicalReviewedAnnotations}=require("../audio-review-payload.js");
const {requireCompleteAnnotationReview}=require("../audio-annotation-review.js");
const [manifestPath,sessionId,confirm,...extra]=process.argv.slice(2);
if(!manifestPath||!sessionId||confirm!=="--confirm-reviewed"||extra.length)
 throw Error("Usage: npm run fingerprint:audio:annotations -- /ruta/manifest.json SESSION_ID --confirm-reviewed");
const obj=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
if(!Array.isArray(obj.sessions))throw Error("Manifest has no sessions");
const matches=obj.sessions.filter(x=>x?.id===sessionId);
if(matches.length!==1)throw Error("Requires exactly one matching session ID");
const session=matches[0];
requireCompleteAnnotationReview(session.annotationReview,session.id);
if(!/^[0-9a-f]{64}$/.test(session.audioSha256||""))
 throw Error("Session must have the SHA-256 of the already reviewed audio");
const bytes=canonicalReviewedAnnotations({...session,suppressions:session.suppressions??[]});
console.log(crypto.createHash("sha256").update(bytes).digest("hex"));
