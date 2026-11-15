"use strict";
const assert=require("node:assert/strict");
const {solve,expression}=require("../algebra-tutor.js");
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,"Expected "+a+" ≈ "+b);
const rows=[
 ["2x+3=11",4],["resuelve -2x+4=10",-3],["2(x+1)=8",3],
 ["x/2=3",6],["x+2=2",0],["resuelve dos equis más tres igual a once",4],
 ["-3x + 1 = 16",-5],["0.5x + 1 = 2",2]
];
for(const [query,expected] of rows){
 const x=solve(query);assert.equal(x.handled,true,query);assert.equal(x.kind,"linear",query);
 near(x.value,expected);assert.equal(x.verified,true);
 assert.match(x.text,/Paso 1/);assert.match(x.text,/Comprobación/);
}
assert.equal(solve("x=x").kind,"identity");
assert.equal(solve("x+1=x+2").kind,"contradiction");
assert.equal(solve("x+y=3").kind,"underdetermined");
const sys=solve("x+y=5; 2x-y=1");
assert.equal(sys.kind,"system");near(sys.x,2);near(sys.y,3);
assert.equal(solve("2x+y=4; 4x+2y=8").kind,"singular");
assert.equal(solve("x/0=1").kind,"unsupported");
assert.equal(solve("x/(x+1)=1").kind,"unsupported");
assert.equal(solve("x*x=4").kind,"unsupported");
assert.equal(solve("x^2=4").kind,"unsupported");
assert.equal(solve("3x4=12").handled,false);
assert.equal(solve("¿Qué hora es?").handled,false);
assert.equal(solve("2+2").handled,false);
assert.equal(solve("x + 2 metros = 3").kind,"unsupported");
assert.equal(solve("2x=4","en").kind,"linear");
assert.match(solve("2x=4","en").text,/Equation/);
assert.match(solve("2x=4","pt").text,/Equação/);
assert.match(solve("2x=4","fr").text,/Équation/);
assert.match(solve("2x=4","it").text,/Equazione/);
assert.match(solve("2x=4","de").text,/Gleichung/);
assert.deepEqual(expression("2(x+1)"),{x:2,y:0,c:2});
console.log("P19 affine and 2-variable system voice tutor: passed");
