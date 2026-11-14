"use strict";
// P08: aggregate verification-attempt metrics only. NEVER accepts raw audio,
// images, names or embeddings, and NEVER uploads information anywhere.
const fs=require("node:fs");
const CLAIM=/^[a-z][a-z0-9_-]{0,31}$/i;
const MODALITIES=new Set(["face","voice","joint"]);
const DECISIONS=new Set(["accept","reject","abstain"]);
const SPLITS=new Set(["calibration","test"]);
const SCENARIOS=new Set(["normal","dim","backlit","profile","glasses",
 "lookalike","similar-voice","noise","replay","tv","multi-face",
 "permission","other"]);
const DEVICES=new Set(["android","iphone","desktop","tablet","other"]);
const ROOT_KEYS=new Set(["schema","synthetic","trials","note"]);
const TRIAL_KEYS=new Set(["id","split","consent","claimed","actual","decision",
 "modality","scenario","device","latencyMs"]);
function ensureManifest(input){
 if(!input||typeof input!=="object"||Array.isArray(input)||input.schema!==1||
    Object.keys(input).some(key=>!ROOT_KEYS.has(key))||
    typeof input.synthetic!=="boolean"||!Array.isArray(input.trials)||
    input.trials.length<1||input.trials.length>100000)
  throw new TypeError("Invalid P08 local evaluation manifest");
 const seen=new Set();
 for(const trial of input.trials){
  if(!trial||typeof trial!=="object"||Array.isArray(trial)||
     Object.keys(trial).some(key=>!TRIAL_KEYS.has(key)))
   throw new TypeError("Manifest must contain metadata only, never biometric samples");
  if(typeof trial.id!=="string"||!CLAIM.test(trial.id)||seen.has(trial.id))
   throw new TypeError("Invalid or duplicate anonymous trial ID");
  seen.add(trial.id);
  if(trial.consent!==true)throw new TypeError("All trials require recorded participant consent");
  if(!SPLITS.has(trial.split)||!MODALITIES.has(trial.modality)||
     !DECISIONS.has(trial.decision)||!SCENARIOS.has(trial.scenario)||
     !DEVICES.has(trial.device)||!CLAIM.test(trial.claimed)||
     !CLAIM.test(trial.actual)||!Number.isFinite(trial.latencyMs)||
     trial.latencyMs<0||trial.latencyMs>120000)
   throw new TypeError("Incomplete or invalid P08 trial metadata");
 }
 if(!input.trials.some(x=>x.split==="calibration")||
    !input.trials.some(x=>x.split==="test"))
  throw new Error("Keep separate calibration and untouched test trials");
 return input;
}
function wilson(success,total){
 if(!total)return {rate:null,lower:null,upper:null,n:0,numerator:success};
 const p=success/total,z=1.95996398454,z2=z*z,den=1+z2/total,
  center=(p+z2/(2*total))/den,
  radius=z*Math.sqrt((p*(1-p)+z2/(4*total))/total)/den;
 return {rate:p,lower:Math.max(0,center-radius),upper:Math.min(1,center+radius),
  n:total,numerator:success};
}
function aggregate(trials){
 const genuine=trials.filter(t=>t.actual===t.claimed);
 const impostor=trials.filter(t=>t.actual!==t.claimed);
 const frr=genuine.filter(t=>t.decision!=="accept").length;
 const far=impostor.filter(t=>t.decision==="accept").length;
 const abstain=trials.filter(t=>t.decision==="abstain").length;
 const durations=trials.map(t=>t.latencyMs).sort((a,b)=>a-b);
 const percentile=q=>durations.length?
  durations[Math.min(durations.length-1,Math.ceil(q*durations.length)-1)]:null;
 return {trials:trials.length,
  falseAcceptance:wilson(far,impostor.length),
  falseRejection:wilson(frr,genuine.length),
  abstentions:wilson(abstain,trials.length),
  latencyMs:{median:percentile(.5),p95:percentile(.95)},
  insufficientSample:impostor.length<30||genuine.length<30};
}
function evaluate(input){
 const manifest=ensureManifest(input);
 const test=manifest.trials.filter(t=>t.split==="test");
 const calibration=manifest.trials.filter(t=>t.split==="calibration");
 const groups={modality:{},scenario:{},device:{}};
 for(const [key,categories] of [
  ["modality",MODALITIES],["scenario",SCENARIOS],["device",DEVICES]]){
  for(const category of categories){
   const relevant=test.filter(t=>t[key]===category);
   if(relevant.length)groups[key][category]=aggregate(relevant);
  }
 }
 return {
  schema:1,kind:"p08-aggregate-identity-evaluation",
  synthetic:manifest.synthetic,
  datasetScope:manifest.synthetic?"synthetic-demonstration-only":"self-reported-non-synthetic",
  calibrationTrials:calibration.length,testTrials:test.length,
  summary:aggregate(test),groups,
  validatedOnHardware:false, // Metrics alone never certify physical correctness.
  warning:manifest.synthetic
   ?"Synthetic example: no real-world accuracy has been measured."
   :"Check consent records, held-out data, devices and protocol before interpreting metrics."
 };
}
if(require.main===module){
 try{
  const filepath=process.argv[2];
  if(!filepath)throw new Error("Usage: npm run evaluate:identity -- /private/path/manifest.json");
  const manifest=JSON.parse(fs.readFileSync(filepath,"utf8"));
  process.stdout.write(JSON.stringify(evaluate(manifest),null,2)+"\n");
 }catch(error){
  process.stderr.write("P08 evaluation refused: "+error.message+"\n");
  process.exitCode=1;
 }
}
module.exports={evaluate,ensureManifest,wilson,aggregate};
