// P51: time visual/human responses based on system clock, without external synchronisation claims.
(function(root){
"use strict";
function readableTime(at,locale="es"){
 const d=new Date(at);if(!Number.isFinite(d.getTime()))throw Error("Invalid time");
 return new Intl.DateTimeFormat(locale,{hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).format(d);
}
function nextLocalTime(now,hour,minute){
 const date=new Date(now),h=Number(hour),m=Number(minute);
 if(!Number.isFinite(date.getTime()))throw Error("Invalid current time");
 if(!Number.isInteger(h)||h<0||h>23||!Number.isInteger(m)||m<0||m>59)throw RangeError("Invalid target time");
 const target=new Date(date);target.setHours(h,m,0,0);
 if(target.getTime()<=date.getTime())target.setDate(target.getDate()+1);
 return target.getTime();
}
function remaining(now,target){
 const diff=Math.max(0,Math.ceil((Number(target)-Number(now))/1000));
 return {days:Math.floor(diff/86400),hours:Math.floor(diff%86400/3600),minutes:Math.floor(diff%3600/60),seconds:diff%60,totalSeconds:diff};
}
function speakTimeText(at,lang="es"){
 const d=new Date(at),h=d.getHours(),m=d.getMinutes();
 const langs={es:"Son las",en:"It is",pt:"São",fr:"Il est",it:"Sono le",de:"Es ist"};
 const prefix=langs[lang]||langs.es;
 const suffix={es:"horas",en:"",pt:"horas",fr:"heures",it:"",de:"Uhr"}[lang]||"";
 return [prefix,String(h),suffix,m?String(m).padStart(2,"0"):""].filter(Boolean).join(" ");
}
root.ROBOTITO_CLOCK_POLICY=Object.freeze({readableTime,nextLocalTime,remaining,speakTimeText});
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_CLOCK_POLICY;
})(typeof window!=="undefined"?window:globalThis);