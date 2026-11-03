/* Scripts stay with the project; only explicit Copy prepares a request for the editing chat. */
window.ProjectScript=(()=>{
 const drafts=new Map(),key='ai-video-studio-script-drafts-v1';let current=null,run=0;
 try{for(const [id,value] of Object.entries(JSON.parse(sessionStorage.getItem(key)||'{}')))if(value&&typeof value.text==='string'&&value.text.length<=50000)drafts.set(id,value);}catch{}
 const requestReply=async response=>{const value=await response.json();if(!response.ok)throw Error(value.error||'Writing context is unavailable.');return value;};
 const get=url=>fetch(url,{cache:'no-store'}).then(requestReply);
 function persist(){try{sessionStorage.setItem(key,JSON.stringify(Object.fromEntries(drafts)));}catch{}}
 function retain(){
  if(!current?.panel.isConnected)return;
  const field=current.panel.querySelector('[data-script-text]');if(!field)return;
  const d={text:field.value,open:current.panel.querySelector('details')?.open??true,base:current.data.version_id};
  for(const name of ['idea','references'])d[name]=current.panel.querySelector('[data-script-'+name+']')?.value??current.brief?.[name]??drafts.get(current.project.id)?.[name]??'';
  drafts.set(current.project.id,d);persist();
 }
 function dirty(target){
  const field=target.panel.querySelector('[data-script-text]');
  return !!field&&(field.value.trim()!==target.data.text.trim());
 }
 function briefDirty(target){
  return !!target.brief&&['idea','references'].some(name=>(target.panel.querySelector('[data-script-'+name+']')?.value||'')!==target.brief[name]);
 }
 function controls(target){
  const field=target.panel.querySelector('[data-script-text]');if(!field)return;
  const earlier=target.data.version_id!==target.data.current_version_id,changed=dirty(target),hasSaved=!!target.data.version_id,briefChanged=briefDirty(target);
  target.panel.querySelector('[data-save-script]').disabled=target.busy||!field.value.trim()||hasSaved&&!changed&&!earlier;
  target.panel.querySelector('[data-copy-script]').disabled=target.busy||!hasSaved&&!target.full||changed||briefChanged;
  target.panel.querySelector('[data-script-state]').textContent=changed?'Unsaved changes':target.data.version_id!==target.data.current_version_id?'Earlier saved script':hasSaved?'Saved with this project':'Draft';
  const count=field.value.trim()?field.value.trim().split(/\s+/).length:0;
  target.panel.querySelector('[data-script-count]').textContent=count+' word'+(count===1?'':'s');
  const heading=target.panel.querySelector('.scripting-heading .eyebrow');if(heading)heading.textContent=target.brief.ready&&!changed&&!earlier?'READY TO RECORD':'FROM THOUGHT TO FIRST TAKE';
  const ready=target.panel.querySelector('[data-script-ready]');if(ready)ready.disabled=target.busy||changed||!hasSaved||briefChanged||earlier;
  const briefSave=target.panel.querySelector('[data-save-brief]');if(briefSave)briefSave.disabled=target.busy||!briefChanged;
 }
 const status=(target,message)=>{if(current===target)target.panel.querySelector('[data-script-status]').textContent=message;};
 function draw(target,message=''){
  const {panel,data,project,full,brief}=target,draft=drafts.get(project.id);
  const conflict=draft&&draft.base!==data.version_id&&draft.text.trim()!==data.text.trim();
  const text=draft?.text??data.text;
  const history=data.versions.length?'<label class="script-history">Saved versions<select data-script-history aria-label="Saved script versions">'+data.versions.map((v,i)=>'<option value="'+esc(v.id)+'" '+(v.id===data.version_id?'selected':'')+'>'+'Version '+(data.version_count-i)+' · '+(v.at?esc(new Date(v.at).toLocaleString()):'Earlier save')+(v.id===data.current_version_id?' · Current':'')+'</option>').join('')+'</select></label>':'';
  const writing='<label class="sr-only" for="project-script-text">Your script</label><textarea id="project-script-text" data-script-text rows="'+(full?15:7)+'" maxlength="50000" placeholder="'+(full?'Your next video starts with a thought. Develop it in chat, or write your script here…':'Paste the script you recorded…')+'">'+esc(text)+'</textarea>';
  const briefUI=full?'<details class="script-brief"><summary>Idea & references <span>optional</span></summary><label for="script-idea">What do you want to say?</label><textarea id="script-idea" data-script-idea rows="3" maxlength="10000" placeholder="The idea, audience or point you want to make…">'+esc(draft?.idea??brief.idea)+'</textarea><label for="script-references">References and what you like</label><textarea id="script-references" data-script-references rows="3" maxlength="10000" placeholder="Paste a video or library link and say what you want to borrow…">'+esc(draft?.references??brief.references)+'</textarea><button class="secondary" data-save-brief>Save context</button></details>':'';
  const actions='<div class="script-action-row"><div><button class="primary" data-save-script>Save script</button><button class="secondary" data-copy-script>'+(full?(brief.ready?'Copy recording request':data.version_id?'Copy refinement request':'Copy writing request'):'Copy request for chat')+'</button></div>'+(full?'<button class="text-button" data-script-ready>'+(brief.ready?'Return to drafting':'Ready to record')+'</button>':'')+'</div><p class="script-help">'+(full?'Write with your assistant in chat, then keep the latest script here. Copy a request to continue with this exact saved version.':'Your assistant uses this script to choose takes and flag missing lines. Saving doesn’t start an edit.')+'</p>';
  const savedSpeech=data.assembled?'<details class="assembled-script"><summary>Selected spoken script · '+esc(data.assembled.version)+'</summary><p>The words selected from your recording are kept separately.</p><pre>'+esc(data.assembled.text)+'</pre></details>':'';
  const body=(full?'<div class="scripting-heading"><div><p class="eyebrow">'+(brief.ready?'READY TO RECORD':'FROM THOUGHT TO FIRST TAKE')+'</p><h2>Your script.</h2><p>Shape the idea. Find your words. Make it yours.</p></div><button class="text-button" data-writing-voice>Your writing preferences</button></div>':'')+
   (conflict?'<p class="project-notice">A newer script is saved. Your local draft is kept below; compare before saving.</p>':'')+
   '<div class="script-editor-head"><span data-script-state></span>'+history+'<span data-script-count></span></div>'+writing+actions+
   '<p data-script-status role="status">'+esc(message)+'</p><button class="text-button" data-reload-script>Compare with saved script</button><div data-saved-comparison hidden></div>'+briefUI+savedSpeech;
  panel.className=full?'scripting-workspace':'';
  panel.innerHTML=full?body:'<details class="project-script" '+(draft?.open?'open':'')+'><summary>Your script <span>optional</span></summary><div class="project-script-body">'+body+'</div></details>';
  panel.querySelectorAll('textarea').forEach(field=>field.addEventListener('input',()=>{retain();target.request=null;controls(target);}));
  panel.querySelector('[data-save-script]').onclick=()=>save(target);
  panel.querySelector('[data-copy-script]').onclick=()=>copy(target);
  panel.querySelector('[data-reload-script]').onclick=()=>compare(target);
  const menu=panel.querySelector('[data-script-history]');if(menu)menu.onchange=()=>loadVersion(target,menu.value);
  const ready=panel.querySelector('[data-script-ready]');if(ready)ready.onclick=()=>saveBrief(target,!brief.ready);
  const saveContext=panel.querySelector('[data-save-brief]');if(saveContext)saveContext.onclick=()=>saveBrief(target,false);
  controls(target);
 }
 async function save(target){
  if(target.busy||current!==target)return;retain();
  const text=target.panel.querySelector('[data-script-text]').value;
  target.request??={project_id:target.project.id,revision:target.data.revision,request_id:crypto.randomUUID(),text};
  target.busy=true;controls(target);status(target,'Saving script…');
  try{
   const data=await fetch('/project-script',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Action':'project-script'},body:JSON.stringify(target.request)}).then(requestReply);
   const draft=drafts.get(target.project.id);
   if(draft?.text===text){draft.text=data.text;draft.base=data.version_id;persist();}
   target.data=data;target.request=null;
   const route=new URLSearchParams(location.hash.slice(1));if(route.get('project')===target.project.id&&route.has('script')){route.set('script',data.version_id);history.replaceState(null,'','#'+route);}
   if(target.full)try{target.brief=await get('/script-brief?'+new URLSearchParams({project:target.project.id}));}catch{}
   if(current===target)draw(target,'Script saved.');
  }catch(error){status(target,error.message||'Couldn’t save. Your draft is kept.');}
  finally{target.busy=false;if(current===target)controls(target);}
 }
 async function saveBrief(target,ready){
  if(target.busy||current!==target)return;
  target.busy=true;retain();controls(target);
  const body={project_id:target.project.id,revision:target.brief.revision,request_id:crypto.randomUUID(),idea:target.panel.querySelector('[data-script-idea]').value,references:target.panel.querySelector('[data-script-references]').value,ready_script:ready?target.data.version_id:null};
  try{
   target.brief=await fetch('/script-brief',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Action':'script-brief'},body:JSON.stringify(body)}).then(requestReply);
   if(current===target)draw(target,ready?'Ready when you are. Record your video, then copy the recording request and bring your footage into chat.':'Context saved. Continue developing your script in chat.');
  }catch(error){status(target,error.message);}
  finally{target.busy=false;if(current===target)controls(target);}
 }
 async function compare(target){
  if(target.busy)return;
  try{
   const data=await get('/project-script?'+new URLSearchParams({project:target.project.id}));if(current!==target)return;
   const box=target.panel.querySelector('[data-saved-comparison]');box.hidden=false;
   box.innerHTML='<h3>Current saved script</h3><pre>'+esc(data.text||'No script saved yet.')+'</pre><button class="secondary" data-use-saved>Use saved script</button><p>Your draft stays in the editor until you choose to replace it.</p>';
   box.querySelector('[data-use-saved]').onclick=()=>{retain();const draft=drafts.get(target.project.id);draft.text=data.text;draft.base=data.version_id;persist();target.data=data;draw(target,'Current saved script loaded.');};
   // Rebase only the revision after showing both versions; the user still explicitly saves their kept draft.
   target.data={...target.data,revision:data.revision,current_version_id:data.current_version_id,versions:data.versions};target.request=null;controls(target);
  }catch(error){status(target,error.message);}
 }
 async function loadVersion(target,id){
  if(target.busy)return;
  if(dirty(target)){status(target,'Save your draft before switching versions.');draw(target,'Save your draft before switching versions.');return;}
  try{
   const data=await get('/project-script?'+new URLSearchParams({project:target.project.id,version:id}));if(current!==target)return;
   const draft=drafts.get(target.project.id)||{};draft.text=data.text;draft.base=data.version_id;drafts.set(target.project.id,draft);persist();target.data=data;
   const route=new URLSearchParams(location.hash.slice(1));route.set('script',id);history.replaceState(null,'','#'+route);
   draw(target,id===data.current_version_id?'Current script loaded.':'Viewing an earlier script. Save script to make it current; all versions are kept.');
  }catch(error){status(target,error.message);}
 }
 async function copy(target){
  if(target.busy||current!==target||dirty(target)||briefDirty(target))return;
  try{
   const data=await get('/project-script?'+new URLSearchParams(target.data.version_id?{project:target.project.id,version:target.data.version_id}:{project:target.project.id}));if(current!==target)return;
   if(data.text!==target.data.text)throw Error('The saved script changed. Compare it before copying.');
   const url=new URL('./',location.href);url.hash=new URLSearchParams(data.version_id?{project:target.project.id,script:data.version_id}:{project:target.project.id,stage:'script'}).toString();
   const intro=!target.full||target.brief.ready?'Use my saved script for '+target.project.title+' to build or refine the spoken cut. I’ll attach my recorded footage or provide its location. Choose the strongest complete takes, preserve natural delivery, and flag missing or changed lines. Keep existing reviews and source footage.':
    'Help me develop or refine the script for '+target.project.title+'. Read docs/SCRIPTING.md, docs/SCRIPTING-BASELINE.md, my local writing preferences and this project’s script brief. Follow my reference intent, preserve accepted direction and save the revised script as a new version. Remember useful general feedback with its source; keep project-only choices local.';
   const value=intro+'\n'+url.href;
   try{await navigator.clipboard.writeText(value);if(current===target){target.panel.querySelector('[data-copy-script]').textContent='Copied ✓';status(target,'Copied. Paste into your editing chat in this studio folder.');}}
   catch{if(current===target){$('#link-text').value=value;$('#link-dialog').showModal();$('#link-text').focus();$('#link-text').select();}}
  }catch(error){status(target,error.message);}
 }
 async function mount(project,artifact){
  const token=++run;current=null;const panel=$('#project-script-panel');if(!panel)return;
  const full=artifact.type==='script';
  panel.hidden=project.format!=='video'||!full&&ReviewLayout.stage(project,artifact)!=='spoken';if(panel.hidden)return;
  panel.className='';panel.innerHTML='<p class="script-help">Opening your script…</p>';
  try{
   const params=new URLSearchParams(location.hash.slice(1)),query=new URLSearchParams({project:project.id});if(params.get('project')===project.id&&params.has('script'))query.set('version',params.get('script'));
   const [data,brief]=await Promise.all([get('/project-script?'+query),full?get('/script-brief?'+new URLSearchParams({project:project.id})):Promise.resolve(null)]);
   if(token!==run||!panel.isConnected)return;current={project,panel,data,brief,full,busy:false,request:null};draw(current);
  }catch(error){if(token===run&&panel.isConnected)panel.innerHTML='<p class="script-help">'+esc(error.message)+' Reopen Script to try again. Your draft is kept.</p>';}
 }
 async function refresh(){
  const target=current;if(!target?.panel.isConnected||target.panel.hidden||target.panel.closest('#project-page')?.hidden||document.hidden||target.busy||dirty(target)||briefDirty(target)||target.data.version_id!==target.data.current_version_id)return;
  try{
   const data=await get('/project-script?'+new URLSearchParams({project:target.project.id}));
   const brief=target.full?await get('/script-brief?'+new URLSearchParams({project:target.project.id})):null;
   if(current!==target||target.busy||dirty(target)||briefDirty(target))return;
   if(data.revision===target.data.revision&&brief?.revision===target.brief?.revision)return;
   drafts.delete(target.project.id);persist();target.data=data;target.brief=brief;draw(target,'Latest script loaded from your editing chat.');
  }catch{/* Kept draft and explicit reload remain available. */}
 }
 window.addEventListener('beforeunload',retain);window.addEventListener('focus',refresh);setInterval(refresh,8000);
 return {mount,retain,hasDraft:()=>!!current&&(dirty(current)||briefDirty(current))};
})();
