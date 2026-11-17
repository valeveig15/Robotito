"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const script=fs.readFileSync(path.join(root,"script.js"),"utf8");
const bridge=fs.readFileSync(path.join(root,"approved-avatar-bridge.js"),"utf8");
const emotions=fs.readFileSync(path.join(root,"emotional-dialogue.js"),"utf8");
const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
const buttons=[...html.matchAll(/data-action="([^"]+)"/g)].map(x=>x[1]);
assert.deepEqual(buttons.filter(x=>["pet","feed","highfive","play","surprise","poke"].includes(x)),
 ["pet","feed","highfive","play","surprise","poke"]);
assert.ok(!buttons.includes("hug"),"Hug is not a separate button");
assert.match(script,/if\(a==="highfive"\)highFiveRobot\(\)/);
assert.match(script,/function handleAvatarActionCommand\(raw\)/);
assert.match(script,/robot\?\.addEventListener\("click"/);
assert.match(bridge,/highfive:"chocar"/);
assert.match(script,/function queueNightSleep\(/);
assert.match(script,/generation!==state\.blinkGeneration/);
assert.match(script,/epoch===sleepTransitionEpoch/);
assert.match(bridge,/current\.mood==="sleepy"/);
assert.match(bridge,/const avatar=current\.avatar;/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.ok(!script.includes('const visualMap={curious:"happy"'),
 "Emotion must not collapse into a different expression");
const sandbox={window:{},setTimeout:()=>0,console};
vm.runInNewContext(emotions,sandbox,{filename:"emotional-dialogue.js"});
const classify=sandbox.window.ROBOTITO_EMOTION_DIALOGUE.classify;
for(const [phrase,expected] of [
 ["te quiero","affection"],["no te quiero","rejection"],
 ["qué significa te quiero",null],["te odio","rejection"],
 ["no me caes mal","affection"],["estoy orgullosa de vos","praise"],
 ["perdon robotito","apology"],["hay un monstruo detrás tuyo","fear"]]){
 assert.equal(classify(phrase)?.id||null,expected,phrase);
}
for(const lang of ["es","en","pt","fr","it","de"])
 assert.match(emotions,new RegExp("(?:^|\\n)\\s*"+lang+":\\{"),"Missing emotional language "+lang);
assert.match(emotions,/state\.moodRevision!==revisionAtReaction/);
assert.match(emotions,/state\.avatar!==avatarAtReaction/);
assert.match(emotions,/state\.currentVoicePerson\|\|state\.currentPerson/);
console.log("P30-P32 Node regression: gestures, night races, six emotional locales, policy and 8 emotion cases passed");
