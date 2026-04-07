// 盤面定義: 360x640 論理座標
// segments: 線分の壁
// bumpers: 円形バンパー
// targets: 矩形ターゲット
// slings: スリングショット(三角)→2線分+反発倍率
// laneTriggers: 上部レーン
// modeHole: モード開始
export const W = 360;
export const H = 640;

// 右下/左下のドレイン以外を囲む壁を作る
function buildWalls(){
  const segs = [];
  const wall = (x1,y1,x2,y2,bounce=0.85)=>segs.push({x1,y1,x2,y2,bounce});

  // 外周
  wall(20, 80, 20, 615);     // 左壁
  wall(340,80, 340,615);     // 右壁
  wall(20, 80, 180, 30);     // 左上斜め
  wall(180,30, 340, 80);     // 右上斜め

  // プランジャーレーン分離壁(上は開放、下は閉)
  wall(322, 90, 322, 615);

  // 下部の漏斗(ドレインへの斜め)
  wall(20, 540, 130, 605);   // 左下斜め
  wall(322,540, 230, 605);   // 右下斜め(プランジャー壁の下から)

  // フリッパー外側の小壁
  wall(20, 615, 60, 615);
  wall(300,615, 322,615);

  return segs;
}

export function createTable(){
  return {
    walls: buildWalls(),
    bumpers: [
      { x: 110, y: 200, r: 18, color:'#27e6ff', score:100, pulse:0 },
      { x: 200, y: 160, r: 20, color:'#ff3df0', score:120, pulse:0 },
      { x: 270, y: 220, r: 18, color:'#ffe23a', score:100, pulse:0 },
      { x: 150, y: 280, r: 14, color:'#5cff9e', score:80,  pulse:0 },
      { x: 235, y: 300, r: 14, color:'#5cff9e', score:80,  pulse:0 },
    ],
    // スリングショット(2本の線分扱いの強反発バンパー線)
    slings: [
      { x1: 50,  y1: 470, x2: 95,  y2: 530, bounce:1.4, glow:0, color:'#ff3df0' },
      { x1: 270, y1: 530, x2: 315, y2: 470, bounce:1.4, glow:0, color:'#ff3df0' },
    ],
    targets: [
      { x: 80,  y: 360, w: 26, h: 8, hit:false, color:'#27e6ff', score:200 },
      { x: 115, y: 360, w: 26, h: 8, hit:false, color:'#27e6ff', score:200 },
      { x: 150, y: 360, w: 26, h: 8, hit:false, color:'#27e6ff', score:200 },
      { x: 185, y: 360, w: 26, h: 8, hit:false, color:'#27e6ff', score:200 },
      { x: 220, y: 360, w: 26, h: 8, hit:false, color:'#27e6ff', score:200 },
      { x: 255, y: 360, w: 26, h: 8, hit:false, color:'#27e6ff', score:200 },
    ],
    // レーン: 上部のライト3つ
    lanes: [
      { x: 70,  y: 110, w: 22, h: 6, lit:false, color:'#ffe23a' },
      { x: 165, y: 90,  w: 22, h: 6, lit:false, color:'#ffe23a' },
      { x: 260, y: 110, w: 22, h: 6, lit:false, color:'#ffe23a' },
    ],
    modeHole: { x: 180, y: 420, r: 8, glow:0 },
    // 全タゲ消し倍率
    multTargetCleared: 0,
    // tick用脈動
    t: 0,
  };
}
