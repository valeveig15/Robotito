"use strict";
const assert=require("node:assert/strict");
const P=require("../private-metrics-policy.js");
const now=new Date("2026-11-18T12:00:00").getTime(),today=P.dayKey(now);
assert.equal(P.TYPES.length,5);
const disabled=P.increment({consent:false,days:{}},"questions",now);
assert.equal(disabled.consent,false);
assert.deepEqual(disabled.days,{});
const enabled=P.increment({consent:true,days:{}},"questions",now);
assert.equal(enabled.days[today].questions,1);
assert.equal(enabled.days[today].classes,0);
const double=P.increment(enabled,"questions",now);
assert.equal(double.days[today].questions,2);
assert.equal(P.increment(double,"recommendations",now).days[today].recommendations,1);
assert.throws(()=>P.increment(double,"userText",now),/Unknown metric/);
const oldDay=P.dayKey(now-40*86400000),recent=P.dayKey(now-5*86400000);
const cleaned=P.clean({consent:true,days:{
 [oldDay]:{questions:100},
 [recent]:{questions:3},
 [today]:{questions:-50,classes:1.3,tasks:"NaN",recommendations:Infinity},
 "injected-key":{questions:1000}
}},now);
assert.equal(cleaned.days[oldDay],undefined);
assert.equal(cleaned.days[recent].questions,3);
assert.equal(cleaned.days[today].questions,0);
assert.equal(cleaned.days[today].classes,1);
assert.equal(cleaned.days[today].tasks,0);
assert.equal(cleaned.days["injected-key"],undefined);
assert.equal(P.clean(null,now).consent,false);
assert.deepEqual(Object.keys(P.totals({days:{}})),[...P.TYPES]);
console.log("P45: consent gating, content-free category totals, 30-day pruning and input validation passed");
