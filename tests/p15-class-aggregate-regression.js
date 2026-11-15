"use strict";
const assert=require("node:assert/strict");
const {build}=require("../class-summary-aggregate.js");
const lines=[
{id:"l1",sessionId:"s1",subject:"Biología",topic:"Membranas",at:1000,text:"La membrana regula el intercambio de sustancias entre compartimentos."},
{id:"l2",sessionId:"s2",subject:"Biología",topic:"Membranas",at:2000,text:"La membrana incluye proteínas que facilitan el transporte de moléculas."},
{id:"l3",sessionId:"s3",subject:"Biología",topic:"Orgánulos",at:3000,text:"La mitocondria participa en el metabolismo energético celular."},
{id:"l4",sessionId:"s4",subject:"Física",topic:"Dinámica",at:4000,text:"Una aceleración proviene de una fuerza neta sobre el cuerpo."}
];
const materials=[
{id:"m1",name:"Apuntes.md",subject:"Biología",topic:"Membranas",chunks:["La membrana tiene lípidos y proteínas que intervienen en el transporte."],exercises:[{text:"Explicá cómo se transportan moléculas."}]},
{id:"m2",name:"Privado.txt",subject:"Física",topic:"Dinámica",chunks:["Información completamente ajena a la materia consultada."]}
];
let x=build({subject:"Biología",topic:"Membranas",lines,materials,level:"long"});
assert.equal(x.ok,true);assert.equal(x.sessionCount,2);assert.equal(x.materialCount,1);
assert.equal(x.lineCount,2);assert.equal(x.exercises.length,1);
assert.equal(x.important.every(y=>y.source.subject==="Biología"&&y.source.topic==="Membranas"),true);
assert.equal(x.important.some(y=>y.text.includes("Física")),false);
assert.equal(x.important.some(y=>y.source.type==="material"&&y.source.chunk===1),true);
const before=x.sourceCount;
materials[0].chunks.push("Las proteínas forman canales y transportadores en la membrana plasmática.");
x=build({subject:"Biología",topic:"Membranas",lines,materials,level:"long"});
assert.equal(x.sourceCount,before+1,"New file content must appear without stale summary cache");
const all=build({subject:"Biología",lines,materials});
assert.equal(all.sessionCount,3,"Whole-subject summary spans topics");
assert.equal(all.important.some(y=>y.source.topic==="Orgánulos"),true);
assert.equal(all.important.some(y=>y.source.subject==="Física"),false);
assert.equal(build({subject:"Física",topic:"Sin tema",lines,materials}).ok,false);
assert.equal(build({subject:"",lines,materials}).reason,"subject-required");
assert.ok(build({subject:"Biología",lines,materials,level:"short"}).important.length<=4);
assert.equal(build({subject:"Biología",lines,materials,level:"long"}).important.length>=
 build({subject:"Biología",lines,materials,level:"short"}).important.length,true);
console.log("P15 cumulative subject/topic source-linked aggregation: passed");
