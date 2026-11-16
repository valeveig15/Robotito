"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync(require("node:path").join(__dirname,"../typed-chat-ui.js"),"utf8");
const handlers={};
const elements={};
function el(){
 return {className:"",textContent:"",children:[],scrollHeight:0,scrollTop:0,clientHeight:100,
  append(...nodes){this.children.push(...nodes);},
  appendChild(node){this.children.push(node);},
  replaceChildren(node){this.children=node?.children?[...node.children]:[node].filter(Boolean);}};
}
elements.typedChatHistory=el();
const document={documentElement:{lang:"es"},getElementById:id=>elements[id]||null,
  createElement:el,createDocumentFragment:el,addEventListener:(key,fn)=>handlers[key]=fn};
const window={addEventListener:(key,fn)=>handlers[key]=fn,visualViewport:null};
vm.runInNewContext(source,{window,document,requestAnimationFrame:fn=>fn()});
handlers.DOMContentLoaded?.();
const chat=window.ROBOTITO_TYPED_CHAT;
chat.onTurn("<script>secreto A</script>","A");
assert.equal(chat.activeOwner,"local");
chat.onOwnerChange("A");
assert.equal(elements.typedChatHistory.children[0].children[1].textContent,"<script>secreto A</script>");
chat.onReply("respuesta A","A");
chat.onOwnerChange("B");
chat.onTurn("pregunta B","B");
assert.equal(elements.typedChatHistory.children.length,1);
assert.ok(!JSON.stringify(elements.typedChatHistory.children).includes("secreto A"));
chat.onOwnerChange("A");
assert.equal(elements.typedChatHistory.children.length,2);
chat.clear();
assert.equal(chat.size,0);
chat.onOwnerChange("B");
assert.equal(chat.size,1);
chat.onReply("respuesta B","B");
chat.onReply("respuesta B","B");
assert.equal(chat.size,2,"identical consecutive bot replies are deduplicated");
for(let i=0;i<50;i++)chat.onTurn("turno "+i,"B");
assert.equal(chat.size,20,"UI keeps bounded history");
console.log("P25: owner isolation, escaping, bounded history, deduplication and clearing OK");
