import {keywordFlags, reservedWords} from './keywords.js';
export {reservedWords};

// Preserve quoted identifiers, literals and comments during formatting and completion.
export function tokenizeSQL(sql) {
  const tokens=[]; let i=0;
  const add=(kind,start,end,closed=true)=>tokens.push({kind,start,end,text:sql.slice(start,end),closed});
  while(i<sql.length){
    const start=i,c=sql[i];
    if(/\s/.test(c)){while(i<sql.length&&/\s/.test(sql[i]))i++;add('space',start,i);continue}
    if(c==='#'||(c==='-'&&sql[i+1]==='-'&&/\s/.test(sql[i+2]||' '))){while(i<sql.length&&sql[i]!=='\n')i++;add('comment',start,i);continue}
    if(c==='/'&&sql[i+1]==='*'){i+=2;while(i<sql.length&&!(sql[i]==='*'&&sql[i+1]==='/'))i++;const closed=i<sql.length;if(closed)i+=2;add('comment',start,i,closed);continue}
    if(c==="'"||c==='"'||c==='`'){i++;let closed=false;while(i<sql.length){if(sql[i]==='\\'){i+=Math.min(2,sql.length-i);continue}if(sql[i]===c){if(sql[i+1]===c){i+=2;continue}i++;closed=true;break}i++}add(c==='`'?'identifier':'string',start,i,closed);continue}
    if(/[\p{L}_$]/u.test(c)){i++;while(i<sql.length&&/[\p{L}\p{N}_$]/u.test(sql[i]))i++;add('word',start,i);continue}
    if(/[0-9]/.test(c)){i++;while(i<sql.length&&/[\w.]/.test(sql[i]))i++;add('number',start,i);continue}
    i++;if(/[<>=!|&]/.test(c)&&/[<>=|&]/.test(sql[i]||''))i++;add('symbol',start,i);
  }return tokens;
}
export function lexicalDiagnostics(sql){
  const out=[],stack=[];
  for(const t of tokenizeSQL(sql)){
    if(!t.closed)out.push({start:t.start,end:t.end,message:t.kind==='comment'?'Unclosed block comment.':'Unclosed quote.',severity:'error'});
    if(t.kind!=='symbol')continue;
    if(t.text==='(')stack.push(t);
    else if(t.text===')'){if(stack.length)stack.pop();else out.push({start:t.start,end:t.end,message:'Unexpected closing parenthesis.',severity:'error'})}
  }
  for(const t of stack)out.push({start:t.start,end:t.end,message:'Unclosed parenthesis.',severity:'error'});
  return out;
}
export function matchingBracket(sql,index){
  const tokens=tokenizeSQL(sql).filter(t=>t.kind==='symbol'&&['(',')'].includes(t.text));
  let n=tokens.findIndex(t=>t.start===index);if(n<0)return null;
  const dir=tokens[n].text==='('?1:-1;let depth=0;
  for(let i=n;i>=0&&i<tokens.length;i+=dir){depth+=tokens[i].text===tokens[n].text?1:-1;if(depth===0)return {from:tokens[n].start,to:tokens[i].start}}
  return {from:tokens[n].start,to:null};
}
export function formatSQL(sql){
  const tokens=tokenizeSQL(sql).filter(t=>t.kind!=='space');let out='',depth=0;
  const breaks=new Set(['SELECT','FROM','WHERE','HAVING','LIMIT','VALUES','SET','UNION','JOIN','LEFT','RIGHT','INNER','CROSS','ON','ORDER','GROUP']);
  const line=()=>{out=out.trimEnd();if(out&&!out.endsWith('\n'))out+='\n';out+='  '.repeat(depth)};
  for(let i=0;i<tokens.length;i++){
    const t=tokens[i],prev=tokens[i-1],next=tokens[i+1];
    let text=t.text,upper=text.toUpperCase();
    // Names adjacent to dots, or immediately following AS, stay untouched.
    if(t.kind==='word'&&keywordFlags[upper]&&prev?.text!=='.'&&next?.text!=='.'&&prev?.text.toUpperCase()!=='AS')text=upper;
    if(t.kind==='comment'){if(out&&!out.endsWith('\n'))out+=' ';out+=text;line();continue}
    if(text===';'){out=out.trimEnd()+';';line();continue}
    if(text==='('){if(prev?.kind==='word'&&!(keywordFlags[prev.text.toUpperCase()]&32))out+=' ';out+='(';depth++;continue}
    if(text===')'){depth=Math.max(0,depth-1);out=out.trimEnd()+')';continue}
    if(text===','){out=out.trimEnd()+', ';continue}
    if(text==='.'){out=out.trimEnd()+'.';continue}
    if(t.kind==='word'&&breaks.has(upper)&&!(upper==='JOIN'&&['LEFT','RIGHT','INNER','CROSS','OUTER'].includes(prev?.text.toUpperCase()))&&!(upper==='SELECT'&&prev?.text==='('))line();
    else if(out&&!/[\s.(]$/.test(out))out+=' ';
    out+=text;
  }return out.trim();
}
const nameOf=t=>t?.kind==='identifier'?t.text.slice(1,t.closed?-1:undefined).replace(/``/g,'`'):t?.text||'';
const quoteName=n=>'`'+n.replace(/`/g,'``')+'`';
export function completionCandidates(sql,cursor,schema={},defaultTable=''){
  const tokens=tokenizeSQL(sql.slice(0,cursor));const last=tokens.at(-1);
  if(last&&['string','comment'].includes(last.kind)&&last.end===cursor)return {list:[],from:cursor,to:cursor};
  let from=cursor,prefix='',quoted=false;
  if(last&&['word','identifier'].includes(last.kind)&&last.end===cursor){from=last.start;prefix=nameOf(last);quoted=last.kind==='identifier'}
  const before=tokenizeSQL(sql.slice(0,from)).filter(t=>t.kind!=='space'&&t.kind!=='comment');
  const all=tokenizeSQL(sql).filter(t=>t.kind!=='space'&&t.kind!=='comment');
  const aliases=Object.create(null);
  for(let i=0;i<all.length;i++)if(['FROM','JOIN','UPDATE','INTO'].includes(all[i].text.toUpperCase())){
    let j=i+1,name=nameOf(all[j]);if(all[j+1]?.text==='.'){name=nameOf(all[j+2]);j+=2}
    aliases[name.toLowerCase()]=name;
    if(all[j+1]?.text.toUpperCase()==='AS')j++;
    const alias=all[j+1];if(alias&&['identifier','word'].includes(alias.kind)&&!keywordFlags[alias.text.toUpperCase()])aliases[nameOf(alias).toLowerCase()]=name;
  }
  const lookup=n=>Object.keys(schema).find(k=>k.toLowerCase()===n.toLowerCase());
  const qualifier=before.at(-1)?.text==='.'?nameOf(before.at(-2)):'';
  const candidates=[];
  const add=(text,kind,detail='')=>{if(text.toLowerCase().startsWith(prefix.toLowerCase()))candidates.push({text:kind==='keyword'||kind==='function'?text:quoted||reservedWords.has(text.toUpperCase())||!/^[\p{L}_][\p{L}\p{N}_$]*$/u.test(text)?quoteName(text):text,displayText:text,kind,detail})};
  if(qualifier){const name=lookup(aliases[qualifier.toLowerCase()]||qualifier);for(const c of schema[name]||[])add(c.name||c,'column',c.type||'')}
  else if(['FROM','JOIN','UPDATE','INTO','TABLE','DESCRIBE','DESC'].includes(before.at(-1)?.text.toUpperCase()))Object.keys(schema).forEach(t=>add(t,'table'));
  else{
    let selected=new Set(Object.values(aliases).map(lookup).filter(Boolean));if(defaultTable)selected.add(lookup(defaultTable));
    if(!selected.size)selected=new Set(Object.keys(schema));
    for(const t of selected)for(const c of schema[t]||[])add(c.name||c,'column',(c.type||'')+' · '+t);
    Object.keys(schema).forEach(t=>add(t,'table'));
    Object.keys(keywordFlags).filter(k=>!k.includes(' ')).forEach(k=>add(k,keywordFlags[k]&32?'function':'keyword'));
  }
  const seen=new Set();return {from,to:cursor,list:candidates.filter(c=>{const key=c.text.toLowerCase();if(seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>a.kind.localeCompare(b.kind)||a.displayText.localeCompare(b.displayText)).slice(0,150)};
}
