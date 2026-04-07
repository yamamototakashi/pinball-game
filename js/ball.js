export class Ball {
  constructor(x, y, r=7){
    this.x=x; this.y=y; this.r=r;
    this.vx=0; this.vy=0;
    this.alive=true;
    this.launched=false;
    this.trail=[];
  }
  reset(x,y){
    this.x=x; this.y=y; this.vx=0; this.vy=0;
    this.alive=true; this.launched=false; this.trail.length=0;
  }
}
