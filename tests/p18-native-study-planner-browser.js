"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p18-native-tasks",async test=>{
 const {page,baseURL}=test;test.phase("p18-native-ui");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_STUDY_PLANNER_UI?.engine)&&
  document.querySelector("#nativeTaskForm"),null,{timeout:20000});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="tasks"]').click();
 await page.locator("#nativeTaskName").fill("Preparar prueba de química");
 await page.locator("#nativeTaskSubject").fill("Química");
 await page.locator("#nativeTaskPriority").selectOption("4");
 await page.locator("#nativeTaskMinutes").fill("45");
 await page.locator("#nativeTaskDue").fill("2000-01-01");
 await page.locator("#nativeTaskForm button[type=submit]").click();
 const list=page.locator("#nativeTaskList");
 await list.getByText("Preparar prueba de química").waitFor();
 assert.match(await list.innerText(),/ATRASADA/,"Past due remains visible");
 let snapshot=await page.evaluate(()=>window.ROBOTITO_STUDY_PLANNER_UI.engine.snapshot());
 assert.equal(snapshot.tasks.length,1);assert.equal(snapshot.tasks[0].subject,"Química");
 test.phase("p18-complete");
 await list.getByRole("button",{name:/Completar/}).click();
 assert.match(await list.innerText(),/Completada/);
 assert.match(await list.innerText(),/Felicitaciones/);
 await page.reload({waitUntil:"domcontentloaded"});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="tasks"]').click();
 snapshot=await page.evaluate(()=>window.ROBOTITO_STUDY_PLANNER_UI.engine.snapshot());
 assert.equal(snapshot.tasks[0].done,true,"Completion survives reload");
 test.phase("p18-explicit-import");
 await page.evaluate(()=>{state.tasks=[
   {task:"Ejercicios de física",subject:"Física",due:"20/11/2030",status:""},
   {task:"Tarea ya entregada",subject:"Inglés",due:"",status:"hecho"}
 ];});
 await page.locator("#nativeSheetImport").click();
 snapshot=await page.evaluate(()=>window.ROBOTITO_STUDY_PLANNER_UI.engine.snapshot());
 assert.equal(snapshot.tasks.length,2,"Only pending Sheet rows copied after explicit action");
 await page.locator("#nativeSheetImport").click();
 snapshot=await page.evaluate(()=>window.ROBOTITO_STUDY_PLANNER_UI.engine.snapshot());
 assert.equal(snapshot.tasks.length,2,"Repeated import must not duplicate tasks");
 assert.equal(await page.evaluate(()=>state.tasks.length),2,"Legacy Sheet source remains intact");
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={nativeUI:true,overdue:true,completion:true,persistence:true,sheetImport:true};
 console.log("P18 "+test.engineName+" native daily tasks regression passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
