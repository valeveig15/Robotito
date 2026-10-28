"use strict";
const assert=require("node:assert/strict");
const {evaluateContinuous}=require("../audio-timeline-metrics.js");
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
eq(report.sessions[0].alerts.length,1,"Requires two independent aligned windows");
eq(report.sessions[0].observedSeconds<6,true,"Suppression and missing coverage excluded");
eq(report.calibrated,false,"Offline metrics cannot calibrate the model");
eq(report.automaticHumanReactionsApproved,false,"No unsolicited reactions authorized");
const b={...a,id:"wrong",annotations:[],suppressions:[],
 frames:times.map(t=>frame(t,[1.25,1.75].includes(t)?"sneeze":"noise"))};
const wrong=evaluateContinuous([b]);
eq(wrong.overall.metrics.sneeze.fp,1,"Two matching false windows form one false alert");
eq(wrong.overall.metrics.sneeze.falseAlertsPerNegativeHour>0,true,
 "Measured reference false alerts use observed negative hours");
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
