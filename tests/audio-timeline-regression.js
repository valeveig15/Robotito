"use strict";
const assert=require("node:assert/strict");
const {evaluateContinuous,poissonUpper95}=require("../audio-timeline-metrics.js");
let checks=0;
const eq=(a,b,name)=>{assert.deepEqual(a,b,name);checks++;};
const frame=(atSeconds,kind)=>({atSeconds,scores:kind==="sneeze"?
 {sneeze:.995,unknown:.02}:kind==="cough"?{cough:.995,unknown:.02}:{unknown:.98,noise:.9}});
const times=[.25,.75,1.25,1.75,2.25,2.75,3.25,3.75,4.25,4.75,5.25,5.75];
const rows=times.map(t=>frame(t,[2.25,2.75,5.25,5.75].includes(t)?"sneeze":"noise"));
const a={id:"room",environment:"quiet",rights:"owned",durationSeconds:6,
 frames:rows,annotations:[{kind:"sneeze",startSeconds:2,endSeconds:3}],
 suppressions:[{startSeconds:3.7,endSeconds:4.7}]};
const report=evaluateContinuous([a]);
eq(report.overall.metrics.sneeze.tp,1,"Real annotated sound is matched");
eq(report.overall.metrics.sneeze.fp,0,"One sustained sound does not repeat inside cooldown");
eq(report.overall.metrics.sneeze.fn,0,"Covered ground truth not missed");
eq(report.overall.metrics.sneeze.evaluableEvents,1,
 "Observed event with consecutive frames can be fairly evaluated");
const oneFrame={...a,id:"one-frame",durationSeconds:3,
 frames:[frame(2.25,"noise")],
 annotations:[{kind:"sneeze",startSeconds:2.2,endSeconds:2.3}],suppressions:[]};
const oneFrameResult=evaluateContinuous([oneFrame]).overall.metrics.sneeze;
eq(oneFrameResult.annotatedEvents,1,"Ground truth remains disclosed");
eq(oneFrameResult.evaluableEvents,0,
 "One observed frame cannot evaluate a two-frame reference detector");
eq(oneFrameResult.unevaluableEvents,1,
 "Unevaluable annotation is explicitly counted");
eq(oneFrameResult.fn,0,"Insufficient coverage must not fabricate missed detections");
const wrongWithCoverage={...oneFrame,id:"wrong-with-coverage",
 frames:[frame(2.25,"noise"),frame(2.75,"noise")],
 annotations:[{kind:"sneeze",startSeconds:2.15,endSeconds:2.8}]};
const withCoverage=evaluateContinuous([wrongWithCoverage]).overall.metrics.sneeze;
eq(withCoverage.evaluableEvents,1,
 "Two consecutive nonhuman windows permit a valid false-negative assessment");
eq(withCoverage.fn,1,"A covered sound with no correct evidence is a real reference miss");
const separated={...oneFrame,id:"separated",durationSeconds:120,
 frames:[frame(.25,"noise"),frame(100.25,"noise")],
 annotations:[{kind:"sneeze",startSeconds:0,endSeconds:101}]};
eq(evaluateContinuous([separated]).overall.metrics.sneeze.unevaluableEvents,1,
 "Two distant observed windows are not evidence of continuous coverage");
eq(report.sessions[0].alerts.length,1,"Requires two independent aligned windows");
eq(report.sessions[0].observedSeconds<6,true,"Suppression and missing coverage excluded");
eq(report.calibrated,false,"Offline metrics cannot calibrate the model");
const near=(x,y,tol,msg)=>{assert.ok(Math.abs(x-y)<tol,msg);checks++;};
near(poissonUpper95(0),-Math.log(.05),1e-10,
 "Zero false episodes require a nonzero 95% upper rate");
near(poissonUpper95(1),4.74386451839,1e-8,
 "Exact one-sided upper count for one false episode");
near(poissonUpper95(2),6.29579362187,1e-8,
 "Exact one-sided upper count for two false episodes");
assert.throws(()=>poissonUpper95(-1));checks++;
assert.throws(()=>poissonUpper95(1.5));checks++;
eq(report.overall.metrics.sneeze.falseAlertsPerNegativeHour,0,
 "Zero observed reference alerts reported as empirical zero");
eq(report.overall.metrics.sneeze.falseAlertsPerNegativeHourUpper95>0,true,
 "Empirical zero must not become zero plausible false alarm rate");
near(report.overall.metrics.sneeze.falseAlertsPerNegativeHourUpper95,
 -Math.log(.05)*3600/report.overall.metrics.sneeze.negativeSeconds,1e-8,
 "Confidence bound uses observed negative exposure, not recording length");
const boundary={...a,id:"boundary",annotations:[],suppressions:[
 {startSeconds:1.4,endSeconds:1.5}],frames:[
 {atSeconds:1.1,windowStartSeconds:.6,windowEndSeconds:1.57,
  scores:{sneeze:.995},suppressed:false},
 {atSeconds:1.6,windowStartSeconds:1.1,windowEndSeconds:2.07,
  scores:{sneeze:.995},suppressed:false}
 ]};
const excluded=evaluateContinuous([boundary]);
eq(excluded.overall.metrics.sneeze.fp,0,
 "Frames overlapping suppression are never eligible despite safe timestamps");
eq(excluded.overall.observedSeconds,0,
 "Partly suppressed windows do not count as observed negative audio");
eq(excluded.sessions[0].skippedFrames,2,
 "Every contaminated frame is reported as skipped");
assert.throws(()=>evaluateContinuous([{...boundary,id:"wrong-bounds",frames:[
 {atSeconds:1.1,windowStartSeconds:1.5,windowEndSeconds:1.57,scores:{noise:.9}}
]}]),/Invalid timestamped audio window bounds/);checks++;
eq(report.automaticHumanReactionsApproved,false,"No unsolicited reactions authorized");
const b={...a,id:"wrong",annotations:[],suppressions:[],
 frames:times.map(t=>frame(t,[1.25,1.75].includes(t)?"sneeze":"noise"))};
const wrong=evaluateContinuous([b]);
eq(wrong.overall.metrics.sneeze.fp,1,"Two matching false windows form one false alert");
eq(wrong.overall.metrics.sneeze.falseAlertsPerNegativeHour>0,true,
 "Measured reference false alerts use observed negative hours");
eq(wrong.overall.metrics.sneeze.falseAlertsPerNegativeHourUpper95>
 wrong.overall.metrics.sneeze.falseAlertsPerNegativeHour,true,
 "Upper event-rate bound exceeds empirical rate after false alarms");
const missing=evaluateContinuous([{...b,id:"missing",frames:[]}]);
eq(missing.overall.metrics.sneeze.falseAlertsPerNegativeHour,null,
 "No listening exposure yields no numerical rate");
eq(missing.overall.metrics.sneeze.falseAlertsPerNegativeHourUpper95,null,
 "No listening exposure yields no uncertainty bound");
eq(wrong.overall.metrics.sneeze.tp,0,"No hallucinated positive labels");
const single={...b,id:"single",frames:times.map(t=>frame(t,t===1.25?"sneeze":"noise"))};
eq(evaluateContinuous([single]).overall.metrics.sneeze.fp,0,
 "Single isolated spike is ignored");
const suppress={...b,id:"suppressed",suppressions:[{startSeconds:1,endSeconds:2}]};
eq(evaluateContinuous([suppress]).overall.metrics.sneeze.fp,0,
 "No alerts inside suppressed interval");
const gap={...b,id:"gap",durationSeconds:120,frames:[
 frame(.25,"sneeze"),frame(100.25,"sneeze")]};
eq(evaluateContinuous([gap]).overall.metrics.sneeze.fp,0,
 "Large missing data gaps cannot create consecutive evidence");
eq(evaluateContinuous([gap]).overall.observedSeconds<2,true,
 "Unobserved time is not counted as negative evidence");
const combined=evaluateContinuous([b,{...b,id:"street",environment:"street"}]);
eq(combined.byEnvironment.quiet.sessionCount,1,"Report keeps environmental splits");
eq(combined.byEnvironment.street.sessionCount,1,"Second environment retained");
for(const bad of [
 [{...a,frames:[frame(2,"noise"),frame(1,"sneeze")]}],
 [{...a,rights:"unknown"}],
 [{...a,suppressions:[{startSeconds:4,endSeconds:3}]}],
 [{...a,frames:[{atSeconds:0,scores:null}]}],
 [{...a,annotations:[{kind:"sneeze",startSeconds:2,endSeconds:8}]}],
 [a,{...a}]
]){assert.throws(()=>evaluateContinuous(bad));checks++;}
console.log("Offline continuous audio-event evaluator regression:",checks,"assertions passed");
