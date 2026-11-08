"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const i18n=require("../i18n.js");require("../ui-messages.js");
let checks=0;
function eq(a,b,message){assert.deepEqual(a,b,message);checks++;}
const commands={es:'¿Cómo se dice “Mañana Ana vendrá” en inglés?',en:'Translate “Mañana Ana vendrá” into French',pt:'Como se diz “Mañana Ana vendrá” em alemão',fr:'Comment dit-on “Mañana Ana vendrá” en allemand ?',it:'Come si dice “Mañana Ana vendrá” in tedesco?',de:'Wie sagt man “Mañana Ana vendrá” auf Englisch?'};
// Portuguese names and diacritics are part of the shared alias dictionary.
commands.pt='Como se diz “Mañana Ana vendrá” em alemão';
for(const [language,command] of Object.entries(commands)){
 const result=i18n.parseTranslation(command);
 assert.ok(result,language+": translation command");checks++;
 eq(result.phrase,"Mañana Ana vendrá",language+": original casing/accents preserved");
 eq(i18n.parseCommand(command),null,language+": translation does not persist a language change");
}
for(const phrase of ['Do not translate this into French','Ne traduis pas cette phrase en allemand','La profesora dijo: di hola en inglés','Was ist Deutsch?'])
 eq(i18n.parseTranslation(phrase),null,"Do not execute incidental or negative translation requests");
const locales=i18n.languages;
for(const {source,translations} of i18n.catalog()){
 const params=[...source.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
 for(const lang of locales){
  assert.ok(translations[lang]?.trim(),source+": "+lang);checks++;
  eq([...translations[lang].matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),params,"Placeholder parity: "+source+" "+lang);
 }
}
eq(i18n.text("Cumple: {date}","de",{date:'<img onerror="bad()">'}),'Geburtstag: <img onerror="bad()">',"Values remain plain text, no HTML evaluation");
eq(i18n.text("Unregistered user text","de"),"Unregistered user text","Unknown text is preserved, never falsely translated");
eq(i18n.text("{count} clases","en",{count:1}),"1 class","Singular class count");
eq(i18n.text("{count} clases","en",{count:2}),"2 classes","Plural class count");
eq(i18n.text("Creo que es {name}.","de",lang=>({name:lang})),"Ich glaube, es ist de.","Dynamic values use the requested locale");
const context={window:{ROBOTITO_I18N:i18n}};
vm.runInNewContext(fs.readFileSync(require.resolve('../species-personality.js'),'utf8'),context);
const species=context.window.ROBOTITO_SPECIES;
for(const id of Object.keys(species.profiles))for(const lang of locales){
 const profile=species.profile(id,lang);
 if(lang!=="es"){assert.notEqual(profile.trait,species.profiles[id].trait,id+": "+lang);checks++;}
 eq(profile.motion,species.profiles[id].motion,"Locale must not change animations");
 assert.ok(species.line(id,"highfive",lang));checks++;
}
vm.runInNewContext(fs.readFileSync(require.resolve('../objects.js'),'utf8'),context);
const objects=context.window.ROBOTITO_OBJECTS;
for(const item of objects.catalog)for(const lang of locales){
 const name=objects.displayName(item,lang);
 assert.ok(name,`${item.id}: missing ${lang} name`);checks++;
 eq(objects.find(name,lang)?.id,item.id,`${lang}: exact object name ${name}`);
}
eq(objects.find(""),null,"An empty query is not an object");
eq(objects.find("catalogue"),null,"An object alias embedded in another word is not a match");
(async()=>{
 const local=require('../localized-content.js');
 eq(await local.translate("PRIVATE_NOTE","und","de"),null,"Do not guess the source language");
 eq(await local.translate("PRIVATE_NOTE","es","de"),null,"Offline missing model preserves failure");
 let destroyed=0,created=0;
 const api={availability:async()=>"downloadable",create:async()=>{created++;return {destroy(){destroyed++;},translate:async()=>"Hello Ana"};}};
 eq(await local.runModel(api,{},s=>s.translate("Hola Ana")),null,"Automatic rendering never starts a model download");
 eq(created,0,"No model allocation without user activation");
 eq(await local.runModel({create:api.create},{},()=>"unexpected"),null,"Unknown model availability never starts an automatic download");
 eq(created,0,"Unknown availability does not allocate a model");
 eq(await local.runModel(api,{},s=>s.translate("Hola Ana"),{allowDownload:true}),"Hello Ana","User initiated local translation");
 eq(destroyed,1,"Model destroyed after translation");
 let resolve;
 const late={create:()=>new Promise(r=>{resolve=r;})};
 eq(await local.runModel(late,{},()=>"stale",{timeout:10,allowDownload:true}),null,"Late model creation times out");
 resolve({destroy(){destroyed++;}});await new Promise(r=>setTimeout(r,0));
 eq(destroyed,2,"Late-created session is destroyed");
 globalThis.ROBOTITO_LANGUAGE_PIPELINE={detect:()=>"es"};
 globalThis.Translator={availability:async()=>"available",create:async()=>({translate:async()=>"La respuesta sigue en español.",destroy(){destroyed++;}})};
 eq(await local.translate("Una explicación original.","es","de"),null,"Wrong-language model output is not labeled translated");
 globalThis.Translator.create=async()=>({translate:async()=>{throw Error("model failed");},destroy(){destroyed++;}});
 eq(await local.translate("Una explicación original.","es","de"),null,"Translation failure preserves an unavailable result");
 eq(destroyed,4,"Rejected and failed translator sessions are destroyed");
 delete globalThis.Translator;delete globalThis.ROBOTITO_LANGUAGE_PIPELINE;
 console.log("P05 content, commands and private translation:",checks,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
