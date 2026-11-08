/* Browser-only browsing preferences. Earlier keys remain intact for source rollback. */
const LibraryFilterModel=(()=>{
 function values(value){return [...new Set((Array.isArray(value)?value:[value]).filter(v=>typeof v==='string'&&v&&v!=='all'&&v.length<=300))].slice(0,500);}
 const defaults=()=>({source:'all',creator:[],category:[],techniques:[],saved:[],availability:'all',search:'',sort:'newest'});
 function restore(value){
  try{if(typeof value==='string')value=JSON.parse(value);}catch{return defaults();}
  const out=defaults();if(!value||typeof value!=='object')return out;
  for(const key of ['creator','category','techniques','saved'])out[key]=values(value[key]);
  if(['all','mine','reference'].includes(value.source))out.source=value.source;
  if(['all','pending','preview'].includes(value.availability))out.availability=value.availability;
  if(['newest','oldest','name'].includes(value.sort))out.sort=value.sort;
  if(typeof value.search==='string')out.search=value.search.slice(0,4000);
  return out;
 }
 const matches=(chosen,value)=>!values(chosen).length||values(chosen).includes(value);
 return {values,defaults,restore,matches};
})();
if(typeof module!=='undefined')module.exports=LibraryFilterModel;
