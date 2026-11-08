const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {runInNewContext}=require('node:vm');
function fixture(){
 const nodes=new Map(),storage=new Map(),writes=[],clips=[];let boxes=[],candidates=[],fail=false;
 function node(id){if(!nodes.has(id))nodes.set(id,{hidden:false,disabled:false,textContent:'',value:'',open:false,events:{},
  set innerHTML(html){this.html=html;if(id==='#technique-upkeep-list')boxes=[...html.matchAll(/<input type="checkbox" value="([^"]+)" ([^>]*)>/g)].map(m=>({value:m[1],checked:m[2].includes('checked'),disabled:false}));},get innerHTML(){return this.html||'';},
  replaceChildren(){this.innerHTML='';},setAttribute(){},focus(){},select(){},addEventListener(e,f){this.events[e]=f;},
  querySelectorAll(s){return s==='input:checked'?boxes.filter(b=>b.checked):s==='input'?boxes:[];},
  showModal(){this.open=true;},close(){this.open=false;this.events.close?.();}});return nodes.get(id);}
 const context={window:{},document:{createElement:()=>node('#dialog'),body:{append(){}}},$:node,active:null,isTech:e=>!!e.examples,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},pausePreview(){},esc:String,
  navigator:{clipboard:{writeText:async text=>clips.push(text)}},fetch:async(url,init)=>{
   if(!init?.body)return {ok:true,json:async()=>({items:candidates})};writes.push(JSON.parse(init.body));
   return {ok:!fail,json:async()=>fail?{error:'A selected video changed.'}:{text:'Exact sources for this request'}};
  }};
 runInNewContext(readFileSync(join(__dirname,'dist/technique-upkeep-ui.js'),'utf8'),context);
 const video=(id,revision='r1')=>({id:'reference:'+id,reference_id:id,title:id,group:'reference',source:{source_version:'V01'},examples:2,moments:3,revision});
 return {node,storage,writes,clips,video,context,api:context.window.TechniqueCatalog,set videos(v){candidates=v;},set fail(v){fail=v;},get boxes(){return boxes;}};
}
test('catch-up dismissal survives completion of some videos and returns for newly eligible sources',async()=>{
 const h=fixture();h.videos=[h.video('one'),h.video('two')];await h.api.refresh();assert.equal(h.node('#technique-upkeep-notice').hidden,false);
 h.node('#dismiss-technique-upkeep').onclick();assert.equal(h.node('#technique-upkeep-notice').hidden,true);
 h.videos=[h.video('two')];await h.api.refresh();assert.equal(h.node('#technique-upkeep-notice').hidden,true);
 h.videos=[h.video('two'),h.video('new')];await h.api.refresh();assert.equal(h.node('#technique-upkeep-notice').hidden,false);
 h.videos=[];await h.api.refresh();assert.equal(h.node('#technique-upkeep-notice').hidden,true);
});
test('single and bulk review use the same exact selection; copying does not complete or approve',async()=>{
 const h=fixture();h.videos=[h.video('one'),h.video('two')];await h.api.open('two');
 assert.deepEqual(h.boxes.filter(b=>b.checked).map(b=>b.value),['reference:two']);
 await h.node('#copy-technique-request').onclick();assert.equal(h.writes[0].items.length,1);assert.equal(h.writes[0].items[0].id,'reference:two');
 assert.equal(h.clips.length,1);assert.equal(h.node('#technique-upkeep-notice').hidden,false);assert.equal(h.storage.size,0);
 await h.api.open();assert.equal(h.boxes.filter(b=>b.checked).length,2);
});
test('changed-source errors preserve selection and do not copy an obsolete request',async()=>{
 const h=fixture();h.videos=[h.video('one')];await h.api.open();h.fail=true;
 await h.node('#copy-technique-request').onclick();assert.equal(h.clips.length,0);
 assert.equal(h.boxes[0].checked,true);assert.match(h.node('#technique-upkeep-status').textContent,/changed/);
});
