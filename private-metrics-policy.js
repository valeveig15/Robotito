// P45: privacy-preserving, opt-in counters with no personal content.
(function(root){
"use strict";
const TYPES=Object.freeze(["questions","classes","recommendations","studySessions","tasks"]);
const dayKey=(time=Date.now())=>new Date(time).toLocaleDateString("sv-SE");
function clean(data,now=Date.now()){
 const days={};
 for(const [day,counts] of Object.entries(data?.days||{})){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))continue;
  const timestamp=new Date(day+"T12:00:00").getTime();
  if(!Number.isFinite(timestamp)||Math.abs(now-timestamp)>30*86400000)continue;
  days[day]={};
  for(const key of TYPES)days[day][key]=Math.min(999999999,Math.max(0,Math.trunc(Number(counts?.[key])||0)));
 }
 return {consent:data?.consent===true,days};
}
function increment(data,type,at=Date.now()){
 if(!TYPES.includes(type))throw Error("Unknown metric");
 const current=clean(data,at);
 if(!current.consent)return current;
 const key=dayKey(at);
 const day={...Object.fromEntries(TYPES.map(k=>[k,0])),...current.days[key]};
 day[type]=Math.min(999999999,day[type]+1);
 return {...current,days:{...current.days,[key]:day}};
}
function totals(data){
 const sum=Object.fromEntries(TYPES.map(k=>[k,0]));
 for(const counts of Object.values(clean(data).days))for(const key of TYPES)sum[key]+=counts[key]||0;
 return sum;
}
root.ROBOTITO_PRIVATE_STATS_POLICY=Object.freeze({TYPES,dayKey,clean,increment,totals});
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_PRIVATE_STATS_POLICY;
})(typeof window!=="undefined"?window:globalThis);
