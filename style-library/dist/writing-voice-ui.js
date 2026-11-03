/* Private writing preferences are owner data. Opening this panel never changes them. */
window.WritingVoice=(()=>{
 let dialog=null,opener=null,data=null,rows=[],changed=false,busy=false,request=null,undo=null;
 const reply=async r=>{const v=await r.json();if(!r.ok)throw Error(v.error||'Writing preferences are unavailable.');return v;};
 const message=text=>{dialog.querySelector('[data-voice-status]').textContent=text;};
 function render(){
  dialog.querySelector('[data-voice-list]').innerHTML=rows.length?rows.map(p=>'<li data-preference="'+esc(p.id)+'"><label for="voice-'+esc(p.id)+'">Writing preference</label><textarea id="voice-'+esc(p.id)+'" data-voice-text rows="2" maxlength="1000">'+esc(p.text)+'</textarea><div><details><summary>Why this was remembered</summary><p>'+esc(p.source)+'</p></details><button class="text-button" data-remove-voice="'+esc(p.id)+'">Remove</button></div></li>').join(''):'<li class="voice-empty"><h3>Your voice starts here.</h3><p>As you refine scripts in chat, your assistant can remember useful writing preferences here. You can also add one yourself.</p></li>';
  controls();
 }
 function controls(){
  dialog.querySelector('[data-save-voice]').disabled=busy||!data||!changed;
  dialog.querySelector('[data-add-voice]').disabled=busy||!data||rows.length>=40||!dialog.querySelector('[data-new-voice]').value.trim();
  dialog.querySelector('[data-undo-voice]').hidden=!undo;
  dialog.querySelectorAll('[data-voice-text],[data-remove-voice]').forEach(n=>n.disabled=busy);
 }
 async function load(){
  const fresh=await fetch('/writing-voice',{cache:'no-store'}).then(reply);
  if(changed){data={...data,revision:fresh.revision};request=null;message('Saved preferences: '+(fresh.preferences.map(p=>p.text).join(' · ')||'None yet')+'. Your draft is kept. Review before saving.');return;}
  data=fresh;rows=structuredClone(data.preferences);render();message('');
 }
 function mount(){
  if(dialog)return;
  dialog=document.createElement('dialog');dialog.className='writing-voice-dialog';dialog.setAttribute('aria-labelledby','writing-voice-title');
  dialog.innerHTML='<div class="project-start-head"><div><p class="eyebrow">PERSONAL TO YOUR STUDIO</p><h2 id="writing-voice-title" tabindex="-1">Your writing preferences</h2><p>A little less explaining, each time you write.</p></div><button class="close-button" data-close-voice aria-label="Close writing preferences">×</button></div><div class="voice-body"><p class="script-help">Your assistant uses these alongside the shared writing guidance. This project’s instructions always come first. Your preferences stay in this installation.</p><ul data-voice-list></ul><label for="new-writing-preference">Add a preference <small>optional</small></label><textarea id="new-writing-preference" data-new-voice rows="2" maxlength="1000" placeholder="For example: Keep transitions conversational and get to the demonstration quickly."></textarea><button class="secondary" data-add-voice>Add preference</button><button class="text-button" data-undo-voice hidden>Undo removal</button><p data-voice-status role="status"></p></div><div class="project-start-foot"><button class="text-button" data-reload-voice>Compare saved preferences</button><button class="primary" data-save-voice>Save preferences</button></div>';
  document.body.append(dialog);
  dialog.querySelector('[data-close-voice]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{opener?.isConnected&&opener.focus();});
  dialog.addEventListener('input',e=>{
   if(e.target.matches('[data-voice-text]')){
    const row=rows.find(p=>p.id===e.target.closest('[data-preference]').dataset.preference);
    row.text=e.target.value;row.source='Edited in the studio. Earlier wording and evidence remain in local writing history.';changed=true;request=null;message('Unsaved changes. Save to use them in future chats.');
   }
   controls();
  });
  dialog.addEventListener('click',e=>{
   const button=e.target.closest('[data-remove-voice]');if(!button)return;
   const index=rows.findIndex(p=>p.id===button.dataset.removeVoice);undo={row:rows[index],index};rows.splice(index,1);changed=true;request=null;render();message('Preference removed from this draft. Save to keep the change.');
  });
  dialog.querySelector('[data-undo-voice]').onclick=()=>{if(!undo)return;rows.splice(undo.index,0,undo.row);undo=null;changed=true;request=null;render();message('Preference restored to this draft.');};
  dialog.querySelector('[data-add-voice]').onclick=()=>{
   const field=dialog.querySelector('[data-new-voice]'),text=field.value.trim();if(!text||rows.length>=40)return;
   rows.push({id:crypto.randomUUID(),text,source:'Added by the owner in the studio.'});field.value='';changed=true;request=null;render();
   dialog.querySelectorAll('[data-voice-text]')[rows.length-1].focus();
  };
  dialog.querySelector('[data-reload-voice]').onclick=()=>load().catch(e=>message(e.message));
  dialog.querySelector('[data-save-voice]').onclick=async()=>{
   if(busy||!data||!changed)return;
   if(rows.some(p=>!p.text.trim())){message('Give each preference some wording, or remove the empty one.');return;}
   request??={revision:data.revision,request_id:crypto.randomUUID(),preferences:structuredClone(rows)};
   busy=true;controls();message('Saving preferences…');
   try{
    data=await fetch('/writing-voice',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Action':'writing-voice'},body:JSON.stringify(request)}).then(reply);
    rows=structuredClone(data.preferences);changed=false;request=null;render();message('Preferences saved. Future writing chats can use them.');
   }catch(error){message(error.message);}
   finally{busy=false;controls();}
  };
 }
 async function open(button){
  mount();opener=button;if(!dialog.open)dialog.showModal();dialog.querySelector('#writing-voice-title').focus();
  if(!changed)try{await load();}catch(error){message(error.message);}
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-writing-voice]');if(b){e.preventDefault();open(b);}});
 return {open};
})();
