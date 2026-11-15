// P19 equation tutor interface. Uses textContent, never interprets user math as HTML.
(function(root){
"use strict";
function init(){
 const btn=document.querySelector("#algebraTutorSolve");
 const input=document.querySelector("#algebraTutorInput");
 const output=document.querySelector("#algebraTutorResult");
 if(!btn||!input||!output)return;
 btn.addEventListener("click",()=>{
  const q=input.value.trim();
  if(!q){output.textContent="Escribí una ecuación o sistema.";return;}
  const lang=document.documentElement.lang||"es";
  const result=root.ROBOTITO_ALGEBRA_TUTOR?.solve?.(q,lang);
  output.textContent=result?.handled?result.text:"Para resolver, escribí una igualdad que contenga x o y.";
 });
}
if(root.document)document.addEventListener("DOMContentLoaded",init);
})(typeof window!=="undefined"?window:globalThis);
