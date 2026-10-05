// Robotito — adjustable desktop split between the panda and its control panel.
(()=>{
  "use strict";
  const STORAGE_KEY="robotito.layoutSplit.v1";
  const MIN_PANE=330;
  const DEFAULT_RATIO=1.6/(1.6+.75);
  const mq=window.matchMedia("(min-width:901px)");
  let layout=null;
  let divider=null;
  let dragging=false;
  let ratio=DEFAULT_RATIO;

  function readSavedRatio(){
    const value=Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value)&&value>0&&value<1?value:DEFAULT_RATIO;
  }
  function measurements(){
    if(!layout||!divider)return null;
    const rect=layout.getBoundingClientRect();
    const dividerWidth=divider.offsetWidth||18;
    const available=rect.width-dividerWidth;
    if(available<MIN_PANE*2)return null;
    return {rect,dividerWidth,available};
  }
  function clampLeft(left,available){
    return Math.max(MIN_PANE,Math.min(available-MIN_PANE,left));
  }
  function applyRatio(nextRatio,persist=false){
    if(!layout||!divider)return;
    if(!mq.matches){
      layout.style.removeProperty("grid-template-columns");
      return;
    }
    const size=measurements();
    if(!size)return;
    const left=clampLeft(size.available*nextRatio,size.available);
    const right=size.available-left;
    ratio=left/size.available;
    layout.style.gridTemplateColumns=left+"px "+size.dividerWidth+"px "+right+"px";
    divider.setAttribute("aria-valuemin",String(MIN_PANE));
    divider.setAttribute("aria-valuemax",String(Math.round(size.available-MIN_PANE)));
    divider.setAttribute("aria-valuenow",String(Math.round(left)));
    divider.setAttribute("aria-valuetext","Robotito "+Math.round(ratio*100)+"%, panel "+Math.round((1-ratio)*100)+"%");
    if(persist)localStorage.setItem(STORAGE_KEY,String(ratio));
  }
  function moveTo(clientX,persist=false){
    const size=measurements();
    if(!size)return;
    const left=clientX-size.rect.left-size.dividerWidth/2;
    applyRatio(clampLeft(left,size.available)/size.available,persist);
  }
  function stopDragging(event){
    if(!dragging)return;
    dragging=false;
    document.body.classList.remove("layout-resizing");
    if(event?.pointerId!==undefined){
      try{divider.releasePointerCapture(event.pointerId);}catch{}
    }
    localStorage.setItem(STORAGE_KEY,String(ratio));
  }
  function reset(){
    ratio=DEFAULT_RATIO;
    localStorage.removeItem(STORAGE_KEY);
    applyRatio(ratio,false);
  }
  function init(){
    layout=document.querySelector(".layout");
    divider=document.querySelector("#layoutResizer");
    if(!layout||!divider)return;
    ratio=readSavedRatio();
    requestAnimationFrame(()=>applyRatio(ratio,false));

    divider.addEventListener("pointerdown",event=>{
      if(!mq.matches||event.button!==0)return;
      dragging=true;
      divider.setPointerCapture?.(event.pointerId);
      document.body.classList.add("layout-resizing");
      moveTo(event.clientX,false);
      event.preventDefault();
    });
    divider.addEventListener("pointermove",event=>{
      if(!dragging)return;
      moveTo(event.clientX,false);
    });
    divider.addEventListener("pointerup",stopDragging);
    divider.addEventListener("pointercancel",stopDragging);
    divider.addEventListener("dblclick",reset);
    divider.addEventListener("keydown",event=>{
      if(!mq.matches)return;
      const size=measurements();
      if(!size)return;
      const current=size.available*ratio;
      let next=current;
      if(event.key==="ArrowLeft")next-=event.shiftKey?60:24;
      else if(event.key==="ArrowRight")next+=event.shiftKey?60:24;
      else if(event.key==="Home")next=MIN_PANE;
      else if(event.key==="End")next=size.available-MIN_PANE;
      else if(event.key==="Enter"||event.key===" "){event.preventDefault();reset();return;}
      else return;
      event.preventDefault();
      applyRatio(clampLeft(next,size.available)/size.available,true);
    });

    window.addEventListener("resize",()=>applyRatio(ratio,false),{passive:true});
    mq.addEventListener?.("change",()=>applyRatio(ratio,false));
  }
  document.addEventListener("DOMContentLoaded",init);
})();
