"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {loadManifest}=require("../audio-evaluation-manifest.js");
const root=fs.mkdtempSync(path.join(os.tmpdir(),"robotito-manifest-"));
let checks=0;
const item={id:"clip",path:"audio.wav",label:"cough",environment:"room",rights:"owned"};
function read(data){fs.writeFileSync(path.join(root,"m.json"),JSON.stringify(data));return loadManifest(path.join(root,"m.json"));}
try{
 fs.writeFileSync(path.join(root,"audio.wav"),Buffer.from("test"));
 fs.writeFileSync(path.join(root,"session.wav"),Buffer.from("different authorized session"));
 const session={id:"session",path:"session.wav",environment:"street",rights:"consented",
  annotations:[{kind:"sneeze",startSeconds:1,endSeconds:2}],
  suppressions:[{startSeconds:3,endSeconds:4}]};
 assert.equal(read({clips:[item]}).clips.length,1);checks++;
 assert.equal(read({clips:[item]}).clips[0].deviceClass,"unspecified");checks++;
 assert.equal(read({clips:[{...item,deviceClass:"usb"}]}).clips[0].deviceClass,"usb");checks++;
 assert.equal(read({sessions:[session]}).sessions.length,1);checks++;
 assert.equal(read({sessions:[{...session,deviceClass:"phone"}]}).sessions[0].deviceClass,"phone");checks++;
 assert.equal(read({clips:[item],sessions:[session]}).sessions.length,1);checks++;
 // Distinct IDs cannot disguise the SAME content as independent evidence.
 fs.writeFileSync(path.join(root,"copy.wav"),Buffer.from("test"));
 const copy={...item,id:"different-id",label:"noise",path:"copy.wav"};
 assert.throws(()=>read({clips:[item,copy]}),
  /Duplicate audio recording: different-id repeats clip/);checks++;
 assert.throws(()=>read({clips:[item],sessions:[{...session,path:"audio.wav"}]}),
  /Duplicate audio recording: session repeats clip/);checks++;
 assert.throws(()=>read({clips:[item],sessions:[{...session,path:"copy.wav"}]}),
  /Duplicate audio recording: session repeats clip/);checks++;
 fs.linkSync(path.join(root,"audio.wav"),path.join(root,"hard-link.wav"));
 assert.throws(()=>read({clips:[item,{...copy,path:"hard-link.wav"}]}),
  /Duplicate audio recording/);checks++;
 fs.symlinkSync(path.join(root,"audio.wav"),path.join(root,"internal-link.wav"));
 assert.throws(()=>read({clips:[item,{...copy,path:"internal-link.wav"}]}),
  /Duplicate audio recording/);checks++;
 assert.equal(read({clips:[item,{...copy,path:"session.wav"}]}).clips.length,2);checks++;
 // Only duplicate byte streams are rejected, not recordings with shared labels.
 assert.equal(read({clips:[item],sessions:[session]}).clips.length,1);checks++;
 assert.equal(read({clips:[{...item,rights:"open-license"}],
  license:"CC-BY-NC-3.0",source:"original dataset"}).clips.length,1);checks++;
 for(const data of [
  {clips:[item,item]},{clips:[item],sessions:[{...session,id:"clip"}]},
  {clips:[{...item,label:"unrecognized"}]},{clips:[{...item,path:""}]},
  {clips:[{...item,path:"../secret.wav"}]},
  {clips:[{...item,deviceClass:"id-9384"}]},
  {sessions:[{...session,deviceClass:null}]},
  {clips:[{...item,rights:"open-license"}]},
  {sessions:[{...session,annotations:[{kind:"noise",startSeconds:0,endSeconds:1}]}]},
  {sessions:[{...session,annotations:[{kind:"cough",startSeconds:-1,endSeconds:2}]}]},
  {sessions:[{...session,annotations:[{kind:"cough",startSeconds:2,endSeconds:2}]}]},
  {sessions:[{...session,suppressions:[{startSeconds:3,endSeconds:1}]}]},
  {sessions:[{...session,annotations:"not an array"}]},
  {clips:[{...item,path:"."}]}
 ]){assert.throws(()=>read(data));checks++;}
 const outside=path.join(os.tmpdir(),"robotito-external-"+process.pid+".wav");
 try{
  fs.writeFileSync(outside,Buffer.from("private"));
  fs.symlinkSync(outside,path.join(root,"escape.wav"));
  assert.throws(()=>read({clips:[{...item,path:"escape.wav"}]}),/symlink/);checks++;
 }finally{fs.rmSync(outside,{force:true});}
 read({clips:[item]});
 fs.symlinkSync(root,path.join(root,"alias"),"dir");
 assert.equal(loadManifest(path.join(root,"alias","m.json")).clips.length,1);checks++;
 console.log("Preflight sound corpus validation:",checks,"checks passed");
}finally{fs.rmSync(root,{recursive:true,force:true});}
