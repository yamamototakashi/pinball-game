const KEY = 'neon-pinball-best';
export function loadBest(){
  try { return parseInt(localStorage.getItem(KEY) || '0', 10) || 0; }
  catch(_){ return 0; }
}
export function saveBest(v){
  try { localStorage.setItem(KEY, String(v|0)); } catch(_){}
}
