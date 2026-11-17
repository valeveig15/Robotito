"use strict";
const assert=require("node:assert/strict");
const facts=require("../species-self-knowledge.js");
const ids="panda brown-bear polar-bear dog monkey cat red-panda iguana chameleon armadillo penguin elephant turtle squirrel mouse hamster rabbit lion tiger panther fox koala pig cow frog owl wolf horse unicorn dinosaur crocodile dolphin zebra deer hippopotamus giraffe kangaroo gorilla sheep goat peacock swan flamingo skunk raccoon otter sloth beaver hedgehog robot".split(" ");
const langs=["es","en","pt","fr","it","de"];
assert.equal(ids.length,50);
assert.deepEqual(Object.keys(facts.catalog()).sort(),ids.slice().sort());
for(const id of ids)for(const lang of langs){
 const food=facts.describe("Qué comes?",{id,name:id,trait:"trait",lang});
 assert.equal(food.kind,"diet");assert.equal(food.action,"feed");
 assert.ok(food.text.length>25,lang+"/"+id+": food");
 assert.ok(!/undefined|\{food\}|null/.test(food.text),lang+"/"+id+": placeholders");
 const species=facts.describe("Qué animal sos?",{id,name:id,trait:"trait",lang});
 assert.equal(species.kind,"identity");assert.ok(species.text.includes(id));
}
const food=id=>facts.describe("Qué comes?",{id,name:id,lang:"es"}).text;
assert.match(food("panda"),/bambú/i);
assert.match(food("polar-bear"),/focas/i);
assert.match(food("chameleon"),/insectos/i);
assert.match(food("iguana"),/vegetales/i);
assert.match(food("penguin"),/peces/i);
assert.match(food("robot"),/virtual/i);
assert.match(food("unicorn"),/míticos/i);
assert.match(food("dinosaur"),/especie/i);
for(const raw of ["Qué es un camaleón","Qué comen los pandas","Qué animales cambian de color",
 "Explicame las cadenas alimentarias","Cuántos osos polares hay","What do chameleons eat",
 "Que come un camaleon","¿Cómo cambia de color un camaleón?","qué es una especie",
 "Are polar bears carnivores?","Do cats eat fish?"]){
 assert.equal(facts.classify(raw),null,"Do not intercept academic biology: "+raw);
}
const examples={
identity:["¿Qué especie sos?","What animal are you?","Que animal voce e?","Quel animal es tu?","Che animale sei?","Was für ein Tier bist du?"],
diet:["¿Qué te gusta comer?","What do you eat?","O que voce come?","Qu'est-ce que tu manges?","Cosa mangi?","Was isst du?"],
chameleon:["¿Por qué cambias de color?","Why do you change color?","Por que mudas de cor?","Pourquoi tu changes de couleur?","Perché cambi colore?","Warum wechselst du die Farbe?"],
virtual:["¿Sos real?","Are you real?","Você é real?","Es-tu réel?","Sei reale?","Bist du echt?"]
};
for(const [kind,queries] of Object.entries(examples))
 queries.forEach((query,index)=>{
  const result=facts.describe(query,{id:"chameleon",name:"Camaleón",trait:"independent eyes",lang:langs[index]});
  assert.equal(result?.kind,kind,langs[index]+"/"+kind+"/"+query);
  if(kind==="chameleon")assert.match(result.text,/color|cor|couleur|colore|farbe/i);
 });
assert.equal(facts.describe("Por qué cambias de color",{id:"dog",lang:"es"}).action,"introduce");
assert.match(facts.describe("Por qué cambias de color",{id:"dog",lang:"es"}).text,/no es un camaleón/i);
assert.equal(facts.describe("hola, buen día",{id:"chameleon"}),null);
assert.equal(facts.describe("Qué comes?",{id:"not-a-known-avatar"}).kind,"diet");
assert.equal(facts.classify("a".repeat(501)),null);
console.log("P29: 50 species, six languages, food, chameleon, identity and academic-question boundaries passed");
