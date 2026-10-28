// Sample-accurate microphone PCM capture, without audio upload.
// AudioWorklet runs on the audio rendering thread in supported browsers.
// Capture is a short-lived lease, not a permanent "allowed" switch:
// if the main thread is frozen, no more PCM leaves this processor.
class RobotitoAudioCaptureProcessor extends AudioWorkletProcessor {
 constructor(){
  super();
  this.chunk=new Float32Array(2048);
  this.filled=0;
  this.enabled=false;
  this.samplesProcessed=0;
  this.leaseUntilSample=0;
  this.port.onmessage=event=>{
   if(event.data?.type!=="capture")return;
   if(event.data.enabled!==true){
    this.enabled=false;
    this.leaseUntilSample=0;
    this.erase();
    return;
   }
   if(!this.enabled)this.erase();
   this.enabled=true;
   // 250ms maximum without an explicit live heartbeat from the app.
   // The deadline is in audio frames, independent of JS wall-clock throttling.
   this.leaseUntilSample=this.samplesProcessed+Math.ceil(sampleRate*.25);
  };
 }
 erase(){
  this.filled=0;
  this.chunk.fill(0);
 }
 process(inputs){
  const channel=inputs[0]?.[0];
  const length=channel?.length||128;
  if(!this.enabled||this.samplesProcessed>=this.leaseUntilSample){
   if(this.enabled){this.enabled=false;this.erase();}
   this.samplesProcessed+=length;
   return true;
  }
  if(channel){
   const allowed=Math.min(channel.length,this.leaseUntilSample-this.samplesProcessed);
   for(let i=0;i<allowed;i++){
    this.chunk[this.filled++]=channel[i];
    if(this.filled===this.chunk.length){
     const finished=this.chunk;
     this.chunk=new Float32Array(2048);
     this.filled=0;
     this.port.postMessage({type:"pcm",samples:finished,sampleRate},[finished.buffer]);
    }
   }
   if(allowed<channel.length){this.enabled=false;this.erase();}
  }
  this.samplesProcessed+=length;
  return true;
 }
}
registerProcessor("robotito-audio-capture",RobotitoAudioCaptureProcessor);
