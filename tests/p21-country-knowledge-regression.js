"use strict";
const assert=require("node:assert/strict");
const {parseQuestion,create}=require("../country-knowledge.js");
const france={name:{common:"France",official:"French Republic"},cca2:"FR",capital:["Paris"],
 region:"Europe",translations:{spa:{common:"Francia"},fra:{common:"France"}},altSpellings:["FR"]};
const congo1={name:{common:"Congo Republic"},cca2:"CG",capital:["Brazzaville"],altSpellings:["Congo"],translations:{}};
const congo2={name:{common:"DR Congo"},cca2:"CD",capital:["Kinshasa"],altSpellings:["Congo"],translations:{}};
const cases=[
["¿Cuál es la capital de Francia?","francia"],
["What is the capital of France?","france"],
["Qual é a capital de França?","franca"],
["Quelle est la capitale de France ?","france"],
["Qual è la capitale di Francia?","francia"],
["Was ist die Hauptstadt von Frankreich?","frankreich"]
];
for(const [q,v] of cases)assert.equal(parseQuestion(q)?.country,v,q);
assert.equal(parseQuestion("¿Quién es el presidente de Francia?"),null);
assert.equal(parseQuestion("Contame cómo estás hoy"),null);
let t=Date.parse("2026-11-15T10:00:00Z"),calls=0;
const client=create({now:()=>t,fetcher:async url=>{
 calls++;
 if(url.includes("congo"))return {ok:true,json:async()=>[congo1,congo2]};
 if(url.includes("desconocido"))return {ok:false,status:404};
 return {ok:true,json:async()=>[france]};
}});
(async()=>{
 let a=await client.answer("¿Cuál es la capital de Francia?","es");
 assert.equal(a.handled,true);
 assert.match(a.text,/Par[ií]s|Paris/);
 assert.match(a.text,/2026-11-15/);
 assert.equal(a.source,"REST Countries");
 assert.match(a.url,/\/alpha\/FR/);
 assert.equal(a.checkedAt,"2026-11-15");
 let before=calls;
 await client.answer("¿Cuál es la capital de Francia?","en");
 assert.equal(calls,before,"same exact country uses cached lookup");
 const amb=await client.answer("capital de Congo");
 assert.equal(amb.ambiguous,true);
 const unknown=await client.answer("capital de Desconocido");
 assert.equal(unknown.unknown,true);
 const down=create({fetcher:async()=>{throw Error("network outage");}});
 assert.match((await down.answer("capital de Francia")).text,/No pude consultar/);
 const missing=create({fetcher:async()=>({ok:true,json:async()=>[{...france,capital:[]}]})});
 assert.equal((await missing.answer("capital de Francia")).missing,true);
 const source=require("node:fs").readFileSync(require("node:path").join(__dirname,"../presidents.js"),"utf8");
 assert.match(source,/verified:false,checkedAt:today/);
 assert.match(source,/fuente oficial independiente/);
 const second={name:{common:"Republic of Testland",official:"Test Republic"},
  cca2:"TL",capital:["Central City"],translations:{spa:{common:"Tierra Prueba"}},altSpellings:[]};
 let callsExact=0;
 const fallback=create({fetcher:async url=>{
  callsExact++;
  if(url.includes("/translation/"))return {ok:true,json:async()=>[france]};
  return {ok:true,json:async()=>[second]};
 }});
 const f=await fallback.answer("capital de Tierra Prueba","es");
 assert.equal(f.cca2,"TL","A nonmatching first endpoint must not block valid second endpoint");
 assert.match(f.text,/Tierra Prueba/,"Localized country label should use REST language codes");
 assert.equal(callsExact,2);
 let partial=0;
 const outage=create({fetcher:async url=>{
  partial++;
  if(url.includes("/name/"))throw Error("temporary outage");
  return {ok:true,json:async()=>[france]};
 }});
 const online=await outage.answer("capital de Francia");
 assert.equal(online.handled,true);
 const used=partial;
 await outage.answer("capital de Francia");
 assert.ok(partial>used,"Partial source failures are not cached as conclusive results");
  console.log("P21 country capitals, source timing, ambiguity, stale authority protection: passed");
})().catch(e=>{console.error(e);process.exitCode=1;});
