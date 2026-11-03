/* Scripts stay with the project; only explicit Copy prepares a request for the editing chat. */
window.ProjectScript=(()=>{
 const drafts=new Map(),key='ai-video-studio-script-drafts-v1';let current=null,run=0;
 try{for(const [id,value] of Object.entries(JSON.parse(sessionStorage.getItem(key)||'{}')))if(value&&typeof value.text==='string'&&value.text.length<=50000)drafts.set(id,value);}catch{}
 const requestReply=async response=>{const value=await response.json();if(!response.ok){const error=Error(value.error||'Your script could not load.');error.status=response.status;throw error;}return value;};
 const get=url=>fetch(url,{cache:'no-store'}).then(requestReply);
 function persist(){try{sessionStorage.setItem(key,JSON.stringify(Object.fromEntries(drafts)));}catch{}}
 function retain(){
  if(!current?.panel.isConnected)return;
  const field=current.panel.querySelector('[data-script-text]');if(!field)return;
  // Keep earlier tab-only context drafts recoverable, even though context is now read-only here.
  const d={...drafts.get(current.project.id),text:field.value,open:current.panel.querySelector('details')?.open??true,base:current.data.version_id};
  drafts.set(current.project.id,d);persist();
 }
 function dirty(target){
  const field=target.panel.querySelector('[data-script-text]');
  return !!field&&(field.value.trim()!==target.data.text.trim());
 }
 function grow(target){
  const field=target?.panel.querySelector('[data-script-text]');if(!target?.full||!field)return;
  field.style.height='auto';field.style.height=(field.scrollHeight+2)+'px';
 }
 function controls(target){
  const field=target.panel.querySelector('[data-script-text]');if(!field)return;
  const earlier=target.data.version_id!==target.data.current_version_id,changed=dirty(target),hasSaved=!!target.data.version_id;
  const save=target.panel.querySelector('[data-save-script]'),copy=target.panel.querySelector('[data-copy-script]');
  save.hidden=target.full&&!changed&&!earlier&&(hasSaved||!field.value.trim());
  save.disabled=target.busy||target.needsCompare||!field.value.trim()||hasSaved&&!changed&&!earlier;
  copy.disabled=target.busy||!hasSaved&&!target.full||changed||target.needsCompare;
  copy.className=target.full&&!changed?'primary':'secondary';
  target.panel.querySelector('[data-script-state]').textContent=changed?'Unsaved changes':earlier?'Earlier version':hasSaved?'Saved':'Draft';
  const count=field.value.trim()?field.value.trim().split(/\s+/).length:0;
  target.panel.querySelector('[data-script-count]').textContent=count+' word'+(count===1?'':'s');
  const compare=target.panel.querySelector('[data-reload-script]');
  compare.hidden=target.full&&!earlier&&!target.needsCompare;
 }
 function status(target,message){
  if(current!==target)return;
  const node=target.panel.querySelector('[data-script-status]');node.textContent=message;node.hidden=!message;
 }
 function contextText(value){
  return value.split(/(https?:\/\/[^\s<>"']+)/g).map(part=>/^https?:\/\//.test(part)?'<a href="'+esc(part)+'" target="_blank" rel="noopener noreferrer">'+esc(part)+'</a>':esc(part)).join('');
 }
 function details(target){
  const box=$('#project-script-context');if(!box)return;
  const {brief,data}=target;
  const notes=target.full?Object.entries({idea:brief.idea,references:brief.references}).filter(([,value])=>value.trim()):[];
  box.hidden=!notes.length&&!data.assembled;
  box.innerHTML=notes.map(([name,value])=>'<section><h3>'+(name==='idea'?'Your idea':'References')+'</h3><p>'+contextText(value)+'</p></section>').join('')+(target.full&&data.assembled?'<details class="assembled-script"><summary>Selected spoken script · '+esc(data.assembled.version)+'</summary><pre>'+esc(data.assembled.text)+'</pre></details>':'');
 }
 function draw(target,message=''){
  const {panel,data,project,full}=target,draft=drafts.get(project.id);
  const conflict=draft&&draft.base!==data.version_id&&draft.text.trim()!==data.text.trim();
  target.needsCompare=!!conflict;
  const text=draft?.text??data.text;
  const history=data.versions.length?'<label class="script-history"><span'+(full?' class="sr-only"':'')+'>Versions</span><select data-script-history aria-label="Saved script versions">'+data.versions.map((v,i)=>'<option value="'+esc(v.id)+'" '+(v.id===data.version_id?'selected':'')+'>'+'Version '+(data.version_count-i)+(v.id===data.current_version_id?' · Current':'')+'</option>').join('')+'</select></label>':'';
  const writing='<label class="sr-only" for="project-script-text">Your script</label><textarea id="project-script-text" data-script-text rows="'+(full?1:7)+'" maxlength="50000" placeholder="'+(full?'Develop your script in chat, or start writing here…':'Paste the script you recorded…')+'">'+esc(text)+'</textarea>';
  const actions='<div class="script-actions"><button class="primary" data-save-script>Save script</button><button class="'+(full?'primary':'secondary')+'" data-copy-script>'+(full?'Copy for chat':'Copy request for chat')+'</button></div>';
  const savedSpeech=!full&&data.assembled?'<details class="assembled-script"><summary>Selected spoken script · '+esc(data.assembled.version)+'</summary><p>The words selected from your recording are kept separately.</p><pre>'+esc(data.assembled.text)+'</pre></details>':'';
  const toolbar='<div class="script-editor-head"><span data-script-state></span><span data-script-count></span>'+history+(full?actions:'')+'</div>';
  const body=(conflict?'<p class="project-notice">A newer script is saved. Your draft is kept below. Compare before saving.</p>':'')+toolbar+writing+(full?'':'<div class="script-action-row">'+actions+'</div><p class="script-help">Your assistant uses this script to choose takes and flag missing lines. Saving doesn’t start an edit.</p>')+
   '<p data-script-status role="status" '+(message?'':'hidden')+'>'+esc(message)+'</p><button class="text-button" data-reload-script>Compare with saved script</button><div data-saved-comparison hidden></div>'+savedSpeech;
  panel.className=full?'scripting-workspace':'';
  panel.innerHTML=full?body:'<details class="project-script" '+(draft?.open?'open':'')+'><summary>Your script <span>optional</span></summary><div class="project-script-body">'+body+'</div></details>';
  panel.querySelector('[data-script-text]').addEventListener('input',()=>{retain();target.request=null;target.panel.querySelector('[data-copy-script]').textContent=full?'Copy for chat':'Copy request for chat';status(target,'');grow(target);controls(target);});
  panel.querySelector('[data-save-script]').onclick=()=>save(target);
  panel.querySelector('[data-copy-script]').onclick=()=>copy(target);
  panel.querySelector('[data-reload-script]').onclick=()=>compare(target);
  const menu=panel.querySelector('[data-script-history]');if(menu)menu.onchange=()=>loadVersion(target,menu.value);
  controls(target);grow(target);details(target);
 }
 async function save(target){
  if(target.busy||target.needsCompare||current!==target)return;retain();
  const text=target.panel.querySelector('[data-script-text]').value;
  target.request??={project_id:target.project.id,revision:target.data.revision,request_id:crypto.randomUUID(),text};
  target.busy=true;controls(target);status(target,'Saving script…');
  try{
   const data=await fetch('/project-script',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Action':'project-script'},body:JSON.stringify(target.request)}).then(requestReply);
   const draft=drafts.get(target.project.id);
   if(draft?.text===text){draft.text=data.text;draft.base=data.version_id;persist();}
   target.data=data;target.request=null;
   const route=new URLSearchParams(location.hash.slice(1));if(route.get('project')===target.project.id&&route.has('script')){route.set('script',data.version_id);history.replaceState(null,'','#'+route);}
   if(current===target)draw(target);
  }catch(error){if(error.status===409)target.needsCompare=true;status(target,error.message||'Couldn’t save. Your draft is kept.');}
  finally{target.busy=false;if(current===target)controls(target);}
 }
 async function compare(target){
  if(target.busy)return;
  try{
   const data=await get('/project-script?'+new URLSearchParams({project:target.project.id}));if(current!==target)return;
   const box=target.panel.querySelector('[data-saved-comparison]');box.hidden=false;
   box.innerHTML='<h3>Current saved script</h3><pre>'+esc(data.text||'No script saved yet.')+'</pre><button class="secondary" data-use-saved>Use saved script</button><p>Your draft stays in the editor until you choose to replace it.</p>';
   box.querySelector('[data-use-saved]').onclick=()=>{retain();const draft=drafts.get(target.project.id);draft.text=data.text;draft.base=data.version_id;persist();target.data=data;draw(target);};
   // Rebase only the revision after showing both versions; saving the kept draft remains explicit.
   target.data={...target.data,revision:data.revision,current_version_id:data.current_version_id,versions:data.versions};target.request=null;target.needsCompare=false;controls(target);
  }catch(error){status(target,error.message);}
 }
 async function loadVersion(target,id){
  if(target.busy)return;
  if(dirty(target)){status(target,'Save your draft before switching versions.');target.panel.querySelector('[data-script-history]').value=target.data.version_id;return;}
  try{
   const data=await get('/project-script?'+new URLSearchParams({project:target.project.id,version:id}));if(current!==target)return;
   const draft=drafts.get(target.project.id)||{};draft.text=data.text;draft.base=data.version_id;drafts.set(target.project.id,draft);persist();target.data=data;
   const route=new URLSearchParams(location.hash.slice(1));route.set('script',id);history.replaceState(null,'','#'+route);
   draw(target,id===data.current_version_id?'':'Viewing an earlier script. Save script to make it current; all versions are kept.');
  }catch(error){status(target,error.message);}
 }
 async function copy(target){
  if(target.busy||current!==target||dirty(target)||target.needsCompare)return;
  try{
   const data=await get('/project-script?'+new URLSearchParams(target.data.version_id?{project:target.project.id,version:target.data.version_id}:{project:target.project.id}));if(current!==target)return;
   if(dirty(target))throw Error('Save your changes before copying.');
   if(data.text!==target.data.text){target.needsCompare=true;controls(target);throw Error('The saved script changed. Compare it before copying.');}
   const url=new URL('./',location.href);url.hash=new URLSearchParams(data.version_id?{project:target.project.id,script:data.version_id}:{project:target.project.id,stage:'script'}).toString();
   const intro=!target.full?'Use my saved script for '+target.project.title+' to build or refine the spoken cut. I’ll attach my recorded footage or provide its location. Choose the strongest complete takes, preserve natural delivery, and flag missing or changed lines. Keep existing reviews and source footage.':
    'Help me develop or refine the script for '+target.project.title+'. Read docs/SCRIPTING.md, docs/SCRIPTING-BASELINE.md, my local writing preferences and this project’s script brief. Follow my reference intent, preserve accepted direction and save the revised script as a new version. Offer a few distinct hook options when we are choosing the opening; keep an accepted hook during targeted revisions. Remember useful general feedback with its source; keep project-only choices local.';
   const value=intro+'\n'+url.href;
   try{await navigator.clipboard.writeText(value);if(current===target){target.panel.querySelector('[data-copy-script]').textContent='Copied ✓';status(target,'Copied—paste into your editing chat.');}}
   catch{if(current===target){$('#link-text').value=value;$('#link-dialog').showModal();$('#link-text').focus();$('#link-text').select();}}
  }catch(error){status(target,error.message);}
 }
 async function mount(project,artifact){
  const token=++run;current=null;const panel=$('#project-script-panel');if(!panel)return;
  const context=$('#project-script-context');if(context){context.hidden=true;context.innerHTML='';}
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
  const target=current;if(!target?.panel.isConnected||target.panel.hidden||target.panel.closest('#project-page')?.hidden||document.hidden||target.busy||dirty(target)||target.data.version_id!==target.data.current_version_id)return;
  try{
   const data=await get('/project-script?'+new URLSearchParams({project:target.project.id}));
   const brief=target.full?await get('/script-brief?'+new URLSearchParams({project:target.project.id})):null;
   if(current!==target||target.busy||dirty(target))return;
   if(data.revision===target.data.revision&&brief?.revision===target.brief?.revision)return;
   const draft=drafts.get(target.project.id);if(draft)drafts.set(target.project.id,{...draft,text:data.text,base:data.version_id});persist();target.data=data;target.brief=brief;draw(target);
  }catch{/* Kept draft and explicit comparison remain available. */}
 }
 window.addEventListener('beforeunload',retain);window.addEventListener('focus',refresh);window.addEventListener('resize',()=>grow(current));setInterval(refresh,8000);
 return {mount,retain,hasDraft:()=>!!current&&dirty(current)};
})();
