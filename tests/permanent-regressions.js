"use strict";
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const planner=require("../semantic-planner.js");
const corpusPath=path.join(__dirname,"regressions","semantic-issues.json");
const corpus=JSON.parse(fs.readFileSync(corpusPath,"utf8"));
if(!Array.isArray(corpus)||!corpus.length)throw Error("Empty regression corpus");
let checks=0;
const seen=new Set();
for(const entry of corpus){
  assert.equal(typeof entry.id,"string");checks++;
  assert.match(entry.id,/^[A-Z]+-\d{3}$/);checks++;
  assert.ok(!seen.has(entry.id),"Duplicate issue: "+entry.id);checks++;
  seen.add(entry.id);
  assert.ok(entry.reason&&typeof entry.reason==="string","Missing causal explanation: "+entry.id);checks++;
  assert.ok(entry.input&&typeof entry.input==="string","Missing input: "+entry.id);checks++;
  assert.ok(entry.expected&&typeof entry.expected==="object","Missing oracle: "+entry.id);checks++;
  const actual=planner.plan(entry.input);
  for(const [key,expected] of Object.entries(entry.expected)){
    try{assert.deepEqual(actual[key],expected,entry.id+" / "+key+" / "+entry.input);}
    catch(error){
      error.message+="\nFixture: tests/regressions/semantic-issues.json ["+entry.id+"]";
      throw error;
    }
    checks++;
  }
}
console.log("Permanent issue regressions:",corpus.length,"cases,",checks,"assertions passed");
