"use strict";
const assert=require("node:assert/strict");
const {normalizeAnnotationReview,requireCompleteAnnotationReview,verifyReviewedAudioDigest}=require("../audio-annotation-review.js");
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
console.log("Robotito audio annotation-review gate regression passed");
