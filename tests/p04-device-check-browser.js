"use strict";
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process"),path=require("node:path");
const {chromium}=require("playwright");
const port=Number(process.env.ROBOTITO_P04_DEVICE_PORT||8894);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],
 {cwd:path.resolve(__dirname,".."),stdio:"ignore"});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 let browser;
 try{
  await sleep(600);
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({permissions:[]});
  const pageErrors=[];page.on("pageerror",e=>pageErrors.push(String(e)));
  await page.goto("http://127.0.0.1:"+port+"/p04-device-check.html",
   {waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(await page.locator("#lang option").count(),6,
   "The diagnostic must offer six languages");
  for(const lang of ["es","en","pt","fr","it","de"]){
   await page.selectOption("#lang",lang);
   assert.equal(await page.locator("#lang").inputValue(),lang);
   assert.ok((await page.locator("#voiceList").textContent()).length>12,
    "Voice availability must be explained in "+lang);
  }
  await page.locator("#speechStop").click();
  assert.match(await page.locator("#speechStatus").textContent(),/detenida/i);
  await page.locator("#micStop").click();
  assert.match(await page.locator("#micStatus").textContent(),/apagado/i);
  // Simulate a denied permission, never opening the real device.
  await page.evaluate(()=>{
   Object.defineProperty(navigator,"mediaDevices",{
    configurable:true,value:{getUserMedia:async()=>{
     throw new DOMException("Permission denied","NotAllowedError");
    }}
   });
  });
  await page.locator("#micStart").click();
  await page.waitForFunction(()=>/No se pudo activar/.test(
   document.getElementById("micStatus").textContent),null,{timeout:3000});
  assert.equal(pageErrors.length,0,"No JavaScript errors: "+pageErrors.join(" | "));
  console.log("Robotito P04 diagnostic Chromium: 6 locales; voice and mic controls; permission denial passed");
 }finally{
  if(browser)await browser.close();
  server.kill("SIGTERM");
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
