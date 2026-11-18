// P42–P43: weather scene after an explicit lookup; truthful in-page question count.
(function(root){
"use strict";
const policy=root.ROBOTITO_WEATHER_SCENE_POLICY;
let expiry=null,questions=0,sessionStart=Date.now(),lastWeather=null;
const $=id=>document.getElementById(id);
function clearWeather(){
 clearTimeout(expiry);expiry=null;lastWeather=null;
 const world=$("world"),badge=$("weatherSceneBadge");
 if(world)for(const kind of ["clear","clouds","fog","drizzle","rain","snow","storm"])world.classList.remove("weather-"+kind);
 if(badge){badge.hidden=true;badge.textContent="";}
}
function updateWeather(response){
 clearWeather();
 const value=policy.view(response?.current);if(!value)return false;
 lastWeather={...value,at:Date.now()};
 const world=$("world"),badge=$("weatherSceneBadge");
 if(!world||!badge)return false;
 world.classList.add("weather-"+value.kind);
 badge.hidden=false;
 badge.textContent=value.icon+" "+value.temperature+" °C · Open-Meteo";
 badge.setAttribute("aria-label","Condiciones actuales consultadas: "+value.temperature+" grados, "+value.kind+". Fuente Open-Meteo.");
 expiry=setTimeout(clearWeather,15*60*1000);
 return true;
}
function recordQuestion(){
 questions++;
 const count=$("honestQuestionCount");
 if(count)count.textContent=String(questions);
}
function init(){
 const counter=$("honestQuestionCount");
 if(counter)counter.textContent="0";
 const scope=$("honestQuestionScope");
 if(scope)scope.textContent="Preguntas procesadas en esta pestaña: no es un contador global de Robotito.";
 root.addEventListener("pagehide",clearWeather);
 document.addEventListener("visibilitychange",()=>{if(document.hidden)clearWeather();});
}
root.ROBOTITO_TRUTHFUL_UI={updateWeather,clearWeather,recordQuestion,get questions(){return questions;},get sessionStart(){return sessionStart;},get lastWeather(){return lastWeather;}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window);
