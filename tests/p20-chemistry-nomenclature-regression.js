"use strict";
const assert=require("node:assert/strict");
const c=require("../chemistry-nomenclature.js");
const known=[
 ["cloruro de sodio","NaCl","sal binaria"],
 ["óxido de hierro(III)","Fe2O3","óxido"],
 ["óxido de hierro(II)","FeO","óxido"],
 ["hidróxido de calcio","Ca(OH)2","hidróxido"],
 ["sulfato de aluminio","Al2(SO4)3","oxisal"],
 ["nitrato de plata","AgNO3","oxisal"],
 ["sulfuro de zinc","ZnS","sal binaria"],
 ["ácido sulfúrico","H2SO4","oxoácido"],
 ["ácido clorhídrico","HCl","hidrácido"],
 ["dióxido de carbono","CO2","óxido molecular"]
];
for(const [name,formula,family] of known){
 const a=c.nameToFormula(name),b=c.formulaToName(formula);
 assert.equal(a.ok,true,name);assert.equal(a.formula,formula);
 assert.equal(b.ok,true,formula);assert.equal(b.name,name);
 assert.equal(a.family,family,formula);
 assert.ok(a.text.length>15);
 if(a.family==="sal binaria"||a.family==="hidróxido"||a.family==="oxisal"||a.family==="óxido")
  assert.match(a.explanation,/\= 0/,"Charge-neutrality explanation required");
}
assert.equal(c.nameToFormula("óxido férrico").formula,"Fe2O3");
assert.equal(c.nameToFormula("óxido ferroso").formula,"FeO");
assert.equal(c.nameToFormula("cloruro de hierro").ambiguous,true);
assert.equal(c.nameToFormula("óxido de hierro").ambiguous,true);
assert.equal(c.formulaToName("NaCl2").invalid,true);
assert.equal(c.formulaToName("CaOH2").invalid,true);
assert.match(c.formulaToName("CaOH2").text,/paréntesis/);
assert.equal(c.formulaToName("FeCl4").ambiguous,true);
assert.equal(c.formulaToName("Xy9").unsupported,true);
assert.equal(c.formulaToName("naCl").invalid,true,"Capitalization matters in elemental symbols");
assert.equal(c.formulaToName("HCl").ok,true);
assert.match(c.formulaToName("HCl").text,/acuosa/);
assert.equal(c.query("¿Cómo se llama Fe2O3?").formula,"Fe2O3");
assert.equal(c.query("¿Cuál es la fórmula de ácido nítrico?").formula,"HNO3");
assert.equal(c.query("Hola").handled,false);
const exercises=c.exercises(6);
assert.equal(exercises.length,6);
assert.equal(exercises.every(e=>e.prompt&&e.answer&&e.reason),true);
assert.ok(c.catalogSize>=60);
console.log("P20 vetted chemistry nomenclature families, valences, acids, charge and abstention: passed");
