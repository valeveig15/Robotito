"use strict";
const assert=require("node:assert/strict");
const report=require("../audio-calibration.js");
let assertions=0;
function eq(a,b,name){assert.deepEqual(a,b,name);assertions++;}
const base={environment:"room",rights:"open-license",durationSeconds:5};
const clips=[
 {...base,id:"true-sneeze",label:"sneeze",deviceClass:"built-in",scores:{sneeze:.995,cough:.02,voice:.05}},
 {...base,id:"true-cough",label:"cough",scores:{cough:.995,sneeze:.01}},
 {...base,id:"ambiguous",label:"sneeze",scores:{sneeze:.995,cough:.97}},
 {...base,id:"speech",label:"voice",scores:{voice:.999,sneeze:.97}},
 {...base,id:"knock",label:"impact",environment:"street",scores:{impact:.97,clap:.90}},
 {...base,id:"false-sneeze",label:"noise",environment:"street",deviceClass:"phone",scores:{sneeze:.99,noise:.10}}
];
eq(report.classify({sneeze:.995,cough:.97}),"unknown","Cough/sneeze ambiguity abstains");
eq(report.classify({voice:.99,sneeze:.97}),"voice","Strong speech vetoes false sneeze");
eq(report.classify({sneeze:.997,cough:.02}),"sneeze","Unopposed sneeze maps correctly");
const x=report.evaluate(clips);
eq(x.clipCount,6,"All annotated clips counted");
eq(x.confusion.sneeze.sneeze,1,"True sneeze positive");
eq(x.confusion.sneeze.unknown,1,"Confusable positive abstains");
eq(x.confusion.noise.sneeze,1,"False-positive visible in confusion matrix");
eq(x.metrics.sneeze.tp,1,"Correct TP");
eq(x.metrics.sneeze.fp,1,"Correct FP");
eq(x.metrics.sneeze.fn,1,"Correct FN");
eq(x.metrics.sneeze.precision,.5,"Precision derived from ground truth");
eq(x.metrics.sneeze.recall,.5,"Recall derived from ground truth");
eq(x.metrics.sneeze.falsePositiveClipsPerNegativeHour,1/(20/3600),
 "False-positive *clips* per non-sneeze recording hour");
eq(x.metrics.sneeze.falsePositiveClipRate,.25,
 "A clip-level false-positive proportion uses all non-sneeze clips");
eq(x.metrics.sneeze.negativeClips,4,
 "Negative clip count excludes the target sound class");
eq(x.environmentMetrics.street.metrics.sneeze.fp,1,
 "False-sneeze clips can be audited by background source");
eq(x.environmentMetrics.room.metrics.sneeze.fp,0,
 "Other environments are not combined into a fictitious per-site rate");
eq(x.metricScope.includes("NOT continuous alarm episodes"),true,
 "Report must disclaim that clip counting is not real-time false alarms");
eq(x.negativeExposureByTarget.sneeze,20/3600,"Non-target human cough counts as sneeze-negative exposure");
eq(x.byEnvironment.street,2,"Environmental strata counted");
eq(x.byDevice.phone,1,"Phone evaluation count is explicit");
eq(x.byDevice["built-in"],1,"Built-in microphone count is explicit");
eq(x.byDevice.unspecified,4,"Missing device metadata remains a separate cohort");
eq(x.deviceMetrics.phone.metrics.sneeze.fp,1,
 "Phone-cohort false sneeze is not hidden by a different device");
eq(x.deviceMetrics["built-in"].metrics.sneeze.tp,1,
 "Built-in microphone positive counts only its own labelled clip");
eq(x.deviceMetrics.unspecified.metrics.sneeze.fp,0,
 "Unknown microphones are not invented as physical-device results");
eq(x.calibrated,false,"Synthetic tests NEVER authorize calibration");
const positive={sneeze:.995,cough:.01,unknown:.02};
const neutral={unknown:.99,noise:.96};
const cough={cough:.995,unknown:.01};
const isolated=report.classifyWindows([neutral,positive,neutral,neutral]);
eq(isolated.predicted,"unknown","One isolated spike in a long recording must abstain");
const repeated=report.classifyWindows([neutral,positive,positive,neutral]);
eq(repeated.predicted,"sneeze","Two adjacent positive windows qualify as clip-level evidence");
// The last YAMNet window can start only one sample after its predecessor.
// Two near-identical pieces of PCM are not corroborating temporal evidence.
const nearDuplicate=[{...positive,windowStartSeconds:0},
 {...positive,windowStartSeconds:1/16000}];
eq(report.classifyWindows(nearDuplicate).predicted,"unknown",
 "Almost identical padded tail windows cannot confirm a human sound");
const spacedWindows=[{...positive,windowStartSeconds:0},
 {...positive,windowStartSeconds:.4875}];
eq(report.classifyWindows(spacedWindows).predicted,"sneeze",
 "Actual YAMNet hop retains two independent positive windows");
assert.throws(()=>report.classifyWindows([
 {...positive,windowStartSeconds:0},positive
]),/Window start times/);assertions++;
eq(report.classifyWindows([neutral,positive,positive,cough,cough]).predicted,
 "unknown","Distinct human events in one file are not a single-label result");
eq(report.classifyWindows([positive]).predicted,"sneeze",
 "A short single-window sound can be evaluated without invented frames");
const reportWindows=report.evaluate([
 {...base,id:"temporal-positive",label:"sneeze",windowScores:[neutral,positive,positive]},
 {...base,id:"temporal-isolated",label:"noise",windowScores:[neutral,positive,neutral]},
 {...base,id:"temporal-conflict",label:"cough",windowScores:[positive,positive,cough,cough]}
]);
eq(reportWindows.confusion.sneeze.sneeze,1,"Real window decisions enter the confusion matrix");
eq(reportWindows.confusion.noise.unknown,1,"Single spike does not count as false-positive clip");
eq(report.classifyWindows([{noise:.98},{noise:.98},{voice:.8}]).predicted,
 "noise","Stable background remains background, not automatically unknown");
eq(report.classifyWindows([{music:.9}]).predicted,"music",
 "Single-window nonhuman class survives evaluation");
eq(reportWindows.temporalEvaluation.clips,3,"Window-based clip count is audited");
eq(reportWindows.temporalEvaluation.conflictingClips,1,
 "Mixed-human source clips are flagged for annotation review");
eq(reportWindows.calibrated,false,"Temporal gates cannot authorize reactions");
eq(x.schemaVersion,2,"Clip metrics get a versioned output schema");
eq(x.environmentMetrics.street.clipCount,2,"Environment sample count is explicit");
eq(x.metrics.sneeze.falsePositiveClipRateUpper95>.25,true,
 "Small samples yield a conservative Wilson upper bound");
eq(x.metrics.cry.falsePositiveClipRateUpper95, x.metrics.cry.falsePositiveClipRateUpper95,
 "Unobserved human class still reports uncertainty about false positive clips");
eq(report.wilsonUpper95(0,0),null,"No negative examples -> no error upper bound");
eq(report.wilsonUpper95(0,1)>.7,true,"One clean negative does not prove zero false alarms");
eq(x.automaticHumanReactionsApproved,false,"No automatic sneeze reaction");
for(const bad of [
 [],
 [{...base,id:"duplicate",label:"sneeze",scores:{}},{...base,id:"duplicate",label:"noise",scores:{}}],
 [{...base,id:"no-permission",label:"sneeze",rights:"unknown",scores:{}}],
 [{...base,id:"invalid-device",label:"sneeze",deviceClass:"private-serial",scores:{}}],
 [{...base,id:"no-observation",label:"sneeze"}]
]){assert.throws(()=>report.evaluate(bad));assertions++;}
console.log("Sound calibration report regression:",assertions,"assertions passed");
