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
    "panther":a("#34313a","#595461","#18161d","mammal","point","long","none"),
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
      case "turtle":return '<ellipse class="avatar-special avatar-shell" cx="110" cy="169" rx="59" ry="55" fill="'+d+'" stroke="#395b36" stroke-width="5"/><path d="M70 169h80M110 118v102M80 132l60 74M140 132l-60 74" stroke="'+b+'" stroke-width="4" opacity=".55"/>';
      case "armadillo":return '<path class="avatar-special avatar-shell" d="M55 174q8-68 55-68t55 68q-4 50-55 50t-55-50z" fill="'+b+'" stroke="'+d+'" stroke-width="5"/><path d="M74 126q-5 49 5 84M94 112q-5 61 1 108M116 111q7 62 2 109M138 122q10 48 3 88" fill="none" stroke="'+d+'" stroke-width="5" opacity=".7"/>';
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
    return '<svg class="avatar-character avatar-robot '+cls+'" viewBox="0 0 220 260" data-character="'+id+'" aria-hidden="true"><ellipse class="avatar-ground" cx="110" cy="238" rx="65" ry="13"/><g class="avatar-whole"><path class="avatar-antenna" d="M110 38V17" stroke="'+p.accent+'" stroke-width="7" stroke-linecap="round"/><circle cx="110" cy="12" r="9" fill="#ff8db1"/><rect class="avatar-body" x="60" y="132" width="100" height="88" rx="28" fill="'+p.body+'" stroke="'+p.accent+'" stroke-width="6"/><rect class="avatar-belly" x="78" y="151" width="64" height="45" rx="13" fill="'+p.belly+'"/><circle cx="95" cy="173" r="6" fill="#ff8db1"/><circle cx="116" cy="173" r="6" fill="#ffd36e"/><circle cx="137" cy="173" r="6" fill="#65d6a6"/><path class="avatar-arm" d="M61 154 34 184M159 154l27 30" stroke="'+p.accent+'" stroke-width="15" stroke-linecap="round"/><path class="avatar-leg" d="M84 216v20M136 216v20" stroke="'+p.accent+'" stroke-width="17" stroke-linecap="round"/><rect class="avatar-head" x="48" y="43" width="124" height="91" rx="32" fill="'+p.belly+'" stroke="'+p.accent+'" stroke-width="7"/><circle cx="48" cy="86" r="12" fill="'+p.body+'"/><circle cx="172" cy="86" r="12" fill="'+p.body+'"/><g class="avatar-eye-group"><ellipse class="avatar-eye-white" cx="82" cy="82" rx="20" ry="23"/><circle class="avatar-iris" cx="82" cy="84" r="12"/><circle class="avatar-pupil" cx="82" cy="85" r="7"/><circle class="avatar-eye-shine" cx="77" cy="78" r="4"/></g><g class="avatar-eye-group"><ellipse class="avatar-eye-white" cx="138" cy="82" rx="20" ry="23"/><circle class="avatar-iris" cx="138" cy="84" r="12"/><circle class="avatar-pupil" cx="138" cy="85" r="7"/><circle class="avatar-eye-shine" cx="133" cy="78" r="4"/></g><path class="avatar-brow avatar-brow-left" d="M66 57q16-8 31 0"/><path class="avatar-brow avatar-brow-right" d="M123 57q16-8 31 0"/><path class="avatar-mouth" d="M88 108q22 20 44 0" fill="none" stroke="'+p.accent+'" stroke-width="5" stroke-linecap="round"/></g></svg>';
  }

  function render(avatar,extraClass){
    const id=avatar&&avatar.id&&profiles[avatar.id]?avatar.id:"panda";
    const p=profiles[id];
    const cls=safeClass(extraClass);
    if(p.shape==="robot")return robotMarkup(id,p,cls);
    const isBird=p.shape==="bird";
    const isAquatic=p.shape==="aquatic";
    const isReptile=p.shape==="reptile";
    const muzzle=isBird
      ? '<path class="avatar-muzzle avatar-beak" d="m96 98 14 17 16-17z" fill="'+p.accent+'"/>'
      : isAquatic
        ? '<path class="avatar-muzzle" d="M103 95q40-5 56 13-28 13-56 3z" fill="'+p.belly+'" stroke="'+p.accent+'" stroke-width="4"/>'
        : isReptile
          ? '<ellipse class="avatar-muzzle" cx="110" cy="105" rx="48" ry="25" fill="'+p.belly+'" stroke="'+p.accent+'" stroke-width="4"/>'
          : '<ellipse class="avatar-muzzle" cx="110" cy="101" rx="34" ry="27" fill="'+p.belly+'" opacity=".96"/><path class="avatar-nose" d="M101 91q9-8 18 0-2 13-9 13t-9-13z" fill="'+p.accent+'"/>';
    const wings=isBird
      ? '<path class="avatar-wing avatar-wing-left" d="M70 139Q35 154 54 203q25-13 39-47z" fill="'+p.body+'" stroke="'+p.accent+'" stroke-width="5"/><path class="avatar-wing avatar-wing-right" d="M150 139q35 15 16 64-25-13-39-47z" fill="'+p.body+'" stroke="'+p.accent+'" stroke-width="5"/>'
      : isAquatic
        ? '<path class="avatar-wing avatar-wing-left" d="M72 147 35 181q27 9 55-8z" fill="'+p.body+'" stroke="'+p.accent+'" stroke-width="5"/><path class="avatar-wing avatar-wing-right" d="m148 147 37 34q-27 9-55-8z" fill="'+p.body+'" stroke="'+p.accent+'" stroke-width="5"/>'
        : '<path class="avatar-arm avatar-arm-left" d="M72 143Q48 164 58 202" fill="none" stroke="'+p.body+'" stroke-width="22" stroke-linecap="round"/><path class="avatar-arm avatar-arm-right" d="M148 143q24 21 14 59" fill="none" stroke="'+p.body+'" stroke-width="22" stroke-linecap="round"/>';
    const legs=id==="flamingo"?"":'<path class="avatar-leg avatar-leg-left" d="M87 207v28" stroke="'+p.accent+'" stroke-width="20" stroke-linecap="round"/><path class="avatar-leg avatar-leg-right" d="M133 207v28" stroke="'+p.accent+'" stroke-width="20" stroke-linecap="round"/>';
    return '<svg class="avatar-character avatar-'+esc(id)+' '+cls+'" viewBox="0 0 220 260" data-character="'+esc(id)+'" aria-hidden="true"><ellipse class="avatar-ground" cx="110" cy="239" rx="64" ry="13"/><g class="avatar-whole">'+behindMarkup(id,p)+tailMarkup(p)+'<ellipse class="avatar-body" cx="110" cy="171" rx="56" ry="61" fill="'+p.body+'" stroke="'+p.accent+'" stroke-width="5"/><ellipse class="avatar-belly" cx="110" cy="180" rx="34" ry="42" fill="'+p.belly+'" opacity=".92"/>'+wings+legs+earsMarkup(p)+'<ellipse class="avatar-head" cx="110" cy="82" rx="'+(isReptile?61:56)+'" ry="'+(isBird?54:50)+'" fill="'+p.body+'" stroke="'+p.accent+'" stroke-width="5"/>'+markingsMarkup(id,p)+'<g class="avatar-eye-group avatar-eye-left"><ellipse class="avatar-eye-white" cx="86" cy="79" rx="18" ry="21"/><circle class="avatar-iris" cx="86" cy="81" r="11"/><circle class="avatar-pupil" cx="86" cy="82" r="7"/><circle class="avatar-eye-shine" cx="81" cy="75" r="4"/></g><g class="avatar-eye-group avatar-eye-right"><ellipse class="avatar-eye-white" cx="134" cy="79" rx="18" ry="21"/><circle class="avatar-iris" cx="134" cy="81" r="11"/><circle class="avatar-pupil" cx="134" cy="82" r="7"/><circle class="avatar-eye-shine" cx="129" cy="75" r="4"/></g><path class="avatar-brow avatar-brow-left" d="M72 55q14-8 28 0"/><path class="avatar-brow avatar-brow-right" d="M120 55q14-8 28 0"/><circle class="avatar-cheek" cx="69" cy="105" r="10"/><circle class="avatar-cheek" cx="151" cy="105" r="10"/>'+muzzle+'<path class="avatar-mouth" d="M92 113q18 18 36 0" fill="none" stroke="'+p.accent+'" stroke-width="4.5" stroke-linecap="round"/>'+specialFront(id,p)+'</g></svg>';
  }

  function audit(requiredIds){
    const ids=requiredIds||Object.keys(profiles);
    const missing=ids.filter(id=>!profiles[id]);
    return {count:Object.keys(profiles).length,missing:missing};
  }

  window.ROBOTITO_AVATAR_ART={profiles:profiles,profile:id=>profiles[id]||profiles.panda,render:render,audit:audit};
})();
