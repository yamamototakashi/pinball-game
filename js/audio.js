// 軽量 WebAudio SE。オシレータ + 短エンベロープのみ。
let ctx = null;
let muted = false;
let master = null;

export function initAudio(){
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);
  } catch(_){}
}
export function resumeAudio(){
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(()=>{});
}
export function setMuted(m){ muted = !!m; }
export function isMuted(){ return muted; }

function blip(freq, dur, type='square', vol=0.5, slide=0){
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq+slide), t+dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t+0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t+dur+0.02);
}

export const sfx = {
  bumper(){ blip(680, 0.08, 'square', 0.4, 320); blip(960,0.06,'triangle',0.25,-200); },
  slingshot(){ blip(420, 0.06, 'sawtooth', 0.35, -120); },
  target(){ blip(1200, 0.05, 'square', 0.3, 200); },
  flip(){ blip(220, 0.04, 'square', 0.25, 80); },
  launch(){ blip(180, 0.25, 'sawtooth', 0.4, 600); },
  drain(){ blip(240, 0.4, 'sawtooth', 0.4, -180); },
  combo(n){ blip(500 + n*60, 0.07, 'triangle', 0.3, 200); },
  fever(){ blip(440,0.1,'square',0.4,400); setTimeout(()=>blip(660,0.1,'square',0.4,400),80); setTimeout(()=>blip(880,0.18,'square',0.4,400),160); },
  gameover(){ blip(330,0.2,'sawtooth',0.4,-100); setTimeout(()=>blip(220,0.3,'sawtooth',0.4,-80),180); setTimeout(()=>blip(165,0.5,'sawtooth',0.4,-60),360); },
  newbest(){ for(let i=0;i<5;i++) setTimeout(()=>blip(660+i*120,0.08,'square',0.3,180),i*70); }
};
