"use strict";
// Regressions for face layering, limb anatomy and emotion symbols.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"avatar-art.js"),"utf8");
const scope={window:{}};
vm.runInNewContext(source,scope,{filename:"avatar-art.js"});
const art=scope.window.ROBOTITO_AVATAR_ART;
assert.ok(art&&typeof art.render==="function");
const count=(text,regex)=>(text.match(regex)||[]).length;
for(const id of ["cat","red-panda","iguana"]){
  const svg=art.render({id},"avatar-main-svg");
  assert.ok(svg.startsWith('<svg class="avatar-character'));
  assert.equal(count(svg,/<svg\b/g),1,id+": one SVG character");
  assert.equal(count(svg,/<\/svg>/g),1,id+": SVG closes");
  assert.equal(count(svg,/<g(?:\s|>)/g),count(svg,/<\/g>/g),id+": balanced vector groups");
  assert.equal(count(svg,/class="avatar-head plush-head"/g),1,id+": no second head");
  assert.equal(count(svg,/class="avatar-body plush-body"/g),1,id+": one torso");
  assert.equal(count(svg,/class="avatar-leg avatar-leg-left/g),1,id+": one left leg");
  assert.equal(count(svg,/class="avatar-leg avatar-leg-right/g),1,id+": one right leg");
  assert.ok(svg.includes('class="avatar-closed-eyes"'),id+": sleep eyes");
  assert.ok(svg.includes('class="avatar-upper-eyelids"'),id+": tired lids");
  assert.ok(svg.includes('class="avatar-tear-left"'),id+": moving tear");
  assert.ok(svg.includes('class="avatar-anger-mark"'),id+": own anger symbol");
  assert.ok(svg.includes('class="avatar-sweat-mark"'),id+": outlined sweat");
  assert.ok(svg.includes('class="avatar-question-mark"'),id+": question placement");
  assert.ok(svg.includes('class="avatar-speaking-mouth"'),id+": actual speech mouth");
  assert.ok(svg.includes('x="84" y="91"')&&svg.includes('x="136" y="91"'),id+": heart centering");
  assert.ok(!svg.includes("avatar-head-facets"),id+": no pasted polygonal face");
  assert.ok(!svg.includes("avatar-body-facets"),id+": no collage body");
}
const iguana=art.render({id:"iguana"},"avatar-main-svg");
assert.ok(iguana.includes('d="M92 123Q110 133 128 123"'),"igui mouth below nostrils");
assert.ok(!iguana.includes('d="M92 116q8 10 18 0 10 10 18 0"'),"igui old extra mouth absent");
assert.ok(iguana.includes("avatar-tail-long"),"iguana tail attached");
const cat=art.render({id:"cat"},"avatar-main-svg");
assert.ok(cat.includes("C181 183 200 193"),"Michi S-tail anatomy");
const redPanda=art.render({id:"red-panda"},"avatar-main-svg");
assert.ok(redPanda.includes("avatar-species-chest"),"Roji has species-specific torso");
assert.ok(redPanda.includes("avatar-tail-bushy"),"Roji retains striped panda tail");
// Latest original files from the user, with complete emotion textures.
for(const [version,slug,marker] of [
  ["Bobi V35","bobi","bb-soft-head"],
  ["Michi V31","michi","mc-soft-head"],
  ["Roji V3.6","roji","rj-soft-head"],
  ["Igui V24","igui","ig-soft-head"]
]){
  const html=fs.readFileSync(path.join(root,"previews",slug+"-review.html"),"utf8");
  assert.ok(html.includes(version),"latest submitted design: "+version);
  assert.ok(html.includes('id="'+marker+'"'),"original species features: "+version);
  assert.ok(html.includes('id="reference-face-idle"'),"user-approved reference face: "+version);
  assert.ok(html.includes('id="reference-fidelity-layer-v15"'),"all original texture styles: "+version);
  assert.equal(html.split("data:image/webp;base64,").length-1,46,"45 mood faces + initial face: "+version);
  assert.equal(count(html,/id="head"/g),1,"one head only: "+version);
}
const bridge=fs.readFileSync(path.join(root,"approved-avatar-bridge.js"),"utf8");
assert.ok(bridge.includes('setAttribute("preserveAspectRatio","xMidYMid meet")'),"show whole approved avatar");
assert.ok(bridge.includes("approvedTearFall"),"approved tears fall");
assert.ok(bridge.includes("approved-eyelids"),"approved tired/bored lids");
assert.ok(bridge.includes('doc.querySelectorAll("style")'),"keep all authentic texture CSS layers");
assert.ok(bridge.includes("parseFaceAtlas(doc)"),"parse all 15 facial moods without executing original scripts");
assert.ok(bridge.includes("animateMichiTail("),"Michi original S-tail animation preserved");
assert.ok(bridge.includes('previews/"+LATEST[id]+"-review.html'),"load latest approved HTML sources");
const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
assert.ok(css.includes('.world[data-avatar="iguana"]'),"Igui jungle habitat");
assert.ok(css.includes("customSpeakMouth"),"talking mouth animates");
console.log("Avatar anatomy and emotion regressions: OK");
