"use strict";
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const engines=require("playwright");
const {hashSeed}=require("./generative-kit.js"),{writeEvidence}=require("./test-evidence.js");
const root=path.resolve(__dirname,"..");
const types={".html":"text/html",".js":"application/javascript",".css":"text/css",
  ".json":"application/json",".svg":"image/svg+xml",".png":"image/png",".wasm":"application/wasm"};
async function startServer(){
  const server=http.createServer((req,res)=>{
    let filename;
    try{
      const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
      filename=path.resolve(root,"."+(pathname==="/"?"/index.html":pathname));
      if(!filename.startsWith(root+path.sep))throw Error("Outside root");
    }catch{res.writeHead(400).end();return;}
    fs.readFile(filename,(error,data)=>{
      if(error){res.writeHead(404).end();return;}
      res.writeHead(200,{"Content-Type":types[path.extname(filename)]||"application/octet-stream",
        "Cache-Control":"no-store"}).end(data);
    });
  });
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  return {url:"http://127.0.0.1:"+server.address().port,close:()=>new Promise(resolve=>{
    server.close(resolve);server.closeAllConnections();
  })};
}
async function runBrowserTest(suite,run,{
  engineName=process.env.ROBOTITO_BROWSER_ENGINE||"chromium",seed=process.env.ROBOTITO_TEST_SEED||"17",
  directory=process.env.ROBOTITO_TEST_ARTIFACT_DIR||path.join(root,"test-results"),
  viewport={width:1280,height:900},timeoutMs=180000
}={}){
  if(!/^[a-z0-9-]+$/.test(suite))throw Error("Invalid browser suite name");
  if(!["chromium","firefox","webkit"].includes(engineName))throw Error("Unsupported browser engine: "+engineName);
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1)throw Error("Invalid browser suite timeout");
  const basename=suite+"-"+engineName+"-"+hashSeed(seed);
  const report={suite,engine:engineName,seed,status:"running",physicalHardware:false,
    externalResources:"stubbed",startedAt:new Date().toISOString(),activeCase:{phase:"setup"},
    pageErrors:[],matrices:{},artifacts:{}};
  let server,browser,context,page,error,forcedExit;
  const persist=()=>{
    for(const checkpoint of checkpoints){
      try{checkpoint();}catch(e){error=error||e;report.status="failed";report.checkpointError=String(e);}
    }
    report.elapsedMs=Date.now()-started;
    writeEvidence(basename+".json",report,{directory});
  };
  const forceShutdown=()=>{
    if(forcedExit)return;
    forcedExit=setTimeout(()=>{
      report.status="failed";report.cleanupError="Browser did not close within 10 seconds";
      persist();process.exit(1);
    },10000);
    forcedExit.unref();
  };
  let rejectDeadline;
  const deadlineFailure=new Promise((_,reject)=>{rejectDeadline=reject;});
  deadlineFailure.catch(()=>{});
  const deadline=setTimeout(()=>{
    report.timedOut=true;report.status="failed";report.error="Browser suite exceeded "+timeoutMs+" ms";
    persist();forceShutdown();
    rejectDeadline(new Error(report.error));
    browser?.close({reason:"Browser test timeout"}).catch(()=>{});
  },timeoutMs);
  deadline.unref();
  fs.mkdirSync(directory,{recursive:true});
  const checkpoints=[];
  const test={report,engineName,seed,checkpoint:fn=>checkpoints.push(fn),
    phase:(phase,index=null,input=null)=>{report.activeCase={phase,index,input};}};
  const started=Date.now();
  try{
    await Promise.race([(async()=>{
    server=await startServer();test.baseURL=server.url;
    browser=await engines[engineName].launch({headless:true});report.browserVersion=browser.version();
    context=await browser.newContext({viewport,permissions:[],acceptDownloads:true});
    context.setDefaultTimeout(15000);context.setDefaultNavigationTimeout(30000);
    await context.route("**/*",route=>{
      const url=new URL(route.request().url());
      if(url.origin===server.url||["data:","blob:"].includes(url.protocol))return route.continue();
      return route.fulfill({status:200,contentType:"application/javascript",body:""});
    });
    context.on("page",p=>p.on("pageerror",e=>report.pageErrors.push(String(e))));
    await context.tracing.start({screenshots:false,snapshots:true,sources:true});
    page=await context.newPage();Object.assign(test,{page,context,browser});
    await run(test);
    })(),deadlineFailure]);
    if(report.pageErrors.length)throw Error("Browser exceptions: "+report.pageErrors.join("\n"));
    report.status="passed";report.activeCase=null;
  }catch(e){
    error=report.timedOut?new Error("Browser suite exceeded "+timeoutMs+" ms",{cause:e}):e;
    report.status="failed";report.error=String(error.stack||error);
    if(page&&!page.isClosed()){
      try{await page.screenshot({path:path.join(directory,basename+".png"),timeout:5000});
        report.artifacts.screenshot=basename+".png";}catch(e){report.screenshotError=String(e.message);}
    }
  }finally{
    clearTimeout(deadline);
    persist();forceShutdown();
    if(context){
      try{
        const trace=report.status==="failed"?path.join(directory,basename+"-trace.zip"):undefined;
        await context.tracing.stop(trace?{path:trace}:{});
        if(trace)report.artifacts.trace=path.basename(trace);
      }catch(e){report.traceError=String(e.message);}
    }
    try{await browser?.close();}catch(e){error=error||e;report.status="failed";report.cleanupError=String(e);}
    await server?.close();
    clearTimeout(forcedExit);persist();
  }
  if(error)throw error;
  return report;
}
module.exports={startServer,runBrowserTest};
