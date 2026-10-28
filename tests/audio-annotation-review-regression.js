"use strict";
const assert=require("node:assert/strict");
const {normalizeAnnotationReview,requireCompleteAnnotationReview,
 verifyReviewedAudioDigest,verifyReviewedAnnotationDigest}=require("../audio-annotation-review.js");
const {canonicalReviewedAnnotations}=require("../audio-review-payload.js");
const {createHash}=require("node:crypto");
assert.equal(normalizeAnnotationReview(undefined),"draft",
 "Legacy data with missing review flag must not assume a negative sound event was verified");
assert.equal(normalizeAnnotationReview("draft"),"draft");
assert.equal(normalizeAnnotationReview("complete"),"complete");
assert.equal(requireCompleteAnnotationReview("complete","reviewed-01"),"complete");
for(const value of [null,false,true,"yes","auto","",{},42,"Complete"]){
 assert.throws(()=>normalizeAnnotationReview(value),/annotationReview must be draft or complete/);
}
for(const value of [undefined,"draft"]){
 assert.throws(()=>requireCompleteAnnotationReview(value,"unreviewed-session"),
  /requires annotationReview=complete/);
}
const good="fa".repeat(32),bad="ba".repeat(32);
assert.equal(verifyReviewedAudioDigest("complete",good,good,"one"),true,
 "Reviewed bytes must match exactly");
assert.equal(verifyReviewedAudioDigest("draft",undefined,good,"two"),false,
 "Legacy unreviewed audio stays inspectable without a fingerprint");
for(const claim of [undefined,"","garbage","A".repeat(64),42,good.slice(1)]){
 assert.throws(()=>verifyReviewedAudioDigest("complete",claim,good,"one"),
  /requires audioSha256|Invalid reviewed audio SHA-256/);
}
assert.throws(()=>verifyReviewedAudioDigest("complete",good,bad,"one"),
 /Reviewed audio SHA-256 mismatch/);
assert.throws(()=>verifyReviewedAudioDigest("draft","no",good,"two"),
 /Invalid reviewed audio SHA-256/);
const reviewed={audioSha256:good,
 annotations:[{kind:"sneeze",startSeconds:.2,endSeconds:.35},
  {kind:"cough",startSeconds:.7,endSeconds:.85}],
 suppressions:[{startSeconds:1,endSeconds:1.5}]};
const sign=x=>createHash("sha256").update(canonicalReviewedAnnotations(x)).digest("hex");
const reviewedSignature=sign(reviewed);
assert.equal(verifyReviewedAnnotationDigest("complete",reviewedSignature,reviewedSignature,"sample"),true);
assert.equal(verifyReviewedAnnotationDigest("draft",undefined,reviewedSignature,"sample"),false);
assert.equal(sign({...reviewed,annotations:reviewed.annotations.slice().reverse()}),reviewedSignature,
 "Reordering independent event marks must not invalidate review");
assert.notEqual(sign({...reviewed,annotations:[{...reviewed.annotations[0],endSeconds:.34},reviewed.annotations[1]]}),reviewedSignature,
 "Moving one event boundary invalidates the review");
assert.notEqual(sign({...reviewed,suppressions:[{startSeconds:1,endSeconds:1.6}]}),reviewedSignature,
 "Editing a suppressed window invalidates the review");
assert.notEqual(sign({...reviewed,audioSha256:bad}),reviewedSignature,
 "Review signature binds the specific audio digest");
assert.throws(()=>verifyReviewedAnnotationDigest("complete",undefined,reviewedSignature,"sample"),
 /requires reviewAnnotationsSha256/);
assert.throws(()=>verifyReviewedAnnotationDigest("complete","x",reviewedSignature,"sample"),
 /Invalid reviewed annotation SHA-256/);
assert.throws(()=>verifyReviewedAnnotationDigest("complete",reviewedSignature,bad,"sample"),
 /Reviewed annotation SHA-256 mismatch/);
console.log("Robotito audio annotation-review gate regression passed");
