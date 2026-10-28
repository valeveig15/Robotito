"use strict";
const assert=require("node:assert/strict");
const {plan,frame,overlapsSuppression,WINDOW_SAMPLES}=require("../audio-evaluation-windows.js");
let checked=0;
const eq=(got,want,name)=>{assert.deepEqual(got,want,name);checked++;};
for(const [duration,expected]of [[2400,1],[8000,1],[15599,1],
 [15600,1],[15601,2],[20000,2],[32000,4],[39000,4]]){
 const rows=plan(duration);
 eq(rows.length,expected,"Correct number of windows for "+duration+" samples");
 eq(rows[0].start,0,"First window always starts at zero");
 eq(rows.at(-1).end,duration,"Last window covers final sample");
 eq(rows.every(row=>row.end-row.start+row.paddingStart+row.paddingEnd===15600),
   true,"Each input to YAMNet is 15600 samples");
 const marked=new Float32Array(duration);
 marked[0]=.25;marked[duration-1]=.75;
 const start=frame(marked,rows[0]),last=frame(marked,rows.at(-1));
 eq(start[rows[0].paddingStart],.25,"Retains initial transient");
 eq(last[rows.at(-1).paddingStart+duration-rows.at(-1).start-1],.75,
   "Retains trailing transient");
}
const short=plan(4000)[0];
eq(short.paddingStart,5800,"Short clips are centred in the YAMNet frame");
eq(short.paddingEnd,5800,"Short clips are symmetrically padded");
eq(frame(new Float32Array(4000).fill(.3),short).length,WINDOW_SAMPLES,
 "Short single sneeze/cough is actually sent to classifier");
for(const n of [0,-1,Infinity,1.2]){assert.throws(()=>plan(n));checked++;}
assert.throws(()=>frame(new Float32Array(4),{start:0,end:7,paddingStart:0,paddingEnd:0}));
checked++;
eq(overlapsSuppression(0,.975,[{startSeconds:.9,endSeconds:1.1}]),true,
 "Partly overlapped voice interval vetoes whole YAMNet frame");
eq(overlapsSuppression(1.1,2,[{startSeconds:.9,endSeconds:1.1}]),false,
 "Touching boundary does not suppress unaffected frame");
eq(overlapsSuppression(0,.975,[{startSeconds:1,endSeconds:2}]),false,
 "Unrelated later suppression leaves frame unchanged");
assert.throws(()=>overlapsSuppression(0,.975,[{startSeconds:1.2,endSeconds:1.1}]));
checked++;
console.log("Robotito short and trailing audio-window regression:",checked,"assertions passed");
