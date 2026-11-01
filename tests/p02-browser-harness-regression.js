"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {runBrowserTest}=require("./browser-test-harness.js");
(async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),"p02-browser-evidence-"));
  try{
    await assert.rejects(()=>runBrowserTest("fixture",()=>{},{engineName:"typo",directory}),/Unsupported browser/);
    let url;
    await assert.rejects(()=>runBrowserTest("fixture",async test=>{
      url=test.baseURL;
      await test.page.goto(test.baseURL);
      test.phase("intentional-failure",7,{synthetic:true});
      throw Error("P02 intentional harness self-check");
    },{directory}),/intentional harness self-check/);
    const files=fs.readdirSync(directory),json=files.find(x=>x.endsWith(".json"));
    const report=JSON.parse(fs.readFileSync(path.join(directory,json),"utf8"));
    assert.equal(report.status,"failed");assert.equal(report.activeCase.index,7);
    assert.ok(report.error.includes("intentional harness self-check"));
    assert.ok(fs.statSync(path.join(directory,report.artifacts.screenshot)).size>100);
    assert.ok(fs.statSync(path.join(directory,report.artifacts.trace)).size>100);
    await assert.rejects(()=>fetch(url),/fetch failed/);
    await assert.rejects(()=>runBrowserTest("timeout",async()=>new Promise(()=>{}),
      {directory,timeoutMs:1500}),/exceeded 1500 ms/);
    const timeoutFile=fs.readdirSync(directory).find(x=>x.startsWith("timeout-")&&x.endsWith(".json"));
    const timeout=JSON.parse(fs.readFileSync(path.join(directory,timeoutFile),"utf8"));
    assert.equal(timeout.status,"failed");assert.equal(timeout.timedOut,true);
    console.log("P02 browser evidence: rejected engine, failure JSON, case, screenshot, trace, deadline and closed server passed");
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
