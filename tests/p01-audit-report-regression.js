"use strict";
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const script=path.join(__dirname,'semantic-adversarial-batches.js');
let checks=0;
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
function run(extra={}){
 const env={...process.env,ROBOTITO_AUDIT_LANGUAGES:'es',ROBOTITO_AUDIT_CASES:'120',ROBOTITO_AUDIT_SEED:'17',ROBOTITO_AUDIT_BATCH:'0',ROBOTITO_AUDIT_EXHAUSTIVE:'0',...extra};
 delete env.ROBOTITO_AUDIT_REPORT;
 const result=spawnSync(process.execPath,[script],{env,encoding:'utf8',timeout:20000});
 if(result.error)throw result.error;
 return {result,report:result.status===0?JSON.parse(result.stdout):null};
}
const a=run(),b=run();eq(a.result.status,0);eq(a.report,b.report,'The same seed and batch reproduce exactly');
eq(Object.keys(a.report.perLanguageErrorRates),['es'],'Only requested language is evaluated');
eq(a.report.totals.errors,0);eq(a.report.totals.cases,120);
const all=run({ROBOTITO_AUDIT_EXHAUSTIVE:'1'}).report,s=all.perLanguageErrorRates.es;
eq(s.cases,s.generatorCases);eq(s.generatorCoverage,1);eq(Object.keys(s.byFamily).length,22);
eq(Object.values(s.byFamily).reduce((n,f)=>n+f.cases,0),s.cases,'Family denominators sum to executed cases');
assert.ok(s.uniqueSemanticCases<s.uniqueInputs&&s.uniqueInputs<s.cases);checks++;
const repeated=run({ROBOTITO_AUDIT_CASES:String(s.generatorCases*2)}).report.perLanguageErrorRates.es;
assert.ok(repeated.duplicateSamples>=s.generatorCases);checks++;
eq(repeated.uniqueSemanticCases,s.uniqueSemanticCases,'Repeating the generator does not invent semantic coverage');
for(const invalid of [{ROBOTITO_AUDIT_LANGUAGES:'es,es'},{ROBOTITO_AUDIT_LANGUAGES:'xx'},{ROBOTITO_AUDIT_CASES:'0'},{ROBOTITO_AUDIT_BATCH:'-1'}]){
 assert.notEqual(run(invalid).result.status,0);checks++;
}
console.log('P01 semantic audit metrics:',checks,'checks');
