// Versioned, bounded binary archives. Web Crypto provides password encryption;
// checksums detect damage in unencrypted archives, not malicious authorship.
(function(root){
"use strict";
const store=root.ROBOTITO_STORE,enc=new TextEncoder(),dec=new TextDecoder("utf-8",{fatal:true});
const MAGIC="RBTMEM2\n",LOCKED="RBTENC2\n",MAX=256*1024*1024,FILE_MAX=128*1024*1024,META_MAX=32*1024*1024;
const TABLES=["state","records","blobs","migrations"],TYPES=new Set(store.recordTypes);
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const sha=async bytes=>new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
const hex=bytes=>[...bytes].map(n=>n.toString(16).padStart(2,"0")).join("");
function validate(meta){
 if(!meta||meta.format!=="robotito-local-backup"||meta.schema!==2||![3,4].includes(meta.dbVersion))throw Error("Unsupported archive version");
 const maps={};
 for(const table of TABLES){
  if(!Array.isArray(meta[table])||meta[table].length>50000)throw Error("Invalid archive table");
  const key=table==="state"?"key":"id",map=maps[table]=new Map();
  for(const row of meta[table]){
   if(!row||typeof row!=="object"||typeof row[key]!=="string"||!row[key]||row[key].length>2048||map.has(row[key]))throw Error("Invalid or duplicate archive ID");
   map.set(row[key],row);
   if(table==="state"&&row.key==="robotito.restore.undo.v1")throw Error("Internal recovery data is not importable");
  }
 }
 for(const row of meta.records){
  if(!TYPES.has(row.type)||typeof row.owner!=="string"||!row.owner||store.isEphemeral(row.owner)||
   !Number.isFinite(row.timestamp)||!Number.isInteger(row.version)||row.version<1||!Array.isArray(row.relatedIds)||!Array.isArray(row.tags)||
   row.relatedIds.some(id=>typeof id!=="string")||row.tags.some(tag=>typeof tag!=="string"))throw Error("Invalid typed record");
  if(row.blobId){const blob=maps.blobs.get(row.blobId);if(!blob||blob.owner!==row.owner||blob.recordId!==row.id)throw Error("Cross-owner or missing file");}
 }
 let offset=0;
 for(const blob of meta.blobs){
  if(typeof blob.owner!=="string"||!blob.owner||store.isEphemeral(blob.owner)||typeof blob.type!=="string"||typeof blob.mime!=="string"||
   !Number.isSafeInteger(blob.size)||blob.size<0||blob.size>FILE_MAX||blob.offset!==offset||!/^[a-f0-9]{64}$/.test(blob.sha256))throw Error("Invalid file metadata");
  offset+=blob.size;if(offset>MAX)throw Error("Archive too large");
  if(blob.recordId!=null){const row=maps.records.get(blob.recordId);if(!row||row.owner!==blob.owner||row.blobId!==blob.id)throw Error("Orphan or cross-owner file");}
 }
 if(!Array.isArray(meta.preferences)||meta.preferences.length>2000)throw Error("Invalid preferences");
 const keys=new Set();for(const item of meta.preferences){
  if(!item||typeof item.key!=="string"||!item.key.startsWith("robotito.")||typeof item.value!=="string"||keys.has(item.key))throw Error("Invalid preference entry");keys.add(item.key);
 }
 return {records:meta.records.length,blobs:meta.blobs.length,owners:[...new Set(meta.records.map(r=>r.owner))],binaryBytes:offset};
}
const derive=(password,salt)=>root.ROBOTITO_BACKUP_CRYPTO.deriveKey(password,salt);
async function exportFile({password=""}={}){
 await root.ROBOTITO_MEMORY?.flush?.();
 const snapshot=await store.rawSnapshot(),preferences=store.devicePreferences(),parts=[];
 const meta={...snapshot,format:"robotito-local-backup",schema:2,dbVersion:store.dbVersion,createdAt:new Date().toISOString(),preferences,blobs:[]};
 let offset=0;
 for(const row of snapshot.blobs){
  const blob=row.blob instanceof Blob?row.blob:row.blobBytes instanceof ArrayBuffer?new Blob([row.blobBytes],{type:row.mimeType||""}):null;
  if(!blob||blob.size>FILE_MAX||offset+blob.size>MAX)throw Error("File or archive exceeds supported limit");
  meta.blobs.push({id:row.id,owner:row.owner,type:row.type,recordId:row.recordId??null,updatedAt:row.updatedAt,
   mime:blob.type,size:blob.size,offset,sha256:hex(await sha(await blob.arrayBuffer()))});
  parts.push(blob);offset+=blob.size;
 }
 validate(meta);
 const json=enc.encode(JSON.stringify(meta));if(json.length>META_MAX)throw Error("Archive metadata exceeds limit");
 const length=new Uint8Array(4);new DataView(length.buffer).setUint32(0,json.length);
 let blob=new Blob([MAGIC,length,await sha(json),json,...parts],{type:"application/octet-stream"});
 if(blob.size>MAX)throw Error("Archive exceeds 256 MiB");
 if(password){
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await derive(password,salt),header=new Uint8Array(await new Blob([LOCKED,salt,iv]).arrayBuffer());
  const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:header},key,await blob.arrayBuffer());
  blob=new Blob([header,encrypted],{type:"application/octet-stream"});
 }
 return blob;
}
async function readFile(file,{password=""}={}){
 if(!(file instanceof Blob)||file.size>MAX+64||file.size<8)throw Error("Invalid or oversized backup file");
 let blob=file,magic=dec.decode(await blob.slice(0,8).arrayBuffer());
 if(magic===LOCKED){
  const header=new Uint8Array(await blob.slice(0,36).arrayBuffer());if(header.length!==36)throw Error("Truncated encrypted archive");
  const salt=header.slice(8,24),iv=header.slice(24),key=await derive(password,salt);
  const bytes=await crypto.subtle.decrypt({name:"AES-GCM",iv,additionalData:header},key,await blob.slice(36).arrayBuffer());
  blob=new Blob([bytes]);magic=dec.decode(await blob.slice(0,8).arrayBuffer());
 }
 if(magic!==MAGIC){
  // Read-only compatibility with existing JSON archives; no implicit merge.
  if(file.size>48*1024*1024)throw Error("Legacy JSON backup exceeds limit");
  let raw=JSON.parse(await blob.text());
  if(root.ROBOTITO_BACKUP_CRYPTO.isEncrypted(raw))raw=await root.ROBOTITO_BACKUP_CRYPTO.decrypt(raw,password);
  else if(file.size>32*1024*1024)throw Error("Legacy JSON backup exceeds limit");
  const summary=store.validateBackup(raw);
  return {legacy:raw,summary};
 }
 if(blob.size<44)throw Error("Truncated archive header");
 const header=new Uint8Array(await blob.slice(8,44).arrayBuffer()),length=new DataView(header.buffer).getUint32(0);
 if(length>META_MAX||44+length>blob.size)throw Error("Invalid archive metadata size");
 const json=new Uint8Array(await blob.slice(44,44+length).arrayBuffer());
 if(!equal(await sha(json),header.slice(4)))throw Error("Metadata checksum mismatch");
 const meta=JSON.parse(dec.decode(json)),summary=validate(meta),start=44+length;
 if(start+summary.binaryBytes!==blob.size)throw Error("Truncated file or unexpected trailing data");
 const files=[];
 for(const item of meta.blobs){
  const bytes=await blob.slice(start+item.offset,start+item.offset+item.size).arrayBuffer();
  if(hex(await sha(bytes))!==item.sha256)throw Error("File checksum mismatch");
  files.push({id:item.id,owner:item.owner,type:item.type,recordId:item.recordId,updatedAt:item.updatedAt,blobBytes:bytes,mimeType:item.mime});
 }
 return {snapshot:{state:meta.state,records:meta.records,blobs:files,migrations:meta.migrations,preferences:meta.preferences},summary};
}
async function restoreFile(file,{password="",confirmation}={}){
 if(confirmation!=="RESTAURAR")throw Error("Explicit restore confirmation required");
 const parsed=await readFile(file,{password});
 if(parsed.legacy)await store.restoreBackup(parsed.legacy,{confirmation});
 else await store.replaceSnapshot(parsed.snapshot,{confirmation});
 return parsed.summary;
}
root.ROBOTITO_ARCHIVE={exportFile,readFile,restoreFile,validate,limits:{archive:MAX,file:FILE_MAX,metadata:META_MAX},
 undo:()=>store.undoLastRestore({confirmation:"DESHACER"})};
})(window);
