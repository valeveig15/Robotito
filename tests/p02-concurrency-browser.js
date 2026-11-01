"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
const {randomSource}=require("./generative-kit.js");
runBrowserTest("p02-concurrency",async test=>{
  const {page,context,baseURL,seed}=test;
  test.report.command="npm run test:p02:browser";
  await page.goto(baseURL);
  await page.waitForFunction(()=>window.ROBOTITO_STORE?.putRecordWithBlob&&window.ROBOTITO_CHAT);
  test.phase("atomic-storage-failure");
  const atomic=await page.evaluate(async()=>{
    const store=window.ROBOTITO_STORE;let checks=0;
    const check=(ok,message)=>{if(!ok)throw Error(message);checks++;};
    for(const existing of [false,true]){
      const id="p02-atomic-"+existing,blobId=id+"-blob";
      const record={id,blobId,type:"audios",owner:"p02-owner",data:{version:1}};
      if(existing)await store.putRecordWithBlob(record,new Blob(["original"]));
      let error;
      try{await store.putRecordWithBlob({...record,data:{invalid(){}}},new Blob(["replacement"]));}
      catch(e){error=e.name;}
      check(error==="DataCloneError","The unsupported value must fail");
      const saved=await store.getRecord(id),blob=await store.getBlob(blobId);
      check(existing?saved?.data?.version===1:saved===null,"Failed save changed record");
      check(existing?await blob?.text()==="original":blob===null,"Failed save committed an orphan or replaced prior bytes");
      await store.putRecordWithBlob({...record,data:{version:2}},new Blob(["recovered"]));
      check((await store.getRecord(id))?.data?.version===2,"Write queue did not recover");
      check(await (await store.getBlob(blobId)).text()==="recovered","Recovery lost the attachment");
      await store.deleteRecord(id);
      check(await store.getBlob(blobId)===null,"Delete left attachment behind");
    }
    const id="p02-queued",blobId=id+"-blob";
    const row={id,blobId,type:"audios",owner:"p02-owner"};
    const operations=await Promise.allSettled([
      store.putRecordWithBlob({...row,data:{revision:1}},new Blob(["first"])),
      store.putRecordWithBlob({...row,data:{invalid(){}}},new Blob(["invalid"])),
      store.deleteRecord(id),
      store.putRecordWithBlob({...row,data:{revision:4}},new Blob(["last"]))
    ]);
    check(operations.map(x=>x.status).join(",")==="fulfilled,rejected,fulfilled,fulfilled","Concurrent failure contaminated later operations");
    check((await store.getRecord(id))?.data?.revision===4,"Same-record queue order changed");
    check(await (await store.getBlob(blobId)).text()==="last","Blob and metadata belong to different revisions");
    await store.deleteRecord(id);return {checks};
  });
  test.report.atomic=atomic;
  test.phase("two-tabs-owner-isolation");
  const second=await context.newPage();await second.goto(baseURL);
  await second.waitForFunction(()=>window.ROBOTITO_STORE?.queryRecords);
  const owners=["p02-Alice","p02-Bob","visitor:p02-consented"];
  const random=randomSource(seed);
  const records=Array.from({length:240},(_,i)=>({id:"p02-tab-"+i,type:"notes",owner:owners[i%3],
    language:random.pick(["es","en","pt","fr","it","de"]),timestamp:1793361600000+i,
    source:"synthetic-p02",data:{index:i,value:random.int(1,10000)}}));
  await Promise.all([page,second].map((tab,index)=>tab.evaluate(async rows=>{
    await Promise.all(rows.map(row=>window.ROBOTITO_STORE.putRecord(row)));
  },records.filter((_,i)=>i%2===index))));
  for(const tab of [page,second])for(const owner of owners){
    const actual=await tab.evaluate(owner=>window.ROBOTITO_STORE.queryRecords({owner,type:"notes",limit:500}),owner);
    assert.deepEqual(actual.map(x=>({id:x.id,owner:x.owner,data:x.data,language:x.language})),
      records.filter(x=>x.owner===owner).reverse().map(x=>({id:x.id,owner:x.owner,data:x.data,language:x.language})),
      "Both tabs must see exactly the requested owner's committed records");
  }
  await second.evaluate(owner=>window.ROBOTITO_STORE.clearRecordsByType("notes",{owner}),owners[0]);
  for(const owner of owners){
    const count=await page.evaluate(async owner=>(await window.ROBOTITO_STORE.queryRecords({owner,type:"notes",limit:500})).length,owner);
    assert.equal(count,owner===owners[0]?0:80,"Deleting one owner affected another");
  }
  await second.close();
  test.report.tabs={tabs:2,owners:3,records:240,simultaneousWrites:true,ownerChecks:9};

  test.phase("accelerated-session-and-storage-load");
  const endurance=await page.evaluate(async()=>{
    const planner=window.ROBOTITO_SEMANTIC_PLANNER,store=window.ROBOTITO_STORE;
    const started=performance.now(),anchor=Date.UTC(2026,9,30,8);
    let context=planner.createContext(),maxContext=0,turnChecks=0;
    for(let i=0;i<3600;i++){
      const now=new Date(anchor+i*12000);
      const input=i%3===0?"¿Cómo va a estar el clima mañana?":i%3===1?"¿Y de noche?":"¿Qué es densidad?";
      const plan=planner.plan(input,{context,now,language:"es"});
      if(i%3===1&&(plan.source!=="weather"||plan.entities.daypart!=="night"))throw Error("Follow-up drift at turn "+i);
      if(i%3===2&&plan.mayReadClass)throw Error("General definition read a class at turn "+i);
      context=planner.advance(context,plan);maxContext=Math.max(maxContext,context.turns.length);
      if(context.turns.length>20)throw Error("Context grew without limit");turnChecks++;
      if(i%120===0)await new Promise(resolve=>setTimeout(resolve,0));
    }
    for(let offset=0;offset<2500;offset+=50){
      await Promise.all(Array.from({length:50},(_,j)=>{
        const i=offset+j;return store.putRecord({id:"p02-load-"+i,type:"memories",owner:"p02-load",
          timestamp:anchor+i*12000,subject:"P02",topic:"synthetic",data:{index:i}});
      }));
    }
    return {turns:3600,turnChecks,maxContext,records:2500,simulatedHours:12,
      elapsedMs:performance.now()-started,wallClockHoursTested:false};
  });
  test.report.endurance=endurance;
  test.phase("load-reload-and-cleanup");
  await page.reload({waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.ROBOTITO_STORE?.queryRecords);
  const cleanup=await page.evaluate(async owners=>{
    const s=window.ROBOTITO_STORE,rows=await s.queryRecords({owner:"p02-load",type:"memories",limit:5000});
    if(rows.length!==2500||rows[0].data.index!==2499||rows.at(-1).data.index!==0)throw Error("Bulk records did not survive reload in date order");
    await s.clearRecordsByType("memories",{owner:"p02-load"});
    for(const owner of owners)await s.clearRecordsByType("notes",{owner});
    if((await s.queryRecords({owner:"p02-load",type:"memories"})).length)throw Error("Cleanup incomplete");
    return {reloaded:rows.length,cleaned:true,highfive:!!document.querySelector('[data-action="highfive"]')};
  },owners);
  assert.equal(cleanup.highfive,true);test.report.cleanup=cleanup;
  console.log("P02 concurrency and accelerated endurance:",JSON.stringify({engine:test.engineName,atomic,tabs:test.report.tabs,endurance,cleanup}));
}).catch(error=>{console.error(error);process.exitCode=1;});
