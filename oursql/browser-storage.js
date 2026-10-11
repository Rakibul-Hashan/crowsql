// Preferences and editor drafts must not prevent the database UI from opening.
const memory=new Map();let issue='';
export const safeStorage={
  getItem(key){try{return globalThis.localStorage.getItem(key)??memory.get(key)??null}catch{issue='Browser settings storage is unavailable; export your work before closing.';return memory.get(key)??null}},
  setItem(key,value){memory.set(key,String(value));try{globalThis.localStorage.setItem(key,String(value))}catch{issue='Could not save preferences or query drafts; export your work before closing.'}},
};
export function readStoredJSON(key,fallback){
  const text=safeStorage.getItem(key);if(!text)return fallback;
  try{const value=JSON.parse(text);if(Array.isArray(fallback)?!Array.isArray(value):value===null||typeof value!=='object'||Array.isArray(value))throw Error('Invalid settings shape');return value}
  catch{issue='Invalid saved settings were reset. Your database tables were not changed.';safeStorage.setItem(key,JSON.stringify(fallback));return fallback}
}
export function getStorageIssue(){return issue}
