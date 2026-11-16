// P24 route, cancellation and non-invented object regression.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync(require("node:path").join(__dirname,"../object-presentation-scene.js"),"utf8");
const item={id:"apple",emoji:"🍎",es:["manzana"],en:["apple"]};
const classes=new Set();
let prop=null, timers=[],hidden=false,reply=[];
const robot={
  classList:{contains:s=>classes.has(s),add:s=>classes.add(s),remove:(...a)=>a.forEach(x=>classes.delete(x))},
  style:{left:""},
  appendChild(node){prop=node;},
  querySelector(q){return q==="#objectSceneProp"?prop:null}
};
const status={textContent:"",replaceChildren(){this.textContent="";}};
const handlers={};
const window={
  ROBOTITO_OBJECTS:{find:q=>/^(manzana|apple)$/.test(q)?item:null,displayName:(v,lang)=>lang==="en"?"apple":"manzana"},
  matchMedia:()=>({matches:true}),
  say:(s)=>reply.push(s),
  addEventListener:(key,fn)=>{handlers[key]=fn}
};
const document={
  hidden:false,
  querySelector:q=>({"#robotito":robot,"#world":{},"#objectSceneStatus":status})[q]||null,
  addEventListener:(key,fn)=>{handlers[key]=fn},
  createElement:()=>({className:"",textContent:"",setAttribute(){},remove(){prop=null;}})
};
const env={window,document,navigator:{userActivation:{isActive:false}},
  setTimeout(fn){const t={fn,cancelled:false};timers.push(t);return t;},
  clearTimeout(t){if(t)t.cancelled=true;}};
vm.runInNewContext(source,env);
function flush(limit=20){for(let i=0;i<limit;i++){const task=timers.shift();if(!task)break;if(!task.cancelled)task.fn();}}
const scene=window.ROBOTITO_OBJECT_SCENE;
assert.equal(scene.parseRequest("Mostrame una manzana").item.id,"apple");
assert.equal(scene.parseRequest("show me an apple","en").item.id,"apple");
assert.equal(scene.parseRequest("¿Qué significa mostrar una manzana?","es"),null);
assert.equal(scene.request("Mostrame un objeto imposible"),true);
assert.ok(reply.pop().includes("No tengo una representación"));
assert.equal(prop,null);
assert.equal(scene.request("Mostrame una manzana"),true);
flush(4);
assert.equal(prop?.textContent,"🍎");
assert.equal(robot.style.left,"50%");
assert.ok(classes.has("object-trip-presenting"));
scene.cancel();
assert.equal(prop,null);
assert.equal(robot.style.left,"");
assert.equal(classes.has("object-trip-presenting"),false);
scene.request("show me an apple",{language:"en"});
handlers.visibilitychange&&((document.hidden=true),handlers.visibilitychange());
flush();
assert.equal(prop,null,"background cancellation prevents stale presentation");
assert.equal(scene.current,null);
assert.equal(scene.parseRequest("No me muestres una manzana"),null);
console.log("P24 scene: command, unsupported objects, return, cancellation, visibility OK");
