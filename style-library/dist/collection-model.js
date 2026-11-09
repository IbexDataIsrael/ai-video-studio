/* Collection membership is exact; source-video context does not widen technique membership. */
const CollectionModel=(()=>{
 function snapshot(e,x=null,slide=null){
  const value={reference_id:e.id,version:e.version??null,path:e.media_path??null,sha256:e.source_sha256??null,url:e.source_url??null};
  if(x)Object.assign(value,{example_id:x.id,start:x.start,end:x.end,sha256:x.source_sha256});
  if(slide){const s=e.slides[slide-1];Object.assign(value,{slide,path:s.path,sha256:s.sha256??null});}
  return value;
 }
 function sameSource(saved,current){
  if(!saved)return false;
  return ['version','path','example_id','start','end','slide'].every(k=>(saved[k]??null)===(current[k]??null))&&
   (!saved.sha256||saved.sha256===current.sha256)&&
   (!!saved.path||saved.url===current.url);
 }
 function exampleMember(c,t,x,entries){
  const e=entries.find(e=>e.id===x.style_id);if(!e)return false;
  return c?.members.some(m=>m.kind==='example'&&m.technique_id===t.id&&m.example_id===x.id&&sameSource(m.source,snapshot(e,x)))||false;
 }
 function referenceMembers(c,e,techniques,entries){
  return (c?.members||[]).filter(m=>{
   if(m.kind==='example'){
    const t=techniques.find(t=>t.id===m.technique_id),x=t?.examples.find(x=>x.id===m.example_id);
    return x?.style_id===e.id&&exampleMember({members:[m]},t,x,entries);
   }
   if(m.reference_id!==e.id&&m.reference_id!==e.archived_from)return false;
   const s=m.kind==='slide'?m.slide:null;
   return (!s||s<=e.slides?.length)&&sameSource(m.source,snapshot(e,null,s));
  });
 }
 function referenceMember(c,e,techniques,entries){return referenceMembers(c,e,techniques,entries).length>0;}
 function focus(c,e,techniques,entries){
  const members=referenceMembers(c,e,techniques,entries);
  if(members.some(m=>m.kind==='reference'))return null;
  return members[0]||null;
 }
 return {snapshot,sameSource,exampleMember,referenceMembers,referenceMember,focus};
})();
if(typeof module!=='undefined')module.exports=CollectionModel;
