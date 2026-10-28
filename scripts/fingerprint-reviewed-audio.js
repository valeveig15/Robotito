"use strict";
// Manual, local-only utility for already reviewed and authorized recordings.
// Prints the SHA-256 hex string only. Does not certify annotation quality,
// upload audio, open a browser, or load any ML model.
const fs=require("node:fs"),crypto=require("node:crypto");
async function main(file=process.argv[2]){
 if(!file)throw Error("Usage: npm run fingerprint:audio -- /ruta/audio.wav");
 const stat=fs.statSync(file);
 if(!stat.isFile()||stat.size===0||stat.size>50*1024*1024)
  throw Error("Audio file must be nonempty and 50 MiB or smaller");
 const hash=crypto.createHash("sha256");
 const stream=fs.createReadStream(file,{highWaterMark:64*1024});
 for await(const chunk of stream)hash.update(chunk);
 const hex=hash.digest("hex");
 console.log(hex);
 return hex;
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={main};
