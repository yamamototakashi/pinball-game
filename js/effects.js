// パーティクル/スコアポップ/フラッシュ
const particles = [];
const pops = [];
let flashAlpha = 0;
let flashColor = '#fff';

export function spawnParticles(x, y, color, count=10, speed=140){
  for (let i=0;i<count;i++){
    const a = Math.random()*Math.PI*2;
    const s = speed*(0.4+Math.random()*0.8);
    particles.push({
      x, y,
      vx:Math.cos(a)*s, vy:Math.sin(a)*s,
      life:0.5+Math.random()*0.4, age:0,
      color, size:1.5+Math.random()*2.2
    });
  }
}
export function spawnPop(x, y, text, color='#fff'){
  pops.push({x, y, text, color, age:0, life:0.8});
}
export function flash(color='#ffffff', alpha=0.5){
  flashAlpha = Math.max(flashAlpha, alpha);
  flashColor = color;
}

export function updateEffects(dt){
  for (let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.age += dt;
    if (p.age >= p.life){ particles.splice(i,1); continue; }
    p.vy += 220*dt;
    p.vx *= (1 - 1.2*dt);
    p.vy *= (1 - 0.8*dt);
    p.x += p.vx*dt;
    p.y += p.vy*dt;
  }
  for (let i=pops.length-1;i>=0;i--){
    const p = pops[i];
    p.age += dt;
    p.y -= 30*dt;
    if (p.age >= p.life) pops.splice(i,1);
  }
  flashAlpha = Math.max(0, flashAlpha - dt*2.2);
}

export function drawEffects(ctx){
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles){
    const k = 1 - p.age/p.life;
    ctx.globalAlpha = k;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size*k, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.save();
  for (const p of pops){
    const k = 1 - p.age/p.life;
    ctx.globalAlpha = k;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawFlash(ctx, w, h){
  if (flashAlpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, flashAlpha);
  ctx.fillStyle = flashColor;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillRect(0,0,w,h);
  ctx.restore();
}

export function clearEffects(){
  particles.length = 0;
  pops.length = 0;
  flashAlpha = 0;
}
