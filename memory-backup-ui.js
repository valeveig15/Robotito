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
  unlock=byId("memoryBackupRestorePassword"),fields=byId("memoryBackupEncryptionFields");
 if(!exporter||!chooser||!file)return;
 let exported=false;
 if(encryptBox&&fields){
  fields.hidden=!encryptBox.checked;
  encryptBox.addEventListener("change",()=>{
   fields.hidden=!encryptBox.checked;
   if(!encryptBox.checked){if(password)password.value="";if(repeat)repeat.value="";}
  });
 }
 exporter.addEventListener("click",async()=>{
  exported=false;chooser.disabled=true;
  const shouldEncrypt=!!encryptBox?.checked;
  try{
   if(shouldEncrypt&&(!password||!repeat||password.value.length<12||
       password.value.length>256||password.value!==repeat.value)){
    status("p07BackupPasswordError");return;
   }
   const archive=await root.ROBOTITO_STORE.exportBackup();
   const output=shouldEncrypt
    ?await root.ROBOTITO_BACKUP_CRYPTO.encrypt(archive,password.value):archive;
   const blob=new Blob([JSON.stringify(output)],{type:"application/json"});
   const url=URL.createObjectURL(blob),link=document.createElement("a");
   link.href=url;
   link.download=(shouldEncrypt?"robotito-encrypted-":"robotito-indexeddb-")+
    new Date().toISOString().slice(0,10)+".json";
   document.body.appendChild(link);
   link.click();
   link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
   exported=true;chooser.disabled=false;
   status(shouldEncrypt?"p07EncryptedBackupReady":"p07BackupReady");
  }catch(e){console.warn("Memory backup failed",e?.name);status("p07BackupFailed");}
  finally{if(password)password.value="";if(repeat)repeat.value="";}
 });
 chooser.addEventListener("click",()=>{if(exported)file.click();});
 file.addEventListener("change",async event=>{
  const selected=event.target.files?.[0];event.target.value="";
  if(!selected||!exported)return;
  let encrypted=false;
  try{
   if(selected.size>48*1024*1024)throw Error("Backup file is too large");
   let archive=JSON.parse(await selected.text());
   encrypted=!!root.ROBOTITO_BACKUP_CRYPTO?.isEncrypted(archive);
   if(encrypted){
    if(!unlock?.value)throw Error("Missing backup password");
    archive=await root.ROBOTITO_BACKUP_CRYPTO.decrypt(archive,unlock.value);
   }else if(selected.size>32*1024*1024){
    throw Error("Unencrypted backup is too large");
   }
   root.ROBOTITO_STORE.validateBackup(archive);
   if(!root.confirm(t("p07RestoreConfirm")))return;
   if(root.prompt(t("p07RestoreType"))!=="RESTAURAR")return;
   await root.ROBOTITO_STORE.restoreBackup(archive,{confirmation:"RESTAURAR"});
   status("p07RestoreDone");
   root.location.reload();
  }catch(e){console.warn("Memory restore refused",e?.name);
   status(encrypted?"p07EncryptedRestoreFailed":"p07RestoreFailed");}
  finally{if(unlock)unlock.value="";}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});
else attach();
})(window);
