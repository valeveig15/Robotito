// P39–P40: local reading circles, structured ratings and fair unread-book draw.
// Sharing uses explicit exports: there is no claimed live multi-device service.
(function(root){
"use strict";
const MAX_CLUBS=40,MAX_RATINGS=1000;
const aspects=["trama","personajes","mundo","escritura","ritmo"];
const normalize=s=>String(s||"").trim().slice(0,300);
function validateRating(input){
 const values={};
 for(const key of aspects){
  const num=Number(input?.[key]);
  if(!Number.isInteger(num)||num<1||num>5)throw new RangeError("Rating must be 1–5: "+key);
  values[key]=num;
 }
 return values;
}
function randomIndex(length,randomBytes){
 if(!Number.isInteger(length)||length<1||length>65536)throw new RangeError("Invalid count");
 const source=randomBytes||(()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0];});
 const range=2**32,cutoff=range-range%length;
 for(let i=0;i<100;i++){const value=source();if(Number.isInteger(value)&&value>=0&&value<cutoff)return value%length;}
 throw Error("Random source failed");
}
function draw(books,{excludeLast=""}={},source){
 const available=(books||[]).filter(book=>book&&normalize(book.Title||book.title)&&
  String(book["Exclusive Shelf"]||book.shelf||"to-read").toLowerCase()==="to-read");
 const unique=new Map();
 for(const book of available){
  const key=(normalize(book.Title||book.title)+"|"+normalize(book.Author||book.author)).toLowerCase();
  if(!unique.has(key))unique.set(key,book);
 }
 const pool=[...unique.values()];
 if(!pool.length)return null;
 const choices=pool.length>1?pool.filter(book=>normalize(book.Title||book.title)!==excludeLast):pool;
 const eligible=choices.length?choices:pool;
 return eligible[randomIndex(eligible.length,source)];
}
function validateExport(input){
 if(!input||input.format!=="robotito-reading-circle"||input.version!==1)throw Error("Invalid reading-circle export");
 if(!Array.isArray(input.clubs)||input.clubs.length>MAX_CLUBS)throw Error("Invalid clubs");
 const clubs=input.clubs.map(row=>{
  if(!row||typeof row.name!=="string"||!row.name.trim()||typeof row.book!=="string"||!row.book.trim())throw Error("Invalid club entry");
  return {id:normalize(row.id)||"import:"+crypto.randomUUID(),name:normalize(row.name),
   book:normalize(row.book),meeting:/^\d{4}-\d{2}-\d{2}$/.test(row.meeting||"")?row.meeting:"",
   notes:normalize(row.notes||""),updatedAt:Number(row.updatedAt)||Date.now()};
 });
 return clubs;
}
const api={aspects,validateRating,randomIndex,draw,validateExport,MAX_CLUBS,MAX_RATINGS};
root.ROBOTITO_READING_POLICY=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
