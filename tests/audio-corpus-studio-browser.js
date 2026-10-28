"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawn,execFileSync}=require("node:child_process");
const {chromium}=require("playwright");
const {loadManifest}=require("../audio-evaluation-manifest.js");
const root=path.resolve(__dirname,"..");
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"robotito-corpus-studio-"));
const port=Number(process.env.ROBOTITO_STUDIO_PORT||8837);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{
 cwd:root,stdio:"ignore"
});
function wav(seconds=2.5,rate=16000){
 const samples=Math.round(seconds*rate),b=Buffer.alloc(44+samples*2);
 b.write("RIFF",0);b.writeUInt32LE(b.length-8,4);
 b.write("WAVE",8);b.write("fmt ",12);b.writeUInt32LE(16,16);
 b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);
 b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);
 b.write("data",36);b.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++)b.writeInt16LE(Math.round(3500*Math.sin(i*440*2*Math.PI/rate)),44+i*2);
 return b;
}
async function saveDownload(page,selector){
 const [download]=await Promise.all([page.waitForEvent("download"),page.click(selector)]);
 const name=download.suggestedFilename();
 const destination=path.join(temp,name);
 await download.saveAs(destination);
 return {name,destination};
}
(async()=>{
 let browser;
 try{
  await new Promise(r=>setTimeout(r,450));
  browser=await chromium.launch({headless:true,args:[
   "--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"
  ]});
  const context=await browser.newContext({acceptDownloads:true,permissions:["microphone"]});
  const page=await context.newPage();
  const external=[];
  page.on("request",request=>{
   if(!request.url().startsWith("http://127.0.0.1:"+port+"/"))
    external.push(request.url());
  });
  await page.goto("http://127.0.0.1:"+port+"/tools/audio-corpus-studio.html",
   {waitUntil:"load"});
  assert.equal(await page.locator("#downloadAudio").isDisabled(),true,
   "No data export before explicit audio selection and consent");
  let micCalls=await page.evaluate(()=>{
   const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
   window.__micCalls=0;
   navigator.mediaDevices.getUserMedia=(...args)=>{window.__micCalls++;return original(...args);};
   return window.__micCalls;
  });
  assert.equal(micCalls,0,"Page must never request microphone automatically");
  await page.locator("#audioFile").setInputFiles({
   name:"private-file.wav",mimeType:"audio/wav",buffer:wav()
  });
  await page.waitForFunction(()=>document.querySelector("#duration").textContent.includes("2.500"));
  assert.equal(await page.evaluate(()=>window.__micCalls),0,
   "Importing a file must not request microphone permission");
  assert.equal(await page.locator("#downloadManifest").isDisabled(),true,
   "No downloads unless consent box checked");
  await page.locator("#consent").check();
  await page.locator("#sessionId").fill("synthetic-lab-1");
  await page.locator("#sourceGroup").fill("synthetic-source-1");
  await page.locator("#evaluationSplit").selectOption("test");
  await page.locator("#environment").fill("quiet-room");
  await page.locator("#deviceClass").selectOption("built-in");
  await page.locator("#eventStart").fill("2.4");
  await page.locator("#eventEnd").fill("3.0");
  await page.click("#addEvent");
  assert.match(await page.locator("#status").textContent(),/intervalo debe estar dentro/i,
   "Out-of-duration sound annotations must be rejected in the UI");
  assert.equal(await page.locator("#eventsList li").count(),0);
  await page.locator("#eventStart").fill("0.3");
  await page.locator("#eventEnd").fill("0.55");
  await page.click("#addEvent");
  await page.locator("#suppressStart").fill("1.1");
  await page.locator("#suppressEnd").fill("1.3");
  await page.click("#addSuppression");
  assert.equal(await page.locator("#eventsList li").count(),1);
  assert.equal(await page.locator("#suppressionsList li").count(),1);
  await page.locator("#sourceGroup").fill("personal name");
  await page.click("#downloadManifest");
  assert.match(await page.locator("#status").textContent(),/grupo de grabación/i,
   "Personal or invalid group IDs cannot appear in manifests");
  await page.locator("#sourceGroup").fill("synthetic-source-1");
  const audio=await saveDownload(page,"#downloadAudio");
  const json=await saveDownload(page,"#downloadManifest");
  assert.equal(audio.name,"synthetic-lab-1.wav");
  assert.equal(json.name,"manifest-synthetic-lab-1.json");
  assert.deepEqual(fs.readFileSync(audio.destination),wav(),
   "Original selected bytes must download unmodified and named to match manifest");
  const manifest=JSON.parse(fs.readFileSync(json.destination,"utf8"));
  assert.deepEqual(manifest.sessions[0].annotations,
   [{kind:"sneeze",startSeconds:.3,endSeconds:.55}]);
  assert.deepEqual(manifest.sessions[0].suppressions,
   [{startSeconds:1.1,endSeconds:1.3}]);
  assert.equal(manifest.sessions[0].path,audio.name,
   "Manifest path must resolve to downloaded audio in same folder");
  assert.equal(loadManifest(json.destination).sessions.length,1,
   "Exported JSON must pass the exact project's preflight parser");
  const output=execFileSync(process.execPath,["scripts/validate-audio-dataset.js",
   json.destination],{cwd:root,encoding:"utf8",timeout:30000});
  assert.match(output,/decodedFilesVerified": 1/,
   "Downloaded WAV and exported manifest pass actual Chromium duration preflight");
  assert.deepEqual(external,[],"The studio must make no requests to external origins");
  await page.click("#discardAudio");
  assert.equal(await page.locator("#downloadAudio").isDisabled(),true,
   "Discard must release the previously prepared sample");
  // Real Chromium MediaRecorder with its test-generated microphone device,
  // not a physical microphone or real sound-recognition trial.
  await page.click("#startRecording");
  await page.waitForFunction(()=>!document.querySelector("#stopRecording").disabled);
  assert.equal(await page.evaluate(()=>window.__micCalls),1,
   "Microphone permission requested only after the user clicks Record");
  await page.waitForTimeout(750);
  await page.click("#stopRecording");
  await page.waitForFunction(()=>!document.querySelector("#downloadAudio").disabled,
   null,{timeout:15000});
  assert.match(await page.locator("#duration").textContent(),/WEBM|OGG/,
   "Capture must produce a decodable recording and display its format");
  assert.equal(await page.locator("#stopRecording").isDisabled(),true);
  const micAudio=await saveDownload(page,"#downloadAudio");
  assert.ok(fs.statSync(micAudio.destination).size>128,
   "Opt-in recording must produce nonempty downloadable audio");
  const micManifest=await saveDownload(page,"#downloadManifest");
  assert.equal(loadManifest(micManifest.destination).sessions.length,1,
   "Recorded audio export must share the same manifest schema");
  assert.deepEqual(external,[],"Microphone recording must never be uploaded");
  console.log("Robotito private corpus studio Chromium integration passed:",
   JSON.stringify({realBrowserWav:true,manifestPreflight:true,
    corruptAnnotationRejected:true,optInFakeMicrophone:true,noExternalRequests:true}));
 }finally{
  await browser?.close();server.kill("SIGTERM");
  fs.rmSync(temp,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
