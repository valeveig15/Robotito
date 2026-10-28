"use strict";
const fs=require("node:fs"),path=require("node:path");
const labels=new Set(["clap","laugh","cry","cough","sneeze","music","voice","impact","noise","silence","unknown"]);
const human=new Set(["clap","laugh","cry","cough","sneeze"]);
const rights=new Set(["owned","consented","open-license"]);
const nonempty=x=>typeof x==="string"&&!!x.trim();
function range(x){
 if(!x||!Number.isFinite(x.startSeconds)||!Number.isFinite(x.endSeconds)||
    x.startSeconds<0||x.startSeconds>=x.endSeconds)
  throw Error("Invalid event or suppression time interval");
}
function contained(root,file){
 const diff=path.relative(root,file);
 return !!diff&&diff!==".."&&!diff.startsWith(".."+path.sep)&&!path.isAbsolute(diff);
}
function loadManifest(location){
 const actual=fs.realpathSync(location),base=path.dirname(actual);
 const manifest=JSON.parse(fs.readFileSync(actual,"utf8"));
 if(!manifest||typeof manifest!=="object"||Array.isArray(manifest))
  throw Error("Audio manifest must be an object");
 const clips=manifest.clips??[],sessions=manifest.sessions??[];
 if(!Array.isArray(clips)||!Array.isArray(sessions)||!clips.length&&!sessions.length)
  throw Error("Manifest needs labelled clips or annotated continuous sessions");
 const ids=new Set(),all=[];
 for(const [rows,continuous]of [[clips,false],[sessions,true]]){
  for(const item of rows){
   if(!nonempty(item?.id)||ids.has(item.id))throw Error("Duplicate or missing audio ID");
   ids.add(item.id);
   if(!nonempty(item.path)||!nonempty(item.environment)||
      !rights.has(item.rights)||!continuous&&!labels.has(item.label))
    throw Error("Invalid audio path, label, rights or environment for "+item.id);
   if(item.rights==="open-license"&&(!nonempty(manifest.license)||!nonempty(manifest.source)))
    throw Error("Open-license audio requires license and source provenance");
   if(continuous){
    if(!Array.isArray(item.annotations)||!Array.isArray(item.suppressions??[]))
     throw Error("Continuous audio needs annotations and optional suppressions");
    for(const x of item.annotations){
     if(!human.has(x?.kind))throw Error("Invalid human event annotation");
     range(x);
    }
    for(const x of item.suppressions??[])range(x);
   }
   const resolved=path.resolve(base,item.path);
   if(!contained(base,resolved))throw Error("Audio leaves manifest folder");
   const physical=fs.realpathSync(resolved);
   if(!contained(base,physical))throw Error("Audio symlink leaves manifest folder");
   const stat=fs.statSync(physical);
   if(!stat.isFile()||stat.size<=0||stat.size>50*1024*1024)
    throw Error("Invalid or oversized audio file");
   all.push({...item,absolutePath:physical});
  }
 }
 return {base,manifest,clips:all.slice(0,clips.length),sessions:all.slice(clips.length)};
}
module.exports={loadManifest};
