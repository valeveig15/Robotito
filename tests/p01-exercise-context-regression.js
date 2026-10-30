"use strict";
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const planner=require('../semantic-planner');
const {rows,contextFor}=require('./fixtures/p01-semantic-cases');
const view={innerHTML:''};
const state={classSubject:'Biología',classTopic:'',academicMaterials:[
 {id:'physics',name:'Física',subject:'Física',topic:'Impulso',rawText:'Ejercicio 3: Un cuerpo tiene masa desconocida.\nEjercicio 5: Explica la conservación del impulso.'},
 {id:'biology',name:'Biología',subject:'Biología',topic:'Mitosis',rawText:'Ejercicio 5: Describe la mitosis.\nEjercicio 17: Describe la meiosis.'}
]};
const box={state,document:{querySelector:selector=>selector==='#classAnswer'?view:null},console};box.window=box;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../class-exercises.js'),'utf8'),box);
const api=box.ROBOTITO_CLASS_EXERCISES;
let checks=0;const eq=(a,b,m)=>{assert.equal(a,b,m);checks++;};
(async()=>{
 for(const language of Object.keys(rows)){
  const plan=planner.plan(rows[language].repair[0],{language,context:contextFor(language,'repair','Física')});
  const result=api.findExercise(rows[language].repair[0],plan);
  eq(result.exercise.number,5);eq(result.exercise.subject,'Física','Structured topic wins over current UI subject');
  eq(await api.handleRequest(rows[language].repair[0],{plan,spoken:false}),true);
  assert.match(view.innerHTML,/conservación del impulso/);checks++;
 }
 eq(api.findExercise('Ejercicio 17 de Física').reason,'not-found','Never substitute another subject with the same number');
 const blocked=planner.plan('No me expliques el ejercicio 5');view.innerHTML='UNCHANGED';
 eq(await api.handleRequest('No me expliques el ejercicio 5',{plan:blocked,spoken:false}),false);eq(view.innerHTML,'UNCHANGED');
 const definition=planner.plan('¿Qué es un ejercicio?');
 eq(await api.handleRequest('¿Qué es un ejercicio?',{plan:definition,spoken:false}),false);
 console.log('P01 structured exercise retrieval:',checks,'checks');
})().catch(e=>{console.error(e);process.exitCode=1;});
