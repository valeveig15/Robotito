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
 // A recorder may emit onstop during start in unusual browser implementations.
 {
  let scheduled=0,stopped=0;
  const instant={state:"inactive",mimeType:"audio/webm",
   start(){this.ondataavailable({data:new Blob([new Uint8Array(150)])});this.onstop();},
   stop(){}};
  const fast=create({getConsent:()=>true,
   requestStream:async()=>({getTracks:()=>[{stop(){stopped++;}}]}),
   recorderFactory:()=>instant,
   save:async()=>{},schedule:()=>{scheduled++;return 1;}});
  eq(await fast.start(),true,"Synchronous stop during start is accepted");
  await tick();
  eq(scheduled,0,"No stale auto-stop scheduled after synchronous stop");
  eq(stopped,1,"Synchronous stop releases the track");
  eq(fast.getStatus().phase,"idle","Synchronous save settles cleanly");
 }
 // A duplicate MediaRecorder stop event must never write the sample twice.
 {
  let writes=0;
  const rec={state:"recording",mimeType:"audio/webm",start(){},stop(){this.state="inactive";this.onstop();this.onstop();}};
  const duplicate=create({getConsent:()=>true,
   requestStream:async()=>({getTracks:()=>[{stop(){}}]}),recorderFactory:()=>rec,
   save:async()=>{writes++;}});
  eq(await duplicate.start(),true,"Start duplicate-event recorder");
  rec.ondataavailable({data:new Blob([new Uint8Array(150)])});
  eq(duplicate.stop(),true,"Stop duplicate-event recorder");
  await tick();
  eq(writes,1,"Duplicate stop never saves twice");
  eq(duplicate.getStatus().phase,"idle","Duplicate stop finishes cleanly");
 }
 // An obsolete recorder must not clear the timer or state of the next session.
 {
  let scheduled=0,cancelled=0,writes=0;
  const recorders=[];
  const stale=create({getConsent:()=>true,
   requestStream:async()=>({getTracks:()=>[{stop(){}}]}),
   recorderFactory:()=>{const r={state:"recording",mimeType:"audio/webm",start(){},stop(){this.state="inactive";this.onstop();}};recorders.push(r);return r;},
   save:async()=>{writes++;},schedule:()=>++scheduled,cancelSchedule:()=>{cancelled++;}});
  eq(await stale.start(),true,"First session starts");
  const oldRecorder=recorders[0];
  stale.cancel();
  eq(await stale.start(),true,"New session starts after cancellation");
  const cancelledBefore=cancelled;
  oldRecorder.onstop();oldRecorder.onerror();
  eq(stale.getStatus().phase,"recording","Old callback does not reset new session");
  eq(cancelled,cancelledBefore,"Old callback does not cancel new timer");
  eq(writes,0,"Old callback does not save stale sample");
  stale.cancel();
 }
 // A missing stop event releases the mic immediately and exits via watchdog.
 {
  let timer,stops=0,writes=0;
  const track={stop(){stops++;}},rec={mimeType:"audio/webm",state:"recording",start(){},stop(){this.state="inactive";}};
  const c=create({getConsent:()=>true,requestStream:async()=>({getTracks:()=>[track]}),recorderFactory:()=>rec,
   save:async()=>{writes++;},schedule:fn=>(timer=fn,1),cancelSchedule:()=>{timer=null;}});
  await c.start();rec.ondataavailable({data:new Blob([new Uint8Array(150)])});c.stop();
  eq(stops,1,"Microphone released without waiting for stop event");timer();
  eq(c.getStatus().phase,"idle","Lost stop event cannot block the next recording");
  rec.onstop();await tick();eq(writes,0,"Late stop cannot save after timeout");eq(stops,1,"Track released exactly once");
 }
 // Deletion serializes with save and blocks a new recording until it settles.
 {
  let finish,removes=0;const events=[];
  const c=create({getConsent:()=>true,remove:()=>{removes++;return new Promise(r=>finish=r);},onStatus:s=>events.push(s)});
  const first=c.removeSample(),second=c.removeSample();
  eq(await c.start(),false,"No new recording during deletion");eq(removes,1,"Concurrent deletes share one operation");
  finish();await Promise.all([first,second]);eq(c.getStatus().phase,"idle");eq(events.at(-1),"deleted");
 }
 // Hardware disconnection/muting invalidates the complete recording, not just its final chunk.
 for(const event of ["ended","mute"]){
  const track=new EventTarget();let stops=0,writes=0;track.stop=()=>{stops++;};
  const rec={mimeType:"audio/webm",state:"recording",start(){},stop(){this.state="inactive";this.onstop();}};
  const c=create({getConsent:()=>true,requestStream:async()=>({getTracks:()=>[track]}),recorderFactory:()=>rec,save:async()=>{writes++;}});
  await c.start();rec.ondataavailable({data:new Blob([new Uint8Array(150)])});track.dispatchEvent(new Event(event));await tick();
  eq(c.getStatus().phase,"idle",event+": capture cancelled");eq(writes,0,event+": interrupted sample not kept");eq(stops,1);
 }
 // A failed atomic replacement must not delete an older, authorized sample.
 {
  let fail,removes=0;
  const rec={state:"recording",mimeType:"audio/webm",start(){},stop(){this.state="inactive";this.onstop();}};
  const c=create({getConsent:()=>true,requestStream:async()=>({getTracks:()=>[{stop(){}}]}),recorderFactory:()=>rec,
   save:()=>new Promise((_,reject)=>fail=reject),remove:async()=>{removes++;}});
  await c.start();rec.ondataavailable({data:new Blob([new Uint8Array(150)])});c.stop();c.cancel();fail(Error("quota"));await tick();
  eq(removes,0,"Failed replacement preserves previous saved sample");eq(c.getStatus().phase,"idle");
 }
 console.log("Voice sample lifecycle:",checked,"assertions");
})().catch(e=>{console.error(e);process.exitCode=1});
