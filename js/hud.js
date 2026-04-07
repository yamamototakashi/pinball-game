export const VERSION = 'v0.0.6';

// HUD描画 + 上部ボタン領域(音/リスタート)のヒット判定
export const hudButtons = {
  sound: { x: 320, y: 8, w: 32, h: 24 },
  restart:{ x: 282, y: 8, w: 32, h: 24 },
};

export function drawHUD(ctx, state){
  // 上部黒帯
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0,0,360,40);
  // 下にネオンライン
  ctx.strokeStyle = '#27e6ff';
  ctx.shadowColor = '#27e6ff';
  ctx.shadowBlur = 6;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,40); ctx.lineTo(360,40); ctx.stroke();
  ctx.shadowBlur = 0;

  // テキスト
  ctx.fillStyle = '#e8f6ff';
  ctx.font = 'bold 9px -apple-system,sans-serif';
  ctx.textAlign='left';
  ctx.fillText('SCORE', 8, 14);
  ctx.fillText('BEST',  8, 30);
  ctx.fillText('BALL',  120, 14);
  ctx.fillText('COMBO', 120, 30);
  ctx.fillText('MULT',  200, 14);

  ctx.font = 'bold 14px -apple-system,sans-serif';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#27e6ff'; ctx.shadowBlur = 6;
  ctx.fillText(String(state.score).padStart(6,'0'), 38, 14);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffe23a';
  ctx.shadowColor='#ffe23a'; ctx.shadowBlur=4;
  ctx.fillText(String(state.best).padStart(6,'0'), 38, 30);
  ctx.shadowBlur = 0;

  ctx.fillStyle='#5cff9e';
  ctx.fillText(String(state.balls), 150, 14);
  ctx.fillStyle = state.combo>0 ? '#ff3df0':'#888';
  ctx.fillText('x'+state.combo, 158, 30);
  ctx.fillStyle = state.mult>1 ? '#ffe23a':'#888';
  ctx.shadowColor='#ffe23a'; ctx.shadowBlur = state.mult>1?6:0;
  ctx.fillText('x'+state.mult, 230, 14);
  ctx.shadowBlur = 0;

  // フィーバーゲージ
  if (state.fever > 0){
    ctx.fillStyle='#ff3df0';
    ctx.shadowColor='#ff3df0'; ctx.shadowBlur=8;
    ctx.font='bold 11px sans-serif';
    ctx.fillText('★ FEVER '+state.fever.toFixed(1)+'s', 200, 30);
    ctx.shadowBlur=0;
  }

  // ボタン
  drawBtn(ctx, hudButtons.sound, state.muted ? '🔇' : '🔊');
  drawBtn(ctx, hudButtons.restart, '↻');

  // バージョン表示 (右下)
  ctx.fillStyle = 'rgba(92,255,158,0.7)';
  ctx.font = '9px -apple-system,sans-serif';
  ctx.textAlign = 'right';
  ctx.shadowColor = '#5cff9e';
  ctx.shadowBlur = 4;
  ctx.fillText(VERSION, 356, 636);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawBtn(ctx, b, label){
  ctx.strokeStyle='#27e6ff';
  ctx.shadowColor='#27e6ff'; ctx.shadowBlur=4;
  ctx.lineWidth=1;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.shadowBlur=0;
  ctx.fillStyle='#e8f6ff';
  ctx.font='14px sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(label, b.x+b.w/2, b.y+b.h/2+1);
  ctx.textBaseline='alphabetic';
}

export function pointInBtn(b, x, y){
  return x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h;
}
