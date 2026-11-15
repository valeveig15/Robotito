"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const first=source.indexOf("function editClassLineText(");
const last=source.indexOf("function renderClassTranscript()",first);
assert.ok(first>=0&&last>first,"Manual transcript functions are part of the running script");
const lines=[{id:"one",text:"Texto oído",correctedText:"Texto oído",corrections:[],
 verificationStatus:"verified",verificationSources:[{url:"https://example.org"}]}];
const state={classLines:lines};
let draft="Versión corregida",writes=0,renders=0;
const api=new Function("state","window","uiText","toast","save","renderClassTranscript",
 source.slice(first,last)+"\nreturn {editClassLineText,undoClassLineText};")(
 state,{prompt:()=>draft},x=>x,()=>{},()=>writes++,()=>renders++);
assert.equal(api.editClassLineText("one"),true);
assert.equal(lines[0].text,"Texto oído","Raw ASR source must remain unchanged");
assert.equal(lines[0].correctedText,"Versión corregida");
assert.equal(lines[0].verificationStatus,"manual","Manual correction invalidates stale verified badge");
assert.deepEqual(lines[0].verificationSources,[],"Sources for old text are removed");
assert.equal(lines[0].corrections.at(-1).kind,"manual");
assert.equal(api.undoClassLineText("one"),true);
assert.equal(lines[0].correctedText,"Texto oído","Undo restores prior wording");
assert.equal(api.undoClassLineText("one"),false,"A second undo cannot corrupt the record");
draft="   ";
assert.equal(api.editClassLineText("one"),false,"Empty edits cannot erase existing transcription");
assert.equal(writes,2,"Only valid edits or undo operations persist");
assert.equal(renders,2,"Changes are reflected by the transcript view");
console.log("P13 transcript manual correction and undo: passed");
