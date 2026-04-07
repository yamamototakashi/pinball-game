import { Ball } from './ball.js';
import { createTable, W, H } from './table.js';
import { Flipper } from './flippers.js';
import { collideCircleSegment, collideCircleCircle, collideCircleRect, collideFlipper } from './physics.js';
import { input, attachInput, consumeLaunchEdge } from './input.js';
import { spawnParticles, spawnPop, flash, updateEffects, drawEffects, drawFlash, clearEffects } from './effects.js';
import { initAudio, resumeAudio, setMuted, isMuted, sfx } from './audio.js';
import { loadBest, saveBest } from './storage.js';
import { drawHUD, hudButtons, pointInBtn } from './hud.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha:false });

// === 状態 ===
const state = {
  phase: 'TITLE',         // TITLE / READY / PLAY / DRAIN / GAMEOVER
  score: 0,
  best: loadBest(),
  balls: 3,
  combo: 0,
  comboTimer: 0,
  mult: 1,
  fever: 0,
  feverTotal: 0,
  muted: false,
  shake: 0,
};

const table = createTable();
const ball = new Ball(335, 560, 7);

const flipL = new Flipper({x:120, y:600}, 50, 'L');
const flipR = new Flipper({x:240, y:600}, 50, 'R');

// === レイアウトスケール ===
let scale = 1, offX = 0, offY = 0;
let cssRect = {left:0, top:0, width:1, height:1};
function resize(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vw = window.innerWidth, vh = window.innerHeight;
  // CSS表示サイズ: アスペクト維持
  const aspect = W/H;
  let cw, ch;
  if (vw/vh > aspect){ ch = vh; cw = vh*aspect; }
  else { cw = vw; ch = vw/aspect; }
  canvas.style.width = cw+'px';
  canvas.style.height = ch+'px';
  canvas.width  = Math.floor(cw*dpr);
  canvas.height = Math.floor(ch*dpr);
  scale = canvas.width / W;
  offX = 0; offY = 0;
  const r = canvas.getBoundingClientRect();
  cssRect = {left:r.left, top:r.top, width:r.width, height:r.height};
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 100));
resize();

attachInput(canvas, () => cssRect);

// === 入力: HUDボタン ===
canvas.addEventListener('touchstart', e => {
  const t = e.changedTouches[0];
  handleTap(t.clientX, t.clientY);
}, {passive:false});
canvas.addEventListener('mousedown', e => handleTap(e.clientX, e.clientY));

function handleTap(cx, cy){
  // CSS座標 → 論理座標
  const r = cssRect;
  const lx = (cx - r.left) / r.width * W;
  const ly = (cy - r.top) / r.height * H;
  if (pointInBtn(hudButtons.sound, lx, ly)){
    state.muted = !state.muted; setMuted(state.muted);
  } else if (pointInBtn(hudButtons.restart, lx, ly)){
    if (state.phase === 'PLAY' || state.phase === 'READY' || state.phase === 'DRAIN'){
      gameOver();
    }
  }
}

// === オーバーレイ ===
const titleEl = document.getElementById('title');
const goEl = document.getElementById('gameover');
const goScore = document.getElementById('go-score-val');
const goBest = document.getElementById('go-best-val');
const goNew = document.getElementById('go-newbest');

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);

// PWA hint一回だけ
const hintEl = document.getElementById('install-hint');
document.getElementById('hint-close').addEventListener('click', ()=>hintEl.classList.add('hidden'));
function maybeShowHint(){
  const isiOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.navigator.standalone;
  if (isiOS && !standalone && !localStorage.getItem('pwa-hint-shown')){
    setTimeout(()=>{
      hintEl.classList.remove('hidden');
      localStorage.setItem('pwa-hint-shown','1');
      setTimeout(()=>hintEl.classList.add('hidden'), 6000);
    }, 1500);
  }
}
maybeShowHint();

function startGame(){
  initAudio(); resumeAudio();
  state.phase = 'READY';
  state.score = 0;
  state.balls = 3;
  state.combo = 0;
  state.mult = 1;
  state.fever = 0;
  resetTable();
  resetBallToPlunger();
  titleEl.classList.add('hidden');
  goEl.classList.add('hidden');
  clearEffects();
}

function resetTable(){
  for (const t of table.targets) t.hit = false;
  for (const l of table.lanes) l.lit = false;
  table.multTargetCleared = 0;
}
function resetBallToPlunger(){
  ball.reset(331, 580);
  ball.launched = false;
}

function gameOver(){
  state.phase = 'GAMEOVER';
  sfx.gameover();
  const isNew = state.score > state.best;
  if (isNew){ state.best = state.score; saveBest(state.best); sfx.newbest(); }
  goScore.textContent = state.score;
  goBest.textContent = state.best;
  goNew.classList.toggle('hidden', !isNew);
  goEl.classList.remove('hidden');
}

// === スコア加算 ===
function addScore(base, x, y, label, color){
  state.combo++;
  state.comboTimer = 2.0;
  const gain = Math.round(base * state.mult * (state.fever>0 ? 3 : 1));
  state.score += gain;
  spawnPop(x, y-12, '+'+gain, color || '#fff');
  if (state.combo > 1) sfx.combo(state.combo);
}

function startFever(){
  state.fever = 8;
  state.feverTotal = 8;
  flash('#ff3df0', 0.7);
  spawnPop(180, 320, '★ FEVER ★', '#ff3df0');
  sfx.fever();
}

// === 物理更新 ===
const GRAVITY = 520;
const MAX_V = 800;

function physicsStep(dt){
  if (!ball.alive) return;

  // フリッパー
  flipL.update(dt, input.left);
  flipR.update(dt, input.right);
  if (input.left  && !flipL._wasActive) sfx.flip();
  if (input.right && !flipR._wasActive) sfx.flip();
  flipL._wasActive = input.left;
  flipR._wasActive = input.right;

  if (!ball.launched){
    // プランジャー待機
    if (consumeLaunchEdge() && state.phase === 'READY'){
      const power = 780;
      ball.vy = -power;
      ball.vx = -40;
      ball.launched = true;
      state.phase = 'PLAY';
      sfx.launch();
      flash('#27e6ff', 0.4);
    }
    return;
  }

  // 重力
  ball.vy += GRAVITY*dt;
  // 速度上限
  const sp = Math.hypot(ball.vx, ball.vy);
  if (sp > MAX_V){ ball.vx*=MAX_V/sp; ball.vy*=MAX_V/sp; }

  ball.x += ball.vx*dt;
  ball.y += ball.vy*dt;

  // 壁
  for (const w of table.walls){
    collideCircleSegment(ball, w.x1, w.y1, w.x2, w.y2, w.bounce);
  }

  // バンパー
  for (const b of table.bumpers){
    if (collideCircleCircle(ball, b.x, b.y, b.r, 1.0)){
      b.pulse = 1;
      addScore(b.score, b.x, b.y, '+', b.color);
      spawnParticles(b.x, b.y, b.color, 14, 220);
      flash(b.color, 0.25);
      sfx.bumper();
      state.shake = 4;
    }
  }

  // スリングショット
  for (const s of table.slings){
    const hit = collideCircleSegment(ball, s.x1, s.y1, s.x2, s.y2, s.bounce);
    if (hit){
      s.glow = 1;
      addScore(50, (s.x1+s.x2)/2, (s.y1+s.y2)/2, '', s.color);
      spawnParticles((s.x1+s.x2)/2, (s.y1+s.y2)/2, s.color, 8, 180);
      sfx.slingshot();
    }
  }

  // ターゲット
  let allHit = true;
  for (const t of table.targets){
    if (!t.hit){
      if (collideCircleRect(ball, t.x, t.y, t.w, t.h, 0.8)){
        t.hit = true;
        addScore(t.score, t.x+t.w/2, t.y, '', t.color);
        spawnParticles(t.x+t.w/2, t.y+t.h/2, t.color, 10, 160);
        sfx.target();
      }
    }
    if (!t.hit) allHit = false;
  }
  if (allHit && table.targets.length>0){
    // 全消し: 倍率アップ
    table.multTargetCleared++;
    state.mult = Math.min(8, state.mult + 1);
    spawnPop(180, 360, 'MULTIPLIER x'+state.mult, '#ffe23a');
    flash('#ffe23a', 0.5);
    for (const t of table.targets) t.hit = false; // リセット
  }

  // レーン(上を通過したら点灯)
  for (const l of table.lanes){
    if (!l.lit && ball.x>l.x && ball.x<l.x+l.w && ball.y>l.y-4 && ball.y<l.y+l.h+4){
      l.lit = true;
      addScore(150, l.x+l.w/2, l.y, '', l.color);
      spawnParticles(l.x+l.w/2, l.y, l.color, 8, 120);
      sfx.target();
    }
  }
  if (table.lanes.every(l=>l.lit)){
    for (const l of table.lanes) l.lit = false;
    startFever();
  }

  // モードホール(中心の小さな穴に近接でボーナス)
  const mh = table.modeHole;
  const dmh = Math.hypot(ball.x-mh.x, ball.y-mh.y);
  if (dmh < mh.r + ball.r){
    mh.glow = 1;
    addScore(500, mh.x, mh.y, '', '#5cff9e');
    spawnParticles(mh.x, mh.y, '#5cff9e', 20, 240);
    flash('#5cff9e', 0.4);
    // 軽くキック
    const ang = Math.atan2(ball.y-mh.y, ball.x-mh.x) || -Math.PI/2;
    ball.vx = Math.cos(ang)*420;
    ball.vy = Math.sin(ang)*420 - 200;
  }

  // フリッパー
  collideFlipper(ball, flipL);
  collideFlipper(ball, flipR);

  // ドレイン判定
  if (ball.y > H + 20){
    ball.alive = false;
    drainBall();
  }
}

function drainBall(){
  state.balls--;
  state.combo = 0;
  state.mult = 1;
  state.fever = 0;
  sfx.drain();
  if (state.balls <= 0){
    setTimeout(gameOver, 600);
  } else {
    setTimeout(()=>{
      state.phase = 'READY';
      resetBallToPlunger();
    }, 700);
  }
}

// === 描画 ===
function draw(){
  const w = canvas.width, h = canvas.height;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0,0,w,h);

  // 論理→物理スケール
  ctx.setTransform(scale,0,0,scale,0,0);

  // 背景脈動
  table.t += 0.016;
  drawBackground(ctx);

  // モードホール
  drawModeHole(ctx, table.modeHole);

  // 壁
  ctx.strokeStyle='#27e6ff';
  ctx.lineWidth=2;
  ctx.shadowColor='#27e6ff';
  ctx.shadowBlur=6;
  for (const w of table.walls){
    ctx.beginPath();
    ctx.moveTo(w.x1,w.y1);
    ctx.lineTo(w.x2,w.y2);
    ctx.stroke();
  }
  ctx.shadowBlur=0;

  // レーン
  for (const l of table.lanes){
    ctx.fillStyle = l.lit ? l.color : 'rgba(255,226,58,0.15)';
    ctx.shadowColor = l.color;
    ctx.shadowBlur = l.lit ? 10 : 2;
    ctx.fillRect(l.x, l.y, l.w, l.h);
  }
  ctx.shadowBlur=0;

  // ターゲット
  for (const t of table.targets){
    if (t.hit){
      ctx.fillStyle='rgba(39,230,255,0.1)';
      ctx.fillRect(t.x, t.y, t.w, t.h);
    } else {
      ctx.fillStyle = t.color;
      ctx.shadowColor=t.color; ctx.shadowBlur=8;
      ctx.fillRect(t.x, t.y, t.w, t.h);
      ctx.shadowBlur=0;
    }
  }

  // バンパー
  for (const b of table.bumpers){
    const pulse = 0.6 + 0.4*Math.sin(table.t*4 + b.x*0.1) + b.pulse;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fillStyle = '#0a0f1f';
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 12*pulse;
    ctx.lineWidth = 2 + pulse*1.5;
    ctx.stroke();
    // 内側ドット
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r*0.45, 0, Math.PI*2);
    ctx.fillStyle = b.color;
    ctx.globalAlpha = 0.6 + 0.4*pulse;
    ctx.fill();
    ctx.globalAlpha=1;
    b.pulse = Math.max(0, b.pulse - 0.05);
  }
  ctx.shadowBlur=0;

  // スリング
  for (const s of table.slings){
    ctx.strokeStyle = s.color;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 8 + s.glow*16;
    ctx.lineWidth = 3 + s.glow*2;
    ctx.beginPath();
    ctx.moveTo(s.x1,s.y1);
    ctx.lineTo(s.x2,s.y2);
    ctx.stroke();
    s.glow = Math.max(0, s.glow-0.05);
  }
  ctx.shadowBlur=0;

  // フリッパー
  drawFlipper(ctx, flipL);
  drawFlipper(ctx, flipR);

  // ボール
  if (ball.alive && ball.launched){
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    const grd = ctx.createRadialGradient(ball.x-2, ball.y-2, 1, ball.x, ball.y, ball.r);
    grd.addColorStop(0,'#fff');
    grd.addColorStop(1,'#27e6ff');
    ctx.fillStyle = grd;
    ctx.shadowColor = '#27e6ff';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur=0;
  } else if (ball.alive){
    // プランジャー位置に表示
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor='#fff'; ctx.shadowBlur=8;
    ctx.fill(); ctx.shadowBlur=0;
  }

  // パーティクル
  drawEffects(ctx);

  // フィーバーオーバーレイ
  if (state.fever > 0){
    ctx.fillStyle = 'rgba(255,61,240,0.06)';
    ctx.fillRect(0,0,W,H);
  }

  // フラッシュ
  drawFlash(ctx, W, H);

  // HUD
  drawHUD(ctx, state);

  // READYヒント
  if (state.phase==='READY'){
    ctx.save();
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.shadowColor='#27e6ff'; ctx.shadowBlur=8;
    ctx.font='bold 12px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('TAP TO LAUNCH', 180, 500);
    ctx.restore();
  }
}

function drawBackground(ctx){
  // グリッド
  ctx.save();
  ctx.strokeStyle='rgba(39,230,255,0.06)';
  ctx.lineWidth=1;
  for (let i=0;i<W;i+=20){
    ctx.beginPath(); ctx.moveTo(i,40); ctx.lineTo(i,H); ctx.stroke();
  }
  for (let j=40;j<H;j+=20){
    ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(W,j); ctx.stroke();
  }
  // 中央発光
  const g = ctx.createRadialGradient(180, 280, 10, 180, 280, 240);
  const a = 0.08 + 0.04*Math.sin(table.t*2);
  g.addColorStop(0, `rgba(255,61,240,${a})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0,40,W,H-40);
  ctx.restore();
}

function drawModeHole(ctx, mh){
  ctx.save();
  const pulse = 0.7+0.3*Math.sin(table.t*5);
  ctx.beginPath();
  ctx.arc(mh.x, mh.y, mh.r, 0, Math.PI*2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.strokeStyle='#5cff9e';
  ctx.shadowColor='#5cff9e';
  ctx.shadowBlur = 14*pulse + mh.glow*16;
  ctx.lineWidth = 2;
  ctx.stroke();
  mh.glow = Math.max(0, mh.glow - 0.04);
  ctx.restore();
}

function drawFlipper(ctx, f){
  const e = f.endpoint();
  ctx.save();
  ctx.strokeStyle = f.active ? '#fff' : '#27e6ff';
  ctx.shadowColor = '#27e6ff';
  ctx.shadowBlur = 10 + f.glow*16;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(f.pivot.x, f.pivot.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();
  ctx.restore();
}

// === メインループ ===
let last = performance.now();
let acc = 0;
const STEP = 1/240;

function loop(now){
  const dt = Math.min(0.05, (now-last)/1000);
  last = now;
  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 16){
    if (state.phase==='PLAY' || state.phase==='READY') physicsStep(STEP);
    acc -= STEP;
    steps++;
  }
  // タイマー類
  if (state.comboTimer > 0){
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
  if (state.fever > 0){
    state.fever -= dt;
    if (state.fever <= 0){ state.fever = 0; flash('#27e6ff', 0.3); }
  }
  updateEffects(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
