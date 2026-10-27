// Runs on the user's device, only after explicit model opt-in.
// The pinned MediaPipe runtime and YAMNet model are fetched over HTTPS.
let classifier=null;
async function initialize(){
 const {AudioClassifier,FilesetResolver}=await import(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@1.1.1/+esm");
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
