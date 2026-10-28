"use strict";
// User-supplied, pseudonymous recording-source groups: a group identifies
// related excerpts/takes, never a device serial number or a real person's name.
// This audit cannot independently verify the curator's annotations.
const SPLITS=Object.freeze(["unspecified","development","validation","test"]);
function normalizeSourceGroup(value){
 if(value===undefined||value===null)return null;
 if(typeof value!=="string"||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(value))
  throw Error("sourceGroup must be a short pseudonymous recording group ID");
 return value;
}
function normalizeEvaluationSplit(value,sourceGroup){
 if(value===undefined||value==="unspecified")return "unspecified";
 if(typeof value!=="string"||!SPLITS.includes(value)||value==="unspecified")
  throw Error("evaluationSplit must be development, validation or test");
 if(!sourceGroup)throw Error("evaluationSplit requires sourceGroup for independence audit");
 return value;
}
function sourceAudit(items){
 const groups=new Map(),bySplit=Object.fromEntries(SPLITS.map(k=>[k,0]));
 let ungrouped=0;
 for(const item of items){
  const group=normalizeSourceGroup(item.sourceGroup);
  const split=normalizeEvaluationSplit(item.evaluationSplit,group);
  bySplit[split]++;
  if(!group){ungrouped++;continue;}
  const seen=groups.get(group);
  if(seen&&seen!==split)
   throw Error("Recording sourceGroup appears across evaluation splits");
  groups.set(group,split);
 }
 return {recordings:items.length,sourceGroups:groups.size,ungroupedRecordings:ungrouped,
  recordingsBySplit:bySplit,
  sourceGroupsBySplit:Object.fromEntries(SPLITS.map(k=>
   [k,[...groups.values()].filter(v=>v===k).length])),
  verifiedOnlyAgainstDeclaredGroups:true,
  independentlyVerified:false};
}
module.exports={SPLITS,normalizeSourceGroup,normalizeEvaluationSplit,sourceAudit};
