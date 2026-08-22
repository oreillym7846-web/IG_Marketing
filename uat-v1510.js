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
