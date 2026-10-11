import {safeStorage as localStorage} from '../browser-storage.js';
import {completionCandidates,formatSQL,lexicalDiagnostics,matchingBracket} from './sql-tools.js';
let active=null;
export function disposeSQLEditor(){if(active){active.dispose();active=null}}
export function getSQLEditor(){return active?.cm||null}
export function mountSQLEditor(textarea,{schema={},defaultTable='',validate,onRun}={}){
  disposeSQLEditor();if(!globalThis.CodeMirror||!textarea)return null;
  const CM=globalThis.CodeMirror;let stopped=false,revision=0,lintTimer,hintTimer,marks=[];
  const hint=cm=>{const p=cm.getCursor(),r=completionCandidates(cm.getValue(),cm.indexFromPos(p),schema,defaultTable);return {from:cm.posFromIndex(r.from),to:cm.posFromIndex(r.to),list:r.list.map(c=>({...c,render(el){el.appendChild(document.createTextNode(c.displayText));const label=document.createElement('span');label.className='completion-kind';label.textContent=c.kind+(c.detail?' · '+c.detail:'');el.appendChild(label)}}))}};
  const complete=cm=>cm.showHint({hint,completeSingle:false,completeOnSingleClick:true,extraKeys:{Enter:(cm,h)=>h.pick(),Tab:(cm,h)=>h.pick(),Esc:(cm,h)=>h.close()}});
  function pair(editor,open,close){const p=editor.getCursor(),token=editor.getTokenAt(p);if(/comment|string/.test(token.type||''))return CM.Pass;const selected=editor.getSelection();editor.replaceSelection(open+selected+close,'around');if(!selected){const q=editor.getCursor();editor.setCursor({line:q.line,ch:q.ch-1})}}
  function closePair(editor,char){const p=editor.getCursor();if(editor.getLine(p.line)[p.ch]===char){editor.setCursor({line:p.line,ch:p.ch+1});return}return CM.Pass}
  const cm=CM.fromTextArea(textarea,{mode:'text/x-mysql',lineNumbers:true,lineWrapping:true,indentUnit:4,tabSize:4,gutters:['CodeMirror-linenumbers','CodeMirror-lint-markers'],extraKeys:{'Ctrl-Space':complete,'Ctrl-Enter':()=>{cm.save();onRun?.()},'Cmd-Enter':()=>{cm.save();onRun?.()},"'('":cm=>pair(cm,'(',')'),"')'":cm=>closePair(cm,')'),"'\"'":cm=>closePair(cm,'"')===CM.Pass?pair(cm,'"','"'):undefined,"'`'":cm=>closePair(cm,'`')===CM.Pass?pair(cm,'`','`'):undefined,"'\''":cm=>closePair(cm,"'","'")===CM.Pass?pair(cm,"'","'"):undefined,Tab:cm=>{if(cm.somethingSelected())cm.indentSelection('add');else cm.replaceSelection('    ')}}});
  cm.getWrapperElement().setAttribute('aria-label','SQL query editor');cm.setSize('100%','100%');
  const diagnostics=document.createElement('div');diagnostics.className='sql-diagnostics';diagnostics.setAttribute('aria-live','polite');textarea.closest('.sql-box').after(diagnostics);
  function annotate(items){if(stopped)return;const annotations=items.map(d=>({message:d.message,severity:d.severity||'error',from:cm.posFromIndex(d.start||0),to:cm.posFromIndex(Math.max((d.start||0)+1,d.end||0))}));cm.setOption('lint',{getAnnotations:()=>annotations});diagnostics.textContent=items.length?items.map(d=>d.message).join(' '):'';diagnostics.hidden=!items.length}
  async function lint(){const n=++revision,sql=cm.getValue(),local=lexicalDiagnostics(sql);if(local.length){annotate(local);return}try{const remote=validate?await validate(sql):[];if(!stopped&&n===revision&&cm.getValue()===sql)annotate(remote)}catch{if(!stopped&&n===revision)annotate([])}}
  cm.on('change',()=>{revision++;cm.save();localStorage.setItem('autosaved-sql',cm.getValue());clearTimeout(lintTimer);lintTimer=setTimeout(lint,900)});
  cm.on('inputRead',(cm,change)=>{clearTimeout(hintTimer);if(change.origin==='complete'||change.origin==='setValue'||!/[\p{L}\p{N}_.$`]/u.test(change.text.join('')))return;hintTimer=setTimeout(()=>{if(!stopped&&!cm.state.completionActive)complete(cm)},120)});
  cm.on('cursorActivity',()=>{marks.forEach(m=>m.clear());marks=[];const p=cm.getCursor(),index=cm.indexFromPos(p),sql=cm.getValue();const pair=matchingBracket(sql,index-1)||matchingBracket(sql,index);if(pair)for(const i of [pair.from,pair.to])if(i!==null)marks.push(cm.markText(cm.posFromIndex(i),cm.posFromIndex(i+1),{className:pair.to===null?'CodeMirror-nonmatchingbracket':'CodeMirror-matchingbracket'}))});
  // Keep the textarea interface used by templates, restore, clear and execution in sync.
  const descriptor=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');
  Object.defineProperty(textarea,'value',{configurable:true,get:()=>cm.getValue(),set:v=>{const text=String(v??'');if(cm.getValue()!==text)cm.setValue(text)}});
  active={cm,format(){cm.setValue(formatSQL(cm.getValue()));cm.focus()},dispose(){stopped=true;revision++;clearTimeout(lintTimer);clearTimeout(hintTimer);marks.forEach(m=>m.clear());delete textarea.value;descriptor.set.call(textarea,cm.getValue());cm.toTextArea();diagnostics.remove()}};
  lintTimer=setTimeout(lint,400);return active;
}
export function formatSQLEditor(){active?.format()}
