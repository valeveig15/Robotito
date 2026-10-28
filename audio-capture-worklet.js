// Sample-accurate microphone PCM capture, without audio upload.
// AudioWorklet runs on the audio rendering thread in supported browsers.
class RobotitoAudioCaptureProcessor extends AudioWorkletProcessor {
 constructor(){
  super();
  this.chunk=new Float32Array(2048);
  this.filled=0;
  // Explicit opt-in and active listening are both required. In particular,
  // do not transfer any PCM to the main thread during class/sleep/own voice.
  this.enabled=false;
  this.port.onmessage=event=>{
   if(event.data?.type!=="capture")return;
   const next=event.data.enabled===true;
   if(next===this.enabled)return;
   this.enabled=next;this.filled=0;this.chunk.fill(0);
  };
 }
 process(inputs){
  if(!this.enabled)return true;
  const channel=inputs[0]?.[0];
  if(channel){
   for(let i=0;i<channel.length;i++){
    this.chunk[this.filled++]=channel[i];
    if(this.filled===this.chunk.length){
     const finished=this.chunk;
     this.chunk=new Float32Array(2048);
     this.filled=0;
     this.port.postMessage({type:"pcm",samples:finished,sampleRate},[finished.buffer]);
    }
   }
  }
  return true;
 }
}
registerProcessor("robotito-audio-capture",RobotitoAudioCaptureProcessor);
