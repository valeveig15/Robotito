// Robotito vNext — broad factual fallback grounded in Wikipedia.
// Used only after Robotito's personal, class, math and curated knowledge routes fail.
(function(){
  const cache=new Map();
  function norm(s){
    return String(s||"").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[¿?¡!.,;:]/g," ")
      .replace(/\s+/g," ").trim();
  }
  function langCode(lang){return lang==="en"?"en":lang==="pt"?"pt":"es";}
  function isFactualQuestion(raw){
    const q=norm(raw);
    if(q.length<4||q.length>220)return false;
    if(!/^(que|qué|quien|quién|cual|cuál|cuales|cuáles|como|cómo|cuando|cuándo|donde|dónde|por que|por qué|define|definime|defina|dame la definicion|decime que es|dime que es|explicame que es|what|who|which|how|when|where|why|define|o que|quem|qual|como|quando|onde|por que)\b/.test(q))return false;
    if(/\b(mi nombre|como estoy|tenes hambre|tienes hambre|recordas de mi|recuerdas de mi|libro|tarea|clase|profesor|profesora|companero|compañero|presidente|president|clima|tiempo hoy|weather)\b/.test(q))return false;
    return true;
  }
  async function getJson(url){
    const res=await fetch(url,{headers:{Accept:"application/json"}});
    if(!res.ok)throw new Error("HTTP "+res.status);
    return await res.json();
  }
  function cleanExtract(text){
    return String(text||"")
      .replace(/\([^)]*pronunciación[^)]*\)/gi," ")
      .replace(/\s+/g," ").trim();
  }
  function takeSentences(text,count){
    const clean=cleanExtract(text);
    const parts=clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];
    return parts.slice(0,count).join(" ").replace(/\s+/g," ").trim();
  }
  async function answer(raw,lang="es",depth="normal"){
    if(!isFactualQuestion(raw))return {handled:false};
    const code=langCode(lang);
    const key=code+"|"+norm(raw);
    const hit=cache.get(key);
    if(hit&&Date.now()-hit.at<6*60*60*1000)return hit.value;
    try{
      const api="https://"+code+".wikipedia.org/w/api.php";
      const searchUrl=api+"?origin=*&format=json&action=query&list=search&srlimit=5&srprop=&srsearch="+encodeURIComponent(raw);
      const search=await getJson(searchUrl);
      const title=search.query?.search?.[0]?.title;
      if(!title)return {handled:false};
      const pageUrl=api+"?origin=*&format=json&action=query&redirects=1&prop=extracts&exintro=1&explaintext=1&titles="+encodeURIComponent(title);
      const page=await getJson(pageUrl);
      const record=Object.values(page.query?.pages||{})[0];
      const extract=cleanExtract(record?.extract||"");
      if(!extract)return {handled:false};
      const count=depth==="definition"?1:depth==="detailed"?4:2;
      let text=takeSentences(extract,count);
      if(text.length>900)text=text.slice(0,897).replace(/\s+\S*$/,"")+"…";
      const value={
        handled:true,
        text,
        title:record?.title||title,
        source:"Wikipedia",
        url:"https://"+code+".wikipedia.org/wiki/"+encodeURIComponent(String(record?.title||title).replace(/ /g,"_"))
      };
      cache.set(key,{at:Date.now(),value});
      return value;
    }catch(e){
      console.warn("wikipedia fallback",e);
      return {handled:false,error:String(e)};
    }
  }
  window.ROBOTITO_WEB_KNOWLEDGE={isFactualQuestion,answer};
})();