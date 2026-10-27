"use strict";
const assert=require("node:assert/strict");
const report=require("../audio-calibration.js");
let assertions=0;
function eq(a,b,name){assert.deepEqual(a,b,name);assertions++;}
const base={environment:"room",rights:"open-license",durationSeconds:5};
const clips=[
 {...base,id:"true-sneeze",label:"sneeze",scores:{sneeze:.995,cough:.02,voice:.05}},
 {...base,id:"true-cough",label:"cough",scores:{cough:.995,sneeze:.01}},
 {...base,id:"ambiguous",label:"sneeze",scores:{sneeze:.995,cough:.97}},
 {...base,id:"speech",label:"voice",scores:{voice:.999,sneeze:.97}},
 {...base,id:"knock",label:"impact",environment:"street",scores:{impact:.97,clap:.90}},
 {...base,id:"false-sneeze",label:"noise",environment:"street",scores:{sneeze:.99,noise:.10}}
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
eq(x.metrics.sneeze.falsePositivesPerNegativeHour,1/(15/3600),"False-positive rate per negative-hour");
eq(x.byEnvironment.street,2,"Environmental strata counted");
eq(x.calibrated,false,"Synthetic tests NEVER authorize calibration");
eq(x.automaticHumanReactionsApproved,false,"No automatic sneeze reaction");
for(const bad of [
 [],
 [{...base,id:"duplicate",label:"sneeze",scores:{}},{...base,id:"duplicate",label:"noise",scores:{}}],
 [{...base,id:"no-permission",label:"sneeze",rights:"unknown",scores:{}}],
 [{...base,id:"no-observation",label:"sneeze"}]
]){assert.throws(()=>report.evaluate(bad));assertions++;}
console.log("Sound calibration report regression:",assertions,"assertions passed");
