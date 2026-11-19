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
  hasGoodreads:i>=40, // exactly 40 of 60 do not require an imported Goodreads account
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

/* P36: rules are applied BEFORE scoring, not merely a penalty that could
   recommend a rejected book when the whole catalogue is unsuitable. */
function selectRecommendations(catalog,{profile={},readTitles=[],ownedTitles=[],excludeRead=true,
 onlyOwned=false,lastTitle="",requireEvidence="",limit=3,scoreCandidate=rank}={}){
 if(!Array.isArray(catalog))throw new TypeError("Catalog must be an array");
 if(!Number.isInteger(limit)||limit<1||limit>20)throw new RangeError("Invalid recommendation limit");
 const known=new Set(),read=new Set([...readTitles].map(fold)),owned=new Set([...ownedTitles].map(fold));
 const negatives=[...(profile.negative||[]),profile.avoid].filter(Boolean).map(fold).filter(Boolean);
 const eligible=[];
 for(const book of catalog){
  if(!book||!String(book.title||book.Title||"").trim())continue;
  const title=String(book.title||book.Title),key=uniqueKey(book),titleKey=fold(title);
  if(known.has(key))continue;known.add(key);
  if(excludeRead&&(read.has(titleKey)||read.has(key)))continue;
  if(onlyOwned&&!(owned.has(titleKey)||owned.has(key)))continue;
  const searchable=fold([title,(book.authors||[]).join(" "),(book.categories||[]).join(" "),book.description||""].join(" "));
  if(negatives.some(word=>searchable.includes(word)))continue;
  if(requireEvidence==="cover"&&!/^https:\/\//i.test(String(book.thumbnail||"")))continue;
  if(requireEvidence==="rating"&&!(typeof book.averageRating==="number"&&Number.isFinite(book.averageRating)&&book.averageRating>=0&&book.averageRating<=5))continue;
  if(requireEvidence==="reviews"&&!(Array.isArray(book.attributedReviews)&&book.attributedReviews.some(row=>row&&typeof row.author==="string"&&row.author.trim()&&typeof row.text==="string"&&row.text.trim())))continue;
  if(requireEvidence==="author"&&!(book.authors||[]).length)continue;
  if(requireEvidence==="saga"&&!String(book.series||"").trim())continue;
  const raw=scoreCandidate(book,profile);
  const score=typeof raw==="number"?raw:raw?.score;
  if(!Number.isFinite(score))continue;
  eligible.push({book,score,matched:Array.isArray(raw?.matched)?raw.matched:[],owned:onlyOwned});
 }
 eligible.sort((a,b)=>b.score-a.score||fold(a.book.title||a.book.Title).localeCompare(fold(b.book.title||b.book.Title)));
 const prior=fold(lastTitle);
 if(prior&&eligible.length>1){
  const alternatives=eligible.filter(x=>fold(x.book.title||x.book.Title)!==prior);
  if(alternatives.length)eligible.splice(0,eligible.length,...alternatives,...eligible.filter(x=>fold(x.book.title||x.book.Title)===prior));
 }
 return eligible.slice(0,limit);
}

const api=Object.freeze({fold,isbn,uniqueKey,shelves,categorize,profiles,rank,simulate,selectRecommendations});
root.ROBOTITO_BOOK_POLICY=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
