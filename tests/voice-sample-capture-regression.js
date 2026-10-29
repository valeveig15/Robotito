"use strict";
const assert=require("node:assert/strict");
const {create}=require("../voice-sample-capture.js");
let checked=0;const eq=(a,b,m)=>{assert.equal(a,b,m);checked++};
const tick=async()=>{for(let i=0;i<7;i++)await Promise.resolve();};
function fixture({deferPermission=false,deferSave=false}={}){
 let consent=false,asked=0,saved=0,deleted=0,grant,finish,callback;
 const tracks=[],recorders=[],status=[];
 class Recorder{
  constructor(s){this.mimeType="audio/webm";this.state="inactive";recorders.push(this);}
  start(){this.state="recording";}
  stop(){this.state="inactive";this.onstop?.();}
  emit(){this.ondataavailable?.({data:new Blob([new Uint8Array(150)])});}
 }
 const stream=()=>{const track={closed:0,stop(){this.closed++}};tracks.push(track);return {getTracks:()=>[track]};};
 const c=create({getConsent:()=>consent,
  requestStream:()=>{asked++;return deferPermission?new Promise(r=>grant=()=>r(stream())):Promise.resolve(stream());},
  recorderFactory:s=>new Recorder(s),save:()=>{saved++;return deferSave?new Promise(r=>finish=r):Promise.resolve();},
  remove:()=>{deleted++;},schedule:fn=>(callback=fn,1),cancelSchedule:()=>callback=null,
  onStatus:s=>status.push(s)});
 return {c,recorders,tracks,status,set:v=>consent=v,asked:()=>asked,saved:()=>saved,deleted:()=>deleted,
  grant:()=>grant(),finish:()=>finish(),tick:()=>callback()};
}
(async()=>{
 let t=fixture();eq(await t.c.start(),false,"No consent");eq(t.asked(),0);
 t.set(true);eq(await t.c.start(),true);t.recorders[0].emit();t.tick();await tick();
 eq(t.saved(),1,"Saved once");eq(t.tracks[0].closed,1,"Track stopped");
 t=fixture({deferPermission:true});t.set(true);const p=t.c.start();t.c.cancel();t.grant();
 eq(await p,false,"Late permission discarded");eq(t.saved(),0);eq(t.tracks[0].closed,1);
 t=fixture();t.set(true);await t.c.start();t.recorders[0].emit();t.set(false);t.c.cancel();await tick();
 eq(t.saved(),0,"Revoked audio not saved");
 t=fixture({deferSave:true});t.set(true);await t.c.start();t.recorders[0].emit();t.c.stop();await tick();
 eq(t.saved(),1);t.set(false);t.c.cancel();eq(t.c.getStatus().active,true);
 t.finish();await tick();eq(t.deleted(),1,"Late save removed");eq(t.c.getStatus().phase,"idle");
 t=fixture();t.set(true);await t.c.start();t.recorders[0].emit();await t.c.removeSample();await tick();
 eq(t.saved(),0);eq(t.deleted(),1);t.c.dispose();eq(await t.c.start(),false);
 // Capture engines can throw synchronously when start() is blocked by the browser.
 {
  let calls=0,stops=0;
  const recorder={state:"inactive",start(){throw Error("Recorder unavailable");},stop(){}};
  const failing=create({getConsent:()=>true,
   requestStream:async()=>({getTracks:()=>[{stop(){stops++;}}]}),
   recorderFactory:()=>{calls++;return recorder;}});
  eq(await failing.start(),false,"A rejected recorder start fails safely");
  eq(stops,1,"Recorder startup failure releases microphone track");
  eq(failing.getStatus().phase,"idle","Recorder startup failure resets phase");
  eq(await failing.start(),false,"Recorder can be retried after failure");
  eq(calls,2,"Retry creates a new recorder");
  eq(stops,2,"Retry failure also releases microphone");
 }
 // A failing stop must invalidate even a subsequently delivered stale onstop event.
 {
  let released=0,writes=0;
  const recorder={state:"recording",mimeType:"audio/webm",start(){},stop(){throw Error("stop rejected");}};
  const guarded=create({getConsent:()=>true,
   requestStream:async()=>({getTracks:()=>[{stop(){released++;}}]}),
   recorderFactory:()=>recorder,
   save:async()=>{writes++;}});
  eq(await guarded.start(),true,"Recording began before stop failure");
  recorder.ondataavailable({data:new Blob([new Uint8Array(150)])});
  eq(guarded.stop(),false,"Stop failure is exposed");
  eq(guarded.getStatus().phase,"idle","Stop failure resets phase");
  eq(released,1,"Stop failure releases mic track");
  recorder.onstop();await tick();
  eq(writes,0,"Late stop callback cannot save invalidated audio");
 }
 console.log("Voice sample lifecycle:",checked,"assertions");
})().catch(e=>{console.error(e);process.exitCode=1});
