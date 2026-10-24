// Use dated Open-Meteo forecast data: never report today's observations as tomorrow's.
(function(root){
"use strict";
const LOCALE={es:"es",en:"en",pt:"pt",fr:"fr",it:"it",de:"de"};
function num(v){const n=Number(v);return v!==null&&v!==undefined&&v!==""&&Number.isFinite(n)?n:null;}
function safeRound(n){return n===null?null:Math.round(n);}
function choose(data,{date,daypart=null,now=new Date()}={}){
 const daily=data?.daily||{},hourly=data?.hourly||{},current=data?.current||{};
 const todayLocal=data?.current?.time?.slice(0,10)||new Date(now).toISOString().slice(0,10);
 const wanted=String(date||todayLocal).slice(0,10);
 const i=Array.isArray(daily.time)?daily.time.indexOf(wanted):-1;
 if(i<0)return null;
 const today=wanted===todayLocal;
 const isNight=daypart==="night";
 const codes=hourly.weather_code||[];
 const hours=(hourly.time||[]).map((time,index)=>({time,index})).filter(x=>
  typeof x.time==="string"&&x.time.startsWith(wanted+"T")
  &&(!isNight||Number(x.time.slice(11,13))>=19&&Number(x.time.slice(11,13))<=23));
 let hourlyNow=null;
 if(isNight&&hours.length){
  const temps=hours.map(x=>num(hourly.temperature_2m?.[x.index])).filter(x=>x!==null);
  const rain=hours.map(x=>num(hourly.precipitation_probability?.[x.index])).filter(x=>x!==null);
  const representative=hours.find(x=>x.time.slice(11,13)==="21")||hours[Math.floor(hours.length/2)];
  hourlyNow={temp:temps.length?temps.reduce((a,b)=>a+b,0)/temps.length:null,
   rain:rain.length?Math.max(...rain):null,weatherCode:num(codes[representative.index])};
 }
 return {date:wanted,daypart:daypart||"day",isCurrent:today&&!isNight,
  high:safeRound(num(daily.temperature_2m_max?.[i])),
  low:safeRound(num(daily.temperature_2m_min?.[i])),
  rain:safeRound(isNight&&hourlyNow?.rain!==null?hourlyNow?.rain:num(daily.precipitation_probability_max?.[i])),
  temp:safeRound(isNight?hourlyNow?.temp:today?num(current.temperature_2m):null),
  feels:safeRound(today&&!isNight?num(current.apparent_temperature):null),
  weatherCode:isNight?hourlyNow?.weatherCode:today?num(current.weather_code):num(daily.weather_code?.[i]),
  timeSource:isNight&&hourlyNow?"hourly":today&&!isNight?"current":"daily"
 };
}
function describe(f,{language="es",place=""}={}){
 if(!f)return null;
 const L=LOCALE[language]||"es";
 const d=new Date(f.date+"T12:00:00");
 const date=new Intl.DateTimeFormat({es:"es-UY",en:"en-US",pt:"pt-BR",fr:"fr-FR",it:"it-IT",de:"de-DE"}[L],
  {weekday:"long",day:"numeric",month:"long"}).format(d);
 const lead=place?place+" · ":"";
 const quant=(v,suffix)=>v===null?"—":v+suffix;
 const high=quant(f.high,"°C"),low=quant(f.low,"°C"),rain=quant(f.rain,"%");
 if(L==="es")return lead+"Pronóstico para "+date+(f.daypart==="night"?" de noche":"")+
  ": máxima "+high+", mínima "+low+", probabilidad de precipitación hasta "+rain+
  (f.temp===null?"":", temperatura estimada "+f.temp+"°C")+".";
 if(L==="en")return lead+"Forecast for "+date+(f.daypart==="night"?" at night":"")+
  ": high "+high+", low "+low+", precipitation chance up to "+rain+
  (f.temp===null?"":", estimated temperature "+f.temp+"°C")+".";
 if(L==="pt")return lead+"Previsão para "+date+(f.daypart==="night"?" à noite":"")+
  ": máxima "+high+", mínima "+low+", chance de chuva até "+rain+".";
 if(L==="fr")return lead+"Prévisions pour "+date+(f.daypart==="night"?" la nuit":"")+
  " : maximale "+high+", minimale "+low+", risque de pluie jusqu'à "+rain+".";
 if(L==="it")return lead+"Previsioni per "+date+(f.daypart==="night"?" di notte":"")+
  ": massima "+high+", minima "+low+", probabilità di pioggia fino a "+rain+".";
 return lead+"Vorhersage für "+date+(f.daypart==="night"?" nachts":"")+
  ": Höchstwert "+high+", Tiefstwert "+low+", Regenwahrscheinlichkeit bis "+rain+".";
}
root.ROBOTITO_WEATHER_FORECAST={choose,describe};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_WEATHER_FORECAST;
})(typeof window!=="undefined"?window:globalThis);