import { FilesetResolver, PoseLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';

export type PoseFrame={timestampMs:number;landmarks:NormalizedLandmark[];confidence:number};
export type PhaseKey='setup'|'load'|'plant'|'contact'|'finish';
export type Measurement={key:string;label:string;value:number|null;unit:string;confidence:number;detail:string;status:'good'|'attention'|'watch'|'insufficient'};
export type Finding={kind:'primary'|'secondary'|'positive'|'neutral';title:string;summary:string;confidence:number;drillIds:string[]};
export type AnalysisResult={frames:PoseFrame[];phases:Record<PhaseKey,number>;measurements:Measurement[];findings:Finding[];overallConfidence:number;qualityNotes:string[];duration:number;fps:number};
export type AnalysisPreview={image:string;people:number;confidence:number};

const POSE_MODEL='https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
const WASM_ROOT='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const L={nose:0,leftShoulder:11,rightShoulder:12,leftHip:23,rightHip:24,leftKnee:25,rightKnee:26,leftAnkle:27,rightAnkle:28,leftHeel:29,rightHeel:30,leftFoot:31,rightFoot:32,leftWrist:15,rightWrist:16};
const vis=(p?:NormalizedLandmark)=>p?.visibility??0;
const dist=(a:NormalizedLandmark,b:NormalizedLandmark)=>Math.hypot(a.x-b.x,a.y-b.y);
const mid=(a:NormalizedLandmark,b:NormalizedLandmark)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2,visibility:Math.min(vis(a),vis(b))} as NormalizedLandmark);
const angle=(a:NormalizedLandmark,b:NormalizedLandmark,c:NormalizedLandmark)=>{const u={x:a.x-b.x,y:a.y-b.y},v={x:c.x-b.x,y:c.y-b.y};const den=Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y);if(!den)return null;return Math.acos(Math.max(-1,Math.min(1,(u.x*v.x+u.y*v.y)/den)))*180/Math.PI};
const segmentAngle=(a:NormalizedLandmark,b:NormalizedLandmark)=>Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
const diffAngle=(a:number,b:number)=>Math.abs(((a-b+180)%360)-180);
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const conf=(f:PoseFrame,ids:number[])=>ids.reduce((s,i)=>s+vis(f.landmarks[i]),0)/ids.length;
const smooth=(v:number[],radius=2)=>v.map((_,i)=>{const s=v.slice(Math.max(0,i-radius),i+radius+1);return s.reduce((a,b)=>a+b,0)/s.length});
const seek=(video:HTMLVideoElement,time:number)=>new Promise<void>((resolve,reject)=>{const done=()=>{video.removeEventListener('seeked',done);resolve()};video.addEventListener('seeked',done,{once:true});video.addEventListener('error',()=>reject(new Error('The browser could not decode this video. Try MP4 or WebM.')),{once:true});video.currentTime=Math.min(time,Math.max(0,video.duration-.001))});
const loaded=(video:HTMLVideoElement)=>new Promise<void>((resolve,reject)=>{video.addEventListener('loadedmetadata',()=>resolve(),{once:true});video.addEventListener('error',()=>reject(new Error('The browser could not decode this video. Try converting it to MP4.')),{once:true})});
const trackingIds=[0,11,12,23,24,25,26,27,28];
function selectHitter(poses:NormalizedLandmark[][],previous?:NormalizedLandmark[]){
 const score=(pose:NormalizedLandmark[])=>{const ankles=mid(pose[L.leftAnkle],pose[L.rightAnkle]),height=dist(pose[L.nose],ankles),visibility=trackingIds.reduce((s,i)=>s+vis(pose[i]),0)/trackingIds.length,upright=Math.abs(pose[L.nose].y-ankles.y);if(!previous)return height*2.4+upright*1.2+visibility*.35-Math.abs(mid(pose[L.leftHip],pose[L.rightHip]).x-.5)*.08;const continuity=trackingIds.reduce((s,i)=>s+dist(pose[i],previous[i]),0)/trackingIds.length;return 1-continuity*3+height*.35+visibility*.15};
 return poses.reduce((best,p)=>score(p)>score(best)?p:best,poses[0]);
}
function previewFrame(video:HTMLVideoElement,landmarks:NormalizedLandmark[],people:number):AnalysisPreview{const canvas=document.createElement('canvas'),max=640,scale=Math.min(1,max/video.videoWidth);canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));const ctx=canvas.getContext('2d')!;ctx.drawImage(video,0,0,canvas.width,canvas.height);ctx.strokeStyle='#ed3f2c';ctx.fillStyle='#ffffff';ctx.lineWidth=Math.max(2,canvas.width/350);for(const[a,b]of[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]]){ctx.beginPath();ctx.moveTo(landmarks[a].x*canvas.width,landmarks[a].y*canvas.height);ctx.lineTo(landmarks[b].x*canvas.width,landmarks[b].y*canvas.height);ctx.stroke()}for(const i of trackingIds){const p=landmarks[i];ctx.beginPath();ctx.arc(p.x*canvas.width,p.y*canvas.height,Math.max(2,canvas.width/220),0,Math.PI*2);ctx.fill()}return{image:canvas.toDataURL('image/jpeg',.7),people,confidence:landmarks.reduce((s,p)=>s+vis(p),0)/landmarks.length}}

export async function analyzeVideo(file:File,onProgress:(stage:number,progress:number,preview?:AnalysisPreview)=>void,signal:AbortSignal):Promise<AnalysisResult>{
 const url=URL.createObjectURL(file),video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.src=url;
 try{
  onProgress(0,.05);await loaded(video);if(video.duration>30)throw new Error('This video is longer than 30 seconds. Trim it to one swing and try again.');if(!Number.isFinite(video.duration)||video.duration<=0)throw new Error('The video duration could not be read.');
  onProgress(1,.1);const vision=await FilesetResolver.forVisionTasks(WASM_ROOT);if(signal.aborted)throw new DOMException('Canceled','AbortError');
  const landmarker=await PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:POSE_MODEL,delegate:'GPU'},runningMode:'VIDEO',numPoses:3,minPoseDetectionConfidence:.45,minPosePresenceConfidence:.45,minTrackingConfidence:.5});
  const sampleFps=video.duration>15?12:15,total=Math.max(2,Math.floor(video.duration*sampleFps)),frames:PoseFrame[]=[];let previous:NormalizedLandmark[]|undefined,maxPeople=0;
  for(let i=0;i<total;i++){if(signal.aborted)throw new DOMException('Canceled','AbortError');const t=i/(total-1)*Math.max(0,video.duration-.01);await seek(video,t);const result=landmarker.detectForVideo(video,Math.round(t*1000));maxPeople=Math.max(maxPeople,result.landmarks.length);let preview:AnalysisPreview|undefined;if(result.landmarks.length){const landmarks=selectHitter(result.landmarks,previous);previous=landmarks;const confidence=landmarks.reduce((s,p)=>s+vis(p),0)/landmarks.length;frames.push({timestampMs:t*1000,landmarks,confidence});if(i%5===0||i===total-1)preview=previewFrame(video,landmarks,result.landmarks.length)}onProgress(2,(i+1)/total,preview);await new Promise(r=>setTimeout(r,0))}
  landmarker.close();if(frames.length<Math.max(8,total*.25))throw new Error('A person could not be tracked reliably. Make sure the entire hitter is visible with good lighting.');
  onProgress(3,.5);const phases=detectPhases(frames);onProgress(4,.7);const measurements=measure(frames,phases);onProgress(5,.9);const avg=frames.reduce((s,f)=>s+f.confidence,0)/frames.length,coverage=frames.length/total,overall=Math.round(clamp(avg*.65+coverage*.35)*100);const qualityNotes:string[]=[];if(maxPeople>1)qualityNotes.push(`${maxPeople} people were detected; identity tracking was used to follow the upright hitter.`);if(avg<.65)qualityNotes.push('Some body landmarks were partially hidden or blurred.');if(coverage<.8)qualityNotes.push('Pose tracking was unavailable in part of the video.');if(video.videoWidth<640)qualityNotes.push('Video resolution is low; record at 720p or higher for better estimates.');const findings=makeFindings(measurements);onProgress(5,1);return{frames,phases,measurements,findings,overallConfidence:overall,qualityNotes,duration:video.duration,fps:sampleFps};
 }finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url)}
}

function detectPhases(frames:PoseFrame[]):Record<PhaseKey,number>{
 const wrist=frames.map(f=>mid(f.landmarks[L.leftWrist],f.landmarks[L.rightWrist]));const speed=smooth(wrist.map((p,i)=>i?dist(p,wrist[i-1])/Math.max(1,(frames[i].timestampMs-frames[i-1].timestampMs)/1000):0));let peak=1;for(let i=1;i<speed.length-1;i++)if(speed[i]>speed[peak])peak=i;const contact=Math.max(2,Math.min(frames.length-2,peak));const setup=0,finish=frames.length-1;const plant=Math.max(1,Math.round(contact*.68)),load=Math.max(1,Math.round(contact*.35));return{setup,load,plant,contact,finish};
}

export function measure(frames:PoseFrame[],p:Record<PhaseKey,number>):Measurement[]{
 const setup=frames[p.setup],load=frames[p.load],contact=frames[p.contact];const bodyHeight=(f:PoseFrame)=>{const ankles=mid(f.landmarks[L.leftAnkle],f.landmarks[L.rightAnkle]);return dist(f.landmarks[L.nose],ankles)};const bh=(bodyHeight(setup)+bodyHeight(contact))/2;
 const head=bh?dist(load.landmarks[L.nose],contact.landmarks[L.nose])/bh*100:null,headC=Math.min(conf(load,[0,27,28]),conf(contact,[0,27,28]));
 const kneeSide=contact.landmarks[L.leftKnee].x<contact.landmarks[L.rightKnee].x?'left':'right';const ids=kneeSide==='left'?[L.leftHip,L.leftKnee,L.leftAnkle]:[L.rightHip,L.rightKnee,L.rightAnkle];const knee=angle(contact.landmarks[ids[0]],contact.landmarks[ids[1]],contact.landmarks[ids[2]]),kneeC=conf(contact,ids);
 const torso=Math.abs(90-segmentAngle(mid(contact.landmarks[L.leftHip],contact.landmarks[L.rightHip]),mid(contact.landmarks[L.leftShoulder],contact.landmarks[L.rightShoulder]))),torsoC=conf(contact,[11,12,23,24]);
 const stance=bh?dist(setup.landmarks[L.leftAnkle],setup.landmarks[L.rightAnkle])/bh:null,stanceC=conf(setup,[0,27,28]);
 const sep=diffAngle(segmentAngle(contact.landmarks[L.leftHip],contact.landmarks[L.rightHip]),segmentAngle(contact.landmarks[L.leftShoulder],contact.landmarks[L.rightShoulder])),sepC=torsoC;
 const item=(key:string,label:string,value:number|null,unit:string,confidence:number,detail:string,status:Measurement['status']):Measurement=>({key,label,value:confidence<.45?null:value,unit,confidence:Math.round(confidence*100),detail,status:confidence<.45?'insufficient':status});
 return[
  item('head','Head displacement',head,'%',headC,'Load → estimated contact',head!==null&&head>9?'attention':head!==null&&head>6?'watch':'good'),
  item('separation','Hip–shoulder separation',sep,'°',sepC,'At estimated contact',sep<18?'attention':sep<28?'watch':'good'),
  item('front-knee','Front knee angle',knee,'°',kneeC,'At estimated contact',knee!==null&&(knee<70||knee>150)?'watch':'good'),
  item('stance','Stance width',stance,'×',stanceC,'Relative to body height',stance!==null&&(stance<.25||stance>.55)?'watch':'good'),
  item('torso','Torso tilt',torso,'°',torsoC,'At estimated contact',torso>30?'watch':'good')
 ];
}

export function makeFindings(m:Measurement[]):Finding[]{const usable=m.filter(x=>x.value!==null);const attention=usable.filter(x=>x.status==='attention'||x.status==='watch').sort((a,b)=>(b.status==='attention'?1:0)-(a.status==='attention'?1:0)||b.confidence-a.confidence);const good=usable.filter(x=>x.status==='good').sort((a,b)=>b.confidence-a.confidence);const explain=(x:Measurement)=>x.key==='head'?`The head moved ${x.value!.toFixed(1)}% of estimated body height from load to contact. This may affect adjustability.`:x.key==='separation'?`Estimated hip–shoulder separation was ${x.value!.toFixed(0)}°. Consider creating a clearer lower-body-first sequence.`:`The measured ${x.label.toLowerCase()} was ${x.value!.toFixed(x.unit==='×'?2:0)}${x.unit}. Review the supporting frame before making a change.`;const out:Finding[]=[];attention.slice(0,2).forEach((x,i)=>out.push({kind:i?'secondary':'primary',title:x.key==='head'?'Control forward head movement':x.key==='separation'?'Create separation before rotation':`Review ${x.label.toLowerCase()}`,summary:explain(x),confidence:x.confidence,drillIds:x.key==='head'?['No-stride tee work','Chair behind rear hip']:['Pause at launch','Separation turns']}));if(good[0])out.push({kind:'positive',title:`Maintain ${good[0].label.toLowerCase()}`,summary:`The video suggests a repeatable ${good[0].label.toLowerCase()} pattern. Keep this foundation while working on the higher-priority opportunity.`,confidence:good[0].confidence,drillIds:['Slow-motion dry swings']});while(out.length<3)out.push({kind:'neutral',title:'More evidence needed',summary:'This observation did not meet the minimum landmark confidence. Confirm key frames or record a clearer open-side video.',confidence:0,drillIds:[]});return out}
