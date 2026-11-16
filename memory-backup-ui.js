// Manual, opt-in backup controls. Encryption happens only on this device.
(function(root){
"use strict";
const byId=id=>document.getElementById(id);
const t=key=>root.ROBOTITO_I18N?.t?.(key,document.documentElement.lang||"es")||key;
function status(key){const el=byId("memoryBackupStatus");if(el){if(root.ROBOTITO_I18N?.bindText)root.ROBOTITO_I18N.bindText(el,root.ROBOTITO_I18N.t(key,"es"));else el.textContent=t(key);}}
function attach(){
 const exporter=byId("downloadMemoryBackup"),chooser=byId("chooseMemoryBackup"),
  file=byId("memoryBackupFile"),encryptBox=byId("encryptMemoryBackup"),
  password=byId("memoryBackupPassword"),repeat=byId("memoryBackupPasswordConfirm"),
  unlock=byId("memoryBackupRestorePassword"),fields=byId("memoryBackupEncryptionFields"),
  undo=byId("undoMemoryRestore"),discard=byId("discardMemoryUndo");
 if(!exporter||!chooser||!file)return;
 let exported=false,busy=false;
 async function refreshUndoControls(){
  try{
   const checkpoint=await root.ROBOTITO_STORE.getRestoreUndoInfo();
   if(undo)undo.disabled=!checkpoint;
   if(discard)discard.disabled=!checkpoint;
  }catch(error){
   console.warn("Memory checkpoint status",error?.name);
   if(undo)undo.disabled=true;
   if(discard)discard.disabled=true;
  }
 }
 refreshUndoControls();
 undo?.addEventListener("click",async()=>{
  if(!root.confirm(t("p07UndoRestoreConfirm")))return;
  if(root.prompt(t("p07UndoRestoreType"))!=="DESHACER")return;
  let committed=false;
  try{
   await root.ROBOTITO_MEMORY?.flush?.();root.stopSenses?.();
   await root.ROBOTITO_STORE.undoLastRestore({confirmation:"DESHACER"});committed=true;
   await root.ROBOTITO_STORE.applyPendingPreferences();
   status("p07UndoRestoreDone");
   root.location.reload();
  }catch(error){console.warn("Memory restore undo refused",error?.name);
   if(committed)root.ROBOTITO_I18N.bindText(byId("memoryBackupStatus"),"Los datos anteriores se recuperaron. Recargá para reintentar la aplicación de sus preferencias.");
   else status("p07UndoRestoreFailed");await refreshUndoControls();}
 });
 discard?.addEventListener("click",async()=>{
  if(!root.confirm(t("p07UndoDiscardConfirm")))return;
  try{
   await root.ROBOTITO_STORE.discardRestoreUndo();
   await refreshUndoControls();status("p07UndoDiscardDone");
  }catch(error){console.warn("Memory checkpoint discard",error?.name);
   status("p07UndoRestoreFailed");}
 });

 if(encryptBox&&fields){
  fields.hidden=!encryptBox.checked;
  encryptBox.addEventListener("change",()=>{
   fields.hidden=!encryptBox.checked;
   if(!encryptBox.checked){if(password)password.value="";if(repeat)repeat.value="";}
  });
 }
 exporter.addEventListener("click",async()=>{
  if(busy)return;busy=true;exporter.disabled=true;exported=false;chooser.disabled=true;
  const shouldEncrypt=!!encryptBox?.checked;
  try{
   if(shouldEncrypt&&(!password||!repeat||password.value.length<12||
       password.value.length>256||password.value!==repeat.value)){
    status("p07BackupPasswordError");return;
   }
   const complete=byId("memoryBackupFormat")?.value!=="legacy";
   await root.ROBOTITO_MEMORY?.flush?.();
   let blob;
   if(complete)blob=await root.ROBOTITO_ARCHIVE.exportFile({password:shouldEncrypt?password.value:""});
   else{
    const archive=await root.ROBOTITO_STORE.exportBackup();
    const output=shouldEncrypt?await root.ROBOTITO_BACKUP_CRYPTO.encrypt(archive,password.value):archive;
    blob=new Blob([JSON.stringify(output)],{type:"application/json"});
   }
   const url=URL.createObjectURL(blob),link=document.createElement("a");
   link.href=url;
   link.download=(complete?"robotito-memory-":shouldEncrypt?"robotito-encrypted-":"robotito-indexeddb-")+
    new Date().toISOString().slice(0,10)+(complete?".robotito":".json");
   document.body.appendChild(link);
   link.click();
   link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
   exported=true;chooser.disabled=false;
   status(shouldEncrypt?"p07EncryptedBackupReady":"p07BackupReady");
  }catch(e){console.warn("Memory backup failed",e?.name);status("p07BackupFailed");}
  finally{busy=false;exporter.disabled=false;if(password)password.value="";if(repeat)repeat.value="";}
 });
 chooser.addEventListener("click",()=>{if(exported)file.click();});
 file.addEventListener("change",async event=>{
  const selected=event.target.files?.[0];event.target.value="";
  if(!selected||!exported||busy)return;
  busy=true;exporter.disabled=true;chooser.disabled=true;
  let encrypted=false,committed=false;
  try{
   encrypted=Boolean(unlock?.value);
   const parsed=await root.ROBOTITO_ARCHIVE.readFile(selected,{password:unlock?.value||""});
   if(!root.confirm(t("p07RestoreConfirm")))return;
   if(root.prompt(t("p07RestoreType"))!=="RESTAURAR")return;
   await root.ROBOTITO_MEMORY?.flush?.();root.stopSenses?.();
   if(parsed.legacy)await root.ROBOTITO_STORE.restoreBackup(parsed.legacy,{confirmation:"RESTAURAR"});
   else await root.ROBOTITO_STORE.replaceSnapshot(parsed.snapshot,{confirmation:"RESTAURAR"});
   committed=true;await root.ROBOTITO_STORE.applyPendingPreferences();
   status("p07RestoreDone");
   root.location.reload();
  }catch(e){console.warn("Memory restore refused",e?.name);
   if(committed)root.ROBOTITO_I18N.bindText(byId("memoryBackupStatus"),"Los datos se restauraron. No pude aplicar las preferencias: recargá para reintentarlo o deshacé la restauración.");
   else status(encrypted?"p07EncryptedRestoreFailed":"p07RestoreFailed");}
  finally{busy=false;exporter.disabled=false;chooser.disabled=!exported;if(unlock)unlock.value="";}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});
else attach();
})(window);
