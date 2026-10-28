"use strict";
const assert=require("node:assert/strict");
const {normalizeAnnotationReview,requireCompleteAnnotationReview}=require("../audio-annotation-review.js");
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
console.log("Robotito audio annotation-review gate regression passed");
