// P11 — foreground-only, allowlisted personal rules.
// No eval, arbitrary JS, remote actions or claim of background execution.
// A storage CAS reserves each execution BEFORE effects to prevent duplicates
// across concurrent tabs. Actions never emit events back into this engine.
(function(root){
"use strict";
const PREFIX="robotito.custom-rules.v1:";
const MAX_RULES=50,MIN_COOLDOWN=60000,MAX_TEXT=180;
const EVENTS=new Set(["speech","sound","vision","absence","clock","interaction"]);
const ACTIONS=new Set(["say","mood","highfive","remind"]);
const SOUNDS=new Set(["clap","music","laugh","cough","sneeze","cry"]);
const GESTURES=new Set(["pet","feed","play","highfive","poke"]);
const MOODS=new Set(["happy","calm","curious","sad"]);
const GUARDS=new Set(["day","night","awake","present","not-class"]);
const MESSAGES={
 saved:{es:"Regla guardada. Solo funcionará con esta pestaña abierta y las autorizaciones disponibles.",en:"Rule saved. It only runs with this tab open and the necessary permissions.",pt:"Regra salva. Só funciona com esta aba aberta e as permissões necessárias.",fr:"Règle enregistrée. Elle fonctionne uniquement avec cet onglet ouvert et les autorisations nécessaires.",it:"Regola salvata. Funziona solo con questa scheda aperta e i permessi necessari.",de:"Regel gespeichert. Sie funktioniert nur bei geöffnetem Tab und mit den nötigen Berechtigungen."},
 invalid:{es:"No entendí esa regla con seguridad. Usá «si digo hola, decí buen día» o los controles de reglas.",en:"I couldn't safely understand that rule. Try 'if I say hello, say good morning'.",pt:"Não entendi a regra com segurança. Use 'se eu disser olá, diga bom dia'.",fr:"Je n'ai pas compris cette règle avec certitude. Essaie 'si je dis bonjour, dis salut'.",it:"Non ho capito con sicurezza la regola. Prova 'se dico ciao, di' buongiorno'.",de:"Diese Regel wurde nicht eindeutig verstanden. Beispiel: 'wenn ich hallo sage, sag guten Morgen'."},
 conflict:{es:"La regla cambió en otra pestaña. Actualizá la lista y revisá antes de guardar.",en:"The rule changed in another tab. Refresh and review it first.",pt:"A regra mudou em outra aba. Atualize e confira primeiro.",fr:"La règle a changé dans un autre onglet. Actualise et vérifie.",it:"La regola è cambiata in un'altra scheda. Aggiorna e controlla.",de:"Die Regel wurde in einem anderen Tab geändert. Bitte aktualisieren."},
 removed:{es:"Regla eliminada.",en:"Rule deleted.",pt:"Regra excluída.",fr:"Règle supprimée.",it:"Regola eliminata.",de:"Regel gelöscht."},
 disabled:{es:"Regla desactivada.",en:"Rule disabled.",pt:"Regra desativada.",fr:"Règle désactivée.",it:"Regola disattivata.",de:"Regel deaktiviert."},
 enabled:{es:"Regla activada.",en:"Rule enabled.",pt:"Regra ativada.",fr:"Règle activée.",it:"Regola attivata.",de:"Regel aktiviert."},
 foreground:{es:"Estas reglas solo se ejecutan con Robotito abierto y activo. No crean notificaciones con la pestaña cerrada.",en:"Rules only run while Robotito is open and active. They cannot notify you after closing the tab.",pt:"As regras funcionam apenas com Robotito aberto e ativo. Não notificam com a aba fechada.",fr:"Les règles fonctionnent uniquement lorsque Robotito est ouvert et actif. Aucune notification onglet fermé.",it:"Le regole funzionano solo con Robotito aperto e attivo. Nessuna notifica a scheda chiusa.",de:"Regeln funktionieren nur bei geöffnetem und aktivem Robotito, nicht nach Schließen des Tabs."},
 list:{es:"Estas son las reglas activas de este perfil.",en:"Here are the rules for this profile.",pt:"Estas são as regras deste perfil.",fr:"Voici les règles de ce profil.",it:"Ecco le regole di questo profilo.",de:"Hier sind die Regeln dieses Profils."}
};
function message(key,lang="es"){return MESSAGES[key]?.[lang]||MESSAGES[key]?.es||key;}
function norm(raw){return String(raw||"").trim().toLocaleLowerCase().normalize("NFD")
 .replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");}
function ownerKey(owner){
 if(typeof owner!=="string"||!owner||owner.length>128||owner.includes(":"))throw new TypeError("Invalid rule owner");
 return PREFIX+encodeURIComponent(owner);
}
function validAction(a){
 return !!a&&ACTIONS.has(a.type)&&(
  ["say","remind"].includes(a.type)?typeof a.text==="string"&&a.text.trim().length>0&&
   a.text.trim().length<=MAX_TEXT&&!/[<>]/.test(a.text):
  a.type==="mood"?MOODS.has(a.mood):a.type==="highfive");
}
function validTrigger(t){
 if(!t||!EVENTS.has(t.type))return false;
 if(t.type==="speech")return typeof t.phrase==="string"&&t.phrase.length>=2&&t.phrase.length<=80;
 if(t.type==="sound")return SOUNDS.has(t.kind);
 if(t.type==="interaction")return GESTURES.has(t.kind);
 if(t.type==="clock")return /^([01]\d|2[0-3]):[0-5]\d$/.test(t.hhmm||"");
 return t.kind===undefined;
}
function validate(rule){
 if(!rule||!validTrigger(rule.when)||!validAction(rule.do)||
  !Number.isSafeInteger(rule.priority)||rule.priority<0||rule.priority>5||
  !Number.isSafeInteger(rule.cooldownMs)||rule.cooldownMs<MIN_COOLDOWN||
  rule.cooldownMs>86400000||typeof rule.enabled!=="boolean"||
  !Array.isArray(rule.guards)||rule.guards.some(g=>!GUARDS.has(g))||
  typeof rule.id!=="string"||!/^rule-[a-f0-9-]{12,44}$/i.test(rule.id)||
  !Number.isSafeInteger(rule.lastRunAt)||rule.lastRunAt<0)throw new TypeError("Invalid safe rule");
 return rule;
}
function parse(raw){
 if(typeof raw!=="string"||raw.length>800)return null;
 const input=raw.trim().replace(/^(?:(?:robotito|osito|hey robotito)\s*[,!:]?\s*)+/i,"");
 const match=input.match(/^(?:si|cuando|if|when|se|quand|si\s+je|wenn|se\s+io)\s+(.+?)\s*(?:,\s*|\s+entonces\s+|\s+then\s+|\s+ent[aã]o\s+|\s+alors\s+|\s+allora\s+|\s+dann\s+)(.+)$/iu);
 if(!match)return null;
 let condition=norm(match[1]),actionRaw=match[2].trim();
 // Limited conjunctions are explicit guards, not arbitrary expression eval.
 const guards=[];
 for(const [re,guard] of [
  [/\s+(?:y|and|e|et|und)\s+(?:es de noche|it is night|e noite|il fait nuit|e notte|es ist nacht)$/, "night"],
  [/\s+(?:y|and|e|et|und)\s+(?:es de dia|it is daytime|e dia|il fait jour|e giorno|es ist tag)$/, "day"],
  [/\s+(?:y|and|e|et|und)\s+(?:no estoy en clase|not in class|fora da aula|pas en classe|non in classe|nicht im unterricht)$/, "not-class"]
 ]){
  if(re.test(condition)){condition=condition.replace(re,"");guards.push(guard);}
 }
 let when=null;
 let m=condition.match(/^(?:digo|yo digo|i say|i speak|eu digo|je dis|dico|ich sage)\s+(.+)$/);
 if(m&&m[1].length<=80)when={type:"speech",phrase:norm(m[1])};
 else if(/^(?:escuchas|oyes|hear|you hear|ouve|ouves|tu entends|senti|horst du)\s+/.test(condition)){
  const kinds=[[/aplaus|clap|palmas|applaus/,"clap"],[/musica|music|musique|musik/,"music"],
   [/risas?|laugh|rire|riso|lachen/,"laugh"],[/tos|cough|toux|husten|tosse/,"cough"],
   [/estornud|sneez|eternu|starnut|nies/,"sneeze"],[/llan|cry|pleur|piant|weinen/,"cry"]];
  const kind=kinds.find(([re])=>re.test(condition))?.[1];if(kind)when={type:"sound",kind};
 }else if(/^(?:no hay nadie|no ves a nadie|nobody is here|no one is here|ningu[eé]m presente|personne n'est l[aà]|nessuno presente|niemand da)$/.test(condition))
  when={type:"absence"};
 else if(/^(?:ves una persona|hay una persona|see a person|someone is visible|vejo alguem|tu vois quelqu'un|c'e qualcuno|jemand ist da)$/.test(condition))
  when={type:"vision"};
 else if((m=condition.match(/^(?:son las|es la|it is|at|s[aã]o|il est|sono le|es ist)\s+(\d{1,2}):([0-5]\d)$/))){
  const h=Number(m[1]);if(h<24)when={type:"clock",hhmm:String(h).padStart(2,"0")+":"+m[2]};
 }else if(/^(?:me acaricias|me acarici[aá]s|you pet me|me acaricia|tu me caresses|mi accarezzi|du streichelst mich)$/.test(condition))when={type:"interaction",kind:"pet"};
 if(!when)return null;
 let action=null;
 if((m=actionRaw.match(/^(?:dec[ií]|di|dime|say|diz|dis|dit|sag|sage)\s+(.+)$/iu)))
  action={type:"say",text:m[1].trim()};
 else if((m=actionRaw.match(/^(?:recordame|recu[eé]rdame|remind me|lembre-me|rappelle-moi|ricordami|erinnere mich)\s+(.+)$/iu)))
  action={type:"remind",text:m[1].trim()};
 else if(/^(?:sonre[ií]|sonrie|smile|sorri|souris|sorridi|l[aä]chle)$/.test(norm(actionRaw)))
  action={type:"mood",mood:"happy"};
 else if(/^(?:ponete tranquilo|calmate|be calm|fica calmo|sois calme|stai calmo|sei ruhig)$/.test(norm(actionRaw)))
  action={type:"mood",mood:"calm"};
 else if(/^(?:choc[aá] los cinco|chocame los cinco|high five|high-five|bate aqui|tape m'en cinq|dammi il cinque|gib mir funf)$/.test(norm(actionRaw)))
  action={type:"highfive"};
 if(!validAction(action))return null;
 return {when,do:action,guards};
}
function sameEvent(when,evt){
 if(when.type!==evt.type)return false;
 if(when.type==="speech")return norm(evt.phrase)===when.phrase;
 if(["sound","interaction"].includes(when.type))return when.kind===evt.kind;
 if(when.type==="clock")return when.hhmm===evt.hhmm;
 return true;
}
function conditions(rule,env){
 if(rule.guards.includes("awake")&&env.sleeping)return false;
 if(rule.guards.includes("present")&&!env.personPresent)return false;
 if(rule.guards.includes("not-class")&&env.classMode)return false;
 if(rule.guards.includes("night")&&env.dayNightMode!=="night")return false;
 if(rule.guards.includes("day")&&env.dayNightMode!=="day")return false;
 return true;
}
function create({store=root.ROBOTITO_STORE,owner="local",effects={},now=()=>Date.now()}={}){
 let records=[],revision=0,loaded=false,emitting=false;
 const lang=()=>effects.language?.()||"es";
 const emitMessage=(key)=>effects.status?.(message(key,lang()));
 const currentOwner=()=>effects.owner?.()||owner;
 const assertOwner=()=>{if(currentOwner()!==owner)throw new Error("Rule owner changed");};
 async function load(){
  if(!store?.get)throw new Error("Local rule storage unavailable");
  const raw=await store.get(ownerKey(owner),{revision:0,rules:[]});
  if(!raw||!Number.isSafeInteger(raw.revision)||raw.revision<0||
   !Array.isArray(raw.rules)||raw.rules.length>MAX_RULES)throw new Error("Invalid saved rules");
  raw.rules.forEach(validate);
  const ids=new Set(raw.rules.map(r=>r.id));
  if(ids.size!==raw.rules.length)throw new Error("Duplicate rule IDs");
  records=raw.rules.map(r=>({...r}));revision=raw.revision;loaded=true;return list();
 }
 function list(){return records.map(r=>({...r,when:{...r.when},do:{...r.do},guards:[...r.guards]}));}
 async function change(mutator){
  if(!loaded)await load();
  assertOwner();
  const next=mutator(list());if(!Array.isArray(next)||next.length>MAX_RULES)throw Error("Too many rules");
  next.forEach(validate);
  const nextVersion=revision+1;
  try{
   await store.updatePersonalRules(owner,{expectedRevision:revision,
    value:{revision:nextVersion,rules:next}});
  }catch(e){await load();emitMessage("conflict");throw e;}
  records=next;revision=nextVersion;
  effects.render?.(list());return list();
 }
 async function add(raw,{priority=2,cooldownMs=MIN_COOLDOWN}={}){
  const parsed=parse(raw);
  if(!parsed){emitMessage("invalid");return null;}
  const id="rule-"+(root.crypto?.randomUUID?.()||Array.from(root.crypto.getRandomValues(new Uint8Array(16)),
   b=>b.toString(16).padStart(2,"0")).join(""));
  const row=validate({...parsed,id,sourceText:raw.trim().slice(0,800),enabled:true,priority,cooldownMs,lastRunAt:0,createdAt:now()});
  await change(rows=>{
   if(rows.some(r=>JSON.stringify(r.when)===JSON.stringify(row.when)&&
     r.priority===row.priority&&r.enabled))throw new Error("Conflicting rule trigger and priority");
   return [...rows,row];
  });
  emitMessage("saved");return row;
 }
 async function remove(id){await change(rows=>rows.filter(r=>r.id!==id));emitMessage("removed");}
 async function toggle(id,enabled){
  await change(rows=>rows.map(r=>r.id===id?{...r,enabled:!!enabled}:r));
  emitMessage(enabled?"enabled":"disabled");
 }
 async function configure(id,{priority,cooldownMs}={}){
  const existing=records.find(r=>r.id===id);
  if(!existing)throw new Error("Rule not found");
  const nextPriority=priority===undefined?existing.priority:Number(priority);
  const nextCooldown=cooldownMs===undefined?existing.cooldownMs:Number(cooldownMs);
  if(!Number.isSafeInteger(nextPriority)||nextPriority<0||nextPriority>5||
     !Number.isSafeInteger(nextCooldown)||nextCooldown<MIN_COOLDOWN||
     nextCooldown>86400000)throw new TypeError("Invalid rule priority or cooldown");
  await change(rows=>rows.map(r=>r.id===id?
   {...r,priority:nextPriority,cooldownMs:nextCooldown}:r));
  emitMessage("saved");
 }
 async function edit(id,text){
  const parsed=parse(text);if(!parsed){emitMessage("invalid");return false;}
  await change(rows=>rows.map(r=>r.id===id?{...r,...parsed,sourceText:text.trim().slice(0,800),lastRunAt:0}:r));
  emitMessage("saved");return true;
 }
 async function emit(evt,env={}){
  if(emitting||!loaded||!evt||!EVENTS.has(evt.type)||!env.foreground||
     env.classMode||env.sleeping||env.muted||env.speaking||env.permissionDenied||
     currentOwner()!==owner)return [];
  const timestamp=now();
  const eligible=records.filter(r=>r.enabled&&sameEvent(r.when,evt)&&conditions(r,env)&&
   timestamp>=r.lastRunAt&&timestamp-r.lastRunAt>=r.cooldownMs);
  if(!eligible.length)return [];
  // At most ONE conflicting rule per stimulus; priority high to low.
  eligible.sort((a,b)=>b.priority-a.priority||a.createdAt-b.createdAt||a.id.localeCompare(b.id));
  const selected=eligible[0];
  emitting=true;
  try{
   // Reserve execution transactionally across tabs before any side effect.
   await change(rows=>rows.map(r=>r.id===selected.id?{...r,lastRunAt:timestamp}:r));
   if(selected.do.type==="say"||selected.do.type==="remind")
    await effects.say?.(selected.do.text,{ruleId:selected.id,kind:selected.do.type});
   else if(selected.do.type==="mood")await effects.mood?.(selected.do.mood);
   else if(selected.do.type==="highfive")await effects.highfive?.();
   return [selected.id];
  }catch(error){
   effects.error?.(error);
   return [];
  }finally{emitting=false;}
 }
 function dispose(){records=[];loaded=false;emitting=false;}
 return {load,list,add,remove,toggle,edit,configure,emit,dispose,owner};
}
root.ROBOTITO_CUSTOM_RULES={create,parse,message,validAction,validTrigger,validate,MIN_COOLDOWN};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_CUSTOM_RULES;
})(typeof window!=="undefined"?window:globalThis);
