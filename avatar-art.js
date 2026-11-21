// Ilustraciones vectoriales animadas para todos los avatares de Robotito.
(function(){
  const a=(body,belly,accent,shape,ears,tail,marking)=>({
    body,belly,accent,
    shape:shape||"mammal",
    ears:ears||"round",
    tail:tail||"small",
    marking:marking||"none"
  });

  const profiles={
    "panda":a("#f7f7f9","#ffffff","#2d2931","mammal","round","small","panda"),
    "brown-bear":a("#8b5a3c","#c99063","#513222","mammal","round","small"),
    "polar-bear":a("#f4fbff","#ffffff","#b9d8e8","mammal","round","small"),
    "dog":a("#c98550","#f2c08d","#6b3f2d","mammal","floppy","wag","patch"),
    "monkey":a("#8c5a3c","#e6b982","#563523","primate","round","curl"),
    "cat":a("#8c8792","#d8d2da","#4e4655","mammal","point","long","forehead"),
    "red-panda":a("#b94d2e","#f3c79f","#482a28","mammal","point","bushy","mask"),
    "iguana":a("#66a65c","#b8d990","#315f3c","reptile","none","long","scales"),
    "chameleon":a("#62b77b","#b8e3a4","#315f4d","reptile","crest","curl","scales"),
    "armadillo":a("#a56e54","#d0a17b","#63483c","mammal","small","long","shell"),
    "penguin":a("#303744","#f7f8fa","#f0a43c","bird","none","feather","tuxedo"),
    "elephant":a("#8f9baa","#c4ccd4","#66717f","mammal","fan","small","none"),
    "turtle":a("#6f9a55","#b9ca78","#456b3e","reptile","none","small","shell"),
    "squirrel":a("#b87542","#efd0a4","#77462d","mammal","point","bushy","none"),
    "mouse":a("#a9a4ad","#e8d6da","#6e6572","mammal","round","long","none"),
    "hamster":a("#d9a56c","#fff1cf","#8b5d3c","mammal","round","small","patch"),
    "rabbit":a("#d4c9d2","#fff8fb","#877786","mammal","long","puff","none"),
    "lion":a("#d79a3f","#f2c56f","#8f582a","mammal","round","long","mane"),
    "tiger":a("#e99035","#f7c27a","#4a332a","mammal","round","long","stripes"),
    "panther":a("#34313a","#665f6c","#18161d","mammal","round","long","none"),
    "fox":a("#d96b32","#f5cfad","#613526","mammal","point","bushy","mask"),
    "koala":a("#9299a3","#dce0e4","#575d66","mammal","fluffy","small","none"),
    "pig":a("#ef9eaa","#ffd0d5","#a95e6b","mammal","small","curl","none"),
    "cow":a("#f3eee9","#fffaf7","#3d3534","mammal","cow","long","cow"),
    "frog":a("#70b85a","#bce294","#386a37","frog","none","none","none"),
    "owl":a("#927052","#d7bd94","#563f32","bird","tuft","feather","owl"),
    "wolf":a("#7a818a","#c5c9ce","#434850","mammal","point","bushy","mask"),
    "horse":a("#9a633f","#d2a077","#58392c","mammal","horse","long","blaze"),
    "unicorn":a("#eee9ff","#ffffff","#b778d0","mammal","horse","long","unicorn"),
    "dinosaur":a("#63a86c","#b5d58d","#356a45","reptile","none","long","dinosaur"),
    "crocodile":a("#5f8d4c","#b4c77a","#365b39","reptile","none","long","crocodile"),
    "dolphin":a("#5e9fca","#bfe1ef","#397393","aquatic","none","fish","dolphin"),
    "zebra":a("#f4f3f2","#ffffff","#25242a","mammal","horse","long","zebra"),
    "deer":a("#b27b4f","#e5bd8e","#684a35","mammal","deer","small","spots"),
    "hippopotamus":a("#9b8197","#c6a8bc","#624e62","mammal","small","small","hippo"),
    "giraffe":a("#d9a64f","#f3d28a","#885e30","mammal","giraffe","long","giraffe"),
    "kangaroo":a("#b98559","#e5bd91","#714c35","mammal","long","long","pouch"),
    "gorilla":a("#4b464d","#807780","#29262b","primate","round","none","chest"),
    "sheep":a("#eee9e2","#fffdf9","#69616a","mammal","sheep","small","wool"),
    "goat":a("#c7b8a3","#ebe1d3","#726451","mammal","goat","small","goat"),
    "peacock":a("#278a87","#66c2af","#235a8f","bird","crest","fan","peacock"),
    "swan":a("#f7f7f6","#ffffff","#d69b55","bird","none","feather","swan"),
    "flamingo":a("#ed839c","#ffc2cd","#a94f67","bird","none","feather","flamingo"),
    "skunk":a("#29272d","#f2f0ed","#151419","mammal","point","bushy","skunk"),
    "raccoon":a("#77757c","#c7c3c2","#37343b","mammal","round","bushy","raccoon"),
    "otter":a("#80563e","#c89c76","#4b352b","aquatic","round","long","none"),
    "sloth":a("#8b7764","#c6b29d","#51483f","primate","round","none","sloth"),
    "beaver":a("#8a5a3a","#cf9d70","#4f3327","mammal","round","flat","beaver"),
    "hedgehog":a("#7d5a42","#dfb889","#4d382d","mammal","round","none","hedgehog"),
    "robot":a("#7cc4d8","#dff6fb","#526f9b","robot","antenna","none","robot")
  };

  const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const safeClass=s=>String(s||"").replace(/[^a-z0-9_-]/gi,"");
  const mix=(hex,target="#ffffff",amount=.2)=>{
    const clean=String(hex||"").replace("#","");
    const goal=String(target||"").replace("#","");
    if(!/^[0-9a-f]{6}$/i.test(clean)||!/^[0-9a-f]{6}$/i.test(goal))return hex;
    const value=[0,2,4].map(i=>Math.round(parseInt(clean.slice(i,i+2),16)*(1-amount)+parseInt(goal.slice(i,i+2),16)*amount));
    return "#"+value.map(n=>n.toString(16).padStart(2,"0")).join("");
  };

  const jewelEyes=new Set(["cat","red-panda","iguana","chameleon","panther","fox","tiger","crocodile","frog","owl","wolf","peacock"]);
  const skyEyes=new Set(["polar-bear","dolphin","swan","flamingo","unicorn","robot"]);
  const honeyEyes=new Set(["dog","monkey","lion","cow","deer","giraffe","kangaroo","otter","beaver"]);
  function irisColor(id){
    if(jewelEyes.has(id))return "#718c52";
    if(skyEyes.has(id))return "#68a9c8";
    if(honeyEyes.has(id))return "#9a6a3f";
    return "#62566d";
  }

  function tailDetailMarkup(id,p){
    if(["red-panda","raccoon"].includes(id))return '<g class="avatar-tail-detail" fill="none" stroke="'+p.belly+'" stroke-width="6" stroke-linecap="round" opacity=".72"><path d="M175 184q18 3 26 14"/><path d="M170 198q15 4 22 14"/></g>';
    if(id==="tiger")return '<g class="avatar-tail-detail" fill="none" stroke="'+p.accent+'" stroke-width="5" stroke-linecap="round"><path d="M176 190l13 7"/><path d="M181 204l10 5"/></g>';
    if(id==="zebra")return '<path class="avatar-tail-detail" d="M185 209q8 6 14 1" fill="none" stroke="'+p.accent+'" stroke-width="7" stroke-linecap="round"/>';
    if(id==="skunk")return '<path class="avatar-tail-detail" d="M176 180q20 8 24 28" fill="none" stroke="'+p.belly+'" stroke-width="6" stroke-linecap="round" opacity=".9"/>';
    return "";
  }

  function faceDetailMarkup(id,p){
    const d=p.accent,b=p.belly;
    if(["cat","red-panda","lion","tiger","panther","fox","wolf","skunk","raccoon","otter"].includes(id))return '<g class="avatar-face-detail avatar-whiskers" fill="none" stroke="'+d+'" stroke-width="2" stroke-linecap="round" opacity=".55"><path d="M76 106 43 99M77 112 40 113M144 106l33-7M143 112l37 1"/></g>';
    if(["mouse","hamster","rabbit","squirrel","beaver","hedgehog"].includes(id))return '<g class="avatar-face-detail avatar-whiskers" fill="none" stroke="'+d+'" stroke-width="2" stroke-linecap="round" opacity=".48"><path d="M78 108 48 102M79 114 46 117M142 108l30-6M141 114l33 3"/></g>'+(id==="rabbit"?'<path class="avatar-tooth" d="M103 119h14v13q-7 6-14 0z" fill="#fff" stroke="'+d+'" stroke-width="1.6"/>':'');
    if(["monkey","gorilla","sloth"].includes(id))return '<path class="avatar-face-detail avatar-face-mask" d="M70 71q17-25 40-6 23-19 40 6-3 47-40 51-37-4-40-51z" fill="'+b+'" opacity=".34"/><circle cx="99" cy="103" r="2.4" fill="'+d+'" opacity=".58"/><circle cx="121" cy="103" r="2.4" fill="'+d+'" opacity=".58"/>';
    if(["iguana","chameleon","dinosaur","crocodile","turtle"].includes(id))return '<g class="avatar-face-detail avatar-scales" fill="'+d+'" opacity=".18"><circle cx="68" cy="95" r="3.4"/><circle cx="75" cy="102" r="2.4"/><circle cx="152" cy="95" r="3.4"/><circle cx="145" cy="102" r="2.4"/></g>';
    if(["horse","unicorn","zebra","deer","giraffe","goat","cow"].includes(id))return '<g class="avatar-face-detail avatar-nostrils" fill="'+d+'" opacity=".55"><ellipse cx="96" cy="109" rx="3" ry="2"/><ellipse cx="124" cy="109" rx="3" ry="2"/></g>';
    if(id==="pig")return '<g class="avatar-face-detail"><ellipse cx="110" cy="106" rx="25" ry="18" fill="'+b+'" stroke="'+d+'" stroke-opacity=".3" stroke-width="2"/><circle cx="101" cy="106" r="3.2" fill="'+d+'" opacity=".65"/><circle cx="119" cy="106" r="3.2" fill="'+d+'" opacity=".65"/></g>';
    if(["penguin","owl","peacock","swan","flamingo"].includes(id))return '<g class="avatar-face-detail avatar-feather-detail" fill="none" stroke="'+b+'" stroke-width="2.2" stroke-linecap="round" opacity=".48"><path d="M71 61q12-10 23-8M149 61q-12-10-23-8"/></g>';
    if(id==="dolphin")return '<path class="avatar-face-detail" d="M132 110q13 8 24 0" fill="none" stroke="'+d+'" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>';
    return "";
  }

  function crownDetailMarkup(id,p){
    if(["horse","unicorn","zebra"].includes(id))return '<path class="avatar-mane-detail" d="M98 30q12-14 23 0l-4 32q-7-8-15 0z" fill="'+p.accent+'" opacity=".9"/>';
    if(id==="iguana")return '<path class="avatar-crest-detail" d="m76 39 9-19 9 16 12-21 10 20 13-17 7 23" fill="'+p.belly+'" stroke="'+p.accent+'" stroke-width="2.5" stroke-linejoin="round"/>';
    if(id==="crocodile")return '<path class="avatar-crest-detail" d="m65 56 9-15 10 12 11-18 10 16" fill="'+p.belly+'" opacity=".72"/>';
    if(id==="dinosaur")return '<path class="avatar-crest-detail" d="m73 48 10-23 13 19 12-27 13 26 14-19 8 25" fill="'+p.accent+'" opacity=".82"/>';
    return "";
  }

  function tailMarkup(p){
    const c=p.body, d=p.accent;
    switch(p.tail){
      case "bushy": return '<path class="avatar-tail avatar-tail-bushy" d="M166 177c48-42 58 18 26 35-18 10-32-3-19-13 20-14 12-29-7-12" fill="'+c+'" stroke="'+d+'" stroke-width="6" stroke-linecap="round"/>';
      case "curl": return '<path class="avatar-tail" d="M165 177c38-16 43 31 14 30-21-1-18-25-2-24" fill="none" stroke="'+c+'" stroke-width="13" stroke-linecap="round"/>';
      case "long": return '<path class="avatar-tail" d="M163 178c38 6 48 35 22 51-12 8-27 4-29-7" fill="none" stroke="'+c+'" stroke-width="14" stroke-linecap="round"/>';
      case "wag": return '<path class="avatar-tail avatar-tail-wag" d="M164 177c30-9 46-28 45-47" fill="none" stroke="'+c+'" stroke-width="16" stroke-linecap="round"/>';
      case "puff": return '<circle class="avatar-tail" cx="177" cy="185" r="20" fill="'+p.belly+'" stroke="'+d+'" stroke-width="4"/>';
      case "flat": return '<path class="avatar-tail" d="M164 180c35 5 50 26 31 43-20 16-39-2-30-14 8-10 12-18-1-29z" fill="'+d+'" opacity=".9"/>';
      case "fish": return '<path class="avatar-tail" d="M164 187c29 2 42 14 55 29-20 1-28 9-38 20-1-20-7-32-17-49z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      case "fan": return '<g class="avatar-tail avatar-tail-fan"><path d="M110 175C33 165 23 83 58 44c22 38 42 23 52 60 10-37 30-22 52-60 35 39 25 121-52 131z" fill="'+p.accent+'" opacity=".84"/><circle cx="58" cy="67" r="9" fill="#54c6b6"/><circle cx="162" cy="67" r="9" fill="#54c6b6"/><circle cx="110" cy="54" r="10" fill="#6bc8af"/></g>';
      case "feather": return '<path class="avatar-tail" d="M158 179c40-3 50 14 53 30-24-5-38 0-52 12z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      case "small": return '<circle class="avatar-tail" cx="171" cy="185" r="14" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      default:return "";
    }
  }

  function earsMarkup(p){
    const c=p.body,d=p.accent,i=p.belly;
    switch(p.ears){
      case "point": return '<path class="avatar-ear avatar-ear-left" d="M62 56 65 9l35 36z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><path class="avatar-ear avatar-ear-right" d="m120 45 35-36 3 47z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><path d="M72 42 72 24l16 20zM132 44l16-20v18z" fill="'+i+'" opacity=".72"/>';
      case "long": return '<path class="avatar-ear avatar-ear-left" d="M72 51C50 16 58-13 77 3c15 13 17 38 10 51z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><path class="avatar-ear avatar-ear-right" d="M133 51c22-35 14-64-5-48-15 13-17 38-10 51z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      case "floppy": return '<path class="avatar-ear avatar-ear-left" d="M76 48C45 35 39 66 50 90c8 16 28 2 32-27z" fill="'+d+'"/><path class="avatar-ear avatar-ear-right" d="M144 48c31-13 37 18 26 42-8 16-28 2-32-27z" fill="'+d+'"/>';
      case "fan": return '<ellipse class="avatar-ear avatar-ear-left" cx="58" cy="67" rx="31" ry="38" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><ellipse class="avatar-ear avatar-ear-right" cx="162" cy="67" rx="31" ry="38" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><path d="M42 65q16-19 32 0M146 65q16-19 32 0" fill="none" stroke="'+i+'" stroke-width="5" opacity=".65"/>';
      case "fluffy": return '<circle class="avatar-ear avatar-ear-left" cx="65" cy="49" r="27" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><circle class="avatar-ear avatar-ear-right" cx="155" cy="49" r="27" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><circle cx="65" cy="49" r="14" fill="'+i+'"/><circle cx="155" cy="49" r="14" fill="'+i+'"/>';
      case "horse": return '<path class="avatar-ear avatar-ear-left" d="M77 47 71 13q22 10 25 35z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><path class="avatar-ear avatar-ear-right" d="m124 48 25-35-6 35z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      case "cow": return '<path class="avatar-ear avatar-ear-left" d="M77 51C48 32 39 52 68 67z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><path class="avatar-ear avatar-ear-right" d="M143 51c29-19 38 1 9 16z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      case "deer": return '<path class="avatar-ear avatar-ear-left" d="M78 51C49 30 45 56 72 70z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><path class="avatar-ear avatar-ear-right" d="M142 51c29-21 33 5 6 19z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      case "giraffe": return '<path class="avatar-ear avatar-ear-left" d="M77 49C52 31 47 52 72 65z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><path class="avatar-ear avatar-ear-right" d="M143 49c25-18 30 3 5 16z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      case "sheep": return '<path class="avatar-ear avatar-ear-left" d="M76 55C45 42 45 69 70 75z" fill="'+d+'"/><path class="avatar-ear avatar-ear-right" d="M144 55c31-13 31 14 6 20z" fill="'+d+'"/>';
      case "goat": return '<path class="avatar-ear avatar-ear-left" d="M78 54C52 38 49 61 72 70z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><path class="avatar-ear avatar-ear-right" d="M142 54c26-16 29 7 6 16z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      case "tuft": return '<path class="avatar-ear avatar-ear-left" d="m67 53-10-35 31 27z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><path class="avatar-ear avatar-ear-right" d="m153 53 10-35-31 27z" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      case "crest": return '<path d="m103 44 7-35 9 36 18-27-5 38z" fill="'+d+'" stroke="'+d+'" stroke-width="3" stroke-linejoin="round"/>';
      case "small": return '<ellipse class="avatar-ear avatar-ear-left" cx="72" cy="51" rx="17" ry="13" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><ellipse class="avatar-ear avatar-ear-right" cx="148" cy="51" rx="17" ry="13" fill="'+c+'" stroke="'+d+'" stroke-width="4"/>';
      case "round": return '<circle class="avatar-ear avatar-ear-left" cx="72" cy="47" r="22" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><circle class="avatar-ear avatar-ear-right" cx="148" cy="47" r="22" fill="'+c+'" stroke="'+d+'" stroke-width="4"/><circle cx="72" cy="47" r="11" fill="'+i+'" opacity=".72"/><circle cx="148" cy="47" r="11" fill="'+i+'" opacity=".72"/>';
      default:return "";
    }
  }

  function behindMarkup(id,p){
    if(id==="hedgehog")return '<path class="avatar-special avatar-spines" d="M55 163 31 145l22-5-15-25 27 5-3-30 25 18 12-29 15 27 23-23 5 31 30-8-15 28 27 7-24 20z" fill="'+p.accent+'" stroke="#4d382d" stroke-width="4" stroke-linejoin="round"/>';
    if(id==="peacock")return tailMarkup({...p,tail:"fan"});
    if(id==="dinosaur")return '<path class="avatar-special" d="m65 152-19-17 24-5-10-23 25 4 1-26 20 14 12-24 15 23 20-17 4 27 27-7-14 25 25 9-25 17z" fill="'+p.accent+'" opacity=".9"/>';
    if(id==="lion")return '<circle class="avatar-special avatar-mane" cx="110" cy="83" r="67" fill="'+p.accent+'" opacity=".96"/>';
    if(id==="giraffe")return '<path class="avatar-special" d="M82 167V87q0-31 28-31t28 31v80z" fill="'+p.body+'" stroke="'+p.accent+'" stroke-width="5"/>';
    return "";
  }

  function markingsMarkup(id,p){
    const d=p.accent;
    if(["tiger","zebra"].includes(id))return '<g class="avatar-markings" fill="none" stroke="'+d+'" stroke-width="7" stroke-linecap="round"><path d="M78 56 91 70M142 56l-13 14M69 89l18 4M151 89l-18 4M86 143l8 18M134 143l-8 18M84 188l12 13M136 188l-12 13"/></g>';
    if(["deer","giraffe"].includes(id))return '<g class="avatar-markings" fill="'+d+'" opacity=".7"><circle cx="80" cy="83" r="7"/><circle cx="142" cy="71" r="8"/><circle cx="73" cy="158" r="8"/><circle cx="145" cy="165" r="7"/><circle cx="110" cy="190" r="8"/></g>';
    if(id==="panda")return '<g class="avatar-markings" fill="'+d+'"><ellipse cx="86" cy="79" rx="22" ry="27" transform="rotate(18 86 79)"/><ellipse cx="134" cy="79" rx="22" ry="27" transform="rotate(-18 134 79)"/></g>';
    if(["red-panda","fox","wolf"].includes(id))return '<path class="avatar-markings" d="M59 78q25-35 51-7 26-28 51 7-9 38-51 39T59 78z" fill="'+d+'" opacity=".78"/>';
    if(id==="raccoon")return '<path class="avatar-markings" d="M58 75q26-29 52-6 26-23 52 6-8 35-52 34S66 110 58 75z" fill="'+d+'"/>';
    if(id==="skunk")return '<path class="avatar-markings" d="M99 38q11-10 22 0l-5 47q-6 17-12 0zM97 133h26l10 72q-23 22-46 0z" fill="'+p.belly+'" opacity=".94"/>';
    if(id==="cow")return '<g class="avatar-markings" fill="'+d+'"><path d="M61 64q20-29 39-6L91 84 62 89z"/><path d="M119 144q34-19 47 16l-15 29-34-4z"/></g>';
    if(id==="dog"||id==="hamster")return '<path class="avatar-markings" d="M61 68q19-25 39-7L92 96 62 94z" fill="'+d+'" opacity=".82"/>';
    if(id==="horse")return '<path class="avatar-markings" d="m103 38 14 0-4 61-10 0z" fill="'+p.belly+'" opacity=".9"/>';
    return "";
  }

  function specialFront(id,p){
    const d=p.accent,b=p.belly;
    switch(id){
      case "elephant":return '<path class="avatar-special avatar-trunk" d="M103 102c-2 31-7 54 9 62 13 6 25-8 18-18" fill="none" stroke="'+p.body+'" stroke-width="19" stroke-linecap="round"/>';
      case "turtle":return '<g class="avatar-special avatar-shell"><ellipse cx="110" cy="179" rx="48" ry="47" fill="'+d+'" stroke="#395b36" stroke-width="3"/><ellipse cx="96" cy="160" rx="18" ry="22" fill="#fff" opacity=".12"/><path d="M76 179h68M110 134v90M84 146l52 66M136 146l-52 66" stroke="'+b+'" stroke-width="3" stroke-linecap="round" opacity=".48"/></g>';
      case "armadillo":return '<g class="avatar-special avatar-shell"><path d="M62 180q7-57 48-57t48 57q-4 43-48 43t-48-43z" fill="'+b+'" stroke="'+d+'" stroke-width="3"/><path d="M80 139q-4 39 4 70M96 126q-4 50 1 94M114 125q6 51 2 96M133 137q8 39 2 72" fill="none" stroke="'+d+'" stroke-width="3.5" stroke-linecap="round" opacity=".58"/><path d="M74 158q36-22 73 0" fill="none" stroke="#fff" stroke-width="3" opacity=".18"/></g>';
      case "unicorn":return '<path class="avatar-special avatar-horn" d="m103 45 8-46 13 48z" fill="#f1b7ff" stroke="'+d+'" stroke-width="4"/><path d="m108 28 11-8M106 38l15-9" stroke="#fff" stroke-width="3"/>';
      case "deer":return '<path class="avatar-special" d="M80 50 65 23m8 15-19-5m17-3 2-18M140 50l15-27m-8 15 19-5m-17-3-2-18" fill="none" stroke="'+d+'" stroke-width="6" stroke-linecap="round"/>';
      case "goat":return '<path class="avatar-special" d="M82 52C58 31 64 10 83 18M138 52c24-21 18-42-1-34" fill="none" stroke="'+d+'" stroke-width="8" stroke-linecap="round"/><path d="M104 111q6 25 12 0" fill="'+d+'"/>';
      case "cow":return '<path class="avatar-special" d="M81 51Q59 31 62 19M139 51q22-20 19-32" fill="none" stroke="#d8c49b" stroke-width="8" stroke-linecap="round"/>';
      case "giraffe":return '<path class="avatar-special" d="M89 44V16M131 44V16" stroke="'+d+'" stroke-width="7" stroke-linecap="round"/><circle cx="89" cy="13" r="8" fill="'+d+'"/><circle cx="131" cy="13" r="8" fill="'+d+'"/>';
      case "kangaroo":return '<path class="avatar-special avatar-pouch" d="M82 166q28 29 56 0v39q-28 20-56 0z" fill="'+b+'" stroke="'+d+'" stroke-width="4"/>';
      case "owl":return '<g class="avatar-special" fill="'+b+'" stroke="'+d+'" stroke-width="4"><circle cx="84" cy="80" r="29"/><circle cx="136" cy="80" r="29"/></g><path d="m110 88-11 15h22z" fill="#df9c3b"/>';
      case "penguin":return '<path class="avatar-special" d="M72 92q38 25 76 0v104q-38 38-76 0z" fill="'+b+'"/><path d="m110 91-12 14h24z" fill="'+p.accent+'"/>';
      case "crocodile":return '<path class="avatar-special" d="M61 91q49 22 98 0v25q-49 25-98 0z" fill="'+b+'" stroke="'+d+'" stroke-width="4"/><path d="m72 111 8 10 8-10 8 10 8-10 8 10 8-10 8 10 8-10 8 10 8-10" fill="#fff"/>';
      case "dinosaur":return '<path class="avatar-special" d="m98 39 12-28 11 29z" fill="'+d+'"/>';
      case "dolphin":return '<path class="avatar-special" d="M151 75q28 10 39 26-24 4-42-7z" fill="'+p.body+'"/><path d="m105 135 20 27-31 1z" fill="'+d+'"/>';
      case "frog":return '<circle class="avatar-special" cx="72" cy="48" r="24" fill="'+p.body+'" stroke="'+d+'" stroke-width="4"/><circle class="avatar-special" cx="148" cy="48" r="24" fill="'+p.body+'" stroke="'+d+'" stroke-width="4"/>';
      case "hippopotamus":return '<ellipse class="avatar-special" cx="110" cy="105" rx="52" ry="32" fill="'+b+'" stroke="'+d+'" stroke-width="4"/><circle cx="93" cy="95" r="5" fill="'+d+'"/><circle cx="127" cy="95" r="5" fill="'+d+'"/>';
      case "sheep":return '<g class="avatar-special avatar-wool" fill="'+b+'"><circle cx="69" cy="55" r="24"/><circle cx="91" cy="39" r="25"/><circle cx="117" cy="37" r="26"/><circle cx="144" cy="52" r="25"/><circle cx="67" cy="150" r="27"/><circle cx="88" cy="133" r="30"/><circle cx="118" cy="132" r="31"/><circle cx="148" cy="150" r="28"/></g>';
      case "peacock":return '<path class="avatar-special" d="M101 43 96 13m14 30V8m9 35 7-30" stroke="'+d+'" stroke-width="4"/><circle cx="96" cy="11" r="5" fill="#58cbb1"/><circle cx="110" cy="7" r="5" fill="#58cbb1"/><circle cx="127" cy="12" r="5" fill="#58cbb1"/>';
      case "flamingo":return '<path class="avatar-special" d="M106 130q-25 35 0 66v42M129 130q18 33-2 63v45" fill="none" stroke="'+p.body+'" stroke-width="8" stroke-linecap="round"/>';
      case "beaver":return '<path class="avatar-special" d="M92 107h14v20H92zM114 107h14v20h-14z" fill="#fff" stroke="'+d+'" stroke-width="3"/>';
      case "sloth":return '<path class="avatar-special" d="M61 73q49-34 98 0-4 48-49 48S65 121 61 73z" fill="'+d+'" opacity=".55"/>';
      default:return "";
    }
  }

  function robotMarkup(id,p,cls){
    const uid="rt-robot-"+(cls||"avatar");
    return '<svg class="avatar-character avatar-robot '+cls+'" viewBox="0 0 220 260" data-character="'+id+'" aria-hidden="true"><defs><linearGradient id="'+uid+'-metal" x1="18%" y1="5%" x2="82%" y2="96%"><stop offset="0" stop-color="#fff" stop-opacity=".64"/><stop offset=".42" stop-color="'+p.body+'"/><stop offset="1" stop-color="#68aec5"/></linearGradient><radialGradient id="'+uid+'-cheek"><stop offset="0" stop-color="#ff9fbd" stop-opacity=".78"/><stop offset="1" stop-color="#ffb8ca" stop-opacity="0"/></radialGradient><filter id="'+uid+'-soft" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#3e5570" flood-opacity=".17"/></filter></defs><ellipse class="avatar-ground" cx="110" cy="242" rx="68" ry="12"/><g class="avatar-whole plush-avatar-whole"><path class="avatar-antenna" d="M110 38V17" stroke="'+p.accent+'" stroke-width="7" stroke-linecap="round"/><circle cx="110" cy="12" r="9" fill="#ff8db1"/><circle cx="107" cy="9" r="3" fill="#fff" opacity=".66"/><rect class="avatar-body plush-body" x="54" y="128" width="112" height="98" rx="38" fill="url(#'+uid+'-metal)" stroke="'+p.accent+'" stroke-opacity=".35" stroke-width="3"/><rect class="avatar-belly plush-belly" x="75" y="149" width="70" height="50" rx="16" fill="'+p.belly+'"/><path class="avatar-chest-heart" d="M110 158c-5-7-15-3-14 5 1 8 14 15 14 15s13-7 14-15c1-8-9-12-14-5z"/><circle cx="91" cy="184" r="5" fill="#ff8db1"/><circle cx="110" cy="184" r="5" fill="#ffd36e"/><circle cx="129" cy="184" r="5" fill="#65d6a6"/><path class="avatar-arm avatar-arm-left arm arm-left" d="M56 151 29 187" stroke="'+p.accent+'" stroke-width="17" stroke-linecap="round"/><path class="avatar-arm avatar-arm-right arm arm-right" d="m164 151 27 36" stroke="'+p.accent+'" stroke-width="17" stroke-linecap="round"/><circle class="avatar-paw-pad" cx="28" cy="188" r="8"/><circle class="avatar-paw-pad" cx="192" cy="188" r="8"/><path class="avatar-leg" d="M82 218v20M138 218v20" stroke="'+p.accent+'" stroke-width="19" stroke-linecap="round"/><ellipse class="avatar-paw-pad" cx="82" cy="239" rx="14" ry="7"/><ellipse class="avatar-paw-pad" cx="138" cy="239" rx="14" ry="7"/><g class="avatar-head-group head-group"><rect class="avatar-head plush-head" x="39" y="39" width="142" height="100" rx="43" fill="'+p.belly+'" stroke="'+p.accent+'" stroke-opacity=".42" stroke-width="4" filter="url(#'+uid+'-soft)"/><path class="avatar-fur-shine avatar-head-shine" d="M61 59q25-19 54-15"/><circle cx="39" cy="88" r="13" fill="url(#'+uid+'-metal)"/><circle cx="181" cy="88" r="13" fill="url(#'+uid+'-metal)"/><g class="avatar-eye-group avatar-eye-left"><ellipse class="avatar-eye-white eye-white-svg" cx="79" cy="82" rx="21" ry="25"/><ellipse class="avatar-iris iris iris-svg" cx="81" cy="84" rx="11.5" ry="13.5"/><circle class="avatar-pupil pupil-svg" cx="81" cy="86" r="7.5"/><circle class="avatar-eye-shine" cx="76" cy="78" r="4.8"/><circle class="avatar-eye-star" cx="86" cy="90" r="2.2"/><path class="blink-line" d="M60 84q19 10 38 0"/></g><g class="avatar-eye-group avatar-eye-right"><ellipse class="avatar-eye-white eye-white-svg" cx="141" cy="82" rx="21" ry="25"/><ellipse class="avatar-iris iris iris-svg" cx="139" cy="84" rx="11.5" ry="13.5"/><circle class="avatar-pupil pupil-svg" cx="139" cy="86" r="7.5"/><circle class="avatar-eye-shine" cx="134" cy="78" r="4.8"/><circle class="avatar-eye-star" cx="144" cy="90" r="2.2"/><path class="blink-line" d="M122 84q19 10 38 0"/></g><path class="avatar-brow avatar-brow-left gentle-brow brow brow-left" d="M63 54q16-8 31 0"/><path class="avatar-brow avatar-brow-right gentle-brow brow brow-right" d="M126 54q16-8 31 0"/><circle class="avatar-cheek cheek" cx="53" cy="111" r="17" fill="url(#'+uid+'-cheek)"/><circle class="avatar-cheek cheek" cx="167" cy="111" r="17" fill="url(#'+uid+'-cheek)"/><path class="avatar-mouth mouth-line" d="M88 111q10 12 22 0 12 12 22 0" fill="none" stroke="'+p.accent+'" stroke-width="3.8" stroke-linecap="round"/><path class="avatar-tongue tongue-svg" d="M103 119q7 9 14 0" fill="#f397b0" opacity=".9"/></g></g></svg>';
  }

  function render(avatar,extraClass){
    const id=avatar&&avatar.id&&profiles[avatar.id]?avatar.id:"panda";
    // El panda conserva siempre su SVG original de index.html. Esta familia
    // ilustrada se usa exclusivamente para los demás avatares.
    if(id==="panda")return null;
    const p=profiles[id];
    const bodyLight=mix(p.body,"#ffffff",.22);
    const bodyShade=mix(p.body,"#2a2330",.10);
    const bellyLight=mix(p.belly,"#ffffff",.30);
    const cls=safeClass(extraClass);
    if(p.shape==="robot")return robotMarkup(id,p,cls);
    const isBird=p.shape==="bird";
    const isAquatic=p.shape==="aquatic";
    const isReptile=p.shape==="reptile";
    const isPrimate=p.shape==="primate";
    const isLongFace=new Set(["horse","unicorn","zebra","deer","giraffe","goat","cow"]).has(id);
    const bodyRx=isBird?52:isAquatic?63:isReptile?60:isPrimate?60:57;
    const bodyRy=isBird?72:isAquatic?55:isReptile?61:isPrimate?64:66;
    const bellyRx=isBird?33:isAquatic?43:isReptile?40:isPrimate?39:36;
    const bellyRy=isBird?52:isAquatic?34:isReptile?39:isPrimate?43:46;
    const headRx=isAquatic?74:isReptile?70:isPrimate?70:68;
    const headRy=isAquatic?53:isBird?62:isLongFace?64:59;
    const uid='rt-'+id.replace(/[^a-z0-9]/g,'-')+'-'+(cls||'avatar');
    const muzzle=isBird
      ? '<path class="avatar-muzzle avatar-beak" d="m96 101 14 18 16-18z" fill="'+p.accent+'"/><path d="M101 106h19" stroke="#fff" stroke-opacity=".36" stroke-width="2" stroke-linecap="round"/>'
      : isAquatic
        ? '<path class="avatar-muzzle plush-muzzle" d="M101 96q45-6 62 14-31 15-62 4z" fill="'+p.belly+'" stroke="'+p.accent+'" stroke-opacity=".32" stroke-width="2.5"/>'
        : isReptile
          ? '<ellipse class="avatar-muzzle plush-muzzle" cx="110" cy="108" rx="51" ry="27" fill="'+p.belly+'" stroke="'+p.accent+'" stroke-opacity=".28" stroke-width="2.5"/><circle cx="93" cy="103" r="3" fill="'+p.accent+'"/><circle cx="127" cy="103" r="3" fill="'+p.accent+'"/>'
          : isLongFace
            ? '<ellipse class="avatar-muzzle plush-muzzle" cx="110" cy="105" rx="31" ry="34" fill="'+p.belly+'" opacity=".97"/><path class="avatar-nose" d="M99 107q11-7 22 0-2 11-11 11t-11-11z" fill="'+p.accent+'"/><ellipse cx="106" cy="109" rx="3" ry="1.8" fill="#fff" opacity=".42"/>'
          : '<ellipse class="avatar-muzzle plush-muzzle" cx="110" cy="104" rx="38" ry="29" fill="'+p.belly+'" opacity=".97"/><path class="avatar-nose" d="M100 93q10-9 20 0-2 14-10 14t-10-14z" fill="'+p.accent+'"/><ellipse cx="106" cy="96" rx="3.4" ry="2.1" fill="#fff" opacity=".48"/>';
    const wings=isBird
      ? '<path class="avatar-wing avatar-wing-left" d="M68 139Q31 157 53 211q29-16 43-54z" fill="url(#'+uid+'-body)" stroke="'+p.accent+'" stroke-opacity=".28" stroke-width="2.5"/><path class="avatar-wing avatar-wing-right" d="M152 139q37 18 15 72-29-16-43-54z" fill="url(#'+uid+'-body)" stroke="'+p.accent+'" stroke-opacity=".28" stroke-width="2.5"/>'
      : isAquatic
        ? '<path class="avatar-wing avatar-wing-left" d="M70 147 30 185q31 11 63-9z" fill="url(#'+uid+'-body)" stroke="'+p.accent+'" stroke-opacity=".28" stroke-width="2.5"/><path class="avatar-wing avatar-wing-right" d="m150 147 40 38q-31 11-63-9z" fill="url(#'+uid+'-body)" stroke="'+p.accent+'" stroke-opacity=".28" stroke-width="2.5"/>'
        : '<g class="avatar-arm avatar-arm-left arm arm-left"><path d="M69 143Q40 169 55 215" fill="none" stroke="'+p.accent+'" stroke-width="27" stroke-linecap="round"/><ellipse class="avatar-paw-pad" cx="56" cy="211" rx="10" ry="7" transform="rotate(-8 56 211)"/></g><g class="avatar-arm avatar-arm-right arm arm-right"><path d="M151 143q29 26 14 72" fill="none" stroke="'+p.accent+'" stroke-width="27" stroke-linecap="round"/><ellipse class="avatar-paw-pad" cx="164" cy="211" rx="10" ry="7" transform="rotate(8 164 211)"/></g>';
    const legs=id==="flamingo"?"":'<g class="avatar-leg avatar-leg-left leg leg-left"><ellipse cx="82" cy="224" rx="27" ry="30" fill="'+p.accent+'"/><ellipse class="avatar-paw-pad" cx="82" cy="235" rx="14" ry="8"/><circle class="avatar-toe" cx="72" cy="225" r="3.2"/><circle class="avatar-toe" cx="82" cy="222" r="3.6"/><circle class="avatar-toe" cx="92" cy="225" r="3.2"/></g><g class="avatar-leg avatar-leg-right leg leg-right"><ellipse cx="138" cy="224" rx="27" ry="30" fill="'+p.accent+'"/><ellipse class="avatar-paw-pad" cx="138" cy="235" rx="14" ry="8"/><circle class="avatar-toe" cx="128" cy="225" r="3.2"/><circle class="avatar-toe" cx="138" cy="222" r="3.6"/><circle class="avatar-toe" cx="148" cy="225" r="3.2"/></g>';
    const feature=specialFront(id,p);
    const bodyFeatureIds=new Set(["turtle","armadillo","penguin","kangaroo","flamingo","sheep"]);
    const bodyFeature=bodyFeatureIds.has(id)?feature:"";
    const underEyeFeatureIds=new Set(["owl","frog","hippopotamus","sloth"]);
    const underEyeFeature=underEyeFeatureIds.has(id)?feature:"";
    const faceFeature=bodyFeatureIds.has(id)||underEyeFeatureIds.has(id)?"":feature;
    return '<svg class="avatar-character avatar-'+esc(id)+' '+cls+'" viewBox="0 0 220 260" data-character="'+esc(id)+'" aria-hidden="true"><defs><linearGradient id="'+uid+'-body" x1="18%" y1="4%" x2="84%" y2="98%"><stop offset="0" stop-color="'+bodyLight+'"/><stop offset=".55" stop-color="'+p.body+'"/><stop offset="1" stop-color="'+bodyShade+'"/></linearGradient><linearGradient id="'+uid+'-belly" x1="24%" y1="6%" x2="76%" y2="96%"><stop offset="0" stop-color="'+bellyLight+'"/><stop offset=".55" stop-color="'+p.belly+'"/><stop offset="1" stop-color="'+p.belly+'"/></linearGradient><radialGradient id="'+uid+'-cheek"><stop offset="0" stop-color="#ff9fbd" stop-opacity=".82"/><stop offset="1" stop-color="#ffb8ca" stop-opacity="0"/></radialGradient><filter id="'+uid+'-soft" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#514353" flood-opacity=".15"/></filter></defs><ellipse class="avatar-ground" cx="110" cy="244" rx="69" ry="11"/><g class="avatar-whole plush-avatar-whole">'+behindMarkup(id,p)+tailMarkup(p)+tailDetailMarkup(id,p)+'<g class="avatar-body-group body-group"><ellipse class="avatar-body plush-body" cx="110" cy="174" rx="'+bodyRx+'" ry="'+bodyRy+'" fill="url(#'+uid+'-body)" stroke="'+p.accent+'" stroke-opacity=".18" stroke-width="2"/><path class="avatar-fur-shine" d="M75 148q-12 38 2 69"/><ellipse class="avatar-belly plush-belly" cx="110" cy="181" rx="'+bellyRx+'" ry="'+bellyRy+'" fill="url(#'+uid+'-belly)"/><ellipse class="avatar-belly-glow" cx="98" cy="161" rx="15" ry="25"/><path class="avatar-chest-heart" d="M110 173c-6-8-18-4-17 6 2 9 17 18 17 18s15-9 17-18c1-10-11-14-17-6z"/>'+bodyFeature+wings+legs+'</g>'+earsMarkup(p)+'<g class="avatar-head-group head-group"><ellipse class="avatar-head plush-head" cx="110" cy="83" rx="'+headRx+'" ry="'+headRy+'" fill="url(#'+uid+'-body)" stroke="'+p.accent+'" stroke-opacity=".18" stroke-width="2" filter="url(#'+uid+'-soft)"/><path class="avatar-fur-shine avatar-head-shine" d="M60 62q22-35 59-37"/><path class="avatar-fur-tuft" d="M91 27q7-15 18 0 10-17 21 2"/>'+crownDetailMarkup(id,p)+markingsMarkup(id,p)+underEyeFeature+'<g class="avatar-eye-group avatar-eye-left"><ellipse class="avatar-eye-white eye-white-svg" cx="82" cy="79" rx="18.5" ry="22.5"/><ellipse class="avatar-iris iris iris-svg" cx="84" cy="82" rx="11.5" ry="13.5"/><circle class="avatar-pupil pupil-svg" cx="84" cy="84" r="7.5"/><circle class="avatar-eye-shine" cx="79" cy="76" r="4.8"/><circle class="avatar-eye-star" cx="89" cy="88" r="2.2"/><path class="blink-line" d="M66 80q16 9 32 0"/></g><g class="avatar-eye-group avatar-eye-right"><ellipse class="avatar-eye-white eye-white-svg" cx="138" cy="79" rx="18.5" ry="22.5"/><ellipse class="avatar-iris iris iris-svg" cx="136" cy="82" rx="11.5" ry="13.5"/><circle class="avatar-pupil pupil-svg" cx="136" cy="84" r="7.5"/><circle class="avatar-eye-shine" cx="131" cy="76" r="4.8"/><circle class="avatar-eye-star" cx="141" cy="88" r="2.2"/><path class="blink-line" d="M122 80q16 9 32 0"/></g><path class="avatar-brow avatar-brow-left gentle-brow brow brow-left" d="M67 51q15-8 29 0"/><path class="avatar-brow avatar-brow-right gentle-brow brow brow-right" d="M124 51q15-8 29 0"/><circle class="avatar-cheek cheek" cx="59" cy="110" r="18" fill="url(#'+uid+'-cheek)"/><circle class="avatar-cheek cheek" cx="161" cy="110" r="18" fill="url(#'+uid+'-cheek)"/>'+muzzle+faceDetailMarkup(id,p)+'<path class="avatar-mouth mouth-line" d="M92 116q8 10 18 0 10 10 18 0" fill="none" stroke="'+p.accent+'" stroke-width="3.6" stroke-linecap="round"/><path class="avatar-tongue tongue-svg" d="M103 123q7 10 14 0" fill="#f397b0" opacity=".9"/></g>'+faceFeature+'</g></svg>';
  }

  function audit(requiredIds){
    const ids=requiredIds||Object.keys(profiles);
    const missing=ids.filter(id=>!profiles[id]);
    return {count:Object.keys(profiles).length,missing:missing};
  }

  // Anatomy and emotions are drawn as part of ONE continuous vector character.
  // No pasted-on polygonal head/body: those produced double faces and cut-out seams.
  function polishedRender(avatar,extraClass){
    let svg=render(avatar,extraClass);
    if(!svg)return svg;
    const id=avatar&&avatar.id||"panda",p=profiles[id]||profiles.panda;
    const special=["cat","red-panda","iguana"].includes(id);
    if(special){
      const existingTail=tailMarkup(p);
      const tail=id==="cat"
        ? '<g class="avatar-tail avatar-tail-long"><path d="M156 190C181 183 200 193 197 213c-2 14-27 18-22 32 6 15 25 8 26-3" fill="none" stroke="'+p.accent+'" stroke-width="19" stroke-linecap="round"/><path d="M156 190C182 184 199 194 197 213c-1 10-23 17-22 26" fill="none" stroke="'+p.body+'" stroke-width="13" stroke-linecap="round"/></g>'
        : id==="iguana"
        ? '<g class="avatar-tail avatar-tail-long"><path d="M150 185Q191 186 215 214Q203 225 180 216Q161 209 150 202Z" fill="'+p.body+'" stroke="'+p.accent+'" stroke-width="2.8" stroke-linejoin="round"/><path d="m177 205 8-14 8 18 7-9 5 13" fill="none" stroke="'+p.accent+'" stroke-width="3" stroke-linejoin="round"/></g>'
        : '<g class="avatar-tail avatar-tail-bushy"><path d="M154 180Q178 151 201 171Q223 191 207 214Q190 233 166 211Q180 203 171 193Z" fill="'+p.body+'" stroke="'+p.accent+'" stroke-width="3.5" stroke-linejoin="round"/><path d="M181 167q13 14 8 43M201 178q11 17-1 35" fill="none" stroke="'+p.belly+'" stroke-width="8" stroke-linecap="round" opacity=".92"/></g>';
      svg=svg.replace(existingTail,tail);
      const armColor=id==="red-panda"?p.accent:p.body;
      const arms='<g class="avatar-arm avatar-arm-left arm arm-left"><path d="M78 145Q57 146 49 168L43 197Q43 218 60 221Q76 217 76 199L87 167Z" fill="'+armColor+'" stroke="'+p.accent+'" stroke-opacity=".35" stroke-width="2"/><path d="M48 205q13 8 24-3" fill="none" stroke="'+p.belly+'" stroke-width="3" opacity=".4"/><ellipse class="avatar-paw-pad" cx="52" cy="212" rx="5" ry="4"/><ellipse class="avatar-paw-pad" cx="63" cy="214" rx="5" ry="4"/><ellipse class="avatar-paw-pad" cx="70" cy="207" rx="4" ry="3.5"/></g>'+
        '<g class="avatar-arm avatar-arm-right arm arm-right"><path d="M142 145Q163 146 171 168L177 197Q177 218 160 221Q144 217 144 199L133 167Z" fill="'+armColor+'" stroke="'+p.accent+'" stroke-opacity=".35" stroke-width="2"/><path d="M172 205q-13 8-24-3" fill="none" stroke="'+p.belly+'" stroke-width="3" opacity=".4"/><ellipse class="avatar-paw-pad" cx="168" cy="212" rx="5" ry="4"/><ellipse class="avatar-paw-pad" cx="157" cy="214" rx="5" ry="4"/><ellipse class="avatar-paw-pad" cx="150" cy="207" rx="4" ry="3.5"/></g>';
      svg=svg.replace(/<g class="avatar-arm avatar-arm-left arm arm-left">.*?<\/g><g class="avatar-arm avatar-arm-right arm arm-right">.*?<\/g>/,arms);
      const legColor=id==="red-panda"?p.accent:p.body;
      const legs='<g class="avatar-leg avatar-leg-left leg leg-left"><path d="M79 199Q65 214 66 238Q65 251 81 251Q101 251 103 234L104 212Z" fill="'+legColor+'" stroke="'+p.accent+'" stroke-opacity=".3" stroke-width="2"/><path d="M65 240q17-9 34 0l8 9q-26 12-48 0Z" fill="'+legColor+'"/><ellipse class="avatar-paw-pad" cx="72" cy="248" rx="5" ry="3"/><ellipse class="avatar-paw-pad" cx="84" cy="249" rx="5" ry="3"/><ellipse class="avatar-paw-pad" cx="96" cy="247" rx="5" ry="3"/></g>'+
        '<g class="avatar-leg avatar-leg-right leg leg-right"><path d="M141 199Q155 214 154 238Q155 251 139 251Q119 251 117 234L116 212Z" fill="'+legColor+'" stroke="'+p.accent+'" stroke-opacity=".3" stroke-width="2"/><path d="M155 240q-17-9-34 0l-8 9q26 12 48 0Z" fill="'+legColor+'"/><ellipse class="avatar-paw-pad" cx="148" cy="248" rx="5" ry="3"/><ellipse class="avatar-paw-pad" cx="136" cy="249" rx="5" ry="3"/><ellipse class="avatar-paw-pad" cx="124" cy="247" rx="5" ry="3"/></g>';
      svg=svg.replace(/<g class="avatar-leg avatar-leg-left leg leg-left">.*?<\/g><g class="avatar-leg avatar-leg-right leg leg-right">.*?<\/g>/,legs);
      const bodyRx=id==="cat"?47:id==="iguana"?52:56;
      svg=svg.replace(/(class="avatar-body plush-body" cx="110" cy="174" rx=")\d+/, '$1'+bodyRx);
      if(id==="cat"){
        svg=svg.replace(/(class="avatar-belly plush-belly" cx="110" cy="181" rx=")\d+/, '$1'+'29');
      }
      const bodyDetail=id==="red-panda"
        ? '<path class="avatar-species-chest" d="M84 143Q96 156 110 150Q124 156 136 143Q145 179 129 202Q121 215 110 221Q99 215 91 202Q75 179 84 143Z" fill="'+p.belly+'" opacity=".88"/><path d="M97 151q13 16 26 0" fill="none" stroke="#fff0df" stroke-width="3" opacity=".75"/>'
        : id==="iguana"
        ? '<path class="avatar-species-chest" d="M93 145Q110 155 127 145Q137 190 122 218Q110 225 98 218Q83 190 93 145Z" fill="'+p.belly+'" opacity=".8"/><path d="M105 171q5 5 10 0M103 190q7 5 14 0M105 208q5 3 10 0" fill="none" stroke="'+p.accent+'" stroke-width="2" opacity=".18"/>'
        : '<path class="avatar-species-chest" d="M94 153q16 9 32 0Q138 184 125 214q-15 11-30 0Q82 184 94 153Z" fill="'+p.belly+'" opacity=".78"/>';
      svg=svg.replace('<ellipse class="avatar-belly-glow"',bodyDetail+'<ellipse class="avatar-belly-glow"');
    }
    // Single reptile mouth below the nostrils; remove the mismatched second line.
    if(id==="iguana"){
      svg=svg.replace(/<path class="avatar-mouth mouth-line" d="M92 116q8 10 18 0 10 10 18 0"[^>]*\/>/,
        '<path class="avatar-mouth mouth-line" d="M92 123Q110 133 128 123" fill="none" stroke="'+p.accent+'" stroke-width="3" stroke-linecap="round"/>');
    }
    const eyelids='<g class="avatar-upper-eyelids" fill="'+p.body+'" stroke="'+p.accent+'" stroke-opacity=".18" stroke-width="1"><path d="M63 77Q61 54 82 55Q103 54 101 77Q83 69 63 77Z"/><path d="M119 77Q117 54 138 55Q159 54 157 77Q139 69 119 77Z"/></g>';
    const eyes='<g class="avatar-expression-eyes" pointer-events="none"><g class="avatar-love-eyes" fill="#ee7897" font-family="system-ui,sans-serif" font-size="24" text-anchor="middle" font-weight="900"><text x="84" y="91">♥</text><text x="136" y="91">♥</text></g><g class="avatar-excited-eyes" fill="#f4c453" font-family="system-ui,sans-serif" font-size="25" text-anchor="middle" font-weight="900"><text x="84" y="92">★</text><text x="136" y="92">★</text></g></g>';
    const closed='<g class="avatar-closed-eyes" fill="none" stroke="'+p.accent+'" stroke-width="4.2" stroke-linecap="round"><path d="M66 82Q83 95 100 82"/><path d="M120 82Q137 95 154 82"/></g>';
    const tears='<g class="avatar-tears" fill="#7cd4e5" stroke="#33879d" stroke-width="1.5"><path class="avatar-tear-left" d="M64 101Q55 114 57 126Q64 136 71 126Q73 115 64 101Z"/><path class="avatar-tear-right" d="M156 101Q147 114 149 126Q156 136 163 126Q165 115 156 101Z"/></g>';
    const symbols='<g class="avatar-emotion-symbols" pointer-events="none"><path class="avatar-anger-mark" d="M166 25l8 6 10-5-2 11 7 8-11 1-4 11-7-8-11 2 4-12-6-8Z" fill="#ef5e6f" stroke="#a83346" stroke-width="2.2" stroke-linejoin="round"/><path class="avatar-sweat-mark" d="M175 57Q186 72 183 80Q174 89 167 80Q166 72 175 57Z" fill="#83d5e4" stroke="#276d86" stroke-width="2.4"/><text class="avatar-question-mark" x="164" y="38" font-size="31" font-family="system-ui,sans-serif" font-weight="900" fill="'+p.belly+'" stroke="'+p.accent+'" stroke-width="3.3" paint-order="stroke">?</text></g>';
    const food=id==="iguana"
       ? '<path d="M179 33q14-18 23-9-1 21-23 19-5-5 0-10Z" fill="#58af51" stroke="#347444" stroke-width="1.7"/><path d="M179 42q10-10 20-14" fill="none" stroke="#d4f3a2" stroke-width="2"/>'
       : id==="cat"
       ? '<path d="M176 35q13-12 25 0-12 13-25 0Z" fill="#82c8d6" stroke="#376e91" stroke-width="1.8"/><path d="m201 35 7-7v14Z" fill="#68a7be" stroke="#376e91" stroke-width="1.5"/><circle cx="182" cy="34" r="1.5" fill="#2b4052"/>'
       : '<path d="M186 25q11 2 12 12 0 11-12 13-12-2-12-13 1-10 12-12Z" fill="#ee797f" stroke="#b64e5e" stroke-width="1.8"/><path d="M186 26q3-8 8-8" fill="none" stroke="#4b8c4c" stroke-width="3" stroke-linecap="round"/><path d="M181 29q5-4 8 0" fill="none" stroke="#ffc7bc" stroke-width="1.7"/>';
    const hunger='<g class="avatar-hunger-cloud" pointer-events="none"><circle cx="188" cy="37" r="26" fill="#fffef5" stroke="'+p.accent+'" stroke-width="2.8" stroke-opacity=".65"/><circle cx="154" cy="69" r="4" fill="#fffef5" stroke="'+p.accent+'" stroke-width="1.5"/><circle cx="164" cy="59" r="6" fill="#fffef5" stroke="'+p.accent+'" stroke-width="1.6"/>'+food+'</g>';
    const speaking='<g class="avatar-speaking-mouth" pointer-events="none"><ellipse cx="110" cy="124" rx="15" ry="10" fill="'+p.accent+'"/><path d="M101 127q9-7 18 0" fill="none" stroke="#ef95b1" stroke-width="4" stroke-linecap="round"/></g>';
    svg=svg.replace(/(<path class="avatar-tongue tongue-svg"[^>]*\/>)/,
      '$1'+eyelids+eyes+closed+tears+symbols+hunger+speaking);
    return svg;
  }

  window.ROBOTITO_AVATAR_ART={profiles:profiles,customIds:Object.keys(profiles).filter(id=>id!=="panda"),profile:id=>profiles[id]||profiles.panda,render:polishedRender,audit:audit};
})();
