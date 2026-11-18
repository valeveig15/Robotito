"use strict";
const assert=require("node:assert/strict");
const p=require("../book-extras-policy.js");
const profiles=p.profiles(60);
assert.equal(profiles.length,60);
assert.equal(new Set(profiles.map(x=>x.id)).size,60);
assert.equal(new Set(profiles.map(x=>x.language)).size,6);
assert.equal(new Set(profiles.map(x=>x.interest)).size,10);
assert.equal(new Set(profiles.map(x=>x.avoid)).size,5);
assert.equal(new Set(profiles.map(x=>x.length)).size,3);
assert.ok(profiles.some(x=>x.excludeRead)&&profiles.some(x=>!x.excludeRead));
assert.ok(profiles.some(x=>x.onlyOwned)&&profiles.some(x=>!x.onlyOwned));
assert.deepEqual(p.profiles(60),profiles,"Synthetic QA is deterministic");
assert.throws(()=>p.profiles(49),/50/);
assert.equal(p.isbn("978-0-306-40615-7"),"9780306406157");
assert.equal(p.isbn("0-306-40615-2"),"0306406152");
assert.equal(p.isbn("9780306406158"),"");
assert.equal(p.isbn("0000"),"");
assert.equal(p.categorize({"Exclusive Shelf":"read"}),"read");
assert.equal(p.categorize({"Exclusive Shelf":"currently-reading"}),"currently-reading");
assert.equal(p.categorize({"Exclusive Shelf":"to-read"}),"to-read");
assert.equal(p.uniqueKey({Title:"El Árbol",Author:"A"}),p.uniqueKey({Title:"El arbol",Author:"A"}));
assert.notEqual(p.uniqueKey({Title:"El arbol",Author:"A"}),p.uniqueKey({Title:"El arbol",Author:"B"}));
const catalog=[
 {title:"Fantasy in the moonlit woods",authors:["Ada"],categories:["fantasy","cozy"],description:"short"},
 {title:"Murder on a dark train",authors:["Bea"],categories:["mystery","horror"],description:"long"},
 {title:"A future love story",authors:["Cam"],categories:["science fiction","romance"],description:"medium"},
 {title:"Greek myth adventures",authors:["Dan"],categories:["mythology","adventure"],description:"short"},
 {title:"History and laughter",authors:["Eve"],categories:["historical","humor"],description:"long"}
];
const result=p.simulate(catalog,profiles);
assert.equal(result.length,60);
assert.ok(result.every(x=>x.top&&Number.isFinite(x.score)));
assert.deepEqual(result,p.simulate(catalog,profiles));
const rank=p.rank({title:"Fantasy",authors:[],categories:["fantasy"],description:"short"},profiles[0]);
assert.ok(Number.isFinite(rank));
console.log("P36–P38: 60 independent synthetic readers, diversity, reproducibility, ISBN, shelves and scoring passed");
