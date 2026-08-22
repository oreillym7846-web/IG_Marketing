const canvas = document.getElementById('story');
const ctx = canvas.getContext('2d');
const exportButton = document.getElementById('export');
const shareButton = document.getElementById('share');
const status = document.getElementById('status');
const autosaveStatus = document.getElementById('autosave-status');
const savePreview = document.getElementById('save-preview');
const savePreviewImage = document.getElementById('save-preview-image');
let pendingSaveFile=null;
const signatureFonts=['Kipish','Witchwoode','Royalty Free','Sekaiwo','Showclick','Marti','Star Rust','Allura','Alex Brush','Birthstone','Bonheur Royale','Carattere','Caveat','Cedarville Cursive','Corinthia','Dancing Script','Dawning of a New Day','Ephesis','Great Vibes','Homemade Apple','Imperial Script','Italianno','Lavishly Yours','Lovers Quarrel','Meow Script','MonteCarlo','Mr De Haviland','Oooh Baby','Parisienne','Petit Formal Script','Pinyon Script','Qwitcher Grypen','Rochester','Sacramento','Satisfy','Style Script','Tangerine','Waterfall','Whisper','WindSong','Yellowtail'];
['description-font','price-font'].forEach(id=>{const select=document.getElementById(id);signatureFonts.forEach(family=>select.add(new Option(family,family)));select.value=select.dataset.default});
const template = new Image();
const templateDefinitions = {
  three:{name:'3 Photo Gecko Post',src:'assets/canonical-master.jpg',slots:[{x:94,y:93,w:532,h:283},{x:94,y:485,w:532,h:283},{x:94,y:879,w:532,h:282}],descriptionY:422,priceY:820},
  two:{name:'2 Photo Gecko Post',src:'assets/template-2-photo-draft.png',slots:[{x:91,y:196,w:538,h:293},{x:91,y:767,w:538,h:296}],descriptionY:620,priceY:690},
  'one-landscape':{name:'1 Photo Gecko Post · Landscape',src:'assets/template-1-photo-landscape-draft.png',slots:[{x:64,y:153,w:592,h:335}],descriptionY:620,priceY:735},
  'one-vertical':{name:'1 Photo Gecko Post · Vertical',src:'assets/template-1-photo-vertical-draft.png',slots:[{x:122,y:195,w:473,h:902}],descriptionY:1010,priceY:1090}
};
let activeTemplate = templateDefinitions.three;
let slots = activeTemplate.slots;
template.src = activeTemplate.src;
const photos = ['examples/avion/photo-1.jpg','examples/avion/photo-2.jpg','examples/avion/photo-3.jpg'].map(src=>{
  const image=new Image(); image.src=src;
  return {image,zoom:1,x:0,y:0,safe:false,controls:{}};
});
let drag=null;
let dropTarget=-1;
let projectReady=false;
let autosaveTimer=null;

function projectSnapshot(){
  return {format:'crestie-king-gecko-post',version:1,savedAt:new Date().toISOString(),postType:document.getElementById('post-type').value,orientation:document.getElementById('photo-orientation').value,description:document.getElementById('description').value,descriptionFont:document.getElementById('description-font').value,descriptionSize:document.getElementById('description-size').value,price:document.getElementById('price').value,priceFont:document.getElementById('price-font').value,priceSize:document.getElementById('price-size').value,photos:photos.map(p=>({src:p.image.src,zoom:p.zoom,x:p.x,y:p.y,safe:p.safe}))};
}
function blobDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})}
async function portableProjectSnapshot(){const project=projectSnapshot();project.photos=await Promise.all(project.photos.map(async photo=>({...photo,src:photo.src.startsWith('data:')?photo.src:await blobDataUrl(await (await fetch(photo.src)).blob())})));return project}
function openProjectDatabase(){return new Promise((resolve,reject)=>{const request=indexedDB.open('ig-marketing-post-studio',1);request.onupgradeneeded=()=>request.result.createObjectStore('projects');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function storeDraft(){
  if(!projectReady)return;
  try{const db=await openProjectDatabase();await new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(projectSnapshot(),'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();autosaveStatus.textContent=`Editable draft saved on this device · ${new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`}
  catch(error){autosaveStatus.textContent='Automatic draft save is unavailable. Use Save Editable Project.'}
}
function queueAutosave(){clearTimeout(autosaveTimer);autosaveTimer=setTimeout(storeDraft,350)}
async function applyProject(project){
  if(!project||project.format!=='crestie-king-gecko-post')throw new Error('Not a Gecko Post project');
  document.getElementById('post-type').value=project.postType||'three';document.getElementById('photo-orientation').value=project.orientation||'landscape';document.getElementById('description').value=project.description||'';document.getElementById('description-font').value=project.descriptionFont||'Allura';document.getElementById('description-size').value=project.descriptionSize||60;document.getElementById('price').value=project.price||'';document.getElementById('price-font').value=project.priceFont||'Mistral';document.getElementById('price-size').value=project.priceSize||82;document.getElementById('description-size-value').textContent=document.getElementById('description-size').value;document.getElementById('price-size-value').textContent=document.getElementById('price-size').value;
  (project.photos||[]).slice(0,photos.length).forEach((saved,index)=>{const image=new Image();image.addEventListener('load',draw);image.src=saved.src;photos[index].image=image;['zoom','x','y','safe'].forEach(key=>photos[index][key]=saved[key]??(key==='zoom'?1:key==='safe'?false:0));['zoom','x','y'].forEach(key=>{const value=key==='zoom'?Math.round(photos[index].zoom*100):Math.round(photos[index][key]*100);photos[index].controls[key].input.value=value;photos[index].controls[key].output.textContent=value});document.querySelectorAll('.safe input')[index].checked=photos[index].safe;document.getElementById(`photo-status-${index+1}`).textContent='Saved project photo'});
  selectTemplate();updateSafety();draw();
}
async function restoreDraft(){try{const db=await openProjectDatabase();const saved=await new Promise((resolve,reject)=>{const tx=db.transaction('projects');const request=tx.objectStore('projects').get('current');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});db.close();if(saved){await applyProject(saved);autosaveStatus.textContent='Restored editable draft saved on this device.'}}catch(error){autosaveStatus.textContent='Started a new editable project.'}projectReady=true;queueAutosave()}

function coverSource(image, slot, state){
  const targetRatio=slot.w/slot.h, sourceRatio=image.width/image.height;
  let baseW,baseH;
  if(sourceRatio>targetRatio){baseH=image.height;baseW=baseH*targetRatio}else{baseW=image.width;baseH=baseW/targetRatio}
  const cropW=baseW/state.zoom,cropH=baseH/state.zoom;
  const roomX=image.width-cropW,roomY=image.height-cropH;
  return {sx:Math.max(0,Math.min(roomX,roomX/2-state.x*roomX/2)),sy:Math.max(0,Math.min(roomY,roomY/2-state.y*roomY/2)),sw:cropW,sh:cropH};
}

function draw(){
  if(!template.complete||photos.slice(0,slots.length).some(p=>!p.image.complete)) return;
  ctx.clearRect(0,0,720,1280);
  ctx.drawImage(template,0,0,720,1280);
  slots.forEach((t,i)=>{const p=photos[i],s=coverSource(p.image,t,p);ctx.drawImage(p.image,s.sx,s.sy,s.sw,s.sh,t.x,t.y,t.w,t.h)});
  if(dropTarget>=0){const t=slots[dropTarget];ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=8;ctx.strokeRect(t.x+4,t.y+4,t.w-8,t.h-8);ctx.restore()}
  const descriptionSize=document.getElementById('description-size').value;
  const descriptionFont=document.getElementById('description-font').value;
  const priceSize=document.getElementById('price-size').value;
  const priceFont=document.getElementById('price-font').value;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.font=`${descriptionSize}px "${descriptionFont}", cursive`;
  ctx.fillText(document.getElementById('description').value,360,activeTemplate.descriptionY,636);
  ctx.font=`${priceSize}px "${priceFont}", cursive`;ctx.fillText(document.getElementById('price').value,360,activeTemplate.priceY,480);
}

function controls(){
  const host=document.getElementById('photo-controls');
  photos.forEach((photo,index)=>{
    const box=document.createElement('section');box.className='photo';box.innerHTML=`<h2>Photo ${index+1}</h2>`;
    [['Zoom','zoom',100,140,1],['Horizontal','x',-100,100,1],['Vertical','y',-100,100,1]].forEach(([label,key,min,max,step])=>{
      const row=document.createElement('label');row.className='row';
      const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=key==='zoom'?100:0;
      const output=document.createElement('output');output.textContent=input.value;
      input.addEventListener('input',()=>{output.textContent=input.value;photo[key]=key==='zoom'?Number(input.value)/100:Number(input.value)/100;photo.safe=false;safe.checked=false;updateSafety();draw();queueAutosave()});
      photo.controls[key]={input,output};
      row.append(label,input,output);box.append(row);
    });
    const safeLabel=document.createElement('label');safeLabel.className='safe';
    const safe=document.createElement('input');safe.type='checkbox';
    safe.addEventListener('change',()=>{photo.safe=safe.checked;updateSafety();queueAutosave()});
    safeLabel.append(safe,document.createTextNode('Photo looks safe — head, crest, torso, legs, feet and toes are visible. Only the tail may crop.'));box.append(safeLabel);host.append(box);
  });
}

function updateSafety(){
  const required=photos.slice(0,slots.length),ready=required.every(p=>p.safe);
  exportButton.disabled=false;shareButton.disabled=false;shareButton.textContent='Save to Phone';
  status.textContent=ready?'Body-safety QA complete. Ready to export.':`Saving is available. Before posting, review ${slots.length===1?'the photo':'all photos'} for complete head, crest, torso, legs, feet and toes.`;
}

function selectTemplate(){
  const postType=document.getElementById('post-type').value;
  const orientation=document.getElementById('photo-orientation').value;
  const key=postType==='one'?`one-${orientation}`:postType;
  activeTemplate=templateDefinitions[key];slots=activeTemplate.slots;
  document.getElementById('orientation-control').hidden=postType!=='one';
  document.querySelectorAll('.compact-photos .order-row').forEach((row,index)=>row.hidden=index>=slots.length);
  document.querySelectorAll('#photo-controls .photo').forEach((section,index)=>section.hidden=index>=slots.length);
  document.querySelectorAll('.order-button').forEach(button=>{
    const slot=Number(button.dataset.slot),target=button.dataset.direction==='up'?slot-1:slot+1;
    button.disabled=slot>=slots.length||target<0||target>=slots.length;
  });
  template.src=activeTemplate.src;updateSafety();draw();queueAutosave();
}

function canvasPoint(event){
  const rect=canvas.getBoundingClientRect();
  return {x:(event.clientX-rect.left)*canvas.width/rect.width,y:(event.clientY-rect.top)*canvas.height/rect.height};
}
canvas.addEventListener('pointerdown',event=>{
  const point=canvasPoint(event),index=slots.findIndex(s=>point.x>=s.x&&point.x<=s.x+s.w&&point.y>=s.y&&point.y<=s.y+s.h);
  if(index<0)return;
  const photo=photos[index];
  if(photo.zoom<1.08){photo.zoom=1.08;photo.controls.zoom.input.value=108;photo.controls.zoom.output.textContent=108;}
  drag={index,start:point,x:photo.x,y:photo.y};canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';draw();
});
canvas.addEventListener('pointermove',event=>{
  if(!drag)return;
  const point=canvasPoint(event),photo=photos[drag.index],slot=slots[drag.index];
  photo.x=Math.max(-1,Math.min(1,drag.x+(point.x-drag.start.x)/(slot.w/2)));
  photo.y=Math.max(-1,Math.min(1,drag.y+(point.y-drag.start.y)/(slot.h/2)));
  ['x','y'].forEach(key=>{const value=Math.round(photo[key]*100);photo.controls[key].input.value=value;photo.controls[key].output.textContent=value});
  photo.safe=false;document.querySelectorAll('.safe input')[drag.index].checked=false;updateSafety();draw();queueAutosave();
});
canvas.addEventListener('pointerup',()=>{drag=null;canvas.style.cursor='grab'});
canvas.addEventListener('pointercancel',()=>{drag=null;canvas.style.cursor='grab'});
canvas.addEventListener('dragover',event=>{
  event.preventDefault();
  const point=canvasPoint(event),index=slots.findIndex(s=>point.x>=s.x&&point.x<=s.x+s.w&&point.y>=s.y&&point.y<=s.y+s.h);
  if(index!==dropTarget){dropTarget=index;draw()}
});
canvas.addEventListener('dragleave',()=>{dropTarget=-1;draw()});
canvas.addEventListener('drop',event=>{
  event.preventDefault();
  const index=dropTarget;dropTarget=-1;draw();
  if(index<0)return;
  const selected=event.dataTransfer.files&&event.dataTransfer.files[0];
  loadPhotoFile(selected,index,document.getElementById(`photo-file-${index+1}`));
});

function loadPhotoFile(selected,index,input){
    if(!selected||!selected.type.startsWith('image/'))return;
    const photo=photos[index];
    const replacement=new Image();
    replacement.addEventListener('load',()=>{
      photo.image=replacement;photo.zoom=1;photo.x=0;photo.y=0;photo.safe=false;
      ['zoom','x','y'].forEach(key=>{const value=key==='zoom'?100:0;photo.controls[key].input.value=value;photo.controls[key].output.textContent=value});
      document.querySelectorAll('.safe input')[index].checked=false;
      document.getElementById(`photo-status-${index+1}`).textContent=`Loaded: ${selected.name}`;
      if(input)input.value='';updateSafety();draw();queueAutosave();
    });
    const reader=new FileReader();reader.addEventListener('load',()=>replacement.src=reader.result);reader.readAsDataURL(selected);
}

photos.forEach((photo,index)=>{
  const input=document.getElementById(`photo-file-${index+1}`),button=document.querySelector(`.upload-button[data-photo="${index}"]`);
  input.addEventListener('change',()=>loadPhotoFile(input.files&&input.files[0],index,input));
  button.addEventListener('click',()=>input.click());
});

function swapPhotoSlots(first,second){
  const keys=['image','zoom','x','y','safe'],saved={};
  keys.forEach(key=>saved[key]=photos[first][key]);
  keys.forEach(key=>photos[first][key]=photos[second][key]);
  keys.forEach(key=>photos[second][key]=saved[key]);
  [first,second].forEach(index=>{
    const photo=photos[index];
    ['zoom','x','y'].forEach(key=>{const value=key==='zoom'?Math.round(photo.zoom*100):Math.round(photo[key]*100);photo.controls[key].input.value=value;photo.controls[key].output.textContent=value});
    document.querySelectorAll('.safe input')[index].checked=photo.safe;
  });
  const firstStatus=document.getElementById(`photo-status-${first+1}`),secondStatus=document.getElementById(`photo-status-${second+1}`),statusText=firstStatus.textContent;
  firstStatus.textContent=secondStatus.textContent;secondStatus.textContent=statusText;updateSafety();draw();queueAutosave();
}
document.querySelectorAll('.order-button').forEach(button=>button.addEventListener('click',()=>{
  const slot=Number(button.dataset.slot),target=button.dataset.direction==='up'?slot-1:slot+1;
  if(target>=0&&target<slots.length)swapPhotoSlots(slot,target);
}));

document.getElementById('custom-font-file').addEventListener('change',async event=>{
  const selected=event.target.files&&event.target.files[0];if(!selected)return;
  try{
    const family=`Crestie Custom ${Date.now()}`;
    const face=new FontFace(family,await selected.arrayBuffer());await face.load();document.fonts.add(face);
    ['description-font','price-font'].forEach(id=>{const option=document.createElement('option');option.value=family;option.textContent=`Custom: ${selected.name}`;document.getElementById(id).append(option)});
    document.getElementById('description-font').value=family;document.getElementById('font-status').textContent=`Loaded: ${selected.name}`;draw();
  }catch(error){document.getElementById('font-status').textContent='Font could not be loaded.'}
});

['description','price','description-font','price-font'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{draw();queueAutosave()}));
[['description-size','description-size-value'],['price-size','price-size-value']].forEach(([inputId,outputId])=>{
  const input=document.getElementById(inputId),output=document.getElementById(outputId);
  input.addEventListener('input',()=>{output.textContent=input.value;draw();queueAutosave()});
});
document.getElementById('save-project').addEventListener('click',async()=>{try{const blob=new Blob([JSON.stringify(await portableProjectSnapshot())],{type:'application/json'}),link=document.createElement('a');link.download=`${outputName().replace('-instagram-story.png','')||'gecko'}.geckopost`;link.href=URL.createObjectURL(blob);link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);autosaveStatus.textContent='Self-contained editable project file saved.'}catch(error){autosaveStatus.textContent='Project could not be saved. Please try again.'}});
document.getElementById('open-project').addEventListener('click',()=>document.getElementById('project-file').click());
document.getElementById('project-file').addEventListener('change',async event=>{const file=event.target.files&&event.target.files[0];if(!file)return;try{await applyProject(JSON.parse(await file.text()));projectReady=true;queueAutosave();autosaveStatus.textContent=`Opened editable project: ${file.name}`}catch(error){autosaveStatus.textContent='That file is not a valid Gecko Post project.'}event.target.value=''});
function outputName(){return `${document.getElementById('description').value.trim().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'crestie'}-instagram-story.png`}
function canvasBlob(){return new Promise((resolve,reject)=>{draw();canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG creation failed')),'image/png')})}
function showSavePreview(file){pendingSaveFile=file;savePreviewImage.src=URL.createObjectURL(file);savePreview.showModal();status.textContent='Press and hold the image, then choose Save to Photos or Save Image.'}
async function openShareSheet(file){
  if(!navigator.share)return false;
  if(navigator.canShare&&!navigator.canShare({files:[file]}))return false;
  try{await navigator.share({files:[file],title:'Crestie King Instagram Story'});status.textContent='Share sheet opened. Choose Save Image to add it to Photos.';return true}
  catch(error){if(error.name==='AbortError'){status.textContent='Save cancelled.';return true}return false}
}
exportButton.addEventListener('click',async()=>{try{const blob=await canvasBlob();showSavePreview(new File([blob],outputName(),{type:'image/png'}))}catch(error){status.textContent='PNG creation failed. Please try again.'}});
shareButton.addEventListener('click',async()=>{try{const blob=await canvasBlob(),file=new File([blob],outputName(),{type:'image/png'});if(!await openShareSheet(file))showSavePreview(file)}catch(error){status.textContent='PNG creation failed. Please try again.'}});
document.getElementById('retry-share').addEventListener('click',async()=>{if(pendingSaveFile&&await openShareSheet(pendingSaveFile))savePreview.close()});
document.getElementById('close-preview').addEventListener('click',()=>savePreview.close());
savePreview.addEventListener('close',()=>{if(savePreviewImage.src)URL.revokeObjectURL(savePreviewImage.src);savePreviewImage.removeAttribute('src');pendingSaveFile=null});
document.getElementById('post-type').addEventListener('change',selectTemplate);
document.getElementById('photo-orientation').addEventListener('change',selectTemplate);
controls();selectTemplate();[template,...photos.map(p=>p.image)].forEach(image=>image.addEventListener('load',draw));restoreDraft();
document.fonts.ready.then(draw);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
