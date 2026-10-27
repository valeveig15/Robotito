// Runs on-device only after opt-in. MediaPipe's WASM loader requires
// importScripts, so use a CLASSIC Worker, not an ES module Worker.
// Runtime/model assets are downloaded only when "init" is requested.
let classifier=null;
async function initialize(){
 importScripts("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@1.1.1/audio_bundle.js");
 const {AudioClassifier,FilesetResolver}=self.audio||{};
 if(!AudioClassifier||!FilesetResolver)
  throw new Error("MediaPipe Tasks Audio bundle did not expose its runtime");
 const files=await FilesetResolver.forAudioTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@1.1.1/wasm");
 classifier=await AudioClassifier.createFromOptions(files,{
  baseOptions:{modelAssetPath:
   "https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite"},
  maxResults:64
 });
 self.postMessage({type:"ready"});
}
self.onmessage=async event=>{
 const data=event.data||{};
 if(data.type==="init"){
  try{await initialize();}catch(e){self.postMessage({type:"error",message:"No se pudo cargar YAMNet: "+String(e?.message||e)});}
 }else if(data.type==="classify"&&classifier){
  try{
   const results=classifier.classify(new Float32Array(data.samples),data.sampleRate);
   const categories=(results||[]).flatMap(r=>(r.classifications||[])
    .flatMap(c=>c.categories||[]))
    .map(c=>({categoryName:String(c.categoryName||""),score:Number(c.score)}));
   self.postMessage({type:"result",id:data.id,categories});
  }catch(e){self.postMessage({type:"error",message:"Falló la clasificación de audio: "+String(e?.message||e)});}
 }
};
