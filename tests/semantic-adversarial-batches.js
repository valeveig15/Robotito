"use strict";
// Bounded reproducible audit. Templates and reviewed expectations live separately
// from the classifier. Repetitions, formats and semantic cases are counted apart.
const fs=require('node:fs'),crypto=require('node:crypto');
const planner=require('../semantic-planner');
const {rows,expected,topics,contextFor}=require('./fixtures/p01-semantic-cases');
const languages=Object.keys(rows);
function integer(name,fallback,max){
 const n=Number(process.env[name]??fallback);
 if(!Number.isSafeInteger(n)||n<0||n>max)throw Error(name+' must be an integer in 0..'+max);
 return n;
}
const seed=integer('ROBOTITO_AUDIT_SEED',17,2147483647);
const batch=integer('ROBOTITO_AUDIT_BATCH',0,99999);
const count=integer('ROBOTITO_AUDIT_CASES',120,100000);
const exhaustive=process.env.ROBOTITO_AUDIT_EXHAUSTIVE==='1';
const langs=(process.env.ROBOTITO_AUDIT_LANGUAGES||languages.join(',')).split(',');
if(!count||!langs.length||langs.some(l=>!languages.includes(l))||new Set(langs).size!==langs.length)throw Error('Select positive case count and unique supported languages');
let state=(seed+Math.imul(batch+1,0x9e3779b1))>>>0;
function rand(){state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;}
function shuffle(array){const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function corpus(language){
 const samples=[];
 for(const [family,templates] of Object.entries(rows[language]))for(const [form,template] of templates.entries()){
  const values=template.includes('{topic}')?topics[language]:[topics[language][0]];
  for(const topic of values){
   const text=template.replaceAll('{topic}',topic);
   samples.push({family,form,text,expected:expected[family],context:contextFor(language,family,topic),contextKind:family==='repair'?'exercise':'none'});
   if(['brief','detail','example','night'].includes(family)){
    const weather=family==='night';
    samples.push({family,form,text,contextKind:weather?'weather':'definition',
     context:{version:2,turns:[],focus:{intent:weather?'weather':'definition',source:weather?'weather':'general',language,entities:{topic}}},
     expected:{intent:weather?'weather':'follow-up',source:weather?'weather':'conversation',shouldExecute:true,needsClarification:false,mayReadClass:false,
      ...(weather?{'entities.daypart':'night'}:{'followUp.kind':family==='detail'?'detailed':family==='brief'?'brief':'example'})}});
   }
  }
 }
 return samples;
}
const transforms=[x=>x,x=>x.toUpperCase(),x=>x.toLowerCase(),x=>'  '+x+'  ',x=>x.replaceAll(' ','  '),x=>x.normalize('NFD'),x=>'Robotito, '+x,x=>x.replace(/[¿?]/g,'')];
const fingerprint=p=>crypto.createHash('sha256').update(fs.readFileSync(require.resolve(p))).digest('hex');
const report={schemaVersion:2,implementationSha256:fingerprint('../semantic-planner'),oracleSha256:fingerprint('./fixtures/p01-semantic-cases'),source:'reviewed synthetic templates; not an independent real-user corpus',seed,batch,exhaustive,
 notes:['Format and channel variants are not new semantic paraphrases.','Exhaustive means the finite checked-in generator only, never all human formulations.'],perLanguageErrorRates:{},examples:[]};
let totalErrors=0;
for(const language of langs){
 const base=corpus(language),pool=[];
 for(let i=0;i<base.length;i++)for(let transform=0;transform<transforms.length;transform++)for(const channel of ['typed','voice'])pool.push({i,transform,channel});
 const shuffled=shuffle(pool),limit=exhaustive?pool.length:count;
 const result={cases:limit,checks:0,errors:0,errorRate:0,uniqueInputs:0,uniqueSemanticCases:0,duplicateSamples:0,generatorCases:pool.length,generatorCoverage:0,byFamily:{},confusions:{}};
 const seen=new Set(),semantic=new Set(),inputs=new Set();
 for(let i=0;i<limit;i++){
  const entry=shuffled[i%shuffled.length],sample=base[entry.i];
  const input=transforms[entry.transform](sample.text);
  const key=JSON.stringify([input,sample.context||null,entry.channel]);
  if(seen.has(key))result.duplicateSamples++;seen.add(key);
  inputs.add(JSON.stringify([input,sample.context||null]));semantic.add(JSON.stringify([sample.family,sample.text,sample.contextKind]));
  const f=result.byFamily[sample.family]||(result.byFamily[sample.family]={cases:0,errors:0,errorRate:0});f.cases++;
  const bad=[];let actual;
  try{
   actual=planner.plan(input,{language,channel:entry.channel,context:sample.context,now:new Date('2026-10-29T12:00:00Z')});
   for(const [field,want] of Object.entries(sample.expected)){
    result.checks++;const got=field.split('.').reduce((value,k)=>value?.[k],actual);
    if(got!==want)bad.push({field,want,actual:got});
   }
  }catch(e){bad.push({error:String(e)});}
  if(bad.length){
   result.errors++;f.errors++;totalErrors++;
   const confusion=(sample.expected.intent||sample.family)+' → '+(actual?.intent||'exception');
   result.confusions[confusion]=(result.confusions[confusion]||0)+1;
   if(report.examples.length<30)report.examples.push({language,family:sample.family,input,contextKind:sample.contextKind,bad});
  }
 }
 for(const value of Object.values(result.byFamily))value.errorRate=value.errors/value.cases;
 result.uniqueInputs=inputs.size;result.uniqueSemanticCases=semantic.size;
 result.generatorCoverage=Math.min(limit,pool.length)/pool.length;result.errorRate=result.errors/result.cases;
 report.perLanguageErrorRates[language]=result;
}
report.totals=Object.values(report.perLanguageErrorRates).reduce((a,r)=>({cases:a.cases+r.cases,checks:a.checks+r.checks,errors:a.errors+r.errors,uniqueSemanticCases:a.uniqueSemanticCases+r.uniqueSemanticCases,duplicateSamples:a.duplicateSamples+r.duplicateSamples}),{cases:0,checks:0,errors:0,uniqueSemanticCases:0,duplicateSamples:0});
console.log(JSON.stringify(report));
if(process.env.ROBOTITO_AUDIT_REPORT)fs.writeFileSync(process.env.ROBOTITO_AUDIT_REPORT,JSON.stringify(report,null,2)+'\n');
if(totalErrors)process.exitCode=1;
