// P26 — keyboard, mouse and touch accessible desktop panel resizing.
(()=>{
  "use strict";
  const STORAGE_KEY="robotito.layoutSplit.v1";
  const MIN_WORLD=260,MIN_PANEL=245;
  const DEFAULT_RATIO=1.6/(1.6+.75);
  const mq=window.matchMedia("(min-width:901px)");
  let layout=null,divider=null,dragging=false,ratio=DEFAULT_RATIO,startRatio=DEFAULT_RATIO;
  function storageRead(){
    try{return localStorage.getItem(STORAGE_KEY);}catch{return null;}
  }
  function storageWrite(value){
    try{localStorage.setItem(STORAGE_KEY,String(value));}catch{/* Storage denied: keep session ratio. */}
  }
  function storageClear(){
    try{localStorage.removeItem(STORAGE_KEY);}catch{/* Storage denied. */}
  }
  function readSavedRatio(){
    const raw=storageRead();
    // Number(null) is zero, so avoid treating a missing key as a real setting.
    const value=raw===null?NaN:Number(raw);
    return Number.isFinite(value)&&value>0&&value<1?value:DEFAULT_RATIO;
  }
  function measurements(){
    if(!layout||!divider)return null;
    const rect=layout.getBoundingClientRect(),css=getComputedStyle(layout);
    const leftPadding=parseFloat(css.paddingLeft)||0,rightPadding=parseFloat(css.paddingRight)||0;
    const dividerWidth=divider.offsetWidth||20;
    const available=rect.width-leftPadding-rightPadding-dividerWidth;
    if(available<MIN_WORLD+MIN_PANEL)return null;
    return {rect,leftPadding,dividerWidth,available};
  }
  function clampLeft(left,available){
    return Math.max(MIN_WORLD,Math.min(available-MIN_PANEL,left));
  }
  function applyRatio(nextRatio,persist=false){
    if(!layout||!divider)return;
    if(!mq.matches){
      layout.style.removeProperty("grid-template-columns");
      divider.removeAttribute("aria-valuenow");
      return;
    }
    const size=measurements();
    if(!size){
      layout.style.removeProperty("grid-template-columns");
      return;
    }
    const wanted=Number(nextRatio);
    const desired=Number.isFinite(wanted)?wanted:DEFAULT_RATIO;
    const left=clampLeft(size.available*desired,size.available),right=size.available-left;
    ratio=left/size.available;
    layout.style.gridTemplateColumns=left+"px "+size.dividerWidth+"px "+right+"px";
    divider.setAttribute("aria-valuemin",String(MIN_WORLD));
    divider.setAttribute("aria-valuemax",String(Math.round(size.available-MIN_PANEL)));
    divider.setAttribute("aria-valuenow",String(Math.round(left)));
    divider.setAttribute("aria-valuetext","Robotito "+Math.round(ratio*100)+" %, panel "+Math.round((1-ratio)*100)+" %");
    if(persist)storageWrite(ratio);
  }
  function moveTo(clientX){
    const size=measurements();
    if(!size)return;
    const left=clientX-size.rect.left-size.leftPadding-size.dividerWidth/2;
    applyRatio(clampLeft(left,size.available)/size.available);
  }
  function finishDrag(event,cancelled=false){
    if(!dragging)return;
    dragging=false;
    document.body.classList.remove("layout-resizing");
    if(cancelled)applyRatio(startRatio);
    else storageWrite(ratio);
    if(event?.pointerId!==undefined){
      try{divider?.releasePointerCapture?.(event.pointerId);}catch{}
    }
  }
  function reset(){
    ratio=DEFAULT_RATIO;
    storageClear();
    applyRatio(ratio);
  }
  function init(){
    layout=document.querySelector(".layout");
    divider=document.querySelector("#layoutResizer");
    if(!layout||!divider)return;
    ratio=readSavedRatio();
    requestAnimationFrame(()=>applyRatio(ratio));

    divider.addEventListener("pointerdown",event=>{
      if(!mq.matches||event.button!==0||dragging||!measurements())return;
      dragging=true;startRatio=ratio;
      try{divider.setPointerCapture?.(event.pointerId);}catch{}
      document.body.classList.add("layout-resizing");
      moveTo(event.clientX);
      event.preventDefault();
    });
    divider.addEventListener("pointermove",event=>{
      if(dragging)moveTo(event.clientX);
    });
    divider.addEventListener("pointerup",event=>finishDrag(event));
    divider.addEventListener("pointercancel",event=>finishDrag(event,true));
    divider.addEventListener("lostpointercapture",event=>finishDrag(event,true));
    divider.addEventListener("dblclick",reset);
    divider.addEventListener("keydown",event=>{
      if(!mq.matches)return;
      if(event.key==="Escape"&&dragging){event.preventDefault();finishDrag(null,true);return;}
      const size=measurements();if(!size)return;
      const current=size.available*ratio;
      let next=current;
      if(event.key==="ArrowLeft")next-=event.shiftKey?60:24;
      else if(event.key==="ArrowRight")next+=event.shiftKey?60:24;
      else if(event.key==="Home")next=MIN_WORLD;
      else if(event.key==="End")next=size.available-MIN_PANEL;
      else if(event.key==="Enter"||event.key===" "){event.preventDefault();reset();return;}
      else return;
      event.preventDefault();
      applyRatio(clampLeft(next,size.available)/size.available,true);
    });
    window.addEventListener("resize",()=>applyRatio(ratio),{passive:true});
    mq.addEventListener?.("change",()=>applyRatio(ratio));
  }
  document.addEventListener("DOMContentLoaded",init);
  window.ROBOTITO_LAYOUT_RESIZER={
    get ratio(){return ratio;},reset,
    get active(){return dragging;},
    minWorld:MIN_WORLD,minPanel:MIN_PANEL
  };
})();
