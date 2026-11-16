// P25 — Lightweight visible transcript for the existing voice/text dialogue engine.
// Only UI echoes are kept here; authoritative conversation storage stays unchanged.
(()=>{
  "use strict";
  const MAX_MESSAGES=20,MAX_OWNERS=12;
  const messagesByOwner=new Map();
  const labels={
    es:"Vos",en:"You",pt:"Você",fr:"Vous",it:"Tu",de:"Du"
  };
  let activeOwner="local",root=null;
  function ensureRoot(){root=root||document.getElementById("typedChatHistory");return root;}
  function record(owner){
    const key=String(owner||"local");
    if(!messagesByOwner.has(key)){
      if(messagesByOwner.size>=MAX_OWNERS){
        const oldest=messagesByOwner.keys().next().value;
        if(oldest!==key)messagesByOwner.delete(oldest);
      }
      messagesByOwner.set(key,[]);
    }
    return messagesByOwner.get(key);
  }
  function ownerOf(value){return String(value||"local");}
  function locale(){
    const lang=document.documentElement.lang?.split("-")[0]||"es";
    return labels[lang]||labels.es;
  }
  function render(){
    const target=ensureRoot();if(!target)return;
    const list=record(activeOwner),wasBottom=target.scrollHeight-target.scrollTop-target.clientHeight<48;
    const frag=document.createDocumentFragment();
    if(!list.length){
      const hint=document.createElement("p");
      hint.className="typed-chat-placeholder";
      hint.textContent="Tu conversación escrita aparecerá aquí.";
      frag.appendChild(hint);
    }
    for(const message of list){
      const row=document.createElement("div");
      row.className="typed-chat-line typed-chat-"+message.role;
      const who=document.createElement("strong");
      who.textContent=message.role==="assistant"?"Robotito":locale();
      const body=document.createElement("span");
      body.textContent=message.text;
      row.append(who,body);frag.appendChild(row);
    }
    target.replaceChildren(frag);
    if(wasBottom)target.scrollTop=target.scrollHeight;
  }
  function select(owner){
    activeOwner=ownerOf(owner);
    render();
  }
  function push(role,text,owner){
    const clean=String(text||"").trim();
    if(!clean)return;
    const key=ownerOf(owner),history=record(key);
    const last=history[history.length-1];
    if(role==="assistant"&&last?.role===role&&last.text===clean)return;
    history.push({role,text:clean.slice(0,6000)});
    if(history.length>MAX_MESSAGES)history.splice(0,history.length-MAX_MESSAGES);
    if(key===activeOwner)render();
  }
  function adjustViewport(){
    const input=document.getElementById("robotitoTextInput");
    if(!input||document.activeElement!==input)return;
    requestAnimationFrame(()=>{
      if(document.activeElement===input)input.scrollIntoView({block:"nearest",inline:"nearest"});
    });
  }
  function init(){
    ensureRoot();
    render();
    document.addEventListener("robotito:languagechange",render);
    window.visualViewport?.addEventListener("resize",adjustViewport,{passive:true});
    document.getElementById("robotitoTextInput")?.addEventListener("focus",adjustViewport);
  }
  document.addEventListener("DOMContentLoaded",init);
  window.ROBOTITO_TYPED_CHAT={
    onTurn:(text,owner)=>push("user",text,owner),
    onReply:(text,owner)=>push("assistant",text,owner),
    onOwnerChange:select,
    clear:()=>{messagesByOwner.delete(activeOwner);render();},
    clearOwner:owner=>{messagesByOwner.delete(ownerOf(owner));if(ownerOf(owner)===activeOwner)render();},
    get activeOwner(){return activeOwner;},
    get size(){return record(activeOwner).length;}
  };
})();