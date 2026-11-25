// Procedural, editable SVG faces. No crops, embedded images, canvas or raster overlays.
// The reference illustration defines proportions and palettes, not image assets.
(()=>{
"use strict";
const SVG="http://www.w3.org/2000/svg";
const approved={
 "panda":{fur:"#fffaf2",muzzle:"#fff8ee",nose:"#252323",line:"#232326",eye:"#151315",blush:"#eda0a3",question:"#fdf3cf",outline:"#343536"},
 "brown-bear":{fur:"#b56a36",muzzle:"#f2c78d",nose:"#59301c",line:"#3f291c",eye:"#21150f",blush:"#e99183",question:"#ffe8ae",outline:"#6b3b22"},
 "polar-bear":{fur:"#f7f7f0",muzzle:"#fffefa",nose:"#252525",line:"#25282a",eye:"#241a15",blush:"#efb0af",question:"#f1f8ff",outline:"#446578"},
 "dog":{fur:"#df964f",muzzle:"#f6d6a6",nose:"#54301e",line:"#3a271f",eye:"#211712",blush:"#ef9d82",question:"#ffe4a6",outline:"#875132"},
 "monkey":{fur:"#aa603a",muzzle:"#f5d2a6",nose:"#56331f",line:"#513322",eye:"#201611",blush:"#ec9285",question:"#f8e2bb",outline:"#764329"}
};
const compactIds=["cat","red-panda","iguana"];
function assign(parent,markup){if(!parent)return false;parent.innerHTML=markup;return true;}
function darkEye(x,y,c){
 return '<ellipse cx="'+x+'" cy="'+y+'" rx="23.5" ry="27.5" fill="'+c.eye+'" />'
 +'<ellipse cx="'+(x-5)+'" cy="'+(y-7)+'" rx="7.8" ry="9.8" fill="#fffefa"/>'
 +'<circle cx="'+(x+11)+'" cy="'+(y+11)+'" r="3.1" fill="#fffaf2" opacity=".9"/>';
}
function approvedEyes(c){
 return darkEye(294,243,c)+darkEye(414,243,c)
 +'<g id="eye-pupils"><ellipse cx="294" cy="244" rx="16" ry="20" fill="'+c.eye+'" opacity=".3"/>'
 +'<ellipse cx="414" cy="244" rx="16" ry="20" fill="'+c.eye+'" opacity=".3"/></g>';
}
function approvedMuzzle(c,id){
 const monkey=id==="monkey",round=id==="dog";
 return '<g id="procedural-muzzle" data-source="svg-paths">'
 +'<ellipse cx="354" cy="308" rx="'+(monkey?57:round?66:62)+'" ry="'+(monkey?40:43)+'" fill="'+c.muzzle+'" opacity="'+(monkey?".95":".98")+'"/>'
 +'<path d="M332 295 Q354 282 376 295 Q373 307 354 311 Q336 307 332 295Z" fill="'+c.nose+'"/>'
 +'<path d="M339 294 Q352 290 363 293" fill="none" stroke="#fff" stroke-width="3.2" opacity=".42" stroke-linecap="round"/>'
 +'<path d="M354 311V327" fill="none" stroke="'+c.line+'" stroke-width="4.3" stroke-linecap="round"/>'
 +'</g>';
}
function paintApproved(stage,id){
 const c=approved[id],head=stage?.querySelector("#front-view #head");
 if(!c||!head)return false;
 const names=["eye-open","eye-closed","heart-eyes","star-eyes","brows-angry","brows-sad",
  "brows-curious","blush","mouth-happy","mouth-neutral","mouth-sad","mouth-o",
  "mouth-angry","mouth-speak","mouth-speak-sad","mouth-speak-angry","tears",
  "sweat-mark","question-mark"];
 const nodes=Object.fromEntries(names.map(name=>[name,head.querySelector('[id="'+name+'"]')]));
 if(names.some(name=>!nodes[name]))return false; // Atomic preflight; preserve originals on malformed SVG.
 const blush=nodes.blush,smile=nodes["mouth-happy"];
 if(blush.parentNode!==smile.parentNode)return false;
 // Only the old unlabelled nose/philtrum paths between cheeks and mouth are replaced.
 let cursor=blush.nextSibling;
 while(cursor&&cursor!==smile){const next=cursor.nextSibling;cursor.remove();cursor=next;}
 const muzzle=document.createElementNS(SVG,"g");
 muzzle.setAttribute("data-avatar-face","programmed");
 muzzle.innerHTML=approvedMuzzle(c,id);
 smile.parentNode.insertBefore(muzzle,smile);
 assign(nodes["eye-open"],approvedEyes(c));
 assign(nodes["eye-closed"],
  '<path d="M270 242Q294 259 318 242M390 242Q414 259 438 242" fill="none" stroke="'+c.line+'" stroke-width="6.6" stroke-linecap="round"/>');
 assign(nodes["heart-eyes"],'<path d="M294 253 275 237Q270 226 280 224Q289 222 294 232Q303 219 312 225Q321 234 311 244Z" fill="#fb718c"/>'
  +'<path d="M414 253 395 237Q390 226 400 224Q409 222 414 232Q423 219 432 225Q441 234 431 244Z" fill="#fb718c"/>');
 const star=x=>'<path d="M'+x+' 222l6 13 14 2-10 10 2 14-12-7-12 7 3-14-10-10 14-2Z" fill="#f6cc60"/>';
 assign(nodes["star-eyes"],star(294)+star(414));
 assign(nodes["brows-angry"],'<path d="M270 209l46 18M437 209l-46 18" stroke="'+c.line+'" stroke-width="7" stroke-linecap="round" fill="none"/>');
 assign(nodes["brows-sad"],'<path d="M271 218Q289 198 312 218M396 218Q419 198 438 218" stroke="'+c.line+'" stroke-width="5" stroke-linecap="round" fill="none"/>');
 assign(nodes["brows-curious"],'<path d="M271 211q22-15 42 1M399 209q23-5 38 5" stroke="'+c.line+'" stroke-width="5" stroke-linecap="round" fill="none"/>');
 assign(blush,'<ellipse cx="261" cy="293" rx="21" ry="11.5" fill="'+c.blush+'"/>'
  +'<ellipse cx="447" cy="293" rx="21" ry="11.5" fill="'+c.blush+'"/>');
 const stroke='fill="none" stroke="'+c.line+'" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
 assign(smile,'<path d="M354 327Q338 345 321 329M354 327Q371 345 388 329" '+stroke+'/>');
 assign(nodes["mouth-neutral"],'<path d="M337 336h34" '+stroke+'/>');
 assign(nodes["mouth-sad"],'<path d="M327 348Q354 324 381 348" '+stroke+'/>');
 assign(nodes["mouth-angry"],'<path d="M326 343Q354 331 382 343" '+stroke+'/>');
 const oral='<path d="M339 336Q354 324 369 336v12q-15 21-30 0Z" fill="'+c.eye+'"/><path d="M342 349q12-5 24 0l-5 6h-15Z" fill="#dd8f8f"/>';
 assign(nodes["mouth-o"],oral);
 assign(nodes["mouth-speak"],oral);
 assign(nodes["mouth-speak-sad"],'<path d="M333 350Q354 325 375 350q-21 16-42 0Z" fill="'+c.eye+'"/><path d="M335 352q18-6 37 0" fill="none" stroke="#dc918e" stroke-width="3"/>');
 assign(nodes["mouth-speak-angry"],'<path d="M328 339Q354 331 380 339L374 359Q354 364 334 358Z" fill="'+c.eye+'"/><path d="M335 343h38" stroke="#fff2e8" stroke-width="4"/>');
 assign(nodes.tears,'<path d="M274 258Q260 289 273 301Q287 306 289 290Q288 278 274 258Z" fill="#82d5ed" stroke="#4da7c7" stroke-width="2"/>'
  +'<path d="M435 258Q421 289 434 301Q448 306 450 290Q449 278 435 258Z" fill="#82d5ed" stroke="#4da7c7" stroke-width="2"/>');
 assign(nodes["sweat-mark"],'<path d="M473 222Q459 244 464 253Q476 261 484 250Q487 242 473 222Z" fill="#b7edf7" stroke="'+c.outline+'" stroke-width="3.3"/>');
 assign(nodes["question-mark"],'<text x="489" y="167" font-size="73" font-weight="900" font-family="Trebuchet MS,system-ui,sans-serif" fill="'+c.question+'" stroke="'+c.outline+'" stroke-width="5.5" paint-order="stroke">?</text>');
 stage.dataset.faceSource="procedural-svg";
 return true;
}
function compactEye(x,id){
 const green=id==="iguana",cx=x,ey=green?79:79;
 const color=green?"#312517":"#241713";
 return '<g class="avatar-eye-group '+(x<110?'avatar-eye-left':'avatar-eye-right')+'">'
 +'<ellipse class="avatar-eye-white eye-white-svg" cx="'+cx+'" cy="'+ey+'" rx="'+(green?14:12)+'" ry="'+(green?17:15)+'" style="fill:'+(green?"#d1b254":color)+'"/>'
 +(green?'<ellipse class="avatar-iris iris iris-svg" cx="'+cx+'" cy="'+ey+'" rx="10" ry="13" style="fill:#2e2119"/>':'')
 +'<ellipse class="avatar-pupil pupil-svg" cx="'+cx+'" cy="'+ey+'" rx="'+(green?7:10)+'" ry="'+(green?10:13)+'" style="fill:'+color+'"/>'
 +'<circle class="avatar-eye-shine" cx="'+(cx-3.5)+'" cy="'+(ey-6)+'" r="4.1" fill="#fff"/>'
 +'<circle class="avatar-eye-star" cx="'+(cx+5)+'" cy="'+(ey+6)+'" r="1.9" fill="#fff" opacity=".9"/>'
 +'<path class="blink-line" d="M'+(cx-13)+' '+ey+'q13 8 26 0"/></g>';
}
function compact(id){
 if(!compactIds.includes(id))return "";
 const cat=id==="cat",red=id==="red-panda",ig=id==="iguana";
 const ink=cat?"#59351e":red?"#4a3028":"#3d6621";
 const face=cat?'<path d="M74 40l9-16 10 16m32 0 10-16 9 16" fill="none" stroke="#cb752d" stroke-width="6" stroke-linecap="round"/><path d="M67 54q11-7 21 3m43 0q11-10 21-3" fill="none" stroke="#c77a39" stroke-width="4"/>'
  :red?'<path d="M55 70q23-31 48-10l-14 38-22-8Z M165 70q-23-31-48-10l14 38 22-8Z" fill="#fff6df"/>'
   +'<path d="M62 100q19 8 35-7M158 100q-19 8-35-7" fill="none" stroke="#ffe8ce" stroke-width="14" stroke-linecap="round"/>'
  :'<ellipse cx="66" cy="109" rx="10" ry="12" fill="#d6e846" opacity=".95"/><ellipse cx="154" cy="109" rx="10" ry="12" fill="#d6e846" opacity=".95"/>'
   +'<path d="M83 48l14-8 13 10 13-10 14 8" fill="none" stroke="#b2e446" stroke-width="8"/>';
 const cheek='<circle class="avatar-cheek cheek" cx="58" cy="108" r="11" style="fill:'+(ig?"#e4e74c":"#f3a4a0")+'"/>'
  +'<circle class="avatar-cheek cheek" cx="162" cy="108" r="11" style="fill:'+(ig?"#e4e74c":"#f3a4a0")+'"/>';
 const muzzle=ig?'<ellipse cx="110" cy="109" rx="49" ry="24" fill="#a7d93d" opacity=".94"/>'
   +'<ellipse cx="99" cy="104" rx="2.8" ry="2" fill="#56822b"/><ellipse cx="121" cy="104" rx="2.8" ry="2" fill="#56822b"/>'
  :'<ellipse class="avatar-muzzle plush-muzzle" cx="110" cy="110" rx="'+(cat?38:39)+'" ry="26" fill="'+(cat?"#fff2d5":"#fff4dd")+'"/>'
  +'<path d="M100 102q10-7 20 0l-10 10Z" fill="'+(cat?"#e68d82":"#593427")+'"/>'
  +'<path d="M110 111v8" stroke="'+ink+'" stroke-width="2.6" stroke-linecap="round"/>';
 const mouth=ig?'M90 119q20 17 40 0':'M110 119q-10 16-23 2M110 119q10 16 23 2';
 const whiskers=cat?'<g class="avatar-face-detail avatar-whiskers" fill="none" stroke="#81502a" stroke-width="2.3" stroke-linecap="round"><path d="M79 109 47 104M79 115l-35 3M141 109l32-5M141 115l35 3"/></g>':'';
 return '<g class="avatar-procedural-face" data-avatar-face="programmed">'
  +face+cheek+muzzle+compactEye(82,id)+compactEye(138,id)
  +'<path class="avatar-brow avatar-brow-left gentle-brow brow brow-left" d="M70 55q13-6 24 0" stroke="'+ink+'"/>'
  +'<path class="avatar-brow avatar-brow-right gentle-brow brow brow-right" d="M126 55q13-6 24 0" stroke="'+ink+'"/>'
  +'<path class="avatar-mouth mouth-line" d="'+mouth+'" fill="none" stroke="'+ink+'" stroke-width="3.2" stroke-linecap="round"/>'
  +'<path class="avatar-tongue tongue-svg" d="M103 125q7 8 14 0" fill="#f09a9e" opacity=".92"/>'
  +whiskers+'</g>';
}
window.ROBOTITO_FACE_PROGRAM=Object.freeze({paintApproved,compact,approvedIds:Object.keys(approved),compactIds});
})();
