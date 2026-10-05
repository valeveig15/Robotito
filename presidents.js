// Robotito vNext — live knowledge about presidents, present and historical.
// Data is resolved dynamically from Wikidata so Robotito is not tied to a stale hard-coded list.
(function(){
  const cache=new Map();
  const COUNTRY_TTL=7*24*60*60*1000;
  const RESULT_TTL=6*60*60*1000;

  function norm(s){
    return String(s||"").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[¿?¡!.,;:]/g," ")
      .replace(/\s+/g," ").trim();
  }

  function language(lang){return lang==="en"?"en":lang==="pt"?"pt":"es";}

  function parseQuestion(raw){
    const q=norm(raw);
    if(!/\b(presidente|president|presidentes|presidents)\b/.test(q))return null;

    const yearMatch=q.match(/\b(18\d{2}|19\d{2}|20\d{2}|21\d{2})\b/);
    const year=yearMatch?Number(yearMatch[1]):null;
    const listIntent=/\b(lista|todos|todas|quienes fueron|cuales fueron|presidentes de|list|all presidents|former presidents)\b/.test(q)
      && !/\b(quien es|quien fue|quien era|who is|who was|quem e|quem era)\b/.test(q);
    const historical=!!year || /\b(quien fue|quien era|quienes fueron|ex presidente|former president|who was|past president|quem era|quem foi)\b/.test(q);

    let country=q
      .replace(/\b(18\d{2}|19\d{2}|20\d{2}|21\d{2})\b/g," ")
      .replace(/\b(en|durante|during|in)\s*$/g," ")
      .replace(/\b(quien|quién|who|quem|cual|cuál|cuales|cuáles|what)\b/g," ")
      .replace(/\b(es|era|fue|is|was|e|é|foi)\b/g," ")
      .replace(/\b(el|la|los|las|the|o|a|os|as)\b/g," ")
      .replace(/\b(presidente|presidentes|president|presidents|actual|current|hoy|today|ahora|now|lista|list|todos|todas|all|former|pasado|pasados)\b/g," ")
      .replace(/\b(de|del|of|do|da|dos|das|en|in|durante|during)\b/g," ")
      .replace(/\s+/g," ").trim();

    // Common country names where removing articles/prepositions can leave aliases.
    const aliases={
      "estados unidos":"Estados Unidos",
      "united states":"United States",
      "usa":"United States",
      "eeuu":"Estados Unidos",
      "reino unido":"Reino Unido",
      "united kingdom":"United Kingdom",
      "gran bretana":"United Kingdom",
      "corea sur":"Corea del Sur",
      "south korea":"South Korea",
      "corea norte":"Corea del Norte",
      "north korea":"North Korea",
      "republica dominicana":"República Dominicana",
      "dominican republic":"Dominican Republic",
      "paises bajos":"Países Bajos",
      "netherlands":"Netherlands"
    };
    country=aliases[country]||country;
    if(!country)return null;
    return {country,year,intent:listIntent?"list":historical?"historical":"current"};
  }

  async function json(url){
    const res=await fetch(url,{headers:{Accept:"application/json"}});
    if(!res.ok)throw new Error("HTTP "+res.status);
    return await res.json();
  }

  async function resolveCountry(name,lang="es"){
    const key="country|"+norm(name)+"|"+language(lang);
    const hit=cache.get(key);
    if(hit&&Date.now()-hit.at<COUNTRY_TTL)return hit.value;

    const langs=[language(lang),"es","en"];
    let candidates=[];
    for(const l of [...new Set(langs)]){
      const url="https://www.wikidata.org/w/api.php?action=wbsearchentities&origin=*&format=json&type=item&limit=8&language="+encodeURIComponent(l)+"&search="+encodeURIComponent(name);
      const data=await json(url);
      candidates.push(...(data.search||[]));
      if(candidates.length)break;
    }
    if(!candidates.length)return null;

    const scored=candidates.map(x=>{
      const d=norm(x.description||"");
      const label=norm(x.label||"");
      let score=0;
      if(label===norm(name))score+=5;
      if(/\b(country|sovereign state|pais|estado soberano|republica|kingdom|nation)\b/.test(d))score+=4;
      if(/\b(city|ciudad|municipality|province|state of|department)\b/.test(d))score-=4;
      return {x,score};
    }).sort((a,b)=>b.score-a.score);

    const value={id:scored[0].x.id,label:scored[0].x.label||name,description:scored[0].x.description||""};
    cache.set(key,{at:Date.now(),value});
    return value;
  }

  function sparqlFor(countryId){
    return [
      "SELECT DISTINCT ?person ?personLabel ?office ?officeLabel ?start ?end WHERE {",
      "  ?person p:P39 ?statement .",
      "  ?statement ps:P39 ?office .",
      "  { ?office wdt:P1001 wd:"+countryId+" . } UNION { ?office wdt:P17 wd:"+countryId+" . }",
      "  ?office wdt:P279* wd:Q48352 .",
      "  ?office rdfs:label ?officeLabel .",
      "  FILTER(LANG(?officeLabel) = \"en\")",
      "  FILTER(CONTAINS(LCASE(STR(?officeLabel)), \"president\"))",
      "  FILTER(!CONTAINS(LCASE(STR(?officeLabel)), \"vice\"))",
      "  OPTIONAL { ?statement pq:P580 ?start . }",
      "  OPTIONAL { ?statement pq:P582 ?end . }",
      "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"es,en,pt\" . }",
      "}"
    ].join("\n");
  }

  async function currentPresident(country){
    const key="current-president|"+country.id;
    const hit=cache.get(key);
    if(hit&&Date.now()-hit.at<RESULT_TTL)return hit.value;

    const q=[
      "SELECT DISTINCT ?person ?personLabel ?office ?officeLabel WHERE {",
      "  wd:"+country.id+" wdt:P35 ?person .",
      "  ?person p:P39 ?statement .",
      "  ?statement ps:P39 ?office .",
      "  ?office rdfs:label ?officeLabel .",
      "  FILTER(LANG(?officeLabel) = \"en\")",
      "  FILTER(CONTAINS(LCASE(STR(?officeLabel)), \"president\"))",
      "  FILTER(!CONTAINS(LCASE(STR(?officeLabel)), \"vice\"))",
      "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"es,en,pt\" . }",
      "}"
    ].join("\n");
    const url="https://query.wikidata.org/sparql?format=json&query="+encodeURIComponent(q);
    const data=await json(url);
    const row=(data.results?.bindings||[])[0];
    const value=row?{
      id:(row.person?.value||"").split("/").pop(),
      name:row.personLabel?.value||"",
      office:row.officeLabel?.value||""
    }:null;
    cache.set(key,{at:Date.now(),value});
    return value;
  }

  async function officeHolders(country){
    const key="holders|"+country.id;
    const hit=cache.get(key);
    if(hit&&Date.now()-hit.at<RESULT_TTL)return hit.value;

    const q=sparqlFor(country.id);
    const url="https://query.wikidata.org/sparql?format=json&query="+encodeURIComponent(q);
    const data=await json(url);
    const rows=(data.results?.bindings||[]).map(b=>({
      id:(b.person?.value||"").split("/").pop(),
      name:b.personLabel?.value||"",
      office:b.officeLabel?.value||"",
      start:b.start?.value||null,
      end:b.end?.value||null
    })).filter(x=>x.name);

    const dedup=[];
    const seen=new Set();
    for(const r of rows){
      const k=[r.id,r.start||"",r.end||"",r.office].join("|");
      if(seen.has(k))continue;
      seen.add(k);dedup.push(r);
    }
    dedup.sort((a,b)=>String(b.start||"0000").localeCompare(String(a.start||"0000")));
    cache.set(key,{at:Date.now(),value:dedup});
    return dedup;
  }

  function dateMs(s,fallback){
    if(!s)return fallback;
    const n=Date.parse(s);
    return Number.isFinite(n)?n:fallback;
  }

  function currentHolder(rows){
    const now=Date.now();
    const plausible=rows.filter(r=>dateMs(r.start,-Infinity)<=now && dateMs(r.end,Infinity)>=now);
    return (plausible.length?plausible:rows)[0]||null;
  }

  function holderInYear(rows,year){
    const from=Date.UTC(year,0,1),to=Date.UTC(year,11,31,23,59,59);
    return rows.filter(r=>dateMs(r.start,-Infinity)<=to && dateMs(r.end,Infinity)>=from);
  }

  function uniquePeople(rows,limit=40){
    const out=[],seen=new Set();
    for(const r of rows){
      const key=r.id||r.name;
      if(seen.has(key))continue;
      seen.add(key);out.push(r);
      if(out.length>=limit)break;
    }
    return out;
  }

  function yearOf(s){return s?String(s).slice(0,4):"";}

  function format(parsed,country,rows,lang="es"){
    lang=language(lang);
    if(!rows.length){
      if(lang==="en")return "I couldn't find a reliable presidential office history for "+country.label+" in Wikidata.";
      if(lang==="pt")return "Não encontrei um histórico presidencial confiável para "+country.label+" no Wikidata.";
      return "No encontré un historial presidencial suficientemente claro para "+country.label+" en Wikidata.";
    }

    if(parsed.intent==="current"){
      const r=currentHolder(rows);
      if(!r)return null;
      if(lang==="en")return "The current president of "+country.label+" is "+r.name+".";
      if(lang==="pt")return "O presidente atual de "+country.label+" é "+r.name+".";
      return "El presidente actual de "+country.label+" es "+r.name+".";
    }

    if(parsed.intent==="historical"&&parsed.year){
      const matches=uniquePeople(holderInYear(rows,parsed.year),6);
      if(!matches.length){
        if(lang==="en")return "I couldn't identify who held the presidency of "+country.label+" in "+parsed.year+" from the available Wikidata dates.";
        if(lang==="pt")return "Não consegui identificar quem ocupava a presidência de "+country.label+" em "+parsed.year+" com as datas disponíveis no Wikidata.";
        return "No pude identificar con suficiente seguridad quién ocupaba la presidencia de "+country.label+" en "+parsed.year+" con las fechas disponibles en Wikidata.";
      }
      const names=matches.map(x=>x.name).join(matches.length===2?" y ":", ");
      if(lang==="en")return matches.length===1?names+" was president of "+country.label+" in "+parsed.year+".":names+" held the presidency of "+country.label+" during "+parsed.year+".";
      if(lang==="pt")return matches.length===1?names+" era presidente de "+country.label+" em "+parsed.year+".":names+" ocuparam a presidência de "+country.label+" durante "+parsed.year+".";
      return matches.length===1?names+" era presidente de "+country.label+" en "+parsed.year+".":names+" ocuparon la presidencia de "+country.label+" durante "+parsed.year+".";
    }

    const people=uniquePeople(rows,30);
    const body=people.map(r=>{
      const span=[yearOf(r.start),yearOf(r.end)].filter(Boolean).join("–");
      return r.name+(span?" ("+span+")":"");
    }).join("; ");
    if(lang==="en")return "Presidents recorded for "+country.label+": "+body+".";
    if(lang==="pt")return "Presidentes registrados para "+country.label+": "+body+".";
    return "Presidentes registrados para "+country.label+": "+body+".";
  }

  async function answer(raw,lang="es"){
    const parsed=parseQuestion(raw);
    if(!parsed)return {handled:false};
    try{
      const country=await resolveCountry(parsed.country,lang);
      if(!country)return {handled:true,text:language(lang)==="en"?"I couldn't identify that country.":"No pude identificar ese país.",source:null};
      if(parsed.intent==="current"){
        const live=await currentPresident(country);
        if(live?.name){
          const code=language(lang);
          const text=code==="en"
            ?"The current president of "+country.label+" is "+live.name+"."
            :code==="pt"
              ?"O presidente atual de "+country.label+" é "+live.name+"."
              :"El presidente actual de "+country.label+" es "+live.name+".";
          return {handled:true,text,source:"Wikidata",country,parsed,rows:[live]};
        }
      }
      const rows=await officeHolders(country);
      const text=format(parsed,country,rows,lang);
      return {
        handled:true,
        text:text||"No encontré un dato suficientemente seguro.",
        source:"Wikidata",
        country,
        parsed,
        rows
      };
    }catch(e){
      console.warn("president knowledge",e);
      const text=language(lang)==="en"
        ?"I couldn't consult the live presidential database right now."
        :language(lang)==="pt"
          ?"Não consegui consultar a base presidencial ao vivo agora."
          :"No pude consultar ahora la base de presidentes en línea.";
      return {handled:true,text,source:null,error:String(e)};
    }
  }

  window.ROBOTITO_PRESIDENTS={parseQuestion,resolveCountry,currentPresident,officeHolders,answer};
})();