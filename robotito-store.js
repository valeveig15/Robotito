// Robotito vNext — durable storage for large classroom data.
// Keeps large transcripts/materials out of localStorage and migrates old data safely.
(function(){
  const DB_NAME="robotito-data-v2";
  const DB_VERSION=1;
  const STORE="state";
  const HEAVY=new Set([
    "robotito.classLines.v1",
    "robotito.classSummaries.v1",
    "robotito.academicMaterials.v1",
    "robotito.memories.v2"
  ]);

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!("indexedDB" in window)){reject(new Error("IndexedDB no disponible"));return;}
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:"key"});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error("No pude abrir IndexedDB"));
    });
  }

  function done(tx){
    return new Promise((resolve,reject)=>{
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error("Error de almacenamiento"));
      tx.onabort=()=>reject(tx.error||new Error("Operación cancelada"));
    });
  }

  async function get(key,fallback=null){
    try{
      const db=await openDb();
      const tx=db.transaction(STORE,"readonly");
      const req=tx.objectStore(STORE).get(key);
      const value=await new Promise((resolve,reject)=>{
        req.onsuccess=()=>resolve(req.result?.value);
        req.onerror=()=>reject(req.error);
      });
      // The read request has completed; don't attach transaction handlers after
      // the completion event may already have fired.
      db.close();
      return value===undefined?fallback:value;
    }catch(e){
      console.warn("robotito store get",key,e);
      return fallback;
    }
  }

  async function set(key,value){
    const db=await openDb();
    const tx=db.transaction(STORE,"readwrite");
    tx.objectStore(STORE).put({key,value,updatedAt:Date.now()});
    await done(tx);
    db.close();
    return true;
  }

  async function remove(key){
    const db=await openDb();
    const tx=db.transaction(STORE,"readwrite");
    tx.objectStore(STORE).delete(key);
    await done(tx);
    db.close();
  }

  function parseLocal(key,fallback){
    try{
      const raw=localStorage.getItem(key);
      return raw===null?fallback:JSON.parse(raw);
    }catch{return fallback;}
  }

  async function migrateKey(key,fallback){
    let stored=await get(key,undefined);
    if(stored!==undefined)return stored;
    const legacy=parseLocal(key,undefined);
    if(legacy!==undefined){
      await set(key,legacy);
      return legacy;
    }
    await set(key,fallback);
    return fallback;
  }

  async function bootstrap(stateObj){
    if(!stateObj)return false;
    try{
      const [lines,summaries,materials,memories]=await Promise.all([
        migrateKey("robotito.classLines.v1",Array.isArray(stateObj.classLines)?stateObj.classLines:[]),
        migrateKey("robotito.classSummaries.v1",Array.isArray(stateObj.classSummaries)?stateObj.classSummaries:[]),
        migrateKey("robotito.academicMaterials.v1",Array.isArray(stateObj.academicMaterials)?stateObj.academicMaterials:[]),
        migrateKey("robotito.memories.v2",Array.isArray(stateObj.memories)?stateObj.memories:[])
      ]);

      stateObj.classLines=Array.isArray(lines)?lines:[];
      stateObj.classSummaries=Array.isArray(summaries)?summaries:[];
      stateObj.academicMaterials=Array.isArray(materials)?materials:[];
      stateObj.memories=Array.isArray(memories)?memories:[];

      // Once the durable copy exists, free the small localStorage quota.
      for(const key of HEAVY){
        try{localStorage.removeItem(key);}catch{}
      }
      return true;
    }catch(e){
      console.warn("robotito durable-store bootstrap",e);
      return false;
    }
  }

  async function persistStateKey(key,value){
    if(!HEAVY.has(key))return false;
    try{
      await set(key,value);
      return true;
    }catch(e){
      console.warn("robotito durable-store persist",key,e);
      // Compatibility fallback: preserve data even if IndexedDB is blocked.
      try{
        localStorage.setItem(key,JSON.stringify(value));
        return true;
      }catch(storageError){
        console.warn("robotito local fallback",key,storageError);
        return false;
      }
    }
  }

  function isHeavyKey(key){return HEAVY.has(key);}

  async function stats(){
    const out={};
    for(const key of HEAVY){
      const value=await get(key,null);
      out[key]=Array.isArray(value)?value.length:(value?1:0);
    }
    try{
      const est=await navigator.storage?.estimate?.();
      if(est){out.usage=est.usage||0;out.quota=est.quota||0;}
    }catch{}
    return out;
  }

  window.ROBOTITO_STORE={get,set,remove,bootstrap,persistStateKey,isHeavyKey,stats,heavyKeys:[...HEAVY]};
})();