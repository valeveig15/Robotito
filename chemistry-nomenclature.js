// Robotito P20 — curated introductory inorganic nomenclature, with uncertainty.
(function(root){
"use strict";
const C={
 Na:{symbol:"Na",charge:1,name:"sodio"},K:{symbol:"K",charge:1,name:"potasio"},
 Ca:{symbol:"Ca",charge:2,name:"calcio"},Mg:{symbol:"Mg",charge:2,name:"magnesio"},
 Ba:{symbol:"Ba",charge:2,name:"bario"},Al:{symbol:"Al",charge:3,name:"aluminio"},
 Zn:{symbol:"Zn",charge:2,name:"zinc"},Ag:{symbol:"Ag",charge:1,name:"plata"},
 FeII:{symbol:"Fe",charge:2,name:"hierro(II)"},FeIII:{symbol:"Fe",charge:3,name:"hierro(III)"},
 CuI:{symbol:"Cu",charge:1,name:"cobre(I)"},CuII:{symbol:"Cu",charge:2,name:"cobre(II)"},
 NH4:{symbol:"NH4",charge:1,name:"amonio",poly:true}
};
const A={
 Cl:{symbol:"Cl",charge:-1,name:"cloruro",family:"sal binaria"},
 F:{symbol:"F",charge:-1,name:"fluoruro",family:"sal binaria"},
 Br:{symbol:"Br",charge:-1,name:"bromuro",family:"sal binaria"},
 I:{symbol:"I",charge:-1,name:"yoduro",family:"sal binaria"},
 O:{symbol:"O",charge:-2,name:"óxido",family:"óxido"},
 S:{symbol:"S",charge:-2,name:"sulfuro",family:"sal binaria"},
 OH:{symbol:"OH",charge:-1,name:"hidróxido",family:"hidróxido",poly:true},
 SO4:{symbol:"SO4",charge:-2,name:"sulfato",family:"oxisal",poly:true},
 NO3:{symbol:"NO3",charge:-1,name:"nitrato",family:"oxisal",poly:true},
 CO3:{symbol:"CO3",charge:-2,name:"carbonato",family:"oxisal",poly:true},
 PO4:{symbol:"PO4",charge:-3,name:"fosfato",family:"oxisal",poly:true}
};
const combinations=[
 ["Na","Cl"],["K","Cl"],["Ca","Cl"],["Mg","Cl"],["Al","Cl"],["FeII","Cl"],["FeIII","Cl"],["CuI","Cl"],["CuII","Cl"],["Ag","Cl"],
 ["Na","Br"],["K","Br"],["Ca","F"],["Na","I"],
 ["Na","O"],["K","O"],["Ca","O"],["Mg","O"],["Al","O"],["FeII","O"],["FeIII","O"],["CuI","O"],["CuII","O"],["Zn","O"],["Ag","O"],
 ["Na","OH"],["K","OH"],["Ca","OH"],["Mg","OH"],["Al","OH"],["FeII","OH"],["FeIII","OH"],["CuII","OH"],["Zn","OH"],["Ba","OH"],
 ["Na","SO4"],["K","SO4"],["Ca","SO4"],["Mg","SO4"],["Al","SO4"],["FeII","SO4"],["FeIII","SO4"],["CuII","SO4"],["NH4","SO4"],
 ["Na","NO3"],["K","NO3"],["Ca","NO3"],["Al","NO3"],["FeIII","NO3"],["CuII","NO3"],["Ag","NO3"],["NH4","NO3"],
 ["Na","CO3"],["K","CO3"],["Ca","CO3"],["Mg","CO3"],["FeII","CO3"],["NH4","CO3"],
 ["Na","PO4"],["Ca","PO4"],["Al","PO4"],["NH4","PO4"],
 ["Na","S"],["FeII","S"],["FeIII","S"],["Zn","S"],["CuII","S"],["K","S"]
];
const gcd=(a,b)=>b?gcd(b,a%b):a;
const fold=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
 .replace(/\s*\(\s*([ivx]+)\s*\)/gi,"($1)").replace(/\s+/g," ").trim();
function ionFormula(c,a){
 const g=gcd(c.charge,-a.charge),n=-a.charge/g,m=c.charge/g;
 const part=(ion,k)=>ion.poly&&k>1?"("+ion.symbol+")"+k:ion.symbol+(k>1?String(k):"");
 return part(c,n)+part(a,m);
}
const table=combinations.map(([ck,ak])=>{
 const c=C[ck],a=A[ak];
 return {formula:ionFormula(c,a),name:a.name+" de "+c.name,cation:c,anion:a,
  family:a.family,counts:{cation:-a.charge/gcd(c.charge,-a.charge),anion:c.charge/gcd(c.charge,-a.charge)}};
});
const acids=[
 {formula:"HCl",name:"ácido clorhídrico",family:"hidrácido",note:"El nombre ácido clorhídrico corresponde a HCl en disolución acuosa."},
 {formula:"H2S",name:"ácido sulfhídrico",family:"hidrácido",note:"El nombre de ácido corresponde a H2S en disolución acuosa."},
 {formula:"HNO3",name:"ácido nítrico",family:"oxoácido"},
 {formula:"H2SO4",name:"ácido sulfúrico",family:"oxoácido"},
 {formula:"H2CO3",name:"ácido carbónico",family:"oxoácido"},
 {formula:"H3PO4",name:"ácido fosfórico",family:"oxoácido"}
];
const molecular=[
 {formula:"CO2",name:"dióxido de carbono",family:"óxido molecular"},
 {formula:"CO",name:"monóxido de carbono",family:"óxido molecular"},
 {formula:"SO2",name:"dióxido de azufre",family:"óxido molecular"},
 {formula:"SO3",name:"trióxido de azufre",family:"óxido molecular"},
 {formula:"N2O5",name:"pentóxido de dinitrógeno",family:"óxido molecular"},
 {formula:"H2O",name:"agua (óxido de dihidrógeno)",family:"óxido molecular"}
];
const entries=[...table,...acids,...molecular];
const aliases={
 "oxido ferroso":"FeO","oxido ferrico":"Fe2O3",
 "cloruro ferroso":"FeCl2","cloruro ferrico":"FeCl3",
 "oxido cuproso":"Cu2O","oxido cuprico":"CuO",
 "sulfato cuprico":"CuSO4","acido muriatico":"HCl",
 "agua":"H2O"
};
function explain(entry){
 if(!entry.cation)return entry.note||("Familia: "+entry.family+". Nombre de referencia del catálogo.");
 const c=entry.cation,a=entry.anion,n=entry.counts.cation,m=entry.counts.anion;
 return "Familia: "+entry.family+". El ion "+c.symbol+" tiene carga +"+c.charge+
  " y "+a.symbol+" tiene carga "+a.charge+". "+
  n+" × (+"+c.charge+") + "+m+" × ("+a.charge+") = 0; "+
  "la proporción mínima neutraliza las cargas. "+
  (/[IVX]/.test(c.name)?"El número romano especifica el estado de oxidación del metal.":"");
}
function result(entry){
 return {handled:true,ok:true,formula:entry.formula,name:entry.name,family:entry.family,
  explanation:explain(entry),
  text:entry.formula+" — "+entry.name+".\n"+explain(entry)};
}
function nameToFormula(name){
 const normalized=fold(name).replace(/^la formula (?:quimica )?de\s+/,"");
 const alias=aliases[normalized];
 const found=entries.find(e=>fold(e.name)===normalized)||entries.find(e=>e.formula===alias);
 if(found)return result(found);
 if(/(?:hierro|cobre)\s*$/.test(normalized))
  return {handled:true,ok:false,ambiguous:true,text:"Falta el número de oxidación: indicá hierro(II), hierro(III), cobre(I) o cobre(II), según corresponda."};
 return {handled:true,ok:false,unsupported:true,text:"Ese nombre no está en mi catálogo verificado de nomenclatura. No voy a inventar una fórmula; verificá la familia y el estado de oxidación."};
}
function formulaToName(formula){
 formula=String(formula||"").trim().replace(/\s+/g,"");
 const known=entries.find(e=>e.formula===formula);
 if(known)return result(known);
 if(!/^(?:[A-Z][a-z]?\d*|\([A-Z][A-Za-z0-9]*\)\d+)+$/.test(formula))
  return {handled:true,ok:false,invalid:true,text:"No reconozco una fórmula química bien escrita. Revisá mayúsculas, subíndices y paréntesis."};
 const missing=table.filter(e=>e.formula!==formula&&e.formula.replace(/[()]/g,"")===formula);
 if(missing.length===1)
  return {handled:true,ok:false,invalid:true,text:"Faltan paréntesis para conservar el ion poliatómico: escribí "+missing[0].formula+" ("+missing[0].name+")."};
 // An explicitly covered polyatomic ion with the wrong charge balance
 // is not an unknown molecule; identify the expected smallest ionic ratio.
 const polyMatches=table.filter(e=>e.anion.poly&&e.cation.symbol!=="NH4"&&
  e.formula!==formula).filter(e=>{
   const c=e.cation.symbol,a=e.anion.symbol;
   const cpart=c.replace(/[.*+?^${}()|[\]\\]/g,"\\ const simple=formula.match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/);");
   const apart=a.replace(/[.*+?^${}()|[\]\\]/g,"\\ const simple=formula.match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/);");
   return new RegExp("^"+cpart+"(?:[2-9]\\d*)?(?:\\("+apart+"\\)(?:[2-9]\\d*)?|"+apart+")$").test(formula);
 });
 if(polyMatches.length===1)
  return {handled:true,ok:false,invalid:true,
   text:"La proporción no neutraliza las cargas de esos iones. Revisá "+
    polyMatches[0].formula+" ("+polyMatches[0].name+")."};
 const simple=formula.match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/);
 if(simple){
  const likely=table.filter(e=>e.cation.symbol===simple[1]&&e.anion.symbol===simple[3]);
  if(likely.length===1)
   return {handled:true,ok:false,invalid:true,text:"Para esos iones la proporción indicada no neutraliza las cargas. Revisá el ejemplo "+likely[0].formula+" ("+likely[0].name+")."};
  if(likely.length>1)
   return {handled:true,ok:false,ambiguous:true,text:"Hay varios estados de oxidación posibles. Revisá la carga del metal antes de fijar los subíndices."};
 }
 return {handled:true,ok:false,unsupported:true,text:"La fórmula parece sintácticamente posible, pero no está en el catálogo confirmado. No puedo clasificarla como correcta ni incorrecta sin más evidencia."};
}
function query(raw){
 const text=String(raw||"").trim().replace(/^[¿?]\s*/,"").replace(/\?$/,"");
 if(!text)return {handled:false};
 const normalized=text.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const formula=normalized.match(/^(?:nombra|nombre de|como se llama|que nombre tiene)\s+([A-Za-z0-9()]+)\??$/i);
 if(formula)return formulaToName(formula[1]);
 const name=normalized.match(/^(?:formula (?:quimica )?de|escribe la formula de|como se formula|cual es la formula de)\s+(.+)$/i);
 if(name)return nameToFormula(name[1]);
 if(/^(?:[A-Z][a-z]?\d*|\([A-Z][A-Za-z0-9]*\)\d+)+$/.test(text))return formulaToName(text);
 return {handled:false};
}
function exercises(count=6){
 const selected=[table.find(e=>e.formula==="NaCl"),table.find(e=>e.formula==="Ca(OH)2"),
  table.find(e=>e.formula==="Fe2O3"),table.find(e=>e.formula==="Al2(SO4)3"),
  acids.find(e=>e.formula==="H2SO4"),molecular.find(e=>e.formula==="CO2")].filter(Boolean);
 return selected.slice(0,Math.max(0,Math.min(6,Number(count)||6))).map((e,i)=>({
  prompt:i%2===0?"Escribí la fórmula de "+e.name+".":"Nombrá la fórmula "+e.formula+".",
  answer:i%2===0?e.formula:e.name,reason:explain(e),family:e.family
 }));
}
const api={nameToFormula,formulaToName,query,exercises,formulaFor:ionFormula,
 catalogSize:entries.length};
root.ROBOTITO_CHEM_NOMENCLATURE=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
