"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const i18n=require("../i18n.js");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const script=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
const languages=["es","en","pt","fr","it","de"];
let checks=0;
function eq(a,b,reason){assert.deepEqual(a,b,reason);checks++;}
function ok(b,reason){assert.ok(b,reason);checks++;}
const attributes=["data-i18n","data-i18n-title","data-i18n-placeholder","data-i18n-aria-label"];
const nodes=[];
for(const attr of attributes){
 for(const m of html.matchAll(new RegExp("<[^>]*\\b"+attr+"=\"([^\"]+)\"[^>]*>","g"))){
  const item=m[0],key=m[1],element={attrs:{[attr]:key},textContent:"original",title:"original",placeholder:"original",
   getAttribute(k){return this.attrs[k]??null;},
   setAttribute(k,v){this.attrs[k]=v;}};
  nodes.push({attr,key,item,element});
 }
}
const doc={
 documentElement:{lang:"es"},
 querySelectorAll(selector){return nodes.filter(n=>selector.includes(n.attr)&&selector=== "["+n.attr+"]").map(n=>n.element);}
};
const p05Keys=["uiHelpSummary","uiHelpContactText","uiHelpContactButton","uiHelpContactAria",
 "uiBrandEyebrow","uiWorldAria","uiResizeTitle","uiInputPrompt","uiClassSubjectExample",
 "uiClassTopicExample","uiClassTopicEditExample","uiVideoTitleAuto","uiVideoTranscriptPrompt",
 "uiClassQuestionExample","uiPersonNameExample","uiBirthdayPlaceholder",
 "uiBookPromptExample","uiMemoryExample",...Array.from({length:15},(_,i)=>"uiAskQ"+(i+1))];
for(const key of p05Keys)ok(nodes.some(n=>n.key===key),"Translation is connected to HTML: "+key);
ok(nodes.filter(n=>n.attr==="data-i18n-placeholder").length>=12,"Form placeholders are wired");
for(const lang of languages){
 eq(i18n.apply(lang,doc),true,"Locale applied "+lang);
 eq(doc.documentElement.lang,lang,"HTML lang attribute "+lang);
 for(const entry of nodes){
  if(!p05Keys.includes(entry.key))continue;
  const target=entry.attr==="data-i18n"?"textContent":
    entry.attr==="data-i18n-title"?"title":
    entry.attr==="data-i18n-placeholder"?"placeholder":"aria-label";
  const actual=target==="aria-label"?entry.element.getAttribute(target):entry.element[target];
  eq(actual,i18n.t(entry.key,lang),lang+" "+entry.key+" target "+target);
  ok(actual!=="original",lang+" "+entry.key+" must have a translation");
 }
 if(lang!=="es"){
  for(const key of p05Keys){
   ok(i18n.t(key,lang)!==i18n.t(key,"es"),lang+" must not show an unchanged Spanish message: "+key);
  }
 }
}
const fake={attrs:{"data-i18n":"missing-key"},textContent:"original",
 getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v;}};
const documentWithoutTranslation={querySelectorAll:q=>q==="[data-i18n]"?[fake]:[],documentElement:{lang:"es"}};
i18n.apply("de",documentWithoutTranslation);
eq(fake.textContent,"original","Unknown translation must not be labeled German");
eq(i18n.apply("xx",doc),false,"Unknown locale not accepted");
ok(html.includes('class="startup-language-line" lang="en"'),"English startup line preserved");
ok(html.includes('class="startup-language-line" lang="pt"'),"Portuguese startup line preserved");
ok(css.includes(".startup-language-line{")&&css.includes("display:block"),
 "Startup lines are block-level, not combined");
ok(!/Which language do you prefer\?\s*·/.test(html),"Startup versions are not joined");
ok(script.includes('languageLocale(state.languageMode||"es")'),
 "Memory dates use selected locale");
ok(script.includes('t?.("uiAvatarAria",lang)'),"Avatar accessibility uses all six languages");
ok(script.includes("updateAvatarAria();\n  populateVoiceSelect();"),
 "Language changes refresh dynamic avatar labels");
console.log("P05 UI i18n localized field checks:",checks,"assertions");
