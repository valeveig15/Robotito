// P42: Visual weather conditions, grounded ONLY in the current Open-Meteo response.
(function(root){
"use strict";
function classify(code){
 const number=Number(code);
 if(!Number.isInteger(number)||number<0||number>99)return "unknown";
 if(number===0)return "clear";
 if([1,2,3].includes(number))return "clouds";
 if([45,48].includes(number))return "fog";
 if([51,53,55,56,57].includes(number))return "drizzle";
 if([61,63,65,66,67,80,81,82].includes(number))return "rain";
 if([71,73,75,77,85,86].includes(number))return "snow";
 if([95,96,99].includes(number))return "storm";
 return "unknown";
}
const icon={clear:"☀️",clouds:"☁️",fog:"🌫️",drizzle:"🌦️",rain:"🌧️",snow:"❄️",storm:"⛈️",unknown:"🌡️"};
function view(current){
 const code=current?.weather_code,kind=classify(code),temperature=Number(current?.temperature_2m),isDay=Number(current?.is_day);
 if(!current||kind==="unknown"||!Number.isFinite(temperature)||temperature<-100||temperature>70||![0,1].includes(isDay))return null;
 return {kind,code:Number(code),temperature:Math.round(temperature),day:isDay===1,icon:icon[kind]};
}
root.ROBOTITO_WEATHER_SCENE_POLICY=Object.freeze({classify,view});
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_WEATHER_SCENE_POLICY;
})(typeof window!=="undefined"?window:globalThis);
