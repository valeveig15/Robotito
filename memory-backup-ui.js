// Manual, opt-in backup controls. Never contacts a remote server.
(function(root){
"use strict";
const byId=id=>document.getElementById(id);
const t=key=>root.ROBOTITO_I18N?.t?.(key,document.documentElement.lang||"es")||key;
function status(key){const el=byId("memoryBackupStatus");if(el)el.textContent=t(key);}
function attach(){
 const exporter=byId("downloadMemoryBackup"),chooser=byId("chooseMemoryBackup"),file=byId("memoryBackupFile");
 if(!exporter||!chooser||!file)return;
 let exported=false;
 exporter.addEventListener("click",async()=>{
  exported=false;chooser.disabled=true;
  try{
   const archive=await root.ROBOTITO_STORE.exportBackup();
   const blob=new Blob([JSON.stringify(archive)],{type:"application/json"});
   const url=URL.createObjectURL(blob),link=document.createElement("a");
   link.href=url;link.download="robotito-indexeddb-"+new Date().toISOString().slice(0,10)+".json";
   document.body.appendChild(link);
   link.click();
   link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
   exported=true;chooser.disabled=false;status("p07BackupReady");
  }catch(e){console.warn("Memory backup",e);status("p07BackupFailed");}
 });
 chooser.addEventListener("click",()=>{if(exported)file.click();});
 file.addEventListener("change",async event=>{
  const selected=event.target.files?.[0];event.target.value="";
  if(!selected||!exported)return;
  try{
   if(selected.size>32*1024*1024)throw Error("Backup file is too large");
   const archive=JSON.parse(await selected.text());
   root.ROBOTITO_STORE.validateBackup(archive);
   if(!root.confirm(t("p07RestoreConfirm")))return;
   if(root.prompt(t("p07RestoreType"))!=="RESTAURAR")return;
   await root.ROBOTITO_STORE.restoreBackup(archive,{confirmation:"RESTAURAR"});
   status("p07RestoreDone");
   root.location.reload();
  }catch(e){console.warn("Memory restore",e);status("p07RestoreFailed");}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});
else attach();
})(window);
