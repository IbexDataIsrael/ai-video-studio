/* Searchable checkbox pickers. Choices apply immediately; the popover stays open. */
window.LibraryFilterUI=(()=>{
 const widgets=new Map();let opened=null;
 function close(focus=false){if(!opened)return;const w=opened;opened=null;w.menu.hidden=true;w.trigger.setAttribute('aria-expanded','false');if(focus)w.trigger.focus({preventScroll:true});}
 function position(w){
  if(w.menu.hidden)return;
  const r=w.trigger.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.visualViewport?.height||window.innerHeight;
  if(r.bottom<0||r.top>vh){close();return;}
  const width=Math.min(Math.max(r.width,290),vw-24),below=vh-r.bottom-12,above=r.top-12,down=below>=240||below>=above;
  const height=Math.min(430,Math.max(140,down?below:above));
  Object.assign(w.menu.style,{width:width+'px',left:Math.max(12,Math.min(r.left,vw-width-12))+'px',maxHeight:height+'px',top:down?r.bottom+7+'px':'auto',bottom:down?'auto':vh-r.top+7+'px'});
 }
 function summary(w){
  const chosen=w.config.values,items=w.config.items,first=items.find(row=>row.id===chosen[0]);
  w.value.textContent=chosen.length?(first?.label||'Unavailable choice')+(chosen.length>1?' +'+(chosen.length-1):''):w.config.empty;
  w.trigger.classList.toggle('has-filter-values',!!chosen.length);
  w.trigger.setAttribute('aria-label',w.config.label+': '+(chosen.length?chosen.map(id=>items.find(row=>row.id===id)?.label||'Unavailable choice').join(', '):w.config.empty));
  w.clear.disabled=!chosen.length;w.status.textContent=chosen.length?chosen.length+' selected':'All included';
 }
 function choose(w,id,checked){
  w.config.values=checked?[...new Set([...w.config.values,id])]:w.config.values.filter(v=>v!==id);
  w.config.change([...w.config.values]);summary(w);
 }
 function rows(w){
  const query=w.search.value.trim().toLocaleLowerCase(),items=w.config.items.filter(row=>!query||row.label.toLocaleLowerCase().includes(query));
  w.list.replaceChildren();let group='';
  for(const row of items){
   if(row.group&&row.group!==group){group=row.group;const h=document.createElement('p');h.className='multi-filter-group';h.textContent=group;w.list.append(h);}
   const label=document.createElement('label');label.className='multi-filter-option';
   const input=document.createElement('input');input.type='checkbox';input.value=row.id;input.checked=w.config.values.includes(row.id);input.setAttribute('aria-label',row.label);
   const text=document.createElement('span');text.textContent=row.label;label.append(input,text);w.list.append(label);
   input.onchange=()=>choose(w,row.id,input.checked);
  }
  if(!items.length){const p=document.createElement('p');p.className='multi-filter-empty';p.textContent='No matches. Try another name.';w.list.append(p);}
 }
 function create(id,config){
  const host=document.getElementById(id);if(!host)return null;
  const trigger=document.createElement('button');trigger.type='button';trigger.className='multi-filter-trigger';trigger.id=id+'-trigger';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',id+'-popover');
  const value=document.createElement('span');value.className='multi-filter-value';const arrow=document.createElement('span');arrow.className='multi-filter-chevron';arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m7 10 5 5 5-5"/></svg>';trigger.append(value,arrow);host.append(trigger);
  const menu=document.createElement('div');menu.id=id+'-popover';menu.className='multi-filter-popover';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label',config.label);
  const heading=document.createElement('div');heading.className='multi-filter-heading';const title=document.createElement('strong');title.textContent=config.label;
  const status=document.createElement('span');status.setAttribute('role','status');heading.append(title,status);
  const search=document.createElement('input');search.type='search';search.className='multi-filter-search';search.placeholder=config.placeholder;search.setAttribute('aria-label',config.placeholder);search.autocomplete='off';
  const list=document.createElement('div');list.className='multi-filter-options';list.setAttribute('role','group');list.setAttribute('aria-label',config.label+' choices');
  const footer=document.createElement('div');footer.className='multi-filter-footer';const clear=document.createElement('button');clear.type='button';clear.className='text-button';clear.textContent='Clear';clear.setAttribute('aria-label','Clear '+config.label.toLocaleLowerCase());
  const done=document.createElement('button');done.type='button';done.className='multi-filter-done';done.textContent='Done';footer.append(clear,done);menu.append(heading,search,list,footer);document.body.append(menu);
  const w={trigger,value,menu,search,list,status,clear,config};widgets.set(id,w);
  trigger.onclick=()=>{if(opened===w)return close(true);close();opened=w;search.value='';rows(w);summary(w);menu.hidden=false;trigger.setAttribute('aria-expanded','true');position(w);search.focus({preventScroll:true});};
  clear.onclick=()=>{w.config.values=[];w.config.change([]);summary(w);rows(w);search.focus({preventScroll:true});};done.onclick=()=>close(true);search.oninput=()=>{rows(w);position(w);};
  menu.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}
   if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key)||event.target===search&&event.key!=='ArrowDown')return;
   const inputs=[...list.querySelectorAll('input')];if(!inputs.length)return;event.preventDefault();const at=inputs.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?inputs.length-1:Math.max(0,Math.min(inputs.length-1,at+(event.key==='ArrowUp'?-1:1)));inputs[next].focus();
  });
  return w;
 }
 function sync(configs){
  for(const [id,config] of Object.entries(configs)){
   const w=widgets.get(id)||create(id,config);if(!w)continue;
   const changed=JSON.stringify(w.config.items)!==JSON.stringify(config.items);w.config=config;summary(w);
   if(opened===w){if(changed)rows(w);else for(const input of w.list.querySelectorAll('input'))input.checked=config.values.includes(input.value);position(w);}
  }
 }
 document.addEventListener('pointerdown',event=>{if(opened&&!opened.menu.contains(event.target)&&!opened.trigger.contains(event.target))close();});
 document.addEventListener('focusin',event=>{if(opened&&!opened.menu.contains(event.target)&&!opened.trigger.contains(event.target))close();});
 window.addEventListener('resize',()=>{if(opened)position(opened);});
 window.visualViewport?.addEventListener('resize',()=>{if(opened)position(opened);});
 window.addEventListener('scroll',event=>{if(opened&&!(event.target instanceof Node&&opened.menu.contains(event.target)))position(opened);},true);
 return {sync,close};
})();
