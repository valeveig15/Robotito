"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p21-country-capitals",async test=>{
 const {page,baseURL}=test;
 test.phase("p21-loaded");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>!!window.ROBOTITO_COUNTRY_KNOWLEDGE?.answer&&
   !!window.ROBOTITO_ROUTER?.classify,null,{timeout:20000});
 const check=await page.evaluate(async()=>{
  const item={name:{common:"France"},cca2:"FR",capital:["Paris"],
   translations:{spa:{common:"Francia"}},altSpellings:["FR"]};
  const client=window.ROBOTITO_COUNTRY_KNOWLEDGE.create({
   now:()=>Date.parse("2026-11-15T12:00:00Z"),
   fetcher:async()=>({ok:true,json:async()=>[item]})
  });
  return {
   intent:window.ROBOTITO_ROUTER.classify("¿Cuál es la capital de Francia?").intent,
   answer:await client.answer("¿Cuál es la capital de Francia?","es"),
   presidentIntent:window.ROBOTITO_ROUTER.classify("¿Quién es el presidente de Francia?").intent,
   fingers:window.ROBOTITO_ROUTER.classify("¿Qué objeto es esto?").intent
  };
 });
 assert.equal(check.intent,"country-capital");
 assert.equal(check.presidentIntent,"president");
 assert.equal(check.fingers,"object");
 assert.equal(check.answer.capital[0],"Paris");
 assert.equal(check.answer.checkedAt,"2026-11-15");
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={country:true,source:true,router:true,hardware:false};
 console.log("P21 "+test.engineName+" source-bound country routing passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
