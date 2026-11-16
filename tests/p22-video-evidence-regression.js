"use strict";
const assert=require("node:assert/strict");
const {createStore,segmentCaptions,captionTime}=require("../video-evidence.js");
const data=new Map();
const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
const timestamp="00:00:01,500 --> 00:00:04,000";
assert.equal(captionTime("00:00:01,500"),1.5);
assert.equal(captionTime("00:61:01,000"),null);
const segments=segmentCaptions("WEBVTT\n\n00:00:01.500 --> 00:00:03.000\nLa célula tiene membrana.\n\n00:00:04.000 --> 00:00:06.000\nRegula el transporte.");
assert.equal(segments.length,2);
assert.equal(segments[0].atSec,1.5);
assert.equal(segments.every(s=>s.complete===false),true);
assert.deepEqual(segmentCaptions("WEBVTT\n\n00:00:10.000 --> 00:00:05.000\nContenido fuera de orden."),
 [],"A reversed subtitle cue must not be imported as spoken evidence");
assert.deepEqual(segmentCaptions("00:00:10.000 --> tiempo inválido\nSupuesto audio."),
 [],"Malformed cue headers must not be treated as untimed speech");
assert.equal(segmentCaptions("WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nTexto válido.\n\n00:00:09.000 --> 00:00:05.000\nTexto descartado.").length,
 1,"Mixed valid and invalid cues import only validated timings");
const plain=segmentCaptions("El transporte activo requiere energía. La membrana tiene proteínas.");
assert.equal(plain[0].atSec,null,"Pasted un-timed captions cannot acquire fabricated timestamps");
let now=1234,store=createStore({storage,now:()=>now});
const common={sourceId:"yt-12345678",sourceUrl:"https://www.youtube.com/watch?v=abcdefghijk",
 title:"Clase de Biología",subject:"Biología",topic:"Membrana",owner:"local",consent:true};
assert.throws(()=>store.addBatch({...common,consent:false,items:[{kind:"heard",capture:true,text:"Un ejemplo de prueba"}]}),/permiso/);
assert.throws(()=>store.addBatch({...common,items:[{kind:"heard",text:"Esto no se escuchó realmente"}]}),/subtítulos/);
assert.equal(store.addBatch({...common,items:segments.map(s=>({...s,kind:"provided-caption"}))}),2);
assert.equal(store.addBatch({...common,items:[
 {kind:"seen",text:"Teléfono",score:.62,samples:1,atSec:10},
 {kind:"seen",text:"Libro",score:.84,samples:3,atSec:20},
 {kind:"heard",text:"La membrana celular regula el intercambio.",capture:true,atSec:8}
]}),2,"Uncertain one-frame object must not be saved as seen");
assert.equal(store.addBatch({...common,subject:"Física",items:[
 {kind:"heard",text:"La energía cinética se conserva en el choque.",capture:true}
]}),1);
assert.equal(store.addBatch({...common,subject:"Biología",topic:"Mitocondria",items:[
 {kind:"provided-caption",text:"La respiración produce ATP."}
]}),1);
const query=store.search({subject:"Biología",topic:"Membrana",query:"membrana"});
assert.equal(query.length,2,"Only query-matching evidence in the selected subject/topic");
assert.equal(query.every(x=>x.subject==="Biología"&&x.topic==="Membrana"),true);
assert.equal(query.some(x=>x.kind==="heard"),true);
const noMatch=store.search({subject:"Química",query:"membrana"});
assert.deepEqual(noMatch,[],"No fallback into unrelated academic material");
assert.equal(store.search({subject:"Biología",topic:"Membrana"}).length,4);
assert.equal(createStore({storage}).snapshot().length,6,"Data survives reload");
const oldCount=store.snapshot().length;
const failure=createStore({storage:{getItem:()=>data.get("robotito.videoEvidence.v1"),setItem:()=>{throw Error("QuotaExceeded")}}});
assert.throws(()=>failure.addBatch({...common,items:[{kind:"heard",text:"No puede guardarse",capture:true}]}),/QuotaExceeded/);
assert.equal(failure.snapshot().length,oldCount,"Failed write cannot mutate the in-memory snapshot");
assert.throws(()=>store.addBatch({...common,items:[{kind:"inferred",text:"Predicción",atSec:-2}]}),/temporal/);
assert.equal(store.removeSource("yt-12345678"),0,"Source removal is scoped and complete");
assert.equal(createStore({storage}).snapshot().length,0);
console.log("P22 consent, caption timing, visual uncertainty, class scope, persistence and source deletion: passed");
