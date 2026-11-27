"use strict";
// Verifies that all three fallback animals receive ONE editable face, not a crop
// or a second face painted over the original eyes/mouth.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,"avatar-face-program.js"),"utf8"),sandbox,{filename:"avatar-face-program.js"});
vm.runInNewContext(fs.readFileSync(path.join(root,"avatar-art.js"),"utf8"),sandbox,{filename:"avatar-art.js"});
const face=sandbox.window.ROBOTITO_FACE_PROGRAM;
const art=sandbox.window.ROBOTITO_AVATAR_ART;
assert.deepEqual(Array.from(face.approvedIds),["panda","brown-bear","polar-bear","dog","monkey"]);
assert.deepEqual(Array.from(face.compactIds),["cat","red-panda","iguana"]);
for(const id of face.compactIds){
 const svg=art.render({id},"live");
 assert.equal((svg.match(/data-avatar-face="programmed"/g)||[]).length,1,id+" procedural head");
 assert.equal((svg.match(/class="avatar-eye-group/g)||[]).length,2,id+" two eyes");
 assert.equal((svg.match(/class="avatar-mouth mouth-line"/g)||[]).length,1,id+" one speaking mouth");
 assert.equal((svg.match(/class="avatar-tongue tongue-svg"/g)||[]).length,1,id+" one tongue");
 assert.doesNotMatch(svg,/<(?:image|canvas|foreignObject)\b|data:image|base64,/i,id+" must not embed face imagery");
 assert.match(svg,/class="avatar-body plush-body"/,id+" body retained");
 assert.match(svg,/class="avatar-tail/,id+" tail retained");
}
for(const id of ["dog","monkey","brown-bear","polar-bear"]){
 assert.equal(face.compact(id),"",id+" is provided by approved SVG world");
}
const untouched=art.render({id:"lion"},"live");
assert.doesNotMatch(untouched,/data-avatar-face="programmed"/);
console.log("Procedural avatar faces: all 8 routes + 3 compact SVGs validated");
