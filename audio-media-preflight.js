"use strict";
// Browser-native decoding is the source of truth for the real duration of
// WAV/MP3/OGG and other Chromium-supported media. No YAMNet download or
// classification happens during preflight; no decoded PCM is exported.
const fs=require("node:fs"),crypto=require("node:crypto");
const {verifyReviewedAudioDigest}=require("./audio-annotation-review.js");
const TOLERANCE_SECONDS=1e-4;
function validateDecodedDuration(item,decoded){
 if(!item||!decoded||!Number.isFinite(decoded.durationSeconds)||
    decoded.durationSeconds<=0||
    !Number.isFinite(decoded.sampleRate)||decoded.sampleRate<=0||
    !Number.isSafeInteger(decoded.channels)||decoded.channels<1)
  throw Error("Invalid or empty decoded audio for "+String(item?.id||"unknown"));
 const duration=decoded.durationSeconds;
 for(const [field,rows] of [["annotation",item.annotations??[]],
                            ["suppression",item.suppressions??[]]]){
  if(!Array.isArray(rows))throw Error("Invalid "+field+" intervals for "+item.id);
  for(const range of rows){
   if(!range||!Number.isFinite(range.startSeconds)||
      !Number.isFinite(range.endSeconds)||range.startSeconds<0||
      range.startSeconds>=range.endSeconds||
      range.endSeconds>duration+TOLERANCE_SECONDS)
    throw Error("Out-of-bounds "+field+" for "+item.id+
      ": must fit decoded audio duration");
  }
 }
 return duration;
}
async function inspectCorpus(page,items){
 if(!page||typeof page.evaluate!=="function"||!Array.isArray(items)||!items.length)
  throw Error("Audio preflight requires a browser page and nonempty corpus");
 let totalDecodedSeconds=0;
 for(const item of items){
  // This is an in-memory transfer to the local Chromium test page; the
  // bytes never enter the MediaPipe worker or any remote service.
  const bytes=fs.readFileSync(item.absolutePath);
  if(item.annotationReview==="complete"){
   const actual=crypto.createHash("sha256").update(bytes).digest("hex");
   verifyReviewedAudioDigest(item.annotationReview,item.audioSha256,actual,item.id);
  }
  const fileBase64=bytes.toString("base64");
  let decoded;
  try{
   decoded=await page.evaluate(async data=>{
    const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
    const decoder=new OfflineAudioContext(1,1,16000);
    const audio=await decoder.decodeAudioData(bytes.buffer);
    return {durationSeconds:audio.duration,sampleRate:audio.sampleRate,
      channels:audio.numberOfChannels};
   },fileBase64);
  }catch(error){
   throw Error("Cannot decode authorized audio for "+item.id+": "+String(error?.message||error));
  }
  totalDecodedSeconds+=validateDecodedDuration(item,decoded);
 }
 return {decodedFilesVerified:items.length,
  totalDecodedSeconds,
  allAnnotationAndSuppressionBoundsVerified:true,
  decoder:"Chromium OfflineAudioContext",
  modelInferencePerformed:false,
  physicalMicrophoneUsed:false};
}
module.exports={validateDecodedDuration,inspectCorpus};
