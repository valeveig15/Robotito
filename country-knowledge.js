// P21 — fact-checked country/capital questions. Never hardcode a current ruler.
(function(root){
"use strict";
const fold=s=>String(s||"").toLowerCase().normalize("NFD")
 .replace(/[\u0300-\u036f]/g,"").replace(/[¿?¡!.,;:]/g," ")
 .replace(/\s+/g," ").trim();
const locale={"es":"es","en":"en","pt":"pt","fr":"fr","it":"it","de":"de"};
const messages={
 es:{capital:"La capital de {country} es {capital}.",many:"El país {country} registra varias capitales: {capital}.",source:"Fuente: REST Countries; consulta {date}.",unclear:"Hay más de un país o territorio que coincide. Indicá el nombre completo.",none:"No pude identificar ese país en una fuente consultable.",offline:"No pude consultar los datos ahora. No voy a adivinar.",missing:"La fuente no identifica una capital verificable para ese territorio.",unsupported:"Para esa información política o histórica necesito una fuente fechada y corroborada; no voy a inventarla."},
 en:{capital:"The capital of {country} is {capital}.",many:"{country} has several listed capitals: {capital}.",source:"Source: REST Countries; checked {date}.",unclear:"Several countries or territories match. Please provide the full name.",none:"I couldn't identify that country in the source.",offline:"The source is unavailable; I won't guess.",missing:"The source doesn't give a verifiable capital for this territory.",unsupported:"That political or historical claim needs dated, corroborated sources; I won't invent it."},
 pt:{capital:"A capital de {country} é {capital}.",many:"{country} tem várias capitais: {capital}.",source:"Fonte: REST Countries; consulta em {date}.",unclear:"Há vários países ou territórios com esse nome. Informe o nome completo.",none:"Não identifiquei o país na fonte.",offline:"Não consegui consultar a fonte agora. Não vou adivinhar.",missing:"A fonte não apresenta uma capital verificável.",unsupported:"Essa informação política ou histórica exige fontes datadas e verificadas."},
 fr:{capital:"La capitale de {country} est {capital}.",many:"{country} a plusieurs capitales répertoriées : {capital}.",source:"Source : REST Countries ; consultée le {date}.",unclear:"Plusieurs pays ou territoires correspondent. Précise le nom complet.",none:"Je n'ai pas identifié ce pays.",offline:"La source est indisponible ; je ne vais pas deviner.",missing:"La source n'indique pas de capitale vérifiable.",unsupported:"Il faut des sources datées et recoupées pour cette affirmation."},
 it:{capital:"La capitale di {country} è {capital}.",many:"{country} ha più capitali elencate: {capital}.",source:"Fonte: REST Countries; consultata il {date}.",unclear:"Corrispondono più paesi o territori. Specifica il nome completo.",none:"Non ho identificato il paese.",offline:"La fonte non è disponibile; non inventerò la risposta.",missing:"La fonte non riporta una capitale verificabile.",unsupported:"Questa affermazione richiede fonti datate e verificate."},
 de:{capital:"Die Hauptstadt von {country} ist {capital}.",many:"{country} hat mehrere angegebene Hauptstädte: {capital}.",source:"Quelle: REST Countries; geprüft am {date}.",unclear:"Mehrere Länder oder Gebiete passen. Bitte gib den vollständigen Namen an.",none:"Das Land konnte nicht identifiziert werden.",offline:"Die Quelle ist nicht erreichbar; ich rate nicht.",missing:"Keine verifizierbare Hauptstadt in der Quelle.",unsupported:"Für diese Aussage sind datierte, gegengeprüfte Quellen nötig."}
};
function parseQuestion(input){
 const q=fold(input);if(q.length<10||q.length>240)return null;
 const patterns=[
  /^(?:cual es|decime|dime|sabes|donde esta)\s+(?:la\s+)?capital\s+(?:de|del)\s+(.+)$/,
  /^capital\s+(?:de|del)\s+(.+)$/,
  /^(?:what is|what's|tell me|where is)\s+(?:the\s+)?capital\s+of\s+(.+)$/,
  /^(?:qual e|qual a|qual e a)\s+capital\s+(?:de|do|da)\s+(.+)$/,
  /^(?:quelle est|ou est)\s+la\s+capitale\s+de\s+(.+)$/,
  /^(?:qual e|qual è)\s+la\s+capitale\s+di\s+(.+)$/,
  /^(?:was ist|wie heisst)\s+die\s+hauptstadt\s+von\s+(.+)$/
 ];
 for(const re of patterns){const m=q.match(re);if(m)return {kind:"capital",country:m[1].trim()};}
 const generic=q.match(/^(?:capital|capitale|hauptstadt)\s+(.+)$/);
 return generic?{kind:"capital",country:generic[1].trim()}:null;
}
function create({fetcher=root.fetch?.bind(root),now=()=>Date.now()}={}){
 const cache=new Map();
 const fields="name,cca2,capital,region,subregion,independent,translations,altSpellings";
 async function read(url){
  if(typeof fetcher!=="function")throw Error("unavailable");
  const result=await fetcher(url,{headers:{Accept:"application/json"}});
  if(result?.status===404)return []; // A valid no-match is not an outage.
  if(!result?.ok)throw Error("source unavailable");
  const data=await result.json();
  return Array.isArray(data)?data:[];
 }
 const variants=row=>[
  row.name?.common,row.name?.official,...(row.altSpellings||[]),
  ...Object.values(row.translations||{}).flatMap(x=>[x?.common,x?.official])
 ].filter(Boolean).map(fold);
 async function lookup(name){
  const key=fold(name);
  const c=cache.get(key);if(c&&now()-c.at<24*3600000)return c.rows;
  const candidateEndpoints=[
   "https://restcountries.com/v3.1/translation/"+encodeURIComponent(name)+"?fields="+fields,
   "https://restcountries.com/v3.1/name/"+encodeURIComponent(name)+"?fields="+fields
  ];
  const collected=new Map();let successes=0,failed=0;
  for(const url of candidateEndpoints){
   try{
    const rows=await read(url);
    successes++;
    for(const row of rows){
     if(!variants(row).includes(key))continue;
     if(!/^[A-Z]{2}$/.test(row.cca2||""))continue;
     collected.set(row.cca2,row);
    }
    // Continue: the first endpoint can omit a matching country/territory,
    // or return one of several similarly named territories.
   }catch{failed++;}
  }
  if(successes===0&&failed===candidateEndpoints.length)throw Error("offline");
  const candidates=[...collected.values()];
  // Do not cache a partial negative or ambiguity result when a source failed:
  // an outage must not hide countries that might match.
  if(failed===0)cache.set(key,{at:now(),rows:candidates});
  return candidates;
 }
 async function answer(raw,lang="es"){
  const parsed=parseQuestion(raw);if(!parsed)return {handled:false};
  const L=messages[locale[lang]||"es"],day=new Date(now()).toISOString().slice(0,10);
  const result=(text,source=null,more={})=>({handled:true,text,source,checkedAt:day,...more});
  try{
   const matches=await lookup(parsed.country);
   if(matches.length>1)return result(L.unclear,null,{ambiguous:true});
   if(!matches.length)return result(L.none,null,{unknown:true});
   const row=matches[0],capital=Array.isArray(row.capital)?row.capital.filter(Boolean):[];
   if(!capital.length)return result(L.missing,null,{missing:true});
   const langKey={es:"spa",en:"eng",pt:"por",fr:"fra",it:"ita",de:"deu"}[lang]||"spa";
   const country=row.translations?.[langKey]?.common||row.name?.common||parsed.country;
   const title=capital.length>1?L.many:L.capital;
   const sentence=title.replace("{country}",country).replace("{capital}",capital.join(", "));
   const url="https://restcountries.com/v3.1/alpha/"+encodeURIComponent(row.cca2||"");
   return result(sentence+" "+L.source.replace("{date}",day),"REST Countries",{url,capital,cca2:row.cca2});
  }catch{return result(L.offline,null,{error:"source-unavailable"});}
 }
 return {answer,lookup};
}
const api={parseQuestion,create,answer:(...args)=>defaultClient.answer(...args)};
const defaultClient=create();
root.ROBOTITO_COUNTRY_KNOWLEDGE=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
