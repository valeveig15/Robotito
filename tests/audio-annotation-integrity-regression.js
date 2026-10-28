"use strict";
const assert=require("node:assert/strict");
const {assertNoMaskedEvents}=require("../audio-annotation-integrity.js");
const t=(a,b)=>({startSeconds:a,endSeconds:b});
assert.equal(assertNoMaskedEvents([t(0,.8)],[t(.8,1.6)]),true,
 "Half-open ranges that only touch are valid");
assert.equal(assertNoMaskedEvents([t(.8,1.6)],[t(0,.8)]),true,
 "Touching boundaries in reverse direction are valid");
assert.equal(assertNoMaskedEvents([t(0,.4),t(2.5,3),t(5.2,5.6)],
 [t(.4,2),t(3,5.2)]),true,
 "Disjoint unsorted event/suppression intervals remain valid");
for(const [events,blocked] of [
 [[t(.8,1.2)],[t(1,1.5)]],
 [[t(1,1.5)],[t(.8,1.2)]],
 [[t(1,2)],[t(1,2)]],
 [[t(1,3)],[t(1.8,2.1)]],
 [[t(0,.1),t(2.7,3.7),t(4,5)],[t(2.5,2.9)]],
 [[t(1,2)],[t(0,3)]]
 ])assert.throws(()=>assertNoMaskedEvents(events,blocked),
 /Ground-truth event overlaps suppressed audio/);
for(const invalid of [null,{},42,"events"])
 assert.throws(()=>assertNoMaskedEvents(invalid,[]),/must be arrays/);
for(const invalid of [t(-1,.5),t(1,1),t(2,1),t(1,Infinity),{startSeconds:NaN,endSeconds:2}])
 assert.throws(()=>assertNoMaskedEvents([invalid],[]),/Invalid annotated/);
assert.equal(assertNoMaskedEvents([],[]),true,
 "Continuous negative sound sessions without events remain valid");
console.log("Robotito shared sound annotation privacy integrity regression passed");
