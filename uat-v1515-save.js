// UAT v0.15.16: direct Safari project download and dated filenames.
(function(){
  function safeDescription(){return document.getElementById('description').value.trim().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'Crestie'}
  function localDateStamp(){const now=new Date(),offset=now.getTimezoneOffset();return new Date(now.getTime()-offset*60000).toISOString().slice(0,10)}
  function projectName(){return `${safeDescription()}-${localDateStamp()}.geckopost`}

  outputName=function(){return `${safeDescription()}-${localDateStamp()}-instagram-story.png`};

  const originalButton=document.getElementById('save-project');
  const saveButton=originalButton.cloneNode(true);
  originalButton.replaceWith(saveButton);

  saveButton.addEventListener('click',async()=>{try{
    saveButton.disabled=true;
    autosaveStatus.textContent='Preparing the editable project and its photos…';
    const blob=new Blob([JSON.stringify(await portableProjectSnapshot())],{type:'application/octet-stream'});
    const filename=projectName();
    const link=document.createElement('a'),url=URL.createObjectURL(blob);
    link.download=filename;link.href=url;link.hidden=true;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    autosaveStatus.textContent=`Download started: ${filename} · Safari will save it to your configured IG Stories folder.`;
  }catch(error){autosaveStatus.textContent='Project could not be downloaded. Please try again.'}
  finally{saveButton.disabled=false}});
})();
