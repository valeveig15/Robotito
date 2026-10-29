"use strict";
// Deterministic, synthetic browser start-up budget smoke.
// Metrics are CI machine timings, not representative mobile field results.
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process"),path=require("node:path");
const {chromium}=require("playwright");
const port=Number(process.env.ROBOTITO_PERF_PORT||8897);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{
 cwd:path.resolve(__dirname,".."),stdio:"ignore"
});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 let browser;
 const report={schemaVersion:1,environment:"GitHub Linux Chromium, external models stubbed",
  physicalHardware:false,series:[]};
 try{
  await pause(650);
  browser=await chromium.launch({headless:true});
  for(const [name,viewport] of Object.entries({
   phone:{width:360,height:740},desktop:{width:1280,height:900},
   landscape:{width:844,height:390}
  })){
   const page=await browser.newPage({viewport,permissions:[]});
   await page.route("https://cdn.jsdelivr.net/**",route=>route.fulfill({
    status:200,contentType:"application/javascript",body:""
   }));
   const start=Date.now();
   await page.goto("http://127.0.0.1:"+port+"/",{waitUntil:"domcontentloaded",timeout:30000});
   const navigationMs=Date.now()-start;
   await page.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.putRecord)
    &&Boolean(document.querySelector("#robotito")?.dataset.avatar),null,{timeout:15000});
   const interactiveMs=Date.now()-start;
   const failures=await page.locator("body").count();
   assert.equal(failures,1);
   assert.ok(interactiveMs<25000,"Startup exceeded 25s CI safety budget on "+name);
   report.series.push({viewport:name,navigationMs,interactiveMs});
   await page.close();
  }
  const sorted=report.series.map(x=>x.interactiveMs).sort((a,b)=>a-b);
  report.p50InteractiveMs=sorted[1];
  report.maxInteractiveMs=sorted.at(-1);
  console.log(JSON.stringify(report));
 }finally{
  if(browser)await browser.close();
  server.kill("SIGTERM");
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
