/* Owner collection management. + and all edit-specific directions remain separate. */
window.LibraryCollections=(()=>{
 let state={collections:[],revision:null},pending=null,busy=false,members=[],run=0,undo=null,saveRevision=null,managerRevision=null,renderedCollections=[];
 const saveDialog=document.createElement('dialog');saveDialog.id='save-collection-dialog';saveDialog.className='collections-dialog';
 saveDialog.setAttribute('aria-labelledby','save-collection-title');
 saveDialog.innerHTML='<form id="save-collection-form"><div class="brief-head"><h2 id="save-collection-title">Save to a collection.</h2><button type="button" class="close-button" data-close-collection-save aria-label="Close save to collection">×</button></div><p id="collection-save-summary"></p><p class="collection-helper">Keep these references for later. Your selection and directions for this edit stay as they are.</p><label class="collection-field">Collection<select id="collection-save-choice" aria-label="Save to collection"></select></label><label id="collection-new-name-field" class="collection-field">Collection name<input id="collection-new-name" maxlength="80" autocomplete="off" placeholder="e.g. Hooks to try"></label><p id="collection-save-error" role="alert"></p><div class="collection-dialog-foot"><button type="button" class="text-button" data-close-collection-save>Cancel</button><button class="primary" id="collection-save-submit">Save</button></div></form>';
 const manageDialog=document.createElement('dialog');manageDialog.id='manage-collections-dialog';manageDialog.className='collections-dialog';manageDialog.setAttribute('aria-labelledby','manage-collections-title');
 manageDialog.innerHTML='<div class="brief-head"><h2 id="manage-collections-title">Your collections.</h2><button class="close-button" id="close-manage-collections" aria-label="Close collections">×</button></div><div class="collection-manage-intro"><p>Organize examples and references without changing their place in your library.</p><button id="new-empty-collection" class="secondary">+ New collection</button></div><p id="collection-manage-status" role="status"></p><div id="collection-manage-undo" hidden><span>Removed from this collection.</span> <button class="text-button" id="undo-collection-member">Undo</button></div><div id="collection-manage-list"></div><details id="removed-collections"><summary>Removed collections</summary><div id="removed-collections-list"></div></details>';
 document.body.append(saveDialog,manageDialog);
 const reviewLatest=document.createElement('button');reviewLatest.type='button';reviewLatest.className='text-button';reviewLatest.textContent='Review latest collections';reviewLatest.hidden=true;
 $('#collection-save-error').after(reviewLatest);
 function memberFor(token){
  const pick=selectionItem(token);if(!pick)return null;
  const {entry:e,x,slide,moment}=pick;
  if(moment)return {kind:'moment',reference_id:e.id,time:moment.time,source:CollectionModel.snapshot(e)};
  if(x)return {kind:'example',technique_id:e.id,example_id:x.id,source:CollectionModel.snapshot(source(x.style_id),x)};
  if(slide)return {kind:'slide',reference_id:e.id,slide,source:CollectionModel.snapshot(e,null,slide)};
  return {kind:'reference',reference_id:e.id,source:CollectionModel.snapshot(e)};
 }
 function currentMember(){return active?memberFor(activeSelectionToken()):null;}
 function adopt(data){state=data;savedCollections=data.collections;updateControls();render();}
 async function reply(response){
  if(!response.headers.get('Content-Type')?.includes('application/json'))throw Error('Collections are unavailable. Restart this studio and try again.');
  const data=await response.json();if(!response.ok)throw Error(data.error||'Couldn’t save the collection.');return data;
 }
 async function refresh(){
  if(pending)return pending;
  pending=(async()=>{const data=await reply(await fetch('/collections',{cache:'no-store'}));adopt(data);return data;})().finally(()=>pending=null);return pending;
 }
 async function change(action,values,expected=state.revision){
  if(busy)throw Error('Wait for the current save to finish.');busy=true;
  const body={action,...values,revision:expected,request_id:crypto.randomUUID()};
  try{const data=await reply(await fetch('/collections',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Action':'collections'},body:JSON.stringify(body)}));adopt(data);return data;}
  catch(error){try{await refresh();}catch{}throw error;}
  finally{busy=false;}
 }
 function sourceOf(m){
  if(m.kind==='example'){const t=item(m.technique_id),x=t?.examples.find(x=>x.id===m.example_id);return x&&CollectionModel.exampleMember({members:[m]},t,x,entries)?source(x.style_id):null;}
  return entries.find(e=>(e.id===m.reference_id||e.archived_from===m.reference_id)&&(m.kind!=='slide'||e.slides?.[m.slide-1])&&CollectionModel.sameSource(m.source,CollectionModel.snapshot(e,null,m.kind==='slide'?m.slide:null)));
 }
 function title(m){
  const e=sourceOf(m),t=m.kind==='example'?item(m.technique_id):null,x=t?.examples.find(x=>x.id===m.example_id);
  return x?.label||(m.kind==='slide'?'Slide '+m.slide+' · ':m.kind==='moment'?'Moment at '+exact(m.time)+' · ':'')+(e?.title||'Unavailable saved reference');
 }
 function position(m){return m.kind==='example'?(item(m.technique_id)?.title||'Technique'):m.kind==='slide'?'Carousel slide':m.kind==='moment'?'Timestamped moment':'Full reference';}
 function chooseMode(){
  const fresh=$('#collection-save-choice').value==='new';$('#collection-new-name-field').hidden=!fresh;
  $('#collection-new-name').required=fresh;$('#collection-save-submit').textContent=fresh?'Create collection':'Save';
 }
 async function openSave(chosen){
  const ticket=++run;members=chosen.filter(Boolean);
  pausePreview();reviewLatest.hidden=true;$('#collection-new-name').value='';$('#collection-save-error').textContent='Loading collections…';
  $('#collection-save-submit').disabled=true;$('#collection-save-summary').textContent=members.length?(members.length===1?title(members[0]):members.length+' items to save: '+members.slice(0,3).map(title).join(' · ')+(members.length>3?'…':'')):'Create an empty collection, then add examples as you browse.';
  if(!saveDialog.open)saveDialog.showModal();
  try{
   await refresh();if(ticket!==run||!saveDialog.open)return;saveRevision=state.revision;
   const personal=state.collections.filter(c=>!c.deleted_at&&c.kind==='personal');
   $('#collection-save-choice').innerHTML=personal.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')+'<option value="new">Create a collection…</option>';
   $('#collection-save-choice').value=personal.length&&members.length?personal[0].id:'new';
   $('#collection-save-choice').parentElement.hidden=!members.length;chooseMode();$('#collection-save-error').textContent='';$('#collection-save-submit').disabled=false;
   if($('#collection-save-choice').value==='new')$('#collection-new-name').focus();
  }catch(error){if(ticket===run&&saveDialog.open)$('#collection-save-error').textContent=error.message;}
 }
 async function manage(){
  pausePreview();$('#collection-manage-status').textContent='Loading collections…';
  if(!manageDialog.open)manageDialog.showModal();
  try{await refresh();renderManager();$('#collection-manage-status').textContent='';}catch(error){$('#collection-manage-status').textContent=error.message;}
 }
 function openCollection(id){
  savedCollectionId=id;rememberFilters();updateControls();render();manageDialog.close();
  if($('#style-dialog').open)closeStyle();if($('#brief-dialog').open)$('#brief-dialog').close();
  history.replaceState(null,'',viewHash());
 }
 function renderManager(){
  managerRevision=state.revision;renderedCollections=state.collections.map(c=>({...c,members:[...c.members]}));
  const rows=renderedCollections.filter(c=>!c.deleted_at);
  $('#collection-manage-list').innerHTML=rows.map(c=>'<section class="collection-manage-row" data-collection-row="'+esc(c.id)+'"><div class="collection-manage-heading"><div><strong>'+esc(c.name)+'</strong><small>'+c.members.length+' item'+(c.members.length===1?'':'s')+(c.kind==='pack'?' · Creator pack':'')+'</small></div><button class="secondary" data-open-collection="'+esc(c.id)+'">Open</button><details class="reference-menu"><summary aria-label="Options for '+esc(c.name)+'">•••</summary><div class="reference-menu-items">'+(c.kind==='personal'?'<button data-rename-collection="'+esc(c.id)+'">Rename</button>':'')+'<button data-delete-collection="'+esc(c.id)+'">Remove collection</button></div></details></div><div data-rename-slot="'+esc(c.id)+'"></div><details class="collection-contents"><summary>View contents</summary><ul>'+c.members.map((m,i)=>'<li><span><strong>'+esc(title(m))+'</strong><small>'+esc(position(m))+'</small></span>'+(c.kind==='personal'?'<button class="text-button" data-remove-member="'+esc(c.id)+'" data-member-index="'+i+'">Remove</button>':'')+'</li>').join('')+(!c.members.length?'<li>Add a reference or example using Save to collection.</li>':'')+'</ul></details></section>').join('')||'<p class="collection-empty">Collections are optional. Save an example to create your first one.</p>';
  const removed=state.collections.filter(c=>c.deleted_at);$('#removed-collections').hidden=!removed.length;
  $('#removed-collections-list').innerHTML=removed.map(c=>'<div class="removed-collection-row"><span>'+esc(c.name)+'</span><button class="text-button" data-restore-collection="'+esc(c.id)+'">Restore</button></div>').join('');
 }
 $('#collection-save-choice').onchange=chooseMode;
 reviewLatest.onclick=async()=>{
  const choice=$('#collection-save-choice').value;reviewLatest.disabled=true;
  try{await refresh();saveRevision=state.revision;
   const personal=state.collections.filter(c=>!c.deleted_at&&c.kind==='personal');
   $('#collection-save-choice').innerHTML=personal.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')+'<option value="new">Create a collection…</option>';
   $('#collection-save-choice').value=personal.some(c=>c.id===choice)?choice:'new';chooseMode();
   $('#collection-save-error').textContent='Latest collections loaded. Review your choice, then save.';reviewLatest.hidden=true;
  }catch(error){$('#collection-save-error').textContent=error.message;}finally{reviewLatest.disabled=false;}
 };
 saveDialog.querySelectorAll('[data-close-collection-save]').forEach(b=>b.onclick=()=>saveDialog.close());
 saveDialog.addEventListener('close',()=>run++);
 $('#save-collection-form').onsubmit=async event=>{
  event.preventDefault();if(busy)return;const ticket=run;$('#collection-save-submit').disabled=true;$('#collection-save-error').textContent='';
  try{
   const id=$('#collection-save-choice').value;
   await change(id==='new'?'create':'add',id==='new'?{name:$('#collection-new-name').value,members}:{id,members},saveRevision);
   if(ticket===run&&saveDialog.open){saveDialog.close();notify('Saved to your collection. Your editing selection is kept.');}
   if(manageDialog.open)renderManager();
  }catch(error){if(ticket===run&&saveDialog.open){$('#collection-save-error').textContent=error.message;reviewLatest.hidden=false;}}
  finally{if(ticket===run)$('#collection-save-submit').disabled=false;}
 };
 $('#manage-collections').onclick=manage;$('#close-manage-collections').onclick=()=>manageDialog.close();
 $('#new-empty-collection').onclick=()=>openSave([]);
 $('#save-reference-collection').onclick=event=>{event.currentTarget.closest('details').open=false;openSave([currentMember()]);};
 $('#save-example-collection').onclick=()=>openSave([currentMember()]);
 $('#save-selection-collection').onclick=event=>{event.currentTarget.closest('details').open=false;openSave(briefIds.map(memberFor));};
 manageDialog.addEventListener('click',async event=>{
  const open=event.target.closest('[data-open-collection]');if(open)return openCollection(open.dataset.openCollection);
  const rename=event.target.closest('[data-rename-collection]');
  if(rename){
   rename.closest('details').open=false;
   const c=renderedCollections.find(c=>c.id===rename.dataset.renameCollection),slot=manageDialog.querySelector('[data-rename-slot="'+c.id+'"]');
   slot.innerHTML='<form class="collection-rename"><input aria-label="Rename collection" maxlength="80" value="'+esc(c.name)+'"><button class="secondary">Save</button><button type="button" class="text-button" data-cancel-rename>Cancel</button></form>';
   slot.querySelector('[data-cancel-rename]').onclick=()=>slot.replaceChildren();slot.querySelector('input').focus();
   slot.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await change('rename',{id:c.id,name:slot.querySelector('input').value},managerRevision);renderManager();}catch(error){$('#collection-manage-status').textContent=error.message;}};
   return;
  }
  const remove=event.target.closest('[data-remove-member]'),del=event.target.closest('[data-delete-collection]'),restore=event.target.closest('[data-restore-collection]');
  if(!remove&&!del&&!restore||busy)return;
  try{
   const id=remove?.dataset.removeMember||del?.dataset.deleteCollection||restore.dataset.restoreCollection;
   const c=renderedCollections.find(c=>c.id===id);
   const response=await change(remove?'remove':del?'delete':'restore',remove?{id,members:[c.members[Number(remove.dataset.memberIndex)]]}:{id},managerRevision);
   if(remove){const saved=response.collections.find(c=>c.id===id);undo={id,index:saved.history.length-1};$('#collection-manage-undo').hidden=false;}
   else $('#collection-manage-status').textContent=del?'Collection removed. Its library items are kept. Restore it below whenever you want.':'Collection restored.';
   renderManager();
  }catch(error){$('#collection-manage-status').textContent=error.message;}
 });
 $('#undo-collection-member').onclick=async()=>{if(!undo)return;try{await change('undo_remove',undo);undo=null;$('#collection-manage-undo').hidden=true;renderManager();}catch(error){$('#collection-manage-status').textContent=error.message;}};
 window.addEventListener('focus',()=>refresh().catch(()=>{}));
 function details(){
  const member=currentMember(),label=member?.kind==='example'?'Save this example to collection…':member?.kind==='slide'?'Save this slide to collection…':member?.kind==='moment'?'Save this moment to collection…':'Save full reference to collection…';
  $('#save-reference-collection').textContent=label;$('#save-example-collection').setAttribute('aria-label',label);
 }
 return {refresh,openSave,manage,memberFor,details};
})();
