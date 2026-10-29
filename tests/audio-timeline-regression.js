"use strict";
const assert=require("node:assert/strict");
const {evaluateContinuous,poissonUpper95,detectionMetrics}=require("../audio-timeline-metrics.js");
let checks=0;
const eq=(a,b,name)=>{assert.deepEqual(a,b,name);checks++;};
const frame=(atSeconds,kind)=>({atSeconds,scores:kind==="sneeze"?
 {sneeze:.995,unknown:.02}:kind==="cough"?{cough:.995,unknown:.02}:{unknown:.98,noise:.9}});
const times=[.25,.75,1.25,1.75,2.25,2.75,3.25,3.75,4.25,4.75,5.25,5.75];
const rows=times.map(t=>frame(t,[2.25,2.75,5.25,5.75].includes(t)?"sneeze":"noise"));
const a={id:"room",environment:"quiet",rights:"owned",annotationReview:"complete",durationSeconds:6,
 frames:rows,annotations:[{kind:"sneeze",startSeconds:2,endSeconds:3}],
 suppressions:[{startSeconds:3.7,endSeconds:4.7}]};
const report=evaluateContinuous([a]);
assert.throws(()=>evaluateContinuous([{...a,id:"draft-rejected",annotationReview:"draft",annotations:[]}]),
 /requires annotationReview=complete/);checks++;
assert.throws(()=>evaluateContinuous([{...a,id:"legacy-unreviewed",annotationReview:undefined,annotations:[]}]),
 /requires annotationReview=complete/);checks++;
assert.throws(()=>evaluateContinuous([{...a,id:"invalid-review",annotationReview:"auto"}]),
 /annotationReview must be draft or complete/);checks++;
assert.throws(()=>evaluateContinuous([{...a,
 suppressions:[{startSeconds:2.3,endSeconds:2.6}]}]),
 /Ground-truth event overlaps suppressed audio/);checks++;
assert.throws(()=>evaluateContinuous([{...a,
 suppressions:[{startSeconds:1.9,endSeconds:2.1}]}]),
 /Ground-truth event overlaps suppressed audio/);checks++;
eq(evaluateContinuous([{...a,id:"touch-only",suppressions:[
 {startSeconds:3,endSeconds:3.5}]}]).overall.metrics.sneeze.annotatedEvents,1,
 "A suppression starting at the exact end of a human event is valid");
eq(report.overall.metrics.sneeze.tp,1,"Real annotated sound is matched");
eq(report.overall.metrics.sneeze.precision,1,"True positive over one alert yields precision one");
eq(report.overall.metrics.sneeze.recall,1,"One eligible detected event yields recall one");
eq(report.overall.metrics.sneeze.precisionDenominator,1,"Precision denominator is emitted alarms");
eq(report.overall.metrics.sneeze.recallDenominator,1,"Recall denominator is evaluable annotations");
eq(report.overall.metrics.sneeze.missRateUpper95>0,true,
 "One observed event cannot prove perfect recall");
eq(report.overall.metrics.sneeze.precisionErrorUpper95>0,true,
 "One correct alert cannot prove zero false-positive probability");
eq(report.overall.eventConfusion.sneeze.sneeze,1,
 "Temporal confusion correctly attributes a true sneeze alert");
eq(report.overall.referenceDetectorLatencySeconds.sneeze.count,1,
 "Reference detector latency tracks only genuinely matched labels");
eq(report.overall.referenceDetectorLatencySeconds.sneeze.p50,.75,
 "Latency is measured from annotated onset to the second confirmation window");
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
eq(evaluateContinuous([oneFrame]).overall.eventConfusion.sneeze.missed,0,
 "Unevaluable labels cannot be silently counted as missed ground truth");
const wrongWithCoverage={...oneFrame,id:"wrong-with-coverage",
 frames:[frame(2.25,"noise"),frame(2.75,"noise")],
 annotations:[{kind:"sneeze",startSeconds:2.15,endSeconds:2.8}]};
const withCoverage=evaluateContinuous([wrongWithCoverage]).overall.metrics.sneeze;
eq(withCoverage.evaluableEvents,1,
 "Two consecutive nonhuman windows permit a valid false-negative assessment");
eq(withCoverage.fn,1,"A covered sound with no correct evidence is a real reference miss");
eq(withCoverage.recall,0,"Covered missed event has zero recall");
eq(withCoverage.precision,null,"No emitted alerts means precision is unknown, not zero");
eq(evaluateContinuous([wrongWithCoverage]).overall.eventConfusion.sneeze.missed,1,
 "Covered but undetected events enter the temporal confusion missed column");
// The tail planner sometimes creates a second frame closer than the normal
// hop. A near-duplicate cannot be an extra detection or evaluable ground truth.
const nearDuplicate={...oneFrame,id:"near-duplicate",durationSeconds:3,
 frames:[frame(1.0,"sneeze"),frame(1.28,"sneeze")],
 annotations:[{kind:"sneeze",startSeconds:.9,endSeconds:1.4}]};
const nearDuplicateStats=evaluateContinuous([nearDuplicate]);
eq(nearDuplicateStats.overall.metrics.sneeze.tp,0,
 "Near-duplicate classifier windows cannot yield a true alert");
eq(nearDuplicateStats.overall.metrics.sneeze.unevaluableEvents,1,
 "Ground truth with insufficient independent windows remains unevaluable");
const nearDuplicateNegative=evaluateContinuous([{...nearDuplicate,id:"near-duplicate-negative",annotations:[]}]);
eq(nearDuplicateNegative.overall.metrics.sneeze.fp,0,
 "Near-duplicate windows cannot fabricate a false alert either");
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
eq(wrong.overall.metrics.sneeze.precision,0,"Only false alerts yield precision zero");
eq(wrong.overall.metrics.sneeze.recall,null,"No target annotations means recall is unknown");
eq(wrong.overall.eventConfusion.background.sneeze,1,
 "False sneeze alarms with no human annotations count as background confusion");
eq(wrong.overall.referenceDetectorLatencySeconds.sneeze.count,0,
 "Unmatched alarms never contribute fabricated reaction latencies");
const confused={...wrongWithCoverage,id:"cough-confused-with-sneeze",
 frames:[frame(2.25,"cough"),frame(2.75,"cough")]};
const confusedReport=evaluateContinuous([confused]);
eq(confusedReport.overall.eventConfusion.sneeze.cough,1,
 "Cough predicted during a true sneeze is exposed as cross-event confusion");
eq(confusedReport.overall.eventConfusion.sneeze.missed,0,
 "One wrong-class alert must not be double-counted as a missed event in confusion");
eq(confusedReport.overall.eventConfusion.background.cough,0,
 "Misclassified human alert must not also count as background in event confusion");
eq(confusedReport.overall.metrics.sneeze.fn,1,
 "Existing per-kind recall still sees the sneeze as undetected");
eq(confusedReport.overall.metrics.cough.fp,1,
 "Existing per-kind false-alert statistic still counts wrong-class cough");
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
const combined=evaluateContinuous([b,{...b,id:"street",environment:"street",deviceClass:"phone",
 sourceGroup:"take-street",evaluationSplit:"test"}]);
eq(combined.byEnvironment.quiet.sessionCount,1,"Report keeps environmental splits");
eq(combined.byEnvironment.street.sessionCount,1,"Second environment retained");
eq(combined.byDevice.phone.sessionCount,1,"Phone timeline receives its own observation denominator");
eq(combined.bySplit.test.metrics.sneeze.fp,1,
 "Continuous reference false episodes use only their declared test split");
eq(combined.bySplit.test.eventConfusion.background.sneeze,1,
 "Temporal confusion is split by independent test cohort, not combined with development");
eq(combined.byDevice.phone.eventConfusion.background.sneeze,1,
 "Device-specific temporal confusion retains its cohort");
eq(combined.bySplit.unspecified.sessionCount,1,
 "Legacy timeline sessions stay explicitly unassigned");
eq(combined.sourceGroupAudit.sourceGroups,1,
 "Direct timeline audit counts only declared recording groups");
eq(combined.sourceGroupAudit.ungroupedRecordings,1,
 "Unassigned sessions never impersonate independent sources");
assert.throws(()=>evaluateContinuous([
 {...b,id:"group-dev",sourceGroup:"one-session",evaluationSplit:"development"},
 {...b,id:"group-test",sourceGroup:"one-session",evaluationSplit:"test"}
]),/across evaluation splits/);checks++;
eq(combined.byDevice.unspecified.sessionCount,1,"Legacy sessions never impersonate measured phones");
eq(combined.bySplit.test.metrics.sneeze.precision,0,
 "Precision uses only its own test split, not combined development");
eq(combined.byDevice.phone.metrics.sneeze.fp,1,
 "False episodes stay tied to the device cohort that generated them");
eq(combined.sessions[1].deviceClass,"phone","Session output carries only a coarse device category");
for(const bad of [
 [{...a,frames:[frame(2,"noise"),frame(1,"sneeze")]}],
 [{...a,rights:"unknown"}],
 [{...a,deviceClass:"physical-serial-number"}],
 [{...a,evaluationSplit:"validation"}],
 [{...a,suppressions:[{startSeconds:4,endSeconds:3}]}],
 [{...a,frames:[{atSeconds:0,scores:null}]}],
 [{...a,annotations:[{kind:"sneeze",startSeconds:2,endSeconds:8}]}],
 [a,{...a}]
]){assert.throws(()=>evaluateContinuous(bad));checks++;}
eq(detectionMetrics(0,0,0).precision,null,"No predictions means no precision rate");
eq(detectionMetrics(0,0,0).recall,null,"No eligible annotations means no recall rate");
eq(detectionMetrics(2,1,2).precision,2/3,"Detector precision derives from TP and FP");
eq(detectionMetrics(2,1,2).recall,.5,"Detector recall derives from eligible TP and FN");
console.log("Offline continuous audio-event evaluator regression:",checks,"assertions passed");
