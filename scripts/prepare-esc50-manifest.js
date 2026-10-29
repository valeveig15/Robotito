"use strict";
// Opt-in ESC-50 manifest builder. No dataset download or audio redistribution.
// ESC-50 by Karol J. Piczak (CC BY-NC 3.0): noncommercial use only.
// https://github.com/karolpiczak/ESC-50
const fs=require("node:fs"),path=require("node:path");
const {sourceAudit}=require("../audio-source-groups.js");
// Use the original dataset's source-aware folds: no original Freesound
// recording must appear in more than one development/validation/test split.
const SPLIT_BY_FOLD=Object.freeze({1:"development",2:"development",3:"development",
 4:"validation",5:"test"});
const CATEGORIES=Object.freeze({
 crying_baby:"cry",sneezing:"sneeze",coughing:"cough",
 laughing:"laugh",clapping:"clap",
 door_knock:"impact",glass_breaking:"impact",mouse_click:"impact",
 fireworks:"impact",vacuum_cleaner:"noise",washing_machine:"noise",
 clock_tick:"noise",breathing:"noise",wind:"noise",rain:"noise"
});
function parseCsv(line){
 const cells=[];let field="",quoted=false;
 for(let i=0;i<line.length;i++){
  const ch=line[i];
  if(ch==='"'){
   if(quoted&&line[i+1]==='"'){field+='"';i++;}
   else quoted=!quoted;
  }else if(ch===","&&!quoted){cells.push(field);field="";}
  else field+=ch;
 }
 if(quoted)throw Error("Malformed quoted CSV row");
 cells.push(field);
 return cells;
}
function build(root,{fold="1",limitPerCategory=Infinity}={}){
 const base=fs.realpathSync(root);
 if(!["1","2","3","4","5","all"].includes(String(fold)))throw Error("Fold must be 1-5 or all");
 if(limitPerCategory!==Infinity&&(!Number.isSafeInteger(limitPerCategory)||limitPerCategory<1))
  throw Error("Maximum per category must be a positive integer");
 const csv=fs.readFileSync(path.join(base,"meta","esc50.csv"),"utf8")
  .replace(/^\uFEFF/,"").trim().split(/\r?\n/);
 const header=parseCsv(csv.shift()).map(x=>x.trim());
 const ix=Object.fromEntries(["filename","fold","category"].map(k=>[k,header.indexOf(k)]));
 if(Object.values(ix).some(n=>n<0))throw Error("ESC-50 CSV lacks filename/fold/category columns");
 const byCategory=new Map();
 for(const line of csv){
  if(!line.trim())continue;
  const cells=parseCsv(line),category=cells[ix.category],file=cells[ix.filename];
  const itemFold=cells[ix.fold];
  if(!Object.hasOwn(CATEGORIES,category)||fold!=="all"&&itemFold!==String(fold))continue;
  const match=/^([1-5])-(\d+)-[A-Z]-\d+\.wav$/.exec(file);
  if(!match||match[1]!==itemFold||!SPLIT_BY_FOLD[itemFold])
   throw Error("Unsafe or invalid ESC-50 filename/fold: "+file);
  const physical=path.join(base,"audio",file);
  if(!fs.existsSync(physical)||!fs.statSync(physical).isFile()||
     !fs.realpathSync(physical).startsWith(path.join(base,"audio")+path.sep))
   throw Error("Missing or unsafe ESC-50 clip: "+file);
  const rows=byCategory.get(category)||[];
  if(rows.length<limitPerCategory){
   rows.push({id:"esc50:"+file,path:"audio/"+file,label:CATEGORIES[category],
    environment:"ESC-50/"+category,rights:"open-license",
    sourceGroup:"esc50-source-"+match[2],evaluationSplit:SPLIT_BY_FOLD[itemFold],
    datasetCategory:category,datasetFold:Number(itemFold)});
   byCategory.set(category,rows);
  }
 }
 const clips=[...byCategory.values()].flat().sort((a,b)=>a.id.localeCompare(b.id));
 if(!clips.length)throw Error("No matching ESC-50 clips found");
 const foldAudit=sourceAudit(clips);
 return {name:"ESC-50 "+(fold==="all"?"all folds":"fold "+fold)+" sound benchmark (exploratory)",
  license:"CC-BY-NC-3.0",source:"https://github.com/karolpiczak/ESC-50",
  citation:"K. J. Piczak, ESC: Dataset for Environmental Sound Classification, ACM Multimedia 2015",
  scope:"Exploratory labels are weak clip-level annotations; not live mic calibration",
  foldPolicy:"Folds 1-3 development, fold 4 validation, fold 5 untouched test; original Freesound source ID grouped",
  declaredSourceGroupCount:foldAudit.sourceGroups,
  verifiedRealWorldIndependence:false,clips};
}
function main(argv=process.argv.slice(2)){
 const root=argv[0];if(!root)throw Error(
  "Usage: npm run prepare:audio:esc50 -- /path/to/ESC-50 [1|2|3|4|5|all] [max-per-category]");
 const fold=argv[1]||"1",limitPerCategory=argv[2]?Number(argv[2]):Infinity;
 const result=build(root,{fold,limitPerCategory});
 const base=fs.realpathSync(root);
 const file=path.join(base,"robotito-esc50-"+fold+"-manifest.json");
 fs.writeFileSync(file,JSON.stringify(result,null,2)+"\n");
 console.log("Created local-only ESC-50 manifest",file,"with",result.clips.length,"clips");
 console.log("CC BY-NC: respect original attribution and noncommercial restriction.");
 console.log("Run: npm run evaluate:audio -- "+file);
}
if(require.main===module)main();
module.exports={CATEGORIES,parseCsv,build};
