// P36–P38: pure book validation, library identity and deterministic reader simulation.
(function(root){
"use strict";
const fold=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
function isbn(value){
 const raw=String(value||"").replace(/[^0-9Xx]/g,"").toUpperCase();
 if(/^\d{13}$/.test(raw)){
  const sum=[...raw].reduce((s,d,i)=>s+Number(d)*(i%2?3:1),0);
  return sum%10===0?raw:"";
 }
 if(/^\d{9}[\dX]$/.test(raw)){
  const sum=[...raw].reduce((s,d,i)=>s+(d==="X"?10:Number(d))*(10-i),0);
  return sum%11===0?raw:"";
 }
 return "";
}
function uniqueKey(book){
 const valid=isbn(book.ISBN||book.isbn||"");
 return valid?"isbn:"+valid:"title:"+fold(book.Title||book.title)+"|"+fold(book.Author||book.author||book.authors?.[0]);
}
const shelves=Object.freeze([
 {key:"read",name:"Leídos",ornament:"🌿",color:"mint"},
 {key:"currently-reading",name:"Leyendo",ornament:"☕",color:"blue"},
 {key:"to-read",name:"Por leer",ornament:"🌙",color:"lavender"}
]);
function categorize(book){
 const value=fold(book["Exclusive Shelf"]||book.shelf||"");
 return value==="read"?"read":value==="currently reading"?"currently-reading":"to-read";
}
const themes=["fantasy","mystery","romance","science fiction","historical","horror","adventure","humor","cozy","mythology"];
const dislikes=["violence","sad ending","long book","love triangle","horror"];
const lengths=["short","medium","long"];
function profiles(count=60){
 if(!Number.isInteger(count)||count<50||count>1000)throw Error("At least 50 distinct simulated reader profiles required");
 return Array.from({length:count},(_,i)=>({
  id:"synthetic-reader-"+String(i+1).padStart(3,"0"),
  interest:themes[i%themes.length],
  secondInterest:themes[(i*3+2)%themes.length],
  avoid:dislikes[(Math.floor(i/themes.length)+i)%dislikes.length],
  length:lengths[(i+Math.floor(i/7))%lengths.length],
  excludeRead:i%3!==0,
  onlyOwned:i%5===0,
  language:["es","en","pt","fr","it","de"][i%6]
 }));
}
function rank(candidate,profile){
 const text=fold([candidate.title,(candidate.authors||[]).join(" "),(candidate.categories||[]).join(" "),candidate.description].join(" "));
 let value=0;
 if(text.includes(fold(profile.interest)))value+=6;
 if(text.includes(fold(profile.secondInterest)))value+=3;
 if(text.includes(fold(profile.avoid)))value-=12;
 if(text.includes(fold(profile.length)))value+=2;
 return value;
}
function simulate(catalog,readers=profiles()){
 if(!Array.isArray(catalog)||!catalog.length)throw Error("Catalog required");
 return readers.map(profile=>{
  const scored=catalog.filter(book=>book?.title).map(book=>({book,score:rank(book,profile)}))
    .sort((a,b)=>b.score-a.score||String(a.book.title).localeCompare(String(b.book.title)));
  return {id:profile.id,language:profile.language,interest:profile.interest,avoid:profile.avoid,
   top:scored[0]?.book.title||null,score:scored[0]?.score??null};
 });
}
const api=Object.freeze({fold,isbn,uniqueKey,shelves,categorize,profiles,rank,simulate});
root.ROBOTITO_BOOK_POLICY=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
