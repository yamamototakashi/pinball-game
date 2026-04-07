// フリッパー: 線分として扱い、回転速度をボールに伝える
export class Flipper {
  constructor(pivot, length, side){
    this.pivot = pivot;          // {x,y}
    this.length = length;
    this.side = side;            // 'L' or 'R'
    this.restAngle = side==='L' ? 0.45 : Math.PI - 0.45;
    this.maxAngle  = side==='L' ? -0.55 : Math.PI + 0.55;
    this.angle = this.restAngle;
    this.angVel = 0;
    this.active = false;
    this.glow = 0;
  }
  update(dt, pressed){
    const target = pressed ? this.maxAngle : this.restAngle;
    const speed = 26;
    const prev = this.angle;
    this.angle += (target - this.angle) * Math.min(1, dt*speed);
    this.angVel = (this.angle - prev)/dt;
    if (pressed && !this.active) this.glow = 1;
    this.active = pressed;
    this.glow = Math.max(0, this.glow - dt*3);
  }
  endpoint(){
    return {
      x: this.pivot.x + Math.cos(this.angle)*this.length,
      y: this.pivot.y + Math.sin(this.angle)*this.length
    };
  }
}
