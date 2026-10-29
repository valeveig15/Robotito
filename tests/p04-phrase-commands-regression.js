"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const start=source.indexOf("async function handleSayInLanguageCommand(");
const end=source.indexOf("function answerEnglishPersonalQuestion(",start);
assert.ok(start>=0&&end>start,"Find real command handler");
const spoken=[],errors=[];
const normal=x=>String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const lookup=x=>({espanol:"es",ingles:"en",portugues:"pt",
 frances:"fr",italiano:"it",aleman:"de"})[x]||null;
const handle=new Function("normalizeText","responseLanguage","targetLanguageFromName",
 "sample","sayInLanguage","translateShortPhrase","say",
 source.slice(start,end)+"return handleSayInLanguageCommand;")(
 normal,()=> "es",lookup,arr=>arr?.[0],
 (text,lang,ms)=>spoken.push({text,lang,ms}),
 async()=>null,text=>errors.push(text));
(async()=>{
 let count=0;
 for(const [name,lang] of [["espanol","es"],["ingles","en"],["portugues","pt"],
  ["frances","fr"],["italiano","it"],["aleman","de"]]){
  assert.equal(await handle("decime algo en "+name),true);
  count++;
  const response=spoken.at(-1);
  assert.equal(response?.lang,lang,"Correct target locale: "+name);
  assert.ok(response.text&&response.text.length>15,"Missing phrase: "+name);
  count+=2;
 }
 assert.equal(errors.length,0,"No translation fallback errors");count++;
 assert.equal(await handle("¿cuál es mi nombre?"),false,"Unrelated command ignored");count++;
 console.log("Robotito P04 six-language phrase commands:",count,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
