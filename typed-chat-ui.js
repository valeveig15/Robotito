// P25 — Lightweight visible transcript for the existing voice/text dialogue engine.
// Only UI echoes are kept here; authoritative conversation storage stays unchanged.
(()=>{
  "use strict";
  const MAX_MESSAGES=20,MAX_OWNERS=12;
  const messagesByOwner=new Map();
  const labels={
    es:"Vos",en:"You",pt:"Você",fr:"Vous",it:"Tu",de:"Du"
  };
  let activeOwner="local",root=null,viewRevision=0;
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
  async function restore(owner,revision){
    const key=ownerOf(owner),storage=window.ROBOTITO_STORE;
    if(!storage?.queryRecords||storage.isEphemeral?.(key))return;
    try{
      const rows=await storage.queryRecords({type:"conversations",owner:key,limit:Infinity});
      if(revision!==viewRevision||key!==activeOwner)return;
      const fromStore=rows.filter(row=>(row.data?.role==="user"||row.data?.role==="assistant")&&typeof row.data.text==="string")
        .sort((a,b)=>a.timestamp-b.timestamp||String(a.id).localeCompare(String(b.id)))
        .map(row=>({role:row.data.role,text:row.data.text.slice(0,6000),at:row.timestamp}));
      // Do not discard messages received while IndexedDB was loading.
      const live=record(key);
      const signatures=new Set(fromStore.map(row=>row.role+"\\u0000"+row.text));
      for(const item of live)if(!signatures.has(item.role+"\\u0000"+item.text))fromStore.push(item);
      messagesByOwner.set(key,fromStore.slice(-MAX_MESSAGES));
      render();
    }catch(error){console.warn("conversation restore",error);}
  }
  function select(owner){
    activeOwner=ownerOf(owner);
    const revision=++viewRevision;
    messagesByOwner.delete(activeOwner);
    render();
    void restore(activeOwner,revision);
  }
  function push(role,text,owner){
    const clean=String(text||"").trim();
    if(!clean)return;
    const key=ownerOf(owner),history=record(key);
    const last=history[history.length-1];
    if(role==="assistant"&&last?.role===role&&last.text===clean)return;
    history.push({role,text:clean.slice(0,6000),at:Date.now()});
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
    clear:()=>{++viewRevision;messagesByOwner.delete(activeOwner);render();},
    clearOwner:owner=>{if(ownerOf(owner)===activeOwner)++viewRevision;messagesByOwner.delete(ownerOf(owner));if(ownerOf(owner)===activeOwner)render();},
    get activeOwner(){return activeOwner;},
    get size(){return record(activeOwner).length;}
  };
})();