// UAT v0.15.15: iPhone-safe editable project saving and dated filenames.
(function(){
  function safeDescription(){return document.getElementById('description').value.trim().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'Crestie'}
  function localDateStamp(){const now=new Date(),offset=now.getTimezoneOffset();return new Date(now.getTime()-offset*60000).toISOString().slice(0,10)}
  function projectName(){return `${safeDescription()}-${localDateStamp()}.geckopost`}

  outputName=function(){return `${safeDescription()}-${localDateStamp()}-instagram-story.png`};

  const originalButton=document.getElementById('save-project');
  const saveButton=originalButton.cloneNode(true);
  originalButton.replaceWith(saveButton);

  saveButton.addEventListener('click',async()=>{try{
    const blob=new Blob([JSON.stringify(await portableProjectSnapshot())],{type:'application/json'});
    const file=new File([blob],projectName(),{type:'application/json'});
    if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
      try{
        await navigator.share({files:[file],title:`Editable Gecko Post · ${safeDescription()}`});
        autosaveStatus.textContent=`Choose Save to Files to keep ${file.name}.`;
        return;
      }catch(error){
        if(error.name==='AbortError'){autosaveStatus.textContent='Editable project save cancelled.';return}
      }
    }
    const link=document.createElement('a'),url=URL.createObjectURL(blob);
    link.download=file.name;link.href=url;link.hidden=true;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    autosaveStatus.textContent=`Saved ${file.name}.`;
  }catch(error){autosaveStatus.textContent='Project could not be saved. Please try again.'}});
})();
