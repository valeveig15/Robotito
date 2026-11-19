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

// P36 acceptance: 60 distinct readers, >=40 without Goodreads, exclusion and
// evidence requests (cover, attributed review, ratings, author and saga).
assert.equal(profiles.filter(x=>!x.hasGoodreads).length,40);
const rich=[
 ...catalog.map((book,i)=>({...book,thumbnail:i%2===0?"https://covers.example/"+i+".jpg":"",
   averageRating:i%2===0?4.5:null,attributedReviews:i===1?[{author:"Test reader",text:"An attributed review"}]:[],
   series:i===2?"A future saga":"",source:"synthetic-test-catalog"})),
 {title:"Fantasy in the moonlit woods",authors:["Ada"],categories:["fantasy"],description:"short",thumbnail:"https://example.test/duplicate.jpg"}
];
const prior="Fantasy in the moonlit woods";
const baseOpts={profile:profiles[0],readTitles:[prior],excludeRead:true};
let chosen=p.selectRecommendations(rich,baseOpts);
assert.ok(chosen.length>0&&chosen.every(x=>x.book.title!==prior));
assert.equal(new Set(chosen.map(x=>p.uniqueKey(x.book))).size,chosen.length);
assert.ok(chosen.every(x=>!p.fold(x.book.description).includes(p.fold(profiles[0].avoid))));
const owned=p.selectRecommendations(rich,{profile:profiles[0],onlyOwned:true,ownedTitles:["Greek myth adventures"],limit:3});
assert.deepEqual(owned.map(x=>x.book.title),["Greek myth adventures"]);
assert.deepEqual(p.selectRecommendations(rich,{profile:profiles[0],onlyOwned:true,ownedTitles:[]}),[]);
assert.deepEqual(p.selectRecommendations(rich,{profile:{negative:["fantasy"]},readTitles:[],excludeRead:false}).some(x=>x.book.title===prior),false);
assert.ok(p.selectRecommendations(rich,{profile:{},requireEvidence:"cover"}).every(x=>x.book.thumbnail.startsWith("https://")));
assert.ok(p.selectRecommendations(rich,{profile:{},requireEvidence:"rating"}).every(x=>typeof x.book.averageRating==="number"));
assert.deepEqual(p.selectRecommendations(rich,{profile:{},requireEvidence:"reviews"}).map(x=>x.book.title),["Murder on a dark train"]);
assert.deepEqual(p.selectRecommendations(rich,{profile:{},requireEvidence:"saga"}).map(x=>x.book.title),["A future love story"]);
assert.ok(p.selectRecommendations(rich,{profile:{},requireEvidence:"author"}).every(x=>x.book.authors.length>0));
const first=p.selectRecommendations(catalog,{profile:{},limit:1})[0].book.title;
const next=p.selectRecommendations(catalog,{profile:{},lastTitle:first,limit:1})[0].book.title;
assert.notEqual(first,next,"Prevent immediate repeats when alternatives exist");
let scenarios=0;
for(let i=0;i<profiles.length;i++){
 const reader=profiles[i],readTitle=catalog[i%catalog.length].title,ownedTitle=catalog[(i+1)%catalog.length].title;
 for(const evidence of ["","cover","rating","reviews","author","saga"]){
  const options={profile:reader,readTitles:[readTitle],ownedTitles:[ownedTitle],
   excludeRead:true,onlyOwned:i%5===0,requireEvidence:evidence};
  const suggestion=p.selectRecommendations(rich,options);
  assert.ok(suggestion.every(x=>x.book.title!==readTitle));
  assert.ok(suggestion.every(x=>!p.fold([x.book.title,x.book.description,(x.book.categories||[]).join(" ")].join(" ")).includes(p.fold(reader.avoid))));
  if(options.onlyOwned)assert.ok(suggestion.every(x=>x.book.title===ownedTitle));
  scenarios++;
 }
}
assert.equal(scenarios,360);
assert.throws(()=>p.selectRecommendations(null),TypeError);
assert.throws(()=>p.selectRecommendations(catalog,{limit:0}),RangeError);

console.log("P36: 60 readers, 40 without Goodreads, 360 source-and-restriction scenarios passed");
console.log("P36–P38: 60 independent synthetic readers, diversity, reproducibility, ISBN, shelves and scoring passed");
