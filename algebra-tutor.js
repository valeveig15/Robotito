// Robotito P19 — conservative affine-equation tutor, independent from arithmetic/geometry.
(function(root){
"use strict";
const EPS=1e-10;
const words={cero:0,uno:1,una:1,un:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,
 once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,
 one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
const terms={
 es:{eq:"Ecuación",system:"Sistema",step:"Paso",check:"Comprobación",unique:"Solución",infinite:"La igualdad se cumple para cualquier valor real de la incógnita.",none:"La igualdad es imposible: no tiene solución.",many:"Hay dos incógnitas y solo una ecuación; faltan condiciones para una solución única.",singular:"Este sistema no tiene una solución única.",invalid:"No puedo resolver con seguridad esa expresión. Uso únicamente ecuaciones lineales; comprobá signos, unidades y paréntesis.",divide:"No está definida la división entre cero ni la división por una expresión que contiene incógnitas.",nonlinear:"La expresión no es lineal; no voy a inventar una solución.",unsupported:"Necesito una igualdad con x o y para resolver la ecuación."},
 en:{eq:"Equation",system:"System",step:"Step",check:"Check",unique:"Solution",infinite:"The equation holds for any real value of the unknown.",none:"The equation is inconsistent: there is no solution.",many:"Two unknowns and one equation are not enough for a unique solution.",singular:"The system has no unique solution.",invalid:"I cannot solve this expression reliably. Only linear equations are supported; check signs, units and parentheses.",divide:"Division by zero or by an expression containing unknowns is not supported.",nonlinear:"This expression is not linear; I will not guess a solution.",unsupported:"I need an equality containing x or y."},
 pt:{eq:"Equação",system:"Sistema",step:"Passo",check:"Verificação",unique:"Solução",infinite:"A igualdade vale para qualquer valor real da incógnita.",none:"A igualdade é impossível: não há solução.",many:"Há duas incógnitas e apenas uma equação.",singular:"O sistema não tem solução única.",invalid:"Não consigo resolver esta expressão com segurança. Só aceito equações lineares.",divide:"Divisão por zero ou por expressão com incógnitas não é permitida.",nonlinear:"A expressão não é linear.",unsupported:"Preciso de uma igualdade com x ou y."},
 fr:{eq:"Équation",system:"Système",step:"Étape",check:"Vérification",unique:"Solution",infinite:"Cette égalité est vraie pour toute valeur réelle.",none:"Cette équation est impossible.",many:"Deux inconnues exigent plus de conditions.",singular:"Ce système n'a pas de solution unique.",invalid:"Je ne peux résoudre cette expression de façon fiable. Seules les équations linéaires sont prises en charge.",divide:"La division par zéro ou par une inconnue n'est pas autorisée.",nonlinear:"Cette expression n'est pas linéaire.",unsupported:"Il faut une égalité avec x ou y."},
 it:{eq:"Equazione",system:"Sistema",step:"Passo",check:"Verifica",unique:"Soluzione",infinite:"L'uguaglianza vale per ogni valore reale.",none:"L'equazione è impossibile.",many:"Due incognite richiedono più condizioni.",singular:"Il sistema non ha una soluzione unica.",invalid:"Non posso risolvere in modo affidabile questa espressione. Sono supportate solo equazioni lineari.",divide:"Divisione per zero o per un'espressione contenente incognite non consentita.",nonlinear:"Questa espressione non è lineare.",unsupported:"Serve un'uguaglianza con x o y."},
 de:{eq:"Gleichung",system:"Gleichungssystem",step:"Schritt",check:"Probe",unique:"Lösung",infinite:"Die Gleichung gilt für jeden reellen Wert.",none:"Die Gleichung ist widersprüchlich.",many:"Zwei Unbekannte erfordern weitere Bedingungen.",singular:"Das System hat keine eindeutige Lösung.",invalid:"Ich kann diesen Ausdruck nicht zuverlässig lösen. Nur lineare Gleichungen werden unterstützt.",divide:"Division durch null oder durch einen Ausdruck mit Unbekannten ist nicht zulässig.",nonlinear:"Dieser Ausdruck ist nicht linear.",unsupported:"Ich brauche eine Gleichung mit x oder y."}
};
const close=n=>Math.abs(n)<EPS?0:n;
const fmt=n=>{
 if(!Number.isFinite(n))throw new Error("invalid");
 return String(close(Math.round(n*1e10)/1e10));
};
function preprocess(raw,language){
 let s=String(raw||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
   .replace(/[¿?¡!]/g," ").replace(/−/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/")
   .replace(/,/g,".").trim();
 s=s.replace(/\b(?:cuanto vale|cual es el valor de)\s+([xy])\s+(?:si|cuando)\b/g,"");
 s=s.replace(/^(?:resuelve|resolve|resolveme|resolver|soluciona|solve|calcula|calculame|resolve|resolva)\s*/,"");
 s=s.replace(/^(?:la|el|esta|this|the)\s+(?:ecuacion|equation|sistema|system)\s*(?:de ecuaciones)?\s*/,"");
 if(root.ROBOTITO_SPOKEN_MATH?.replaceNumberWords&&!/[xy]\s+[xy]/.test(s))
   s=root.ROBOTITO_SPOKEN_MATH.replaceNumberWords(s,["es","en","pt"].includes(language)?language:"es");
 s=s.replace(/\b(?:equis)\b/g,"x")
   .replace(/\b(?:mas|plus|mais)\b/g,"+")
   .replace(/\b(?:menos|minus)\b/g,"-")
   .replace(/\b(?:multiplicado por|multiplied by|dividido entre|dividido por)\b/g,m=>m.startsWith("divid")?"/":"*")
   .replace(/\b(?:por|times|vezes)\b/g,"*")
   .replace(/\b(?:es igual a|igual a|equals|equal to|igual)\b/g,"=")
   .replace(/\b(?:y tambien|ademas)\b/g,";");
 s=s.replace(/\b[a-z]+\b/g,m=>Object.hasOwn(words,m)?String(words[m]):m);
 return s.replace(/\s+/g,"").replace(/;+$/,"");
}
const constant=n=>({x:0,y:0,c:n});
const variable=v=>({x:v==="x"?1:0,y:v==="y"?1:0,c:0});
const isConstant=a=>Math.abs(a.x)<EPS&&Math.abs(a.y)<EPS;
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,c:a.c+b.c});
const neg=a=>({x:-a.x,y:-a.y,c:-a.c});
function mul(a,b){
 if(!isConstant(a)&&!isConstant(b))throw new Error("nonlinear");
 const k=isConstant(a)?a.c:b.c,z=isConstant(a)?b:a;
 return {x:z.x*k,y:z.y*k,c:z.c*k};
}
function div(a,b){
 if(!isConstant(b)||Math.abs(b.c)<EPS)throw new Error("divide");
 return {x:a.x/b.c,y:a.y/b.c,c:a.c/b.c};
}
function tokensOf(s){
 const tokens=[];let p=0;
 const re=/\s*(\d+(?:\.\d+)?|[xy()+\-*/])\s*/gy;
 while(p<s.length){
  re.lastIndex=p;const m=re.exec(s);
  if(!m||m.index!==p)throw new Error("invalid");
  const val=m[1],previous=tokens.at(-1);
  if(previous&&(/^(\d|[xy]|\))/.test(previous))&&(/^(\d|[xy]|\()/.test(val))
   && !(previous.match(/^\d/)&&val.match(/^\d/)))tokens.push("*");
  tokens.push(val);p=re.lastIndex;
 }
 return tokens;
}
function expression(s){
 const tokens=tokensOf(s);let i=0;const peek=()=>tokens[i];const take=()=>tokens[i++];
 if(!tokens.length||tokens.length>300)throw new Error("invalid");
 function primary(){
  const t=take();
  if(t==="("){const e=expr();if(take()!==")")throw new Error("invalid");return e;}
  if(t==="x"||t==="y")return variable(t);
  if(/^\d/.test(t||""))return constant(Number(t));
  throw new Error("invalid");
 }
 function unary(){
  if(peek()==="+"){take();return unary();}
  if(peek()==="-"){take();return neg(unary());}
  return primary();
 }
 function product(){
  let v=unary();
  while(peek()==="*"||peek()==="/"){
   const op=take(),rhs=unary();v=op==="*"?mul(v,rhs):div(v,rhs);
  }
  return v;
 }
 function expr(){
  let v=product();
  while(peek()==="+"||peek()==="-"){
   const op=take(),rhs=product();v=op==="+"?add(v,rhs):add(v,neg(rhs));
  }
  return v;
 }
 const result=expr();
 if(i!==tokens.length||!Object.values(result).every(Number.isFinite))throw new Error("invalid");
 return result;
}
function equation(text){
 const parts=text.split("=");
 if(parts.length!==2||!parts[0]||!parts[1])throw new Error("invalid");
 const left=expression(parts[0]),right=expression(parts[1]);
 return {left,right,x:left.x-right.x,y:left.y-right.y,n:right.c-left.c,raw:text};
}
function solve(raw,language="es"){
 const lang=terms[language]||terms.es;
 const source=String(raw||"");
 // Bare digit-x-digit can mean multiplication, not an unknown.
 if(/\d+x\d/i.test(source))return {handled:false};
 if(!/(?:=|\bigual\b|\bequals?\b)/i.test(source)||!/(?:\b[xy]\b|\d+[xy](?![a-z])|\bequis\b)/i.test(source))
  return {handled:false};
 const prepared=preprocess(source,language);
 if(prepared.length>1200)return {handled:true,error:lang.invalid,text:lang.invalid};
 try{
  const parts=prepared.split(";").filter(Boolean);
  if(parts.length<1||parts.length>2)throw new Error("invalid");
  const eqs=parts.map(equation);
  const mentioned=new Set(),active=new Set();
  eqs.forEach(e=>{
   if(e.raw.includes("x"))mentioned.add("x");
   if(e.raw.includes("y"))mentioned.add("y");
   if(Math.abs(e.x)>EPS)active.add("x");
   if(Math.abs(e.y)>EPS)active.add("y");
  });
  if(!mentioned.size)throw new Error("invalid");
  if(eqs.length===1){
   const e=eqs[0],v=active.has("x")?"x":active.has("y")?"y":mentioned.has("x")?"x":"y";
   if(active.size>1)return {handled:true,kind:"underdetermined",text:lang.many};
   const a=e[v],b=e.n;
   if(Math.abs(a)<EPS){
    const text=Math.abs(b)<EPS?lang.infinite:lang.none;
    return {handled:true,kind:Math.abs(b)<EPS?"identity":"contradiction",text};
   }
   const value=b/a;
   if(!Number.isFinite(value))throw new Error("invalid");
   const l=e.left[v]*value+e.left.c,r=e.right[v]*value+e.right.c;
   const verified=Math.abs(l-r)<=1e-7*Math.max(1,Math.abs(l),Math.abs(r));
   if(!verified)throw new Error("invalid");
   const text=lang.eq+": "+e.raw+".\n"+
    lang.step+" 1: "+fmt(a)+v+" = "+fmt(b)+".\n"+
    lang.step+" 2: "+v+" = "+fmt(b)+" / "+fmt(a)+" = "+fmt(value)+".\n"+
    lang.check+": "+fmt(l)+" = "+fmt(r)+".";
   return {handled:true,kind:"linear",variable:v,value,verified,text,steps:3};
  }
  const [a,b]=eqs,det=a.x*b.y-b.x*a.y;
  if(active.size!==2||Math.abs(det)<EPS)
   return {handled:true,kind:"singular",text:lang.singular};
  const x=(a.n*b.y-b.n*a.y)/det,y=(a.x*b.n-b.x*a.n)/det;
  if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error("invalid");
  const checks=eqs.map(e=>Math.abs(e.x*x+e.y*y-e.n)<1e-7*Math.max(1,Math.abs(e.n)));
  if(!checks.every(Boolean))throw new Error("invalid");
  const text=lang.system+": "+a.raw+"; "+b.raw+".\n"+
   lang.step+" 1: "+fmt(a.x)+"x + ("+fmt(a.y)+")y = "+fmt(a.n)+
    " ; "+fmt(b.x)+"x + ("+fmt(b.y)+")y = "+fmt(b.n)+".\n"+
   lang.step+" 2: D = "+fmt(a.x)+"·"+fmt(b.y)+" − "+fmt(b.x)+"·"+fmt(a.y)+" = "+fmt(det)+".\n"+
   lang.step+" 3: x = "+fmt(x)+"; y = "+fmt(y)+".\n"+
   lang.check+": ("+checks.map(x=>x?"✓":"✗").join(", ")+").";
  return {handled:true,kind:"system",x,y,verified:true,text,steps:4};
 }catch(error){
  const text=lang[error.message]||lang.invalid;
  return {handled:true,error:text,kind:"unsupported",text};
 }
}
const api={solve,preprocess,expression,equation};
root.ROBOTITO_ALGEBRA_TUTOR=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
