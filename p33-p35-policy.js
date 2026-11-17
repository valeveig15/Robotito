// P33–P35: deterministic, independently testable policies. No network or personal data leaves the browser.
(function(root){
  "use strict";
  const finite = x => typeof x === "number" && Number.isFinite(x);
  function batteryThreshold(previous,current,charging=false){
    if(charging || !finite(current) || current<0 || current>100)return null;
    const levels=[5,10,20,50];
    if(previous===null || previous===undefined)return levels.find(x=>current<=x)||null;
    if(!finite(previous)||previous<0||previous>100||current>=previous)return null;
    return levels.find(x=>previous>x && current<=x)||null;
  }
  function birthdaySlot(date){
    const h=date.getHours();
    return h>=6&&h<12?"morning":h>=12&&h<18?"afternoon":"night";
  }
  function birthdayDay(date){
    const pad=x=>String(x).padStart(2,"0");
    return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate());
  }
  function isBirthday(iso,date){
    const m=/^\d{4}-(\d{2})-(\d{2})$/.exec(String(iso||""));
    return !!m && Number(m[1])===date.getMonth()+1 && Number(m[2])===date.getDate();
  }
  function birthdayKey(person,date){
    const id=person?.id||person?.personId||person?.uuid||person?.name;
    if(!id)return null;
    return "robotito.birthday.v2."+encodeURIComponent(String(id))+"."+birthdayDay(date)+"."+birthdaySlot(date);
  }
  function normalizedTitle(value){
    return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  }
  function bookIdentity(book){
    const ids=book?.industryIdentifiers||[];
    const isbn=ids.find(x=>/^ISBN_13$/.test(x?.type)&&/^\d{13}$/.test(x?.identifier||""))?.identifier;
    return isbn?"isbn:"+isbn:"title:"+normalizedTitle(book?.title)+"|"+normalizedTitle((book?.authors||[])[0]);
  }
  function safeHttps(value){
    try{const url=new URL(String(value));if(url.protocol==="http:" && /(^|\\.)(googleusercontent\\.com|google\\.com|googleapis\\.com|gstatic\\.com)$/.test(url.hostname))url.protocol="https:";return url.protocol==="https:"?url.href:"";}catch{return "";}
  }
  root.ROBOTITO_P33_P35=Object.freeze({batteryThreshold,birthdaySlot,birthdayDay,isBirthday,birthdayKey,normalizedTitle,bookIdentity,safeHttps});
})(typeof window!=="undefined"?window:globalThis);
