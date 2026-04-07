// 軽量2D衝突: 円vs線分, 円vs円, 円vs矩形

export function collideCircleSegment(ball, x1, y1, x2, y2, bounce=0.85){
  const dx = x2-x1, dy = y2-y1;
  const len2 = dx*dx + dy*dy;
  let t = ((ball.x-x1)*dx + (ball.y-y1)*dy)/len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + dx*t, cy = y1 + dy*t;
  const ddx = ball.x-cx, ddy = ball.y-cy;
  const d2 = ddx*ddx+ddy*ddy;
  if (d2 < ball.r*ball.r){
    const d = Math.sqrt(d2) || 0.0001;
    const nx = ddx/d, ny = ddy/d;
    const overlap = ball.r - d;
    ball.x += nx*overlap;
    ball.y += ny*overlap;
    const vn = ball.vx*nx + ball.vy*ny;
    if (vn < 0){
      ball.vx -= (1+bounce)*vn*nx;
      ball.vy -= (1+bounce)*vn*ny;
    }
    return {nx, ny, point:{x:cx, y:cy}};
  }
  return null;
}

export function collideCircleCircle(ball, x, y, r, bounce=1.0){
  const dx = ball.x-x, dy = ball.y-y;
  const d2 = dx*dx+dy*dy;
  const rs = ball.r+r;
  if (d2 < rs*rs){
    const d = Math.sqrt(d2) || 0.0001;
    const nx = dx/d, ny = dy/d;
    const overlap = rs-d;
    ball.x += nx*overlap;
    ball.y += ny*overlap;
    const vn = ball.vx*nx + ball.vy*ny;
    if (vn < 0){
      ball.vx -= (1+bounce)*vn*nx;
      ball.vy -= (1+bounce)*vn*ny;
      // 追加キック
      ball.vx += nx*60;
      ball.vy += ny*60;
    }
    return true;
  }
  return false;
}

export function collideCircleRect(ball, rx, ry, rw, rh, bounce=0.7){
  const cx = Math.max(rx, Math.min(ball.x, rx+rw));
  const cy = Math.max(ry, Math.min(ball.y, ry+rh));
  const dx = ball.x-cx, dy = ball.y-cy;
  const d2 = dx*dx+dy*dy;
  if (d2 < ball.r*ball.r){
    const d = Math.sqrt(d2)||0.0001;
    const nx = dx/d, ny = dy/d;
    ball.x += nx*(ball.r-d);
    ball.y += ny*(ball.r-d);
    const vn = ball.vx*nx+ball.vy*ny;
    if (vn<0){
      ball.vx -= (1+bounce)*vn*nx;
      ball.vy -= (1+bounce)*vn*ny;
    }
    return true;
  }
  return false;
}

// フリッパーの線分に当てるとき、回転速度を加味
export function collideFlipper(ball, flipper){
  const p = flipper.pivot;
  const e = flipper.endpoint();
  const hit = collideCircleSegment(ball, p.x, p.y, e.x, e.y, 0.4);
  if (hit){
    // 端点での接線速度を加える
    const dx = ball.x - p.x, dy = ball.y - p.y;
    const tx = -dy, ty = dx;
    const tlen = Math.sqrt(tx*tx+ty*ty)||1;
    const speed = flipper.angVel * Math.sqrt(dx*dx+dy*dy);
    ball.vx += (tx/tlen)*speed*0.6;
    ball.vy += (ty/tlen)*speed*0.6;
    // 押した瞬間の追加キック
    if (flipper.active){
      ball.vx += hit.nx * 80;
      ball.vy += hit.ny * 80;
    }
    return hit;
  }
  return null;
}
