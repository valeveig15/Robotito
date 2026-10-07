"use strict";
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const sandbox={console,setTimeout,clearTimeout,fetch:async()=>{throw new Error("network disabled in core tests");}};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);

function load(file){vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),sandbox,{filename:file});}
function fail(message,actual,expected){failures.push({message,actual,expected});}
function equal(actual,expected,message){total++;if(!Object.is(actual,expected))fail(message,actual,expected);}
function ok(value,message){total++;if(!value)fail(message,value,"truthy");}
let total=0;
const failures=[];

["intent-engine.js","spoken-math.js","knowledge.js","emotional-dialogue.js","presidents.js","physics-momentum.js"].forEach(load);

const intent=sandbox.ROBOTITO_INTENT_ENGINE;
const intentCases={
  definition:["¿Qué es permutación?","Definime fotosíntesis","What is entropy?","Define gravity","O que é densidade?"],
  explanation:["Explícame permutación","¿Cómo funciona la fotosíntesis?","Explain entropy","How does gravity work?","Me explique densidade"],
  comparison:["Compara mitosis y meiosis","¿Cuál es la diferencia entre masa y peso?","Compare cats and dogs","Difference between speed and velocity"],
  exercise:["Explícame paso a paso el ejercicio 4","Resolvé el ejercicio 2","Resuelve este problema","Solve exercise 9","Explique o exercício 2"],
  "class-question":["Según la clase, ¿qué es permutación?","¿Qué vimos en clase?","Buscá en mis apuntes la fórmula","According to my class, explain entropy","Na minha aula, o que vimos?"],
  "book-recommendation":["Recomendame un libro de misterio","Sugerime novelas parecidas","Recommend a book about grief","Sugira um livro de fantasia"],
  calculation:["¿Cuánto es 18 por 7?","Calculá la raíz cuadrada de 144","What is 8 * 9?","Quanto é 9 + 4?"],
  conversation:["Hola robotito","Te quiero mucho","Thank you"],
  command:["Callate por 20 segundos","Mostrame un gato","Open class"],
  statement:["Me gusta la permutación","Tengo un problema con mi amigo","La profesora de yoga es amable","Recomendé un libro ayer"]
};
for(const [expected,phrases] of Object.entries(intentCases))for(const phrase of phrases)equal(intent.classify(phrase).intent,expected,"intent: "+phrase);
equal(intent.classify("¿Qué es permutación?").useClassMemory,false,"general definition never uses class memory");
equal(intent.classify("Según la clase, ¿qué es permutación?").useClassMemory,true,"explicit class question uses class memory");
equal(intent.classify("Explícame paso a paso el ejercicio 4").depth,"step-by-step","step-by-step depth preserved");
equal(intent.shapeAnswer("¿Qué es X?","Primera. Segunda."),"Primera.","definition is one sentence");

const math=sandbox.ROBOTITO_SPOKEN_MATH;
const mathCases=[
  ["dos más dos","es",4],["10 menos 7","es",3],["seis por ocho","es",48],["20 dividido 4","es",5],
  ["dos más tres por cuatro","es",14],["dos elevado a la cuarta","es",16],["raíz cuadrada de 144","es",12],
  ["raíz cúbica de 27","es",3],["20 por ciento de 50","es",10],["factorial de 5","es",120],
  ["la mitad de 18","es",9],["el doble de 7","es",14],["el triple de 6","es",18],
  ["-2^2","es",-4],["2^-2","es",.25],["what is five plus seven","en",12],
  ["six times nine","en",54],["square root of 81","en",9],["dois mais três","pt",5],
  ["dez dividido por dois","pt",5],["raiz quadrada de 64","pt",8]
];
for(const [phrase,lang,expected] of mathCases)equal(math.solve(phrase,lang).value,expected,"math: "+phrase);
equal(math.solve("tengo dos gatos","es").handled,false,"math rejects non-operation");
ok(math.solve("10 dividido 0","es").error,"division by zero is explicit");

const emotion=sandbox.ROBOTITO_EMOTION_DIALOGUE;
const emotionCases=[
  ["te quiero mucho","affection"],["I love you","affection"],["hay un monstruo atrás tuyo","fear"],
  ["viste lo que le pasa a la mamá de Bambi","grief"],["me caes mal","rejection"],
  ["sos un idiota","anger"],["perdón robotito, te traté mal","apology"],
  ["bien hecho, excelente trabajo","praise"],["tengo una sorpresa","excitement"],
  ["tranquilo, no hay ningún monstruo","reassurance"],["qué significa te quiero",null],["me gusta Bambi",null]
];
for(const [phrase,expected] of emotionCases)equal(emotion.classify(phrase)?.id||null,expected,"emotion: "+phrase);

const knowledge=sandbox.ROBOTITO_COMMON_KNOWLEDGE;
equal(knowledge.answer("¿Qué es permutación?","es"),"Una permutación es una ordenación de todos los elementos de un conjunto; el orden sí importa.","permutation answer");
ok(knowledge.answer("what is a permutation","en")?.toLowerCase().includes("ordering"),"English permutation answer");

const presidents=sandbox.ROBOTITO_PRESIDENTS;
let parsed=presidents.parseQuestion("¿Quién era presidente de Uruguay en 2010?");
equal(parsed.country,"uruguay","historical president country");equal(parsed.year,2010,"historical president year");equal(parsed.intent,"historical","historical president intent");
parsed=presidents.parseQuestion("List presidents of Brazil");equal(parsed.country,"brazil","English president country");equal(parsed.intent,"list","president list intent");

const physics=sandbox.ROBOTITO_PHYSICS_MOMENTUM;
ok(physics.answer("¿qué es un choque elástico?")?.toLowerCase().includes("energía cinética"),"elastic collision definition");
ok(physics.answer("¿qué es un choque inelástico?")?.toLowerCase().includes("no se conserva"),"inelastic collision definition");

for(const file of fs.readdirSync(root).filter(name=>name.endsWith(".js"))){
  total++;
  try{new vm.Script(fs.readFileSync(path.join(root,file),"utf8"),{filename:file});}
  catch(error){fail("syntax: "+file,String(error),"valid JavaScript");}
}

if(failures.length){
  console.error(`Robotito core regression: ${total-failures.length}/${total} passed`);
  failures.forEach(item=>console.error("FAIL",item.message,{actual:item.actual,expected:item.expected}));
  process.exit(1);
}
console.log(`Robotito core regression: ${total}/${total} passed`);
