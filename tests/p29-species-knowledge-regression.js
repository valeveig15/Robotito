"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const species=require("../species-knowledge.js");
const source=fs.readFileSync(require("node:path").join(__dirname,"../script.js"),"utf8");
const catalog=source.split("const ROBOTITO_AVATARS = [")[1]?.split("];")[0]||"";
const ids=[...catalog.matchAll(/\{id:"([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,50,"Every available avatar must be covered");
assert.equal(new Set(ids).size,50);
const audit=species.assertCatalog(ids);
assert.deepEqual(audit.unknown,[],"No missing species food or habitat facts");
assert.deepEqual(audit.invalid,[],"Every fact points to a localized category");
assert.equal(audit.count,50);
const languages=["es","en","pt","fr","it","de"];
for(const id of ids){
 const fact=species.get(id);
 assert.ok(fact?.foodEmoji,"Species-safe visual food for "+id);
 for(const lang of languages){
  for(const [raw,kind] of [["¿Qué animal sos?","identity"],["¿Dónde vivís?","habitat"],
   ["¿Qué comes?","diet"],["¿A qué familia perteneces?","family"],
   ["¿Qué hábitos tenés?","habits"],["¿De dónde sos?","origin"]]){
   const res=species.answer(raw,{id,lang,name:id});
   assert.equal(res?.handled,true,raw+" / "+id+" / "+lang);
   assert.equal(res?.kind,kind);
   assert.ok(res.text.length>35,"No invented or empty answer");
  }
 }
}
assert.equal(species.parseQuestion("¿En dónde viven los tigres?"),null,
 "Unrelated school questions about other animals are not hijacked");
assert.equal(species.parseQuestion("¿Por qué la luz se refracta?"),null);
assert.equal(species.parseQuestion("Te doy un abrazo"),null);
assert.equal(species.parseQuestion("¿Por qué cambias de color?"),"habits");
assert.equal(species.answer("Where are you from?",{id:"dog",lang:"en",name:"dog"}).text.includes("Uruguay"),true);
assert.match(species.answer("¿A qué familia perteneces?",{id:"red-panda",lang:"es",name:"panda rojo"}).text,/Ailuridae/);
assert.match(species.answer("¿Qué hábitos tenés?",{id:"chameleon",lang:"es",name:"camaleón"}).text,/temperatura/);
assert.match(species.answer("¿Qué comes?",{id:"unicorn",lang:"es",name:"unicornio"}).text,/imaginaria/);
assert.match(species.answer("¿Qué hábitos tenés?",{id:"dinosaur",lang:"en",name:"dinosaur"}).text,/extinct|no non-avian/);
const feed=(text,id)=>species.feedingOffer(text,{id,lang:"es"});
assert.deepEqual([feed("te doy un pescado","polar-bear").ok,feed("te doy una banana","polar-bear").ok,
 feed("te doy chocolate","dog").ok,feed("te doy bambú","panda").ok],[true,false,false,true]);
assert.equal(feed("te doy un abrazo","dog"),null,"Affection is not food");
assert.equal(feed("¿Cuál es tu comida?","panda"),null,"Questions do not trigger feeding");
assert.equal(feed("te doy un pescado","robot").ok,false);
console.log("P29: 50 species × 6 languages × 6 questions, safety, origin, relatives and food: passed");
