// タッチ/キー入力。画面下半分の左右でフリッパー。
export const input = {
  left:false, right:false, launch:false,
  // 一時的なエッジトリガー
  _launchEdge:false
};

export function consumeLaunchEdge(){
  const v = input._launchEdge;
  input._launchEdge = false;
  return v;
}

export function attachInput(canvas, getRect){
  const touches = new Map();

  function classify(x, y){
    const r = getRect();
    const lx = (x - r.left) / r.width;
    const ly = (y - r.top) / r.height;
    // 下半分: 左右フリッパー
    if (ly > 0.55){
      return lx < 0.5 ? 'left' : 'right';
    }
    return null;
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches){
      const z = classify(t.clientX, t.clientY);
      if (z){
        touches.set(t.identifier, z);
        if (z==='left') input.left = true;
        if (z==='right') input.right = true;
        input._launchEdge = true;
      }
    }
  }, {passive:false});

  canvas.addEventListener('touchmove', e => { e.preventDefault(); }, {passive:false});

  function end(e){
    e.preventDefault();
    for (const t of e.changedTouches){
      const z = touches.get(t.identifier);
      touches.delete(t.identifier);
      if (z){
        // まだ別の指で押されているか確認
        let stillL=false, stillR=false;
        for (const v of touches.values()){
          if (v==='left') stillL=true;
          if (v==='right') stillR=true;
        }
        input.left = stillL;
        input.right = stillR;
      }
    }
  }
  canvas.addEventListener('touchend', end, {passive:false});
  canvas.addEventListener('touchcancel', end, {passive:false});

  // マウス(デスクトップ確認用)
  canvas.addEventListener('mousedown', e => {
    const z = classify(e.clientX, e.clientY);
    if (z==='left') input.left = true;
    if (z==='right') input.right = true;
    input._launchEdge = true;
  });
  window.addEventListener('mouseup', () => { input.left=false; input.right=false; });

  // キーボード
  window.addEventListener('keydown', e => {
    if (e.key==='ArrowLeft' || e.key==='z' || e.key==='Z') input.left = true;
    if (e.key==='ArrowRight'|| e.key==='/' || e.key==='m' || e.key==='M') input.right = true;
    if (e.key===' ') input._launchEdge = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key==='ArrowLeft' || e.key==='z' || e.key==='Z') input.left = false;
    if (e.key==='ArrowRight'|| e.key==='/' || e.key==='m' || e.key==='M') input.right = false;
  });

  // 誤操作防止
  document.addEventListener('gesturestart', e=>e.preventDefault());
  document.addEventListener('dblclick', e=>e.preventDefault());
}
