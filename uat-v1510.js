const uatDragZones=[];
let uatPhotoDrag=null;
document.querySelectorAll('.photo-compact')[1].classList.add('middle-photo-control');
const uatOrderControls=document.querySelector('.middle-order');
const uatOrderToolbar=document.createElement('div');
uatOrderToolbar.className='photo-order-toolbar';
uatOrderToolbar.innerHTML='<span>Photo order</span>';
uatOrderToolbar.append(uatOrderControls);
document.querySelector('.upload-strip').append(uatOrderToolbar);

function updateUatDragZones(){
  uatDragZones.forEach((zone,index)=>{
    const slot=slots[index];
    zone.hidden=index>=slots.length;
    if(!slot)return;
    zone.style.left=`${slot.x/7.2}%`;
    zone.style.top=`${slot.y/12.8}%`;
    zone.style.width=`${slot.w/7.2}%`;
    zone.style.height=`${slot.h/12.8}%`;
  });
}

photos.forEach((photo,index)=>{
  const zone=document.createElement('div');
  zone.className='photo-drag-zone';
  zone.setAttribute('role','application');
  zone.setAttribute('aria-label',`Drag photo ${index+1} to reposition it`);
  zone.addEventListener('pointerdown',event=>{
    const point=canvasPoint(event);
    uatPhotoDrag={index,start:point,x:photo.x,y:photo.y};
    zone.setPointerCapture(event.pointerId);
  });
  zone.addEventListener('pointermove',event=>{
    if(!uatPhotoDrag||uatPhotoDrag.index!==index)return;
    const point=canvasPoint(event),slot=slots[index];
    photo.x=Math.max(-1,Math.min(1,uatPhotoDrag.x+(point.x-uatPhotoDrag.start.x)/(slot.w/2)));
    photo.y=Math.max(-1,Math.min(1,uatPhotoDrag.y+(point.y-uatPhotoDrag.start.y)/(slot.h/2)));
    ['x','y'].forEach(key=>{const value=Math.round(photo[key]*100);photo.controls[key].input.value=value;photo.controls[key].output.textContent=value});
    draw();queueAutosave();
  });
  const finish=()=>{uatPhotoDrag=null};
  zone.addEventListener('pointerup',finish);
  zone.addEventListener('pointercancel',finish);
  document.getElementById('photo-controls').prepend(zone);
  uatDragZones.push(zone);
});

document.getElementById('post-type').addEventListener('change',updateUatDragZones);
document.getElementById('photo-orientation').addEventListener('change',updateUatDragZones);
updateUatDragZones();

async function applyUatFont(type){
  const select=document.getElementById(`${type}-font`);
  const size=document.getElementById(`${type}-size`).value;
  const sample=type==='description'?document.getElementById('description').value:document.getElementById('price').value;
  updateFontPreviews();
  try{await document.fonts.load(`${size}px "${select.value}"`,sample||'Gecko')}catch(error){}
  draw();
  queueAutosave();
}

['description','price'].forEach(type=>{
  const select=document.getElementById(`${type}-font`);
  select.addEventListener('change',()=>applyUatFont(type));
  select.addEventListener('input',()=>applyUatFont(type));
});

const uatTextStyles={
  description:{bold:false,italic:false,underline:false},
  price:{bold:false,italic:false,underline:false}
};
const UAT_TEXT_PREFS_KEY='ig-marketing-last-text-settings';

function syncUatStyleControls(){
  ['description','price'].forEach(type=>{
    const sample=document.getElementById(`${type}-font-preview`),styles=uatTextStyles[type];
    sample.style.fontWeight=styles.bold?'700':'400';
    sample.style.fontStyle=styles.italic?'italic':'normal';
    sample.style.textDecoration=styles.underline?'underline':'none';
    document.querySelectorAll(`[data-text-type="${type}"]`).forEach(button=>button.setAttribute('aria-pressed',String(styles[button.dataset.style])));
  });
}

function saveUatTextPreferences(){
  const preferences={styles:uatTextStyles};
  ['description','price'].forEach(type=>{
    preferences[`${type}Font`]=document.getElementById(`${type}-font`).value;
    preferences[`${type}Size`]=document.getElementById(`${type}-size`).value;
  });
  localStorage.setItem(UAT_TEXT_PREFS_KEY,JSON.stringify(preferences));
}

function restoreUatTextPreferences(){
  try{
    const preferences=JSON.parse(localStorage.getItem(UAT_TEXT_PREFS_KEY)||'null');
    if(!preferences)return;
    ['description','price'].forEach(type=>{
      const font=document.getElementById(`${type}-font`),size=document.getElementById(`${type}-size`);
      if([...font.options].some(option=>option.value===preferences[`${type}Font`]))font.value=preferences[`${type}Font`];
      if(preferences[`${type}Size`]){size.value=preferences[`${type}Size`];document.getElementById(`${type}-size-value`).textContent=size.value}
      Object.assign(uatTextStyles[type],preferences.styles?.[type]||{});
    });
    updateFontPreviews();syncUatStyleControls();draw();
  }catch(error){}
}

['description','price'].forEach(type=>{
  const group=document.createElement('div');
  group.className='text-style-controls';
  [['bold','B','Bold'],['italic','I','Italic'],['underline','U','Underline']].forEach(([style,label,name])=>{
    const button=document.createElement('button');
    button.type='button';button.dataset.textType=type;button.dataset.style=style;button.textContent=label;button.setAttribute('aria-label',`${name} ${type}`);button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{uatTextStyles[type][style]=!uatTextStyles[type][style];syncUatStyleControls();draw();saveUatTextPreferences();queueAutosave()});
    group.append(button);
  });
  document.getElementById(`${type}-font-preview`).closest('.font-choice').append(group);
  [`${type}-font`,`${type}-size`].forEach(id=>document.getElementById(id).addEventListener('change',saveUatTextPreferences));
});

const baseUatProjectSnapshot=projectSnapshot;
projectSnapshot=function(){return {...baseUatProjectSnapshot(),textStyles:JSON.parse(JSON.stringify(uatTextStyles))}};
const baseUatApplyProject=applyProject;
applyProject=async function(project){
  await baseUatApplyProject(project);
  ['description','price'].forEach(type=>Object.assign(uatTextStyles[type],project.textStyles?.[type]||{}));
  syncUatStyleControls();draw();
};

draw=function(){
  if(!template.complete||photos.slice(0,slots.length).some(photo=>!photo.image.complete))return;
  ctx.clearRect(0,0,720,1280);ctx.drawImage(template,0,0,720,1280);
  slots.forEach((slot,index)=>{const photo=photos[index],source=coverSource(photo.image,slot,photo);ctx.drawImage(photo.image,source.sx,source.sy,source.sw,source.sh,slot.x,slot.y,slot.w,slot.h)});
  if(dropTarget>=0){const slot=slots[dropTarget];ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=8;ctx.strokeRect(slot.x+4,slot.y+4,slot.w-8,slot.h-8);ctx.restore()}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';
  [['description',activeTemplate.descriptionY,636],['price',activeTemplate.priceY,480]].forEach(([type,y,maxWidth])=>{
    const size=Number(document.getElementById(`${type}-size`).value),family=document.getElementById(`${type}-font`).value,text=document.getElementById(type).value,styles=uatTextStyles[type];
    ctx.font=`${styles.italic?'italic ':''}${styles.bold?'700 ':''}${size}px "${family}", cursive`;ctx.fillText(text,360,y,maxWidth);
    if(styles.underline&&text){const width=Math.min(ctx.measureText(text).width,maxWidth);ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(2,size/24);ctx.beginPath();ctx.moveTo(360-width/2,y+size*.38);ctx.lineTo(360+width/2,y+size*.38);ctx.stroke();ctx.restore()}
  });
};

const uatPreferenceWait=setInterval(()=>{if(projectReady){clearInterval(uatPreferenceWait);restoreUatTextPreferences()}},50);
setTimeout(()=>clearInterval(uatPreferenceWait),2500);
syncUatStyleControls();
