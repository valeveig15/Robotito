"use strict";
const assert=require("node:assert/strict"),{runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p11-rules-audit",async test=>{
 const {page,baseURL,context}=test;let checks=0;
 const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
 async function ready(p){await p.goto(baseURL,{waitUntil:"domcontentloaded"});await p.waitForFunction(()=>ROBOTITO_MEMORY.active);
  await p.evaluate(async()=>{state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();await ROBOTITO_TEMPORAL_RULES.refresh();window.auditSaid=[];window.say=text=>auditSaid.push(text);});}
 await ready(page);test.phase("class-mode-and-due-batches");
 await page.evaluate(async()=>{
  const service=ROBOTITO_TEMPORAL_RULES.attach();state.classMode=true;
  await service.run(e=>{for(let i=0;i<5;i++)e.create({kind:"once",ms:1000,text:"Aviso "+i,priority:i},"Ada");});await ROBOTITO_TEMPORAL_RULES.refresh();
 });
 await page.waitForTimeout(1600);
 eq(await page.evaluate(async()=>(await ROBOTITO_MEMORY_STATE.collection("Ada","robotito.temporal-rules.v1")).items.length),5,"Recording a class cannot silently consume scheduled messages");
 await page.evaluate(()=>{state.classMode=false;});
 await page.waitForFunction(()=>auditSaid.join(" ").includes("Aviso 0"));
 eq(await page.evaluate(()=>auditSaid.flatMap(text=>text.split(" · ")).sort()),["Aviso 0","Aviso 1","Aviso 2","Aviso 3","Aviso 4"],"All five due reminders reach the visible response without interrupting each other");
 test.phase("natural-management-and-transient-rules");
 const managed=await page.evaluate(async()=>{
  await handleSpeech("Si digo hola, decí Léa <libro>",{channel:"typed"});
  const service=ROBOTITO_TEMPORAL_RULES.attach(),owner=ROBOTITO_MEMORY.owner();
  await handleSpeech("Desactivá la regla 1",{channel:"typed"});const disabled=service.temporaryList(owner)[0]?.enabled;
  await handleSpeech("Cambiá la regla 1 para decir Até amanhã",{channel:"typed"});
  await handleSpeech("Activá la regla 1",{channel:"typed"});await handleSpeech("hola",{channel:"typed"});
  return {disabled,last:auditSaid.at(-1),saved:(await ROBOTITO_MEMORY_STATE.collection(owner,"robotito.temporal-rules.v1")).items.length};
 });
 eq(managed,{disabled:false,last:"Até amanhã",saved:0},"Natural edits remain session-only when the original instruction is transient");
 test.phase("consented-event-adapter");
 const denied=await page.evaluate(async()=>{
  await handleSpeech("Si oís palmas y ves una persona, decí Bienvenido",{channel:"typed"});
  return ROBOTITO_TEMPORAL_RULES.receive({kind:"audio:clap",verified:true,permission:true,at:Date.now(),epoch:state.captureEpoch});
 });eq(denied,0,"A rule never activates a stopped microphone or camera");
 await page.evaluate(async()=>{
  state.started=true;state.captureEpoch=1;state.stream={getTracks:()=>[{kind:"audio",readyState:"live"},{kind:"video",readyState:"live"}]};
  await ROBOTITO_TEMPORAL_RULES.receive({kind:"vision:person",verified:true,permission:true,at:Date.now(),epoch:state.captureEpoch});
 });
 await page.waitForTimeout(700);
 const event=await page.evaluate(async()=>{
  await ROBOTITO_TEMPORAL_RULES.receive({kind:"vision:person",verified:true,permission:true,at:Date.now(),epoch:state.captureEpoch});
  await ROBOTITO_TEMPORAL_RULES.receive({kind:"audio:clap",verified:true,permission:true,at:Date.now(),epoch:state.captureEpoch});
  const count=auditSaid.filter(text=>text==="Bienvenido").length;
  state.started=false;state.stream=null;return count;
 });eq(event,1,"Fresh independently observed vision plus approved applause triggers one response");
 test.phase("cross-tab-single-delivery");
 await page.evaluate(async()=>{
  await ROBOTITO_TEMPORAL_RULES.attach().run(e=>e.create({kind:"phrase",trigger:"clave compartida",text:"una sola respuesta"},"Ada"));
  await ROBOTITO_TEMPORAL_RULES.refresh();state.lastVoiceConfirmedAt=Date.now();
 });
 const other=await context.newPage();await ready(other);
 await Promise.all([page,other].map(p=>p.evaluate(()=>handleSpeech("clave compartida",{channel:"typed"}))));
 const results=await Promise.all([page,other].map(p=>p.evaluate(()=>auditSaid.filter(text=>text==="una sola respuesta").length)));
 eq(results.reduce((a,b)=>a+b,0),1,"Atomic revision plus cooldown prevents two tabs from saying the same saved rule");
 await other.close();
 test.phase("delayed-rule-list-owner-change");
 await ready(page);
 const leaked=await page.evaluate(async()=>{
  const service=ROBOTITO_TEMPORAL_RULES.attach();
  await service.run(e=>e.create({kind:"phrase",trigger:"dato privado",text:"mensaje privado de Ada"},"Ada"));
  await ROBOTITO_TEMPORAL_RULES.refresh();
  const run=service.run;let release,captured;
  const waiting=new Promise(resolve=>{captured=resolve;}),gate=new Promise(resolve=>{release=resolve;});
  service.run=async action=>{
   service.run=run;
   const result=await run(action);state.classMode=true;captured();await gate;return result;
  };
  const pending=handleSpeech("Mostrame mis reglas",{channel:"typed"});await waiting;
  state.currentVoicePerson="Bea";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();
  state.classMode=false;auditSaid=[];release();await pending;
  return auditSaid.some(text=>text.includes("mensaje privado de Ada"));
 });
 eq(leaked,false,"A delayed list must not speak the previous owner's private rule responses");
 test.report.checks=checks;console.log("P11 browser audit:",checks,"checks; synthetic capture signals only");
}).catch(e=>{console.error(e);process.exitCode=1;});
