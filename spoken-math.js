// Robotito — spoken everyday mathematics.
// Handles short/medium calculations without requiring the dedicated Math area.
(function(){
  const strip=s=>String(s||"").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[¿?¡!]/g," ")
    .replace(/,/g,",")
    .replace(/\s+/g," ").trim();

  const ES={
    cero:0,un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,
    diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,
    veinte:20,veintiuno:21,veintiun:21,veintidos:22,veintitres:23,veinticuatro:24,veinticinco:25,veintiseis:26,veintisiete:27,veintiocho:28,veintinueve:29,
    treinta:30,cuarenta:40,cincuenta:50,sesenta:60,setenta:70,ochenta:80,noventa:90,
    cien:100,ciento:100,doscientos:200,trescientos:300,cuatrocientos:400,quinientos:500,seiscientos:600,setecientos:700,ochocientos:800,novecientos:900
  };
  const EN={
    zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,
    sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90
  };
  const PT={
    zero:0,um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,catorze:14,quatorze:14,
    quinze:15,dezesseis:16,dezasseis:16,dezessete:17,dezoito:18,dezenove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,oitenta:80,noventa:90,
    cem:100,cento:100,duzentos:200,trezentos:300,quatrocentos:400,quinhentos:500,seiscentos:600,setecentos:700,oitocentos:800,novecentos:900
  };

  const NUM_WORDS=new Set([
    ...Object.keys(ES),...Object.keys(EN),...Object.keys(PT),
    "y","and","e","mil","miles","thousand","milhao","milhoes","million","millions","millon","millones"
  ]);

  function dictFor(lang){return lang==="en"?EN:lang==="pt"?PT:ES;}
  function parseWordNumberTokens(tokens,lang){
    const dict=dictFor(lang);
    let total=0,current=0,had=false;
    for(const raw of tokens){
      const w=raw.replace(/[^a-z0-9ñ]/g,"");
      if(!w)continue;
      if(w==="y"||w==="and"||w==="e")continue;
      if(Object.prototype.hasOwnProperty.call(dict,w)){
        const v=dict[w];
        // Tens + units naturally sum; hundred words are already full values.
        current+=v; had=true; continue;
      }
      if(w==="mil"||w==="miles"||w==="thousand"){
        total+=(current||1)*1000;current=0;had=true;continue;
      }
      if(["millon","millones","million","millions","milhao","milhoes"].includes(w)){
        total+=(current||1)*1000000;current=0;had=true;continue;
      }
      return null;
    }
    return had?total+current:null;
  }

  function replaceNumberWords(input,lang){
    const tokens=String(input).split(/\s+/);
    const out=[];
    for(let i=0;i<tokens.length;){
      const clean=tokens[i].replace(/[^a-z0-9ñ]/g,"");
      if(!NUM_WORDS.has(clean)){out.push(tokens[i]);i++;continue;}
      let best=null,bestEnd=i;
      let phrase=[];
      for(let j=i;j<Math.min(tokens.length,i+12);j++){
        const w=tokens[j].replace(/[^a-z0-9ñ]/g,"");
        if(!NUM_WORDS.has(w))break;
        phrase.push(w);
        const n=parseWordNumberTokens(phrase,lang);
        if(n!==null){best=n;bestEnd=j+1;}
      }
      if(best!==null){
        out.push(String(best));
        i=bestEnd;
      }else{
        out.push(tokens[i]);i++;
      }
    }
    return out.join(" ");
  }

  function prep(input,lang){
    let s=strip(input)
      .replace(/\bcuanto\s+(?:es|da|seria|son)\b/g," ")
      .replace(/\b(?:calculame|calcula|resolve|resolver|resuelve|decime|dime)\b/g," ")
      .replace(/\bwhat(?:'s| is)\b|\bcalculate\b|\bwork out\b/g," ")
      .replace(/\bquanto (?:e|da)\b|\bcalcula\b/g," ")
      .replace(/\s+/g," ").trim();

    s=s
      .replace(/\bpor ciento\b/g," % ")
      .replace(/\bpor cento\b/g," % ")
      .replace(/\bpercent\b/g," % ");

    s=replaceNumberWords(s,lang);

    // Decimal speech after word-number conversion.
    s=s.replace(/(\d+)\s+(?:coma|punto|point|virgula)\s+(\d+)/g,"$1.$2");
    return s.trim();
  }

  function fmt(n,lang){
    if(!Number.isFinite(n))return String(n);
    const v=Math.abs(n)<1e-12?0:Number(n.toFixed(10));
    return new Intl.NumberFormat(lang==="en"?"en-US":lang==="pt"?"pt-BR":"es-UY",{
      maximumFractionDigits:10,useGrouping:false
    }).format(v);
  }

  function resultText(kind,data,lang){
    const es={
      add:`${fmt(data.a,lang)} más ${fmt(data.b,lang)} da ${fmt(data.value,lang)}.`,
      sub:`${fmt(data.a,lang)} menos ${fmt(data.b,lang)} da ${fmt(data.value,lang)}.`,
      mul:`${fmt(data.a,lang)} por ${fmt(data.b,lang)} da ${fmt(data.value,lang)}.`,
      div:`${fmt(data.a,lang)} dividido ${fmt(data.b,lang)} da ${fmt(data.value,lang)}.`,
      power:`${fmt(data.a,lang)} elevado a ${fmt(data.b,lang)} da ${fmt(data.value,lang)}.`,
      sqrt:`La raíz cuadrada de ${fmt(data.a,lang)} es ${fmt(data.value,lang)}.`,
      cbrt:`La raíz cúbica de ${fmt(data.a,lang)} es ${fmt(data.value,lang)}.`,
      root:`La raíz de índice ${fmt(data.n,lang)} de ${fmt(data.a,lang)} es ${fmt(data.value,lang)}.`,
      percent:`${fmt(data.a,lang)} por ciento de ${fmt(data.b,lang)} es ${fmt(data.value,lang)}.`,
      half:`La mitad de ${fmt(data.a,lang)} es ${fmt(data.value,lang)}.`,
      double:`El doble de ${fmt(data.a,lang)} es ${fmt(data.value,lang)}.`,
      triple:`El triple de ${fmt(data.a,lang)} es ${fmt(data.value,lang)}.`,
      factorial:`${fmt(data.a,lang)} factorial es ${fmt(data.value,lang)}.`,
      expression:`Da ${fmt(data.value,lang)}.`
    };
    if(lang==="en"){
      const map={
        add:`${fmt(data.a,lang)} plus ${fmt(data.b,lang)} is ${fmt(data.value,lang)}.`,
        sub:`${fmt(data.a,lang)} minus ${fmt(data.b,lang)} is ${fmt(data.value,lang)}.`,
        mul:`${fmt(data.a,lang)} times ${fmt(data.b,lang)} is ${fmt(data.value,lang)}.`,
        div:`${fmt(data.a,lang)} divided by ${fmt(data.b,lang)} is ${fmt(data.value,lang)}.`,
        power:`${fmt(data.a,lang)} to the power of ${fmt(data.b,lang)} is ${fmt(data.value,lang)}.`,
        sqrt:`The square root of ${fmt(data.a,lang)} is ${fmt(data.value,lang)}.`,
        cbrt:`The cube root of ${fmt(data.a,lang)} is ${fmt(data.value,lang)}.`,
        root:`The ${fmt(data.n,lang)}-th root of ${fmt(data.a,lang)} is ${fmt(data.value,lang)}.`,
        percent:`${fmt(data.a,lang)} percent of ${fmt(data.b,lang)} is ${fmt(data.value,lang)}.`,
        half:`Half of ${fmt(data.a,lang)} is ${fmt(data.value,lang)}.`,
        double:`Double ${fmt(data.a,lang)} is ${fmt(data.value,lang)}.`,
        triple:`Triple ${fmt(data.a,lang)} is ${fmt(data.value,lang)}.`,
        factorial:`${fmt(data.a,lang)} factorial is ${fmt(data.value,lang)}.`,
        expression:`The result is ${fmt(data.value,lang)}.`
      }; return map[kind]||map.expression;
    }
    if(lang==="pt"){
      const map={
        add:`${fmt(data.a,lang)} mais ${fmt(data.b,lang)} dá ${fmt(data.value,lang)}.`,
        sub:`${fmt(data.a,lang)} menos ${fmt(data.b,lang)} dá ${fmt(data.value,lang)}.`,
        mul:`${fmt(data.a,lang)} vezes ${fmt(data.b,lang)} dá ${fmt(data.value,lang)}.`,
        div:`${fmt(data.a,lang)} dividido por ${fmt(data.b,lang)} dá ${fmt(data.value,lang)}.`,
        power:`${fmt(data.a,lang)} elevado a ${fmt(data.b,lang)} dá ${fmt(data.value,lang)}.`,
        sqrt:`A raiz quadrada de ${fmt(data.a,lang)} é ${fmt(data.value,lang)}.`,
        cbrt:`A raiz cúbica de ${fmt(data.a,lang)} é ${fmt(data.value,lang)}.`,
        root:`A raiz de índice ${fmt(data.n,lang)} de ${fmt(data.a,lang)} é ${fmt(data.value,lang)}.`,
        percent:`${fmt(data.a,lang)} por cento de ${fmt(data.b,lang)} é ${fmt(data.value,lang)}.`,
        half:`A metade de ${fmt(data.a,lang)} é ${fmt(data.value,lang)}.`,
        double:`O dobro de ${fmt(data.a,lang)} é ${fmt(data.value,lang)}.`,
        triple:`O triplo de ${fmt(data.a,lang)} é ${fmt(data.value,lang)}.`,
        factorial:`${fmt(data.a,lang)} fatorial é ${fmt(data.value,lang)}.`,
        expression:`O resultado é ${fmt(data.value,lang)}.`
      }; return map[kind]||map.expression;
    }
    return es[kind]||es.expression;
  }

  function specialSolve(s,lang){
    let m;

    // Percentages.
    m=s.match(/(-?\d+(?:\.\d+)?)\s*(?:%|por ciento|percent|por cento)\s+(?:de|of)\s+(-?\d+(?:\.\d+)?)/);
    if(m){
      const a=Number(m[1]),b=Number(m[2]),value=a*b/100;
      return {kind:"percent",a,b,value,text:resultText("percent",{a,b,value},lang)};
    }

    // Roots.
    m=s.match(/(?:raiz\s+)?(cuarta|quarta|quinta|sexta|septima|setima|octava|oitava)\s+raiz\s+(?:de|of)?\s*(-?\d+(?:\.\d+)?)/);
    if(m){
      const indexes={cuarta:4,quarta:4,quinta:5,sexta:6,septima:7,setima:7,octava:8,oitava:8};
      const n=indexes[m[1]],a=Number(m[2]);
      if(a<0&&n%2===0)return {error:lang==="en"?"That even root has no real result.":lang==="pt"?"Essa raiz de índice par não tem resultado real.":"Esa raíz de índice par no tiene resultado real."};
      const value=a<0?-Math.pow(-a,1/n):Math.pow(a,1/n);
      return {kind:"root",a,n,value,text:resultText("root",{a,n,value},lang)};
    }
    m=s.match(/(?:raiz|root)\s+(?:cuarta|quarta|quinta|sexta|septima|setima|octava|oitava)\s+(?:de|of)?\s*(-?\d+(?:\.\d+)?)/);
    if(m){
      const word=(s.match(/(?:raiz|root)\s+(cuarta|quarta|quinta|sexta|septima|setima|octava|oitava)/)||[])[1];
      const indexes={cuarta:4,quarta:4,quinta:5,sexta:6,septima:7,setima:7,octava:8,oitava:8};
      const n=indexes[word],a=Number(m[1]);
      if(a<0&&n%2===0)return {error:lang==="en"?"That even root has no real result.":lang==="pt"?"Essa raiz de índice par não tem resultado real.":"Esa raíz de índice par no tiene resultado real."};
      const value=a<0?-Math.pow(-a,1/n):Math.pow(a,1/n);
      return {kind:"root",a,n,value,text:resultText("root",{a,n,value},lang)};
    }
    m=s.match(/(?:raiz|root)\s+(?:cuadrada|quadrada|square)?\s*(?:de|of)?\s*(-?\d+(?:\.\d+)?)/);
    if(m && /(?:raiz|root)/.test(s) && !/(?:cubica|cubica|cube|indice|index)/.test(s)){
      const a=Number(m[1]);
      if(a<0)return {error:lang==="en"?"A real square root cannot be taken from a negative number.":lang==="pt"?"Não existe raiz quadrada real de um número negativo.":"No existe raíz cuadrada real de un número negativo."};
      const value=Math.sqrt(a);
      return {kind:"sqrt",a,value,text:resultText("sqrt",{a,value},lang)};
    }
    m=s.match(/(?:raiz\s+cubica|cube root)\s*(?:de|of)?\s*(-?\d+(?:\.\d+)?)/);
    if(m){
      const a=Number(m[1]),value=Math.cbrt(a);
      return {kind:"cbrt",a,value,text:resultText("cbrt",{a,value},lang)};
    }
    m=s.match(/(?:raiz|root)\s+(?:de\s+)?(?:indice|index)\s+(\d+)\s+(?:de|of)\s+(-?\d+(?:\.\d+)?)/);
    if(m){
      const n=Number(m[1]),a=Number(m[2]);
      if(n===0)return {error:lang==="en"?"A root cannot have index zero.":lang==="pt"?"Uma raiz não pode ter índice zero.":"Una raíz no puede tener índice cero."};
      if(a<0&&n%2===0)return {error:lang==="en"?"That even root has no real result.":lang==="pt"?"Essa raiz de índice par não tem resultado real.":"Esa raíz de índice par no tiene resultado real."};
      const value=a<0?-Math.pow(-a,1/n):Math.pow(a,1/n);
      return {kind:"root",a,n,value,text:resultText("root",{a,n,value},lang)};
    }

    // Natural powers.
    m=s.match(/(?:el\s+)?(?:cuadrado|square)\s+(?:de|of)\s+(-?\d+(?:\.\d+)?)/);
    if(m){const a=Number(m[1]),b=2,value=a*a;return {kind:"power",a,b,value,text:resultText("power",{a,b,value},lang)};}
    m=s.match(/(?:el\s+)?(?:cubo|cube)\s+(?:de|of)\s+(-?\d+(?:\.\d+)?)/);
    if(m){const a=Number(m[1]),b=3,value=a*a*a;return {kind:"power",a,b,value,text:resultText("power",{a,b,value},lang)};}
    m=s.match(/(-?\d+(?:\.\d+)?)\s+(?:a la|a|elevado a la)\s+(cuarta|quinta|sexta|septima|octava)/);
    if(m){
      const powers={cuarta:4,quinta:5,sexta:6,septima:7,octava:8};
      const a=Number(m[1]),b=powers[m[2]],value=Math.pow(a,b);
      return {kind:"power",a,b,value,text:resultText("power",{a,b,value},lang)};
    }
    m=s.match(/(-?\d+(?:\.\d+)?)\s+(?:al cuadrado|squared|ao quadrado)/);
    if(m){const a=Number(m[1]),b=2,value=a*a;return {kind:"power",a,b,value,text:resultText("power",{a,b,value},lang)};}
    m=s.match(/(-?\d+(?:\.\d+)?)\s+(?:al cubo|cubed|ao cubo)/);
    if(m){const a=Number(m[1]),b=3,value=a*a*a;return {kind:"power",a,b,value,text:resultText("power",{a,b,value},lang)};}
    m=s.match(/(-?\d+(?:\.\d+)?)\s+(?:elevado a|elevado al|to the power of|to the power|raised to|elevado a potencia)\s*(-?\d+(?:\.\d+)?)/);
    if(m){
      const a=Number(m[1]),b=Number(m[2]),value=Math.pow(a,b);
      if(!Number.isFinite(value))return {error:"El resultado no es un número real finito."};
      return {kind:"power",a,b,value,text:resultText("power",{a,b,value},lang)};
    }

    // Factorial.
    m=s.match(/(?:factorial\s+(?:de|of)?\s*)?(\d+)\s*(?:factorial|!)?/);
    const factorialAsked=/factorial|!/.test(s);
    if(m&&factorialAsked){
      const a=Number(m[1]);
      if(!Number.isInteger(a)||a<0||a>170)return {error:lang==="en"?"I can only calculate factorials of whole numbers from 0 to 170.":lang==="pt"?"Só calculo fatoriais de números inteiros de 0 a 170.":"Solo calculo factoriales de números enteros entre 0 y 170."};
      let value=1;for(let i=2;i<=a;i++)value*=i;
      return {kind:"factorial",a,value,text:resultText("factorial",{a,value},lang)};
    }

    // Half / double / triple.
    m=s.match(/(?:mitad|half|metade)\s+(?:de|of)\s+(-?\d+(?:\.\d+)?)/);
    if(m){const a=Number(m[1]),value=a/2;return {kind:"half",a,value,text:resultText("half",{a,value},lang)};}
    m=s.match(/(?:doble|double|dobro)\s+(?:de|of)?\s*(-?\d+(?:\.\d+)?)/);
    if(m){const a=Number(m[1]),value=a*2;return {kind:"double",a,value,text:resultText("double",{a,value},lang)};}
    m=s.match(/(?:triple|triplo)\s+(?:de|of)?\s*(-?\d+(?:\.\d+)?)/);
    if(m){const a=Number(m[1]),value=a*3;return {kind:"triple",a,value,text:resultText("triple",{a,value},lang)};}

    return null;
  }

  function translateOperators(s){
    return s
      .replace(/\bdividido\s+(?:entre|por)\b|\bdividido\b|\bdivided by\b|\bover\b|\bdividido por\b/g," / ")
      .replace(/\bmultiplicado\s+por\b|\bmultiplicado\b|\btimes\b|\bmultiplied by\b|\bvezes\b/g," * ")
      .replace(/\bpor\b/g," * ")
      .replace(/\bmas\b|\bplus\b|\bmais\b/g," + ")
      .replace(/\bmenos\b|\bminus\b/g," - ")
      .replace(/\belevado\s+(?:a|al)\b|\braised to\b|\bto the power of\b/g," ^ ")
      .replace(/[x×]/g,"*").replace(/÷/g,"/")
      .replace(/,/g,".")
      .replace(/\s+/g," ").trim();
  }

  function tokenizeExpression(s){
    const tokens=[];
    const re=/\s*(\d+(?:\.\d+)?|[()+\-*/^])\s*/gy;
    let pos=0;
    while(pos<s.length){
      re.lastIndex=pos;
      const m=re.exec(s);
      if(!m||m.index!==pos)return null;
      tokens.push(m[1]);pos=re.lastIndex;
    }
    return tokens;
  }

  function evaluateTokens(tokens){
    let i=0;
    const peek=()=>tokens[i];
    const take=()=>tokens[i++];
    function primary(){
      const t=peek();
      if(t==="("){
        take();const v=expr();
        if(take()!==")")throw new Error("parentheses");
        return v;
      }
      if(/^\d/.test(t||"")){take();return Number(t);}
      throw new Error("number");
    }
    function unary(){
      if(peek()==="+"){take();return unary();}
      if(peek()==="-"){take();return -unary();}
      return primary();
    }
    function power(){
      const base=unary();
      if(peek()==="^"){take();return Math.pow(base,power());}
      return base;
    }
    function term(){
      let v=power();
      while(peek()==="*"||peek()==="/"){
        const op=take(),rhs=power();
        if(op==="/"&&rhs===0)throw new Error("divide-zero");
        v=op==="*"?v*rhs:v/rhs;
      }
      return v;
    }
    function expr(){
      let v=term();
      while(peek()==="+"||peek()==="-"){
        const op=take(),rhs=term();
        v=op==="+"?v+rhs:v-rhs;
      }
      return v;
    }
    const value=expr();
    if(i!==tokens.length)throw new Error("extra");
    return value;
  }

  function mathIntent(s){
    const n=strip(s);
    const hasNumber=/\d/.test(n)||[...NUM_WORDS].some(w=>new RegExp("\\b"+w+"\\b").test(n));
    if(!hasNumber)return false;
    return /[+\-*/×÷^%]|\b(mas|menos|por|multiplicado|dividido|entre|plus|minus|times|mais|vezes|raiz|root|cuadrada|cubica|elevado|power|cuadrado|cubo|cuarta|quinta|sexta|septima|octava|factorial|mitad|doble|triple|metade|dobro|triplo|percent|ciento|cento)\b/.test(n);
  }

  function solve(rawText,lang="es"){
    if(!mathIntent(rawText))return {handled:false};
    const s=prep(rawText,lang);
    const special=specialSolve(s,lang);
    if(special){
      if(special.error)return {handled:true,error:special.error,text:special.error};
      return {handled:true,...special};
    }

    const expression=translateOperators(s)
      .replace(/\s+(?:es|da|equals|igual|resultado)\s*$/g,"")
      .trim();

    // Keep everyday spoken math intentionally bounded.
    const operatorCount=(expression.match(/[+\-*/^]/g)||[]).length;
    if(operatorCount>7||expression.length>140)return {handled:false};

    const tokens=tokenizeExpression(expression);
    if(!tokens||!tokens.some(t=>/[+\-*/^]/.test(t)))return {handled:false};

    try{
      const value=evaluateTokens(tokens);
      if(!Number.isFinite(value))return {handled:true,error:"El resultado no es un número real finito.",text:"El resultado no es un número real finito."};

      // For a single binary operation, answer naturally.
      if(tokens.length===3&&/^\d/.test(tokens[0])&&/^\d/.test(tokens[2])){
        const a=Number(tokens[0]),b=Number(tokens[2]),op=tokens[1];
        const kind={"+":"add","-":"sub","*":"mul","/":"div","^":"power"}[op]||"expression";
        return {handled:true,kind,a,b,value,expression,text:resultText(kind,{a,b,value},lang)};
      }
      return {handled:true,kind:"expression",value,expression,text:resultText("expression",{value},lang)};
    }catch(e){
      if(e.message==="divide-zero"){
        const text=lang==="en"?"You can't divide by zero.":lang==="pt"?"Não se pode dividir por zero.":"No se puede dividir entre cero.";
        return {handled:true,error:text,text};
      }
      return {handled:false};
    }
  }

  window.ROBOTITO_SPOKEN_MATH={solve,replaceNumberWords,parseWordNumberTokens};
})();