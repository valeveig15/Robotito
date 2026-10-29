"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const i18n=require("../i18n.js");
const src=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const start=src.indexOf("function applyDayNightMode(");
const end=src.indexOf("function ambientMood(){",start);
assert.ok(start>=0&&end>start,"Production clock and day/night functions present");
const elements={
 "#world":{dataset:{},attrs:{},setAttribute(key,value){this.attrs[key]=value;}},
 "#dayNightLabel":{textContent:""},
 "#clock":{textContent:""},
 "#dateInfo":{textContent:""}
};
const document={
 body:{classList:{toggle(){}}},
 querySelector:()=>({setAttribute(){}})
};
const state={languageMode:"es"};
const locales=[];
const locale=lang=>{locales.push(lang);return i18n.locale(lang);};
const run=new Function("state","document","window","$","languageLocale","isNightByClock","Date",
 src.slice(start,end)+"\nreturn {applyDayNightMode,clockTick};"
)(state,document,{ROBOTITO_I18N:i18n},s=>elements[s]||null,locale,
 date=>date.getHours()>=18||date.getHours()<6,Date);
let checks=0;
function eq(a,b,name){assert.deepEqual(a,b,name);checks++;}
const noon=new Date(2026,9,29,12,0,0),night=new Date(2026,9,29,22,0,0);
run.applyDayNightMode(noon);
eq(elements["#world"].attrs["aria-label"],i18n.t("uiWorldDayAria","es"),"Spanish UI day");
eq(elements["#dayNightLabel"].textContent,i18n.t("uiDayLabel","es"),"Spanish day label");
state.languageMode="de";
run.applyDayNightMode(night);
eq(elements["#world"].attrs["aria-label"],i18n.t("uiWorldNightAria","de"),"German UI night");
eq(elements["#dayNightLabel"].textContent,i18n.t("uiNightLabel","de"),"German night label");
run.clockTick();
eq(locales.at(-1),"de","Date and time follow persistent locale, never response language");
state.languageMode="it";
run.applyDayNightMode(noon);
eq(elements["#world"].attrs["aria-label"],i18n.t("uiWorldDayAria","it"),"Italian UI day");
eq(elements["#dayNightLabel"].textContent,i18n.t("uiDayLabel","it"),"Italian day label");
eq(i18n.t("uiBirthdayPlaceholder","de"),"TT/MM/JJJJ",
 "German placeholder uses accepted input mask");
console.log("P05 persistent UI language independent of one-turn response:",checks,"checks");
