"use strict";
const assert=require("node:assert/strict");
const {create}=require("../audio-microphone-gate.js");
let listeners=new Map(),statusEvents=[];
const track={readyState:"live",enabled:true,muted:false,
 addEventListener(kind,fn){const list=listeners.get(kind)||new Set();list.add(fn);listeners.set(kind,list);},
 removeEventListener(kind,fn){listeners.get(kind)?.delete(fn);},
 dispatch(kind){for(const fn of listeners.get(kind)||[])fn();}
};
const gate=create({stream:{getAudioTracks:()=>[track]},onChange:state=>statusEvents.push(state)});
assert.equal(gate.status(),"live","Live audio track can be used");
assert.equal(gate.isLive(),true);
track.muted=true;track.dispatch("mute");
assert.equal(gate.isLive(),false,"Browser-muted microphone must stop model PCM");
assert.deepEqual(statusEvents,["muted"],"Mute triggers immediate reset callback");
track.muted=false;track.dispatch("unmute");
assert.equal(gate.isLive(),true,"Fresh live microphone can resume after unmute");
track.enabled=false;
assert.equal(gate.isLive(),false,"Explicit track.enabled=false must be gated without an event");
track.enabled=true;
assert.equal(gate.isLive(),true,"Explicit reenable can resume capture");
track.readyState="ended";track.dispatch("ended");
assert.equal(gate.status(),"ended","Revoked, stopped or disconnected microphone is not usable");
assert.deepEqual(statusEvents,["muted","live","ended"]);
gate.dispose();
assert.equal(gate.isLive(),false,"Disposed capture gate cannot authorize PCM");
track.readyState="live";track.dispatch("unmute");
assert.deepEqual(statusEvents,["muted","live","ended"],
 "Stopped session must not retain track callbacks");
assert.ok([...listeners.values()].every(set=>set.size===0),
 "All media track event handlers are detached");
const noTracks=create({stream:{getAudioTracks:()=>[]}});
assert.equal(noTracks.isLive(),false,"No microphone track always fails closed");
const invalid=create({stream:{}});
assert.equal(invalid.status(),"ended","Unsupported MediaStream never passes permission checks");
const multiple=create({stream:{getAudioTracks:()=>[
 {readyState:"ended",enabled:true,muted:false},
 {readyState:"live",enabled:true,muted:false}
]}});
assert.equal(multiple.isLive(),true,"A second usable track can sustain audio capture");
multiple.dispose();
console.log("Robotito microphone track lifecycle and default-deny regression passed");
