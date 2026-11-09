const {test}=require('node:test'),assert=require('node:assert/strict'),{readFileSync}=require('node:fs'),{join}=require('node:path'),{runInNewContext}=require('node:vm');
function picker(){
 const handlers={},windowHandlers={},changes=[];let document;
 class Node{
  constructor(tag='div'){this.tag=tag;this.children=[];this.attributes={};this.style={};this.value='';this.hidden=false;this.listeners={};this.classList={toggle(){}};}
  append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  contains(node){return node===this||this.children.some(c=>c.contains(node));}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,v){this.listeners[k]=v;}
  querySelectorAll(selector){return this.children.flatMap(c=>[...(c.tag===selector?[c]:[]),...c.querySelectorAll(selector)]);}
  getBoundingClientRect(){return {left:20,right:320,top:100,bottom:144,width:300};}
  focus(){document.activeElement=this;handlers.focusin?.({target:this});}
 }
 const host=new Node(),body=new Node();body.append(host);
 document={body,documentElement:{clientWidth:390},activeElement:null,getElementById:id=>id==='facet'?host:null,createElement:tag=>new Node(tag),addEventListener:(k,v)=>handlers[k]=v};
 const window={innerHeight:844,addEventListener:(k,v)=>windowHandlers[k]=v};
 runInNewContext(readFileSync(join(__dirname,'dist/library-filter-ui.js'),'utf8'),{document,window,Node});
 const api=window.LibraryFilterUI;
 const config={label:'Creators',empty:'All creators',placeholder:'Search creators',values:[],items:[{id:'a',label:'Alex'},{id:'b',label:'Blair'},{id:'c',label:'Casey'}],change(values){changes.push([...values]);config.values=values;api.sync({facet:{...config}});}};
 api.sync({facet:config});const trigger=host.children[0],menu=body.children[1],search=menu.children[1],list=menu.children[2],footer=menu.children[3];
 const inputs=()=>list.querySelectorAll('input');
 return {api,config,trigger,menu,search,list,footer,inputs,changes,handlers,windowHandlers,document,Node,open:()=>trigger.onclick(),choose:(i,checked=true)=>{const input=inputs()[i];input.checked=checked;input.onchange();}};
}
test('checkbox choices apply immediately, retain focus and leave the menu open for additional choices',()=>{
 const h=picker();h.open();const first=h.inputs()[0];first.focus();h.choose(0);h.choose(1);
 assert.equal(h.menu.hidden,false);assert.deepEqual(h.changes,[['a'],['a','b']]);assert.equal(h.trigger.children[0].textContent,'Alex +1');assert.equal(h.document.activeElement,first);assert.equal(h.inputs()[0],first);
 h.choose(0,false);assert.equal(h.trigger.children[0].textContent,'Blair');assert.equal(h.trigger.attributes['aria-expanded'],'true');
});
test('search narrows choices without clearing checked values and reports an empty match',()=>{
 const h=picker();h.open();h.choose(0);h.search.value='bl';h.search.oninput();assert.equal(h.inputs().length,1);assert.equal(h.inputs()[0].value,'b');
 h.choose(0);assert.deepEqual(h.changes.at(-1),['a','b']);h.search.value='absent';h.search.oninput();assert.equal(h.inputs().length,0);assert.match(h.list.children[0].textContent,/No matches/);
 h.search.value='';h.search.oninput();assert.equal(h.inputs()[0].checked,true);assert.equal(h.inputs()[1].checked,true);
});
test('Escape and Done dismiss to the trigger; outside focus dismisses without stealing focus',()=>{
 const h=picker();h.open();h.menu.listeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(h.menu.hidden,true);assert.equal(h.document.activeElement,h.trigger);
 h.open();h.footer.children[1].onclick();assert.equal(h.menu.hidden,true);assert.equal(h.document.activeElement,h.trigger);
 h.open();const outside=new h.Node();outside.focus();assert.equal(h.menu.hidden,true);assert.equal(h.document.activeElement,outside);
});
test('keyboard navigation, facet clear and viewport positioning remain usable',()=>{
 const h=picker();h.open();h.menu.listeners.keydown({key:'ArrowDown',target:h.search,preventDefault(){}});assert.equal(h.document.activeElement,h.inputs()[0]);
 h.menu.listeners.keydown({key:'End',target:h.inputs()[0],preventDefault(){}});assert.equal(h.document.activeElement,h.inputs()[2]);
 h.choose(0);h.footer.children[0].onclick();assert.deepEqual(h.changes.at(-1),[]);assert.equal(h.menu.hidden,false);assert.equal(h.document.activeElement,h.search);assert.equal(h.trigger.children[0].textContent,'All creators');
 h.windowHandlers.scroll({target:{}});assert.equal(h.menu.style.width,'300px');assert.equal(h.menu.style.left,'20px');
 h.handlers.pointerdown({target:new h.Node()});assert.equal(h.menu.hidden,true);
});
