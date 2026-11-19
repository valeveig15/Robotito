"use strict";
const assert=require("node:assert/strict");
const p=require("../reading-clubs-policy.js");
assert.deepEqual(p.validateRating({trama:5,personajes:4,mundo:3,escritura:2,ritmo:1}),
 {trama:5,personajes:4,mundo:3,escritura:2,ritmo:1});
assert.throws(()=>p.validateRating({trama:0,personajes:4,mundo:3,escritura:2,ritmo:1}),RangeError);
assert.throws(()=>p.validateRating({trama:5,personajes:4,mundo:3,escritura:2,ritmo:6}),RangeError);
assert.throws(()=>p.validateRating({trama:1.5,personajes:4,mundo:3,escritura:2,ritmo:1}),RangeError);
assert.equal(p.randomIndex(3,()=>5),2);
assert.equal(p.randomIndex(1,()=>0),0);
assert.throws(()=>p.randomIndex(0),RangeError);
const books=[
 {Title:"Leído",Author:"A","Exclusive Shelf":"read"},
 {Title:"Pendiente A",Author:"B","Exclusive Shelf":"to-read"},
 {Title:"Pendiente B",Author:"C","Exclusive Shelf":"to-read"},
 {Title:"Pendiente A",Author:"B","Exclusive Shelf":"to-read"}
];
assert.equal(p.draw(books,{},()=>0).Title,"Pendiente A");
assert.equal(p.draw(books,{excludeLast:"Pendiente A"},()=>0).Title,"Pendiente B");
assert.equal(p.draw([books[0]]),null);
assert.equal(p.draw([books[1]],{excludeLast:"Pendiente A"},()=>0).Title,"Pendiente A");
assert.throws(()=>p.validateExport({format:"wrong",version:1,clubs:[]}),/Invalid/);
const accepted=p.validateExport({format:"robotito-reading-circle",version:1,
 clubs:[{id:"x",name:"Club del bosque",book:"Libro 1",meeting:"2026-12-01",notes:"leer"}]});
assert.equal(accepted.length,1);assert.equal(accepted[0].meeting,"2026-12-01");
assert.throws(()=>p.validateExport({format:"robotito-reading-circle",version:1,
 clubs:[{name:"",book:"Libro"}]}),/Invalid/);
console.log("P39–P40: ratings, fair draw, read exclusion, no repeats, import validation passed");
