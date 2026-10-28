"use strict";
const assert=require("node:assert/strict");
const {validateDecodedDuration,inspectCorpus}=require("../audio-media-preflight.js");
const valid={id:"synthetic-session",annotations:[
 {kind:"sneeze",startSeconds:0,endSeconds:.25},
 {kind:"cough",startSeconds:1,endSeconds:2.5}],
 suppressions:[{startSeconds:.3,endSeconds:.7}]};
const decoded={durationSeconds:2.5,sampleRate:16000,channels:1};
assert.equal(validateDecodedDuration(valid,decoded),2.5,
 "Event/suppression can end exactly at recording boundary");
assert.equal(validateDecodedDuration({...valid,annotations:[]},decoded),2.5,
 "Negative continuous sessions require no human event");
assert.equal(validateDecodedDuration({...valid,annotations:[
 {kind:"sneeze",startSeconds:2.5,endSeconds:2.50001}]},decoded),2.5,
 "Tiny decoder floating-point discrepancies are tolerated");
for(const [item,metadata] of [
 [{...valid,annotations:[{kind:"sneeze",startSeconds:2,endSeconds:3}]},decoded],
 [{...valid,suppressions:[{startSeconds:2.4,endSeconds:3}]},decoded],
 [{...valid,annotations:[{kind:"sneeze",startSeconds:3,endSeconds:3.5}]},decoded],
 [{...valid,annotations:[{kind:"sneeze",startSeconds:-1,endSeconds:.2}]},decoded],
 [{...valid,suppressions:[{startSeconds:.8,endSeconds:.8}]},decoded],
 [valid,{...decoded,durationSeconds:NaN}],
 [valid,{...decoded,durationSeconds:0}],
 [valid,{...decoded,sampleRate:0}],
 [valid,{...decoded,channels:0}],
 [valid,{...decoded,channels:1.2}]
])assert.throws(()=>validateDecodedDuration(item,metadata),
 /Out-of-bounds|Invalid or empty/,
 "Invalid or out-of-recording events must fail BEFORE inference");
const missing={...valid,annotations:[],suppressions:[]};
assert.equal(validateDecodedDuration(missing,decoded),2.5,
 "Non-annotated clip still has an inspected duration");
(async()=>{
 await assert.rejects(inspectCorpus(null,[valid]),/browser page/);
 await assert.rejects(inspectCorpus({evaluate(){}},[]),/nonempty corpus/);
 console.log("Audio media duration validation regression passed");
})().catch(error=>{console.error(error);process.exitCode=1;});
