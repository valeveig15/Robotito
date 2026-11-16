"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const code=fs.readFileSync(require("node:path").join(__dirname,"../layout-resizer.js"),"utf8");
const store=new Map();
const listeners={},winListeners={},mediaListeners={};
const attributes={};
const layout={
 style:{gridTemplateColumns:"",removeProperty(name){if(name==="grid-template-columns")this.gridTemplateColumns="";}},
 getBoundingClientRect:()=>({left:0,width:1100})
};
const divider={
 offsetWidth:20,
 addEventListener:(name,callback)=>listeners[name]=callback,
 setAttribute:(name,value)=>attributes[name]=value,
 removeAttribute:name=>{delete attributes[name];},
 setPointerCapture(){},releasePointerCapture(){}
};
const bodyClass=new Set();
const document={
 body:{classList:{add:x=>bodyClass.add(x),remove:x=>bodyClass.delete(x)}},
 querySelector:q=>q===".layout"?layout:q==="#layoutResizer"?divider:null,
 addEventListener:(name,callback)=>listeners[name]=callback
};
const mq={matches:true,addEventListener:(name,callback)=>mediaListeners[name]=callback};
const storage={
 getItem:k=>store.has(k)?store.get(k):null,
 setItem:(k,v)=>store.set(k,v),
 removeItem:k=>store.delete(k)
};
const window={matchMedia:()=>mq,addEventListener:(name,fn)=>winListeners[name]=fn};
vm.runInNewContext(code,{document,window,localStorage:storage,getComputedStyle:()=>({paddingLeft:"14px",paddingRight:"14px"}),requestAnimationFrame:f=>f()});
listeners.DOMContentLoaded();
const ctrl=window.ROBOTITO_LAYOUT_RESIZER;
assert.equal(ctrl.minWorld,260);assert.equal(ctrl.minPanel,245);
const down={button:0,pointerId:3,clientX:400,preventDefault(){}};
function key(key,shiftKey=false){listeners.keydown({key,shiftKey,preventDefault(){}});}
key("Home");
assert.equal(Number(attributes["aria-valuenow"]),260);
key("End");
assert.equal(Number(attributes["aria-valuenow"]),807);
key("ArrowLeft");
assert.equal(Number(attributes["aria-valuenow"]),783);
assert.ok(store.has("robotito.layoutSplit.v1"));
listeners.pointerdown(down);
listeners.pointermove({pointerId:3,clientX:330});
assert.equal(ctrl.active,true);
listeners.pointercancel({pointerId:3});
assert.equal(ctrl.active,false);
assert.equal(Number(attributes["aria-valuenow"]),783,"cancelled drag reverts");
listeners.pointerdown(down);
listeners.pointermove({pointerId:3,clientX:320});
listeners.pointerup({pointerId:3});
assert.equal(ctrl.active,false);
assert.ok(Number(attributes["aria-valuenow"])<400);
// Pointer travel beyond either edge is always clamped, including touch-style pointer IDs.
listeners.pointerdown({button:0,pointerId:8,clientX:320,preventDefault(){}});
listeners.pointermove({pointerId:8,clientX:-900});
assert.equal(Number(attributes["aria-valuenow"]),260);
listeners.pointermove({pointerId:8,clientX:4000});
assert.equal(Number(attributes["aria-valuenow"]),807);
listeners.pointerup({pointerId:8});
mq.matches=false;mediaListeners.change();
assert.equal(layout.style.gridTemplateColumns,"");
mq.matches=true;mediaListeners.change();
assert.ok(layout.style.gridTemplateColumns.includes("px"));
key("Enter");
assert.equal(store.has("robotito.layoutSplit.v1"),false);
assert.ok(ctrl.ratio>0.5&&ctrl.ratio<0.8);
console.log("P26: extremes, keyboard, pointer cancel/save, mobile transition and reset passed");
