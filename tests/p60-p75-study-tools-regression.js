"use strict";
const assert=require("node:assert/strict");
const P=require("../study-tools-policy.js");
assert.equal(P.formatClock(0),"00:00:00");
assert.equal(P.formatClock(3661000),"01:01:01");
assert.equal(P.formatClock(-500),"00:00:00");
assert.equal(P.durationMinutes(25),25);
assert.throws(()=>P.durationMinutes(0),RangeError);
assert.throws(()=>P.durationMinutes(1500),RangeError);
assert.throws(()=>P.durationMinutes("banana"),RangeError);
const stopped=P.timerState({mode:"countdown",startedAt:1000,elapsedMs:5000,limitMs:15000,running:false},9000);
assert.equal(stopped.remaining,10000);
const running=P.timerState({mode:"countdown",startedAt:1000,elapsedMs:5000,limitMs:15000,running:true},15000);
assert.equal(running.remaining,0);assert.equal(running.done,true);assert.equal(running.progress,100);
assert.equal(P.timerState({mode:"stopwatch",startedAt:1000,elapsedMs:4000,running:true},6000).elapsed,9000);
const monday=new Date("2026-11-16T12:00:00");
const week=P.weeklyMinutes([
 {at:monday.getTime(),minutes:30,subject:"Biología"},
 {at:monday.getTime()+60000,minutes:20,subject:"Biología"},
 {at:monday.getTime()+60000,minutes:15,subject:"Física"},
 {at:monday.getTime()-8*86400000,minutes:500,subject:"Física"},
 {at:monday.getTime()+60000,minutes:-5,subject:"Física"}
],monday.getTime());
assert.equal(week.length,7);assert.equal(week[0].minutes,65);
assert.equal(week[0].subjects["Biología"],50);
assert.equal(week.reduce((sum,x)=>sum+x.minutes,0),65);
assert.deepEqual(P.estimateMinutes([{subject:"Física",minutes:20},{subject:"Física",minutes:45}], "Física",30),
 {minutes:30,samples:2,source:"manual"});
assert.deepEqual(P.estimateMinutes([{subject:"Física",minutes:20},{subject:"Física",minutes:45},{subject:"Física",minutes:35}],"Física",30),
 {minutes:35,samples:3,source:"observed"});
const card=P.makeFlashcard("¿Qué es ATP?","Trifosfato de adenosina","Biología");
assert.equal(card.subject,"Biología");
assert.throws(()=>P.makeFlashcard("","respuesta"),/Front/);
assert.equal(P.gradeCard(card,true,1000).dueAt,1000+86400000);
assert.equal(P.gradeCard({...card,repetitions:2},true,1000).intervalDays,7);
assert.equal(P.gradeCard({...card,repetitions:5},false,1000).repetitions,0);
const read="Hola, ¿qué tal? 1+2=3.\n";
assert.equal(P.readingSegments(read).map(x=>x.head+x.tail).join(""),read);
assert.ok(P.readingSegments(read).some(x=>x.word&&x.tail));
assert.ok(P.readingSegments("<script>alert(1)</script>").some(x=>x.word));
const map=P.mindMap("Membrana celular\nFosfolípidos\nProteínas\nTransporte");
assert.equal(map.topic,"Membrana celular");
assert.equal(map.branches.length,3);
assert.equal(map.branches[0].label,"Fosfolípidos");
assert.equal(P.mindMap("").branches.length,0);
console.log("P60/P61/P62/P67/P69/P70/P73/P75: 27 assertions passed");
