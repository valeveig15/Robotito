// P20 — educational nomenclature panel with source-bounded explanations.
(function(root){
"use strict";
let quiz=null;
let next=0;
function init(){
 const input=document.querySelector("#nomenclatureInput"),
  solve=document.querySelector("#nomenclatureSolve"),
  output=document.querySelector("#nomenclatureAnswer"),
  generate=document.querySelector("#nomenclaturePractice"),
  reveal=document.querySelector("#nomenclatureReveal"),
  question=document.querySelector("#nomenclatureExercise");
 if(!input||!solve||!output||!generate||!reveal||!question)return;
 solve.addEventListener("click",()=>{
  const value=input.value.trim();
  if(!value){output.textContent="Escribí un nombre o una fórmula de un compuesto.";return;}
  const api=root.ROBOTITO_CHEM_NOMENCLATURE;
  let r=api?.query?.(value);
  if(!r?.handled){
   r=/^(?:[A-Z][a-z]?\d*|\([A-Z][A-Za-z0-9]*\)\d+)+$/.test(value)?
    api.formulaToName(value):api.nameToFormula(value);
  }
  output.textContent=r?.text||"No fue posible verificar el compuesto.";
 });
 generate.addEventListener("click",()=>{
  const rows=root.ROBOTITO_CHEM_NOMENCLATURE?.exercises?.(6)||[];
  if(!rows.length){question.textContent="Sin ejercicios disponibles.";return;}
  quiz=rows[next++%rows.length];
  question.textContent=quiz.prompt;
  output.textContent="";
  reveal.disabled=false;
 });
 reveal.addEventListener("click",()=>{
  if(!quiz)return;
  output.textContent="Solución: "+quiz.answer+".\n"+quiz.reason;
 });
}
if(root.document)document.addEventListener("DOMContentLoaded",init);
})(typeof window!=="undefined"?window:globalThis);
