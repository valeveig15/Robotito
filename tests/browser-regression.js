"use strict";
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");

const port=Number(process.env.ROBOTITO_TEST_PORT||8765);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:require("node:path").resolve(__dirname,".."),stdio:"ignore"});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

(async()=>{
  let browser;
  try{
    await pause(700);
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    await page.route("https://cdn.jsdelivr.net/**",route=>route.fulfill({status:200,contentType:"application/javascript",body:""}));
    const pageErrors=[];
    page.on("pageerror",error=>pageErrors.push(String(error)));
    await page.goto(`http://127.0.0.1:${port}/?tests=1`,{waitUntil:"domcontentloaded",timeout:60000});
    await page.waitForFunction(()=>document.documentElement.dataset.robotitoTests,{timeout:30000});
    const report=await page.evaluate(()=>window.ROBOTITO_LAST_TEST_REPORT);
    if(!report)throw new Error("The browser test report was not created");
    if(report.failed){
      console.error(JSON.stringify(report.results.filter(test=>!test.ok),null,2));
      throw new Error(`${report.failed} browser regression tests failed`);
    }
    if(pageErrors.length)throw new Error("Page errors: "+pageErrors.join(" | "));

    const viewports=[[390,844],[360,740],[844,390],[768,1024]];
    for(const [width,height] of viewports){
      await page.setViewportSize({width,height});
      const layout=await page.evaluate(()=>{
        document.querySelector("#languageGate")?.classList.add("hidden");
        const scene=document.querySelector(".world-scene")?.getBoundingClientRect();
        const controls=document.querySelector(".world-controls")?.getBoundingClientRect();
        const buttons=[...document.querySelectorAll(".world-controls .quick-actions button")].map(el=>el.getBoundingClientRect());
        return {
          viewport:document.documentElement.clientWidth,
          scrollWidth:document.documentElement.scrollWidth,
          separated:!!scene&&!!controls&&controls.top>=scene.bottom-1,
          controlsVisible:!!controls&&controls.width>0&&controls.height>0,
          buttonsVisible:buttons.length>=7&&buttons.every(box=>box.width>20&&box.height>=38)
        };
      });
      if(layout.scrollWidth>layout.viewport+1||!layout.separated||!layout.controlsVisible||!layout.buttonsVisible){
        throw new Error(`Mobile layout failed at ${width}x${height}: ${JSON.stringify(layout)}`);
      }
    }
    console.log(`Robotito browser regression: ${report.total}/${report.total} passed; 4 responsive viewports passed`);
  }finally{
    if(browser)await browser.close();
    server.kill("SIGTERM");
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
