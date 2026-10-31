"use strict";
// CI readiness timings with external resources stubbed, not physical-device performance.
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("browser-performance",async test=>{
  const series=[];
  test.report.command="npm run test:browser:performance";
  test.report.series=series;test.report.budgetMs=25000;
  test.report.measurement="navigation to store API, avatar DOM and chat handler readiness; fresh page, shared browser context";
  for(const [name,viewport] of Object.entries({phone:{width:360,height:740},
    desktop:{width:1280,height:900},landscape:{width:844,height:390}})){
    for(let sample=0;sample<3;sample++){
      test.phase("startup",sample,{viewport:name});
      const page=await test.context.newPage();
      await page.setViewportSize(viewport);
      const start=performance.now();
      await page.goto(test.baseURL,{waitUntil:"domcontentloaded"});
      const navigationMs=performance.now()-start;
      await page.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.putRecord)
        &&Boolean(document.querySelector("#robotito")?.dataset.avatar)
        &&typeof window.ROBOTITO_CHAT?.send==="function");
      const readyMs=performance.now()-start;
      assert.ok(readyMs<test.report.budgetMs,"CI readiness budget exceeded on "+name);
      series.push({viewport:name,sample,navigationMs,readyMs});
      await page.close();
    }
  }
  const sorted=series.map(x=>x.readyMs).sort((a,b)=>a-b);
  test.report.summary={samples:sorted.length,p50ReadyMs:sorted[Math.ceil(sorted.length*.5)-1],
    p95ReadyMs:sorted[Math.ceil(sorted.length*.95)-1],maxReadyMs:sorted.at(-1)};
  console.log("Robotito CI readiness:",JSON.stringify(test.report.summary));
}).catch(error=>{console.error(error);process.exitCode=1;});
