import {
  CELL,
  CENTER,
  FLOOR,
  GROUND,
  PLATFORMS,
  BARRICADE_WIDTH,
  TYPES,
  Game,
  type Shape,
  type Kind,
} from './engine';
import {
  MONSTERS,
  SKILLS,
  isAirborne,
  isChampion,
  isWanderingElite,
  enemyScale,
} from './content';
export type View = {
  scale: number;
  ground: number;
  width: number;
  height: number;
};
export function getView(game: Game, width: number, height: number): View {
  const initial = Math.min(width / 1050, height / 400, 1.35);
  const scale = Math.min(initial, (height - 115) / (game.towerHeight() + 110));
  return { scale, ground: height - 32, width, height };
}
export function toWorld(view: View, x: number, y: number) {
  return {
    x: (x - view.width / 2) / view.scale + CENTER,
    y: (y - view.ground) / view.scale + FLOOR,
  };
}

const person = [
  '...HHH...',
  '..HHHHH..',
  '..HSSSH..',
  '...SSS...',
  '....S....',
  '..BBBBB..',
  '.ABBBBA..',
  '.ABBBBA..',
  '...BBB...',
  '...LLL...',
  '...L.L...',
  '..LL.LL..',
];
function soldier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: Kind,
  flip = false,
) {
  const palette: Record<string, string> = {
    H:
      kind === 'archer'
        ? '#86b9a7'
        : kind === 'frost'
          ? '#bde5f7'
          : kind === 'cannon'
            ? '#ecafa6'
            : '#eace77',
    S: '#f0cc9e',
    B:
      kind === 'frost'
        ? '#76a8d6'
        : kind === 'cannon'
          ? '#6f3343'
          : kind === 'mint'
            ? '#cc9d36'
            : '#476f7b',
    A: '#cba477',
    L: '#393e48',
  };
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  const p = 1.35;
  person.forEach((row, j) =>
    row.split('').forEach((v, i) => {
      if (v !== '.') {
        ctx.fillStyle = palette[v];
        ctx.fillRect((i - 4) * p, (j - 9) * p, p + 0.2, p + 0.2);
      }
    }),
  );
  if (kind === 'archer') {
    ctx.strokeStyle = '#e8c582';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(5, -7);
    ctx.quadraticCurveTo(12, 0, 5, 7);
    ctx.lineTo(5, -7);
    ctx.stroke();
  }
  if (kind === 'frost') {
    ctx.fillStyle = '#dee7d9';
    ctx.fillRect(7, -7, 1.4, 15);
    ctx.fillStyle = '#a2f1ff';
    ctx.fillRect(5.5, -9, 4, 4);
  }
  ctx.restore();
}
export function piece(
  ctx: CanvasRenderingContext2D,
  cells: Shape,
  kind: Kind,
  cx: number,
  cy: number,
  level = 1,
  glued = false,
  _time = 0,
) {
  const type = TYPES[kind];
  const occupied = new Set(cells.map(([x, y]) => `${x},${y}`));
  for (const [x, y] of cells) {
    const px = (x - cx) * CELL - CELL / 2,
      py = (y - cy) * CELL - CELL / 2;
    ctx.fillStyle = '#17262d';
    ctx.fillRect(px - 1, py - 1, CELL + 2, CELL + 2);
  }
  for (const [x, y] of cells) {
    const px = (x - cx) * CELL - CELL / 2,
      py = (y - cy) * CELL - CELL / 2;
    ctx.fillStyle = type.color;
    ctx.fillRect(px, py, CELL, CELL);
    ctx.fillStyle = 'rgba(255,232,190,.09)';
    ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
    ctx.fillStyle = 'rgba(0,0,0,.11)';
    ctx.fillRect(px + 6, py + 15, 3, 2);
    ctx.fillRect(px + 18, py + 7, 3, 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = type.light;
    ctx.beginPath();
    if (!occupied.has(`${x},${y - 1}`)) {
      ctx.moveTo(px + 1, py + 1);
      ctx.lineTo(px + CELL - 1, py + 1);
    }
    if (!occupied.has(`${x - 1},${y}`)) {
      ctx.moveTo(px + 1, py + 1);
      ctx.lineTo(px + 1, py + CELL - 1);
    }
    if (!occupied.has(`${x + 1},${y}`)) {
      ctx.moveTo(px + CELL - 1, py + 1);
      ctx.lineTo(px + CELL - 1, py + CELL - 1);
    }
    if (!occupied.has(`${x},${y + 1}`)) {
      ctx.moveTo(px + 1, py + CELL - 1);
      ctx.lineTo(px + CELL - 1, py + CELL - 1);
    }
    ctx.stroke();
  }
  const first = cells[0],
    last = cells[cells.length - 1];
  const fx = (first[0] - cx) * CELL,
    fy = (first[1] - cy) * CELL,
    lx = (last[0] - cx) * CELL,
    ly = (last[1] - cy) * CELL;
  if (kind === 'archer') {
    ctx.fillStyle = '#5d3a26';
    ctx.fillRect(fx - 8, fy - 5, 16, 3);
    ctx.fillRect(fx - 6, fy - 9, 2, 16);
    ctx.fillRect(fx + 5, fy - 9, 2, 16);
    ctx.fillStyle = '#dab483';
    ctx.fillRect(fx - 8, fy - 6, 16, 1);
    soldier(ctx, lx, ly + 4, kind);
  } else if (kind === 'cannon') {
    ctx.fillStyle = '#332d33';
    ctx.fillRect(fx - 9, fy + 3, 17, 5);
    ctx.fillStyle = '#d7a8a2';
    ctx.fillRect(fx - 7, fy + 1, 13, 3);
    ctx.fillStyle = '#4f4448';
    ctx.fillRect(fx - 10, fy - 5, 15, 7);
    ctx.fillStyle = '#938087';
    ctx.fillRect(fx - 10, fy - 5, 15, 2);
    ctx.fillStyle = '#201f25';
    ctx.fillRect(fx - 11, fy - 4, 3, 5);
    soldier(ctx, lx, ly + 3, kind);
  } else if (kind === 'frost') {
    ctx.fillStyle = '#527e91';
    ctx.fillRect(fx - 7, fy - 6, 14, 15);
    ctx.strokeStyle = '#aacfe0';
    ctx.lineWidth = 1;
    ctx.strokeRect(fx - 6, fy - 7, 12, 14);
    ctx.fillStyle = '#b9eeef';
    ctx.fillRect(fx - 4, fy - 6, 8, 2);
    soldier(ctx, lx, ly + 4, kind);
  } else if (kind === 'bomber') {
    ctx.fillStyle = '#453229';
    ctx.fillRect(fx - 9, fy - 3, 18, 12);
    ctx.fillStyle = '#cd995b';
    ctx.fillRect(fx - 10, fy - 5, 20, 4);
    ctx.fillStyle = '#283238';
    ctx.fillRect(fx - 5, fy - 12, 10, 9);
    ctx.fillStyle = '#e3b963';
    ctx.fillRect(fx + 2, fy - 15, 2, 5);
    ctx.fillStyle = '#fff0a9';
    ctx.fillRect(fx + 2, fy - 16, 3, 3);
    soldier(ctx, lx, ly + 4, kind);
  } else if (kind === 'laser') {
    ctx.fillStyle = '#38334f';
    ctx.fillRect(fx - 10, fy + 4, 20, 5);
    ctx.fillStyle = '#b5a3e5';
    ctx.fillRect(fx - 6, fy - 2, 12, 6);
    ctx.fillStyle = '#7c65bb';
    ctx.fillRect(fx - 4, fy - 12, 8, 11);
    ctx.fillStyle = '#e3d4ff';
    ctx.fillRect(fx - 2, fy - 15, 4, 16);
    ctx.fillStyle = '#fff8ff';
    ctx.fillRect(fx - 3, fy - 10, 6, 4);
    ctx.strokeStyle = '#cfc1ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx - 8, fy - 7);
    ctx.lineTo(fx - 8, fy + 2);
    ctx.moveTo(fx + 8, fy - 7);
    ctx.lineTo(fx + 8, fy + 2);
    ctx.stroke();
    soldier(ctx, lx, ly + 4, kind);
  } else if (kind === 'engineer') {
    ctx.fillStyle = '#33463b';
    ctx.fillRect(fx - 10, fy - 7, 20, 17);
    ctx.fillStyle = '#b8e0bd';
    ctx.fillRect(fx - 2, fy - 10, 4, 16);
    ctx.fillRect(fx - 8, fy - 4, 16, 4);
    ctx.fillStyle = '#d7bd82';
    ctx.fillRect(lx - 7, ly - 8, 14, 4);
    ctx.fillRect(lx - 2, ly - 13, 4, 14);
    soldier(ctx, lx, ly + 4, kind);
  } else if (kind === 'shieldRoom') {
    ctx.fillStyle = '#263f53';
    ctx.fillRect(fx - 10, fy - 8, 20, 18);
    ctx.fillStyle = '#8fcbe8';
    ctx.fillRect(fx - 7, fy - 6, 14, 12);
    ctx.fillStyle = '#d8f4ff';
    ctx.fillRect(fx - 2, fy - 4, 4, 8);
    ctx.strokeStyle = '#a8dcf5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lx, ly, 12, Math.PI, 0);
    ctx.stroke();
  } else if (kind === 'mint') {
    ctx.fillStyle = '#533b28';
    ctx.fillRect(fx - 9, fy - 4, 18, 12);
    ctx.fillStyle = '#e4bc5b';
    ctx.fillRect(fx - 8, fy - 5, 16, 8);
    ctx.fillStyle = '#ffdf83';
    ctx.fillRect(fx - 7, fy - 5, 14, 2);
    ctx.fillStyle = '#71502d';
    ctx.fillRect(fx - 1, fy - 2, 2, 7);
    soldier(ctx, lx, ly + 4, kind);
  } else if (kind === 'barracks') {
    ctx.fillStyle = '#162c38';
    ctx.fillRect(fx - 8, fy - 7, 16, 18);
    ctx.fillStyle = '#a9cbd7';
    ctx.fillRect(fx - 9, fy - 9, 18, 3);
    ctx.fillStyle = '#668e9d';
    ctx.fillRect(fx - 6, fy - 3, 4, 12);
    ctx.fillRect(fx + 2, fy - 3, 4, 12);
    ctx.fillStyle = '#d9ce98';
    ctx.fillRect(lx - 7, ly - 10, 2, 21);
    ctx.fillStyle = '#90c5d0';
    ctx.fillRect(lx - 5, ly - 10, 14, 9);
    ctx.fillStyle = '#e4ebc4';
    ctx.fillRect(lx - 1, ly - 8, 3, 5);
  } else if (kind === 'fortress') {
    ctx.fillStyle = '#263c43';
    ctx.fillRect(fx - 10, fy - 9, 20, 21);
    ctx.fillStyle = '#d1dcce';
    ctx.fillRect(fx - 11, fy - 11, 22, 4);
    ctx.fillRect(fx - 11, fy - 15, 5, 5);
    ctx.fillRect(fx + 6, fy - 15, 5, 5);
    ctx.fillStyle = '#6f949b';
    ctx.fillRect(fx - 7, fy - 4, 14, 12);
    ctx.fillStyle = '#e0c68e';
    ctx.fillRect(lx - 22, ly - 1, 43, 2);
    ctx.fillStyle = '#e6ece2';
    ctx.fillRect(lx - 25, ly - 3, 7, 5);
    ctx.fillRect(lx + 18, ly - 3, 7, 5);
    soldier(ctx, lx, ly + 5, kind);
  } else if (kind === 'barricade') {
    drawBarricade(ctx, 0, CELL / 2);
  } else {
    ctx.strokeStyle = '#b0d984';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < cells.length; i++) {
      const [a, b] = cells[i];
      const px = (a - cx) * CELL,
        py = (b - cy) * CELL;
      if (i === 0) ctx.moveTo(px - 10, py);
      ctx.lineTo(px + 10, py + Math.sin(i * 2) * 6);
    }
    ctx.stroke();
    for (const [a, b] of cells) {
      const px = (a - cx) * CELL,
        py = (b - cy) * CELL;
      ctx.fillStyle = '#79ab58';
      ctx.fillRect(px - 5, py - 7, 7, 4);
      ctx.fillRect(px + 4, py + 3, 7, 4);
    }
  }
  if (level > 1) {
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe09c';
    ctx.fillText(level === 3 ? '★★★' : '★★', fx, fy - 9);
  }
  if (glued) {
    ctx.strokeStyle = '#91c978';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    for (const [a, b] of cells)
      ctx.strokeRect((a - cx) * CELL - 11, (b - cy) * CELL - 11, 22, 22);
    ctx.setLineDash([]);
  }
}
function drawBarricade(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
) {
  ctx.fillStyle = '#493829';
  ctx.fillRect(x - 29, ground - 4, 58, 5);
  for (let n = 0; n < 6; n++) {
    const px = x - 26 + n * 9;
    ctx.fillStyle = '#bd9663';
    ctx.fillRect(px, ground - 25, 6, 25);
    ctx.fillStyle = '#e0bf84';
    ctx.fillRect(px + 1, ground - 28, 4, 4);
    ctx.fillStyle = '#775637';
    ctx.fillRect(px + 4, ground - 22, 2, 19);
  }
  ctx.strokeStyle = '#6b4c32';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 25, ground - 19);
  ctx.lineTo(x + 25, ground - 8);
  ctx.stroke();
  ctx.fillStyle = '#b7b49b';
  ctx.fillRect(x - 21, ground - 18, 3, 3);
  ctx.fillRect(x + 18, ground - 10, 3, 3);
}
export function render(ctx: CanvasRenderingContext2D, game: Game, view: View) {
  const { width: w, height: h, scale: s, ground: g } = view;
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.translate(w / 2, g);
  ctx.scale(s, s);
  ctx.translate(-CENTER, -FLOOR);
  // The ground and foundation are part of the collision scene.
  ctx.fillStyle = '#122d32';
  ctx.fillRect(CENTER - w / s / 2, FLOOR + 12, w / s, 80);
  ctx.fillStyle = '#57604d';
  ctx.fillRect(CENTER - w / s / 2, FLOOR + 12, w / s, 3);
  ctx.fillStyle = '#38463d';
  for (let i = -35; i < 36; i++) {
    ctx.fillRect(CENTER + i * 27, FLOOR + 15, 13, 3);
  }
  for (const platform of PLATFORMS) {
    const left = platform.x - platform.width / 2;
    ctx.fillStyle = '#252e2e';
    ctx.fillRect(left - 6, FLOOR + 4, platform.width + 12, 14);
    ctx.fillStyle = platform.x === CENTER ? '#aa8956' : '#778788';
    ctx.fillRect(left, FLOOR, platform.width, 13);
    ctx.fillStyle = platform.x === CENTER ? '#ead1a0' : '#bdccbe';
    ctx.fillRect(left, FLOOR, platform.width, 3);
    ctx.fillStyle = '#526365';
    for (let i = 0; i < platform.width / CELL; i++)
      ctx.fillRect(left + i * CELL, FLOOR + 5, 1, 7);
  }
  for (const b of game.barricades) {
    drawBarricade(ctx, b.x, GROUND);
    ctx.fillStyle = '#26343a';
    ctx.fillRect(b.x - 23, GROUND - 35, 46, 4);
    ctx.fillStyle = b.hp < b.maxHp * 0.35 ? '#e79878' : '#b8c592';
    ctx.fillRect(b.x - 23, GROUND - 35, (46 * b.hp) / b.maxHp, 4);
  }
  for (const x of [
    game.projectileBounds.minX + 12,
    game.projectileBounds.maxX - 12,
  ]) {
    ctx.fillStyle = '#d49f7955';
    ctx.fillRect(x - 2, FLOOR - 20, 4, 26);
  }
  for (const room of game.rooms) {
    ctx.save();
    ctx.translate(room.body.position.x, room.body.position.y);
    ctx.rotate(room.body.angle);
    piece(
      ctx,
      room.cells,
      room.kind,
      room.cx,
      room.cy,
      room.level,
      room.glued,
      game.time,
    );
    for (const [cx, cy] of room.cells) {
      const x = (cx - room.cx) * CELL - CELL / 2,
        y = (cy - room.cy) * CELL - CELL / 2;
      if (room.hitFlash > 0) {
        ctx.fillStyle = `rgba(255,133,111,${room.hitFlash * 1.8})`;
        ctx.fillRect(x, y, CELL, CELL);
      }
      if (room.fortification > 0) {
        ctx.strokeStyle = ['#a4c6d3', '#d0ddef', '#f2d394'][
          room.fortification - 1
        ];
        ctx.lineWidth = 2;
        for (const [dx, dy] of [
          [0, 0],
          [CELL, 0],
          [0, CELL],
          [CELL, CELL],
        ]) {
          const sx = dx ? -1 : 1,
            sy = dy ? -1 : 1;
          ctx.beginPath();
          ctx.moveTo(x + dx + sx * 7, y + dy + sy * 2);
          ctx.lineTo(x + dx + sx * 2, y + dy + sy * 2);
          ctx.lineTo(x + dx + sx * 2, y + dy + sy * 7);
          ctx.stroke();
        }
      }
      if (room.id === game.inspectedRoom) {
        ctx.strokeStyle = '#f6dc9b';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
      }
    }
    ctx.restore();
    if (room.kind === 'shieldRoom' && room.shield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.13 + 0.12 * (room.shield / room.maxShield);
      ctx.fillStyle = '#8edcff';
      ctx.strokeStyle = '#bfeeff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(room.body.position.x, room.body.position.y, 175, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.stroke();
      ctx.restore();
    }
    if (room.kind === 'engineer' && room.cooldown > TYPES.engineer.rate - 0.35) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#b8e0bd';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(room.body.position.x, room.body.position.y, 165, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (room.hp < room.maxHp || room.id === game.inspectedRoom) {
      const x = room.body.position.x - 22,
        y = room.body.bounds.min.y - 7;
      ctx.fillStyle = '#1a2c33';
      ctx.fillRect(x, y, 44, 4);
      ctx.fillStyle = room.hp / room.maxHp < 0.35 ? '#ee907a' : '#a9ccd3';
      ctx.fillRect(x, y, 44 * Math.max(0, room.hp / room.maxHp), 4);
    }
  }
  for (const link of game.links) {
    const a = game.rooms.find((r) => r.id === link.a),
      b = game.rooms.find((r) => r.id === link.b);
    if (!a || !b) continue;
    ctx.strokeStyle = '#91bb6c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.body.position.x, a.body.position.y);
    ctx.lineTo(b.body.position.x, b.body.position.y);
    ctx.stroke();
    const mx = (a.body.position.x + b.body.position.x) / 2,
      my = (a.body.position.y + b.body.position.y) / 2;
    ctx.fillStyle = '#9ac77a';
    ctx.fillRect(mx - 2, my - 5, 7, 4);
  }
  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;
    const kind = enemy.kind ?? 'grunt',
      type = MONSTERS[kind];
    if (enemy.guarding) {
      ctx.fillStyle = '#87cfe414';
      ctx.strokeStyle = '#96d7e57a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(enemy.x, FLOOR - 16, 120, 54, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (enemy.windup) {
      const w = enemy.windup;
      const progress = Math.max(0, 1 - w.remaining / w.duration);
      ctx.fillStyle = '#f67e6435';
      ctx.strokeStyle = enemy.frozen > 0 ? '#a3e7f6' : '#ffad83';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff93734d';
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius * progress, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w.x - 10, w.y);
      ctx.lineTo(w.x + 10, w.y);
      ctx.moveTo(w.x, w.y - 10);
      ctx.lineTo(w.x, w.y + 10);
      ctx.stroke();
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe0b8';
      ctx.fillText(
        `${enemy.boss ? '落石' : '横扫'} ${Math.max(0, w.remaining).toFixed(1)}s`,
        w.x,
        w.y - w.radius - 8,
      );
    }
    if (isAirborne(kind)) {
      ctx.save();
      ctx.translate(enemy.x, game.enemyY(enemy));
      const flap = enemy.frozen > 0 ? 0 : Math.sin(enemy.phase * 1.2) * 7;
      const size = kind === 'wyvern' ? 1.3 : 1;
      ctx.scale(size, size);
      ctx.fillStyle = kind === 'wyvern' ? '#9d624e' : '#796292';
      ctx.fillRect(-25, -5 + flap, 18, 6);
      ctx.fillRect(7, -5 + flap, 18, 6);
      ctx.fillRect(-20, 1 + flap, 12, 5);
      ctx.fillRect(8, 1 + flap, 12, 5);
      ctx.fillRect(-14, 5 + flap, 7, 4);
      ctx.fillRect(7, 5 + flap, 7, 4);
      ctx.fillStyle = type.color;
      ctx.fillRect(-7, -8, 14, 17);
      ctx.fillRect(-8, -13, 4, 7);
      ctx.fillRect(4, -13, 4, 7);
      ctx.fillStyle = '#f8ddaf';
      ctx.fillRect(-5, -5, 3, 3);
      ctx.fillRect(2, -5, 3, 3);
      ctx.fillStyle = '#30253e';
      ctx.fillRect(-2, 1, 4, 3);
      if (kind === 'wyvern') {
        ctx.fillStyle = '#efa45f';
        ctx.fillRect(-3, 5, 6, 7);
      }
      if (enemy.frozen > 0) {
        ctx.fillStyle = '#9cddf645';
        ctx.fillRect(-27, -15, 54, 30);
        ctx.strokeStyle = '#b6e7f1';
        ctx.strokeRect(-27, -15, 54, 30);
      }
      ctx.fillStyle = '#26323c';
      ctx.fillRect(-15, -20, 30, 3);
      ctx.fillStyle = '#d1a1cf';
      ctx.fillRect(-15, -20, (30 * enemy.hp) / enemy.maxHp, 3);
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.translate(enemy.x, FLOOR + 7);
    if (enemy.side < 0) ctx.scale(-1, 1);
    const scale = enemyScale(kind);
    ctx.scale(scale, scale);
    if (kind === 'runner') ctx.scale(1.2, 0.85);
    const walk = enemy.frozen > 0 ? 0 : Math.sin(enemy.phase) * 2;
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(-9, 0, 19, 3);
    ctx.fillStyle = enemy.slow > 0 || enemy.frozen > 0 ? '#95ccda' : type.color;
    ctx.fillRect(-6, -23, 12, 9);
    ctx.fillStyle =
      kind === 'shaman'
        ? '#416950'
        : kind === 'shooter'
          ? '#704a69'
          : enemy.boss
            ? '#7b323c'
            : '#6e594b';
    ctx.fillRect(-8, -14, 16, 12);
    ctx.fillStyle = '#d2b78e';
    ctx.fillRect(-9, -21, 18, 3);
    ctx.fillStyle = '#202f31';
    ctx.fillRect(-6, -19, 3, 3);
    ctx.fillStyle = '#4b4845';
    ctx.fillRect(-6, -3, 4, 4 + walk);
    ctx.fillRect(3, -3, 4, 4 - walk);
    ctx.fillStyle = '#a49171';
    ctx.fillRect(-13, -12, 6, 10);
    ctx.fillStyle = '#deccad';
    ctx.fillRect(-15, -14, 3, 10);
    if (enemy.boss) {
      ctx.fillStyle = '#ecad7c';
      ctx.fillRect(-7, -27, 3, 5);
      ctx.fillRect(4, -27, 3, 5);
    }
    if (kind === 'shield' || kind === 'sentinel' || kind === 'ironwarden') {
      ctx.fillStyle = kind === 'ironwarden' ? '#343d43' : '#476577';
      ctx.fillRect(-16, -22, 10, 22);
      ctx.fillStyle = kind === 'ironwarden' ? '#b6bec0' : '#b9d4dc';
      ctx.fillRect(-16, -22, 3, 22);
      ctx.fillRect(-13, -13, 7, 3);
      ctx.fillStyle = kind === 'ironwarden' ? '#69757a' : '#7893a2';
      ctx.fillRect(-8, -28, 16, 6);
      if (kind === 'sentinel') {
        ctx.fillStyle = '#f4d694';
        ctx.fillRect(-6, -32, 3, 7);
        ctx.fillRect(3, -32, 3, 7);
        ctx.fillRect(-13, -17, 5, 5);
      } else if (kind === 'ironwarden') {
        ctx.fillStyle = '#d9e0dc';
        ctx.fillRect(-10, -33, 20, 4);
        ctx.fillRect(-19, -24, 4, 25);
        ctx.fillStyle = '#7d898d';
        ctx.fillRect(8, -18, 8, 17);
      }
    } else if (kind === 'berserker' || kind === 'razorhound') {
      ctx.fillStyle = kind === 'razorhound' ? '#9d3d39' : '#cb624d';
      ctx.fillRect(-8, -29, 17, 6);
      ctx.fillStyle = '#f6d39a';
      ctx.fillRect(-11, -33, 4, 8);
      ctx.fillRect(8, -33, 4, 8);
      ctx.fillStyle = kind === 'razorhound' ? '#e1a18b' : '#8fa8ac';
      ctx.fillRect(-22, -26, 10, 11);
      ctx.fillStyle = '#c2a17c';
      ctx.fillRect(-15, -20, 3, 21);
      if (kind === 'razorhound') {
        ctx.fillStyle = '#f4d7c0';
        ctx.fillRect(11, -25, 14, 3);
        ctx.fillRect(13, -17, 12, 3);
      }
    } else if (kind === 'runner') {
      ctx.fillStyle = '#dfa770';
      ctx.fillRect(-12, -25, 7, 4);
      ctx.fillStyle = '#f1d8a3';
      ctx.fillRect(-15, -29, 3, 7);
      ctx.fillStyle = '#9d6546';
      ctx.fillRect(8, -12, 9, 3);
    } else if (kind === 'shooter' || kind === 'hexer') {
      ctx.fillStyle = kind === 'hexer' ? '#d7b5e4' : '#deb8a2';
      ctx.fillRect(-20, -14, 17, 3);
      ctx.fillStyle = kind === 'hexer' ? '#7e5294' : '#cab6cf';
      ctx.fillRect(-16, -19, 2, 13);
      ctx.fillStyle = kind === 'hexer' ? '#563567' : '#8d6586';
      ctx.fillRect(-8, -26, 18, 4);
      if (kind === 'hexer') {
        ctx.fillStyle = '#eac9ff';
        ctx.fillRect(-18, -32, 7, 7);
        ctx.fillRect(-3, -35, 6, 7);
      }
    } else if (kind === 'shaman') {
      ctx.fillStyle = '#a69565';
      ctx.fillRect(-15, -27, 3, 29);
      ctx.fillStyle = '#b7df9c';
      ctx.fillRect(-18, -32, 9, 8);
      ctx.fillStyle = '#456b50';
      ctx.fillRect(-6, -28, 12, 6);
      ctx.fillRect(-3, -33, 6, 6);
    } else if (kind === 'sapper') {
      ctx.fillStyle = '#784838';
      ctx.fillRect(-10, -17, 21, 15);
      ctx.fillStyle = '#dbac74';
      ctx.fillRect(-10, -15, 21, 2);
      ctx.fillRect(-10, -6, 21, 2);
      ctx.fillStyle =
        enemy.fuse !== null && Math.sin(game.time * 25) > 0
          ? '#fff1a1'
          : '#f18564';
      ctx.fillRect(6, -23, 3, 7);
    }
    if (enemy.frozen > 0) {
      ctx.fillStyle = '#9cddf640';
      ctx.fillRect(-19, -35, 37, 37);
      ctx.strokeStyle = '#b0e7f7';
      ctx.lineWidth = 1;
      ctx.strokeRect(-19, -35, 37, 37);
    }
    if (enemy.hp < enemy.maxHp && !isChampion(kind)) {
      ctx.fillStyle = '#253036';
      ctx.fillRect(-10, -30, 20, 3);
      ctx.fillStyle = enemy.slow > 0 ? '#96dce7' : '#cf8c73';
      ctx.fillRect(-10, -30, (20 * enemy.hp) / enemy.maxHp, 3);
    }
    ctx.restore();
    if (isChampion(kind)) {
      const width = enemy.boss ? 116 : 92;
      const x = Math.max(
        game.projectileBounds.minX + width / 2 + 8,
        Math.min(game.projectileBounds.maxX - width / 2 - 8, enemy.x),
      );
      const y = FLOOR - 36 * scale;
      ctx.fillStyle = '#172229';
      ctx.fillRect(x - width / 2 - 2, y - 2, width + 4, 11);
      ctx.fillStyle = enemy.enraged ? '#f47357' : type.color;
      ctx.fillRect(
        x - width / 2,
        y,
        width * Math.max(0, enemy.hp / enemy.maxHp),
        7,
      );
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff1d2';
      ctx.fillText(
        `${enemy.boss ? 'BOSS' : isWanderingElite(kind) ? '游荡精英' : '精英'} · ${type.name}`,
        x,
        y - 20,
      );
      ctx.fillText(
        `${Math.ceil(enemy.hp)} / ${Math.ceil(enemy.maxHp)}`,
        x,
        y - 6,
      );
      ctx.fillStyle = enemy.enraged ? '#ffac8e' : '#b6e0e9';
      ctx.fillText(
        enemy.enraged
          ? '狂暴'
          : enemy.guarding
            ? '护阵生效'
            : enemy.windup
              ? '蓄力中'
              : '进军',
        x,
        y + 22,
      );
    }
    if (enemy.fuse !== null && enemy.fuse !== undefined) {
      ctx.fillStyle = '#412c2b';
      ctx.fillRect(enemy.x - 17, FLOOR - 39, 34, 4);
      ctx.fillStyle = '#ffb583';
      ctx.fillRect(
        enemy.x - 17,
        FLOOR - 39,
        34 * Math.max(0, enemy.fuse / 1.5),
        4,
      );
    }
  }
  for (const ally of game.soldiers) {
    if (ally.hp <= 0) continue;
    const melee = ally.kind === 'melee';
    ctx.fillStyle = '#7dbfc8';
    ctx.fillRect(ally.x - 9, FLOOR + 9, 18, 2);
    soldier(
      ctx,
      ally.x,
      FLOOR + 2 + Math.sin(ally.phase) * 0.5,
      melee ? 'barracks' : 'archer',
      ally.side < 0,
    );
    if (melee) {
      ctx.fillStyle = '#8fbdcf';
      ctx.fillRect(ally.x + ally.side * 10 - 3, FLOOR - 13, 6, 11);
      ctx.fillStyle = '#e7e2bd';
      ctx.fillRect(ally.x + ally.side * 14 - 1, FLOOR - 19, 2, 14);
    }
    ctx.fillStyle = '#223944';
    ctx.fillRect(ally.x - 11, FLOOR - 27, 22, 3);
    ctx.fillStyle = melee ? '#a5cfd4' : '#b8d897';
    ctx.fillRect(ally.x - 11, FLOOR - 27, (22 * ally.hp) / ally.maxHp, 3);
  }
  for (const shot of game.enemyShots) {
    const length = Math.hypot(shot.vx, shot.vy) || 1;
    const dx = shot.vx / length,
      dy = shot.vy / length;
    ctx.save();
    if (shot.kind === 'hexer') {
      ctx.shadowColor = MONSTERS[shot.kind].color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#dca8f0';
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f3dfff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shot.x - dx * 25, shot.y - dy * 25);
      ctx.lineTo(shot.x, shot.y);
      ctx.stroke();
    } else if (shot.kind === 'ironwarden') {
      ctx.strokeStyle = '#dce3df';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(shot.x - dx * 24, shot.y - dy * 24);
      ctx.lineTo(shot.x + dx * 4, shot.y + dy * 4);
      ctx.stroke();
      ctx.fillStyle = '#8c989c';
      ctx.fillRect(shot.x - 3, shot.y - 3, 6, 6);
    } else if (shot.kind === 'razorhound') {
      ctx.strokeStyle = '#ffac92';
      ctx.lineWidth = 4;
      for (const offset of [-5, 5]) {
        ctx.beginPath();
        ctx.moveTo(
          shot.x - dx * 21 - dy * offset,
          shot.y - dy * 21 + dx * offset,
        );
        ctx.lineTo(shot.x - dy * offset, shot.y + dx * offset);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = MONSTERS[shot.kind].color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(shot.x - dx * 14, shot.y - dy * 14);
      ctx.lineTo(shot.x, shot.y);
      ctx.stroke();
      ctx.fillStyle = '#ffe2d4';
      ctx.fillRect(shot.x - 2, shot.y - 2, 4, 4);
    }
    ctx.restore();
  }
  for (const pulse of game.pulses) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pulse.life / pulse.max);
    ctx.strokeStyle = pulse.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      pulse.x,
      pulse.y,
      Math.max(1, pulse.radius * (1 - pulse.life / pulse.max)),
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }
  for (const p of game.projectiles) {
    const color = TYPES[p.kind].light;
    ctx.strokeStyle = color;
    ctx.lineWidth = p.kind === 'cannon' ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    for (const t of p.trail) ctx.lineTo(t.x, t.y);
    ctx.stroke();
    ctx.fillStyle = p.kind === 'cannon' ? '#ffbd71' : color;
    if (p.kind === 'bomber') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(game.time * 6);
      ctx.fillStyle = '#2c3038';
      ctx.fillRect(-5, -5, 10, 10);
      ctx.fillStyle = '#f6d290';
      ctx.fillRect(-4, -5, 7, 2);
      ctx.fillStyle = '#ffc46b';
      ctx.fillRect(3, -9, 2, 5);
      ctx.restore();
      continue;
    }
    ctx.fillRect(
      p.x - 2,
      p.y - 2,
      p.kind === 'cannon' ? 5 : 3,
      p.kind === 'cannon' ? 5 : 3,
    );
  }
  for (const blast of game.blasts) {
    const progress = 1 - blast.life / blast.max;
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.5;
    ctx.fillStyle = TYPES[blast.kind].light;
    ctx.beginPath();
    ctx.arc(
      blast.x,
      blast.y,
      Math.max(1, blast.radius * progress),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = '#ffe0a8';
    ctx.lineWidth = 3 * (1 - progress) + 1;
    ctx.stroke();
    ctx.restore();
  }
  for (const beam of game.beams) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (beam.life / beam.max) * 2);
    ctx.strokeStyle = '#a58bfa';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(beam.x, beam.y);
    ctx.lineTo(beam.endX, beam.endY);
    ctx.stroke();
    ctx.strokeStyle = '#eee4ff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }
  for (const spear of game.spears) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (spear.life / spear.max) * 2);
    ctx.strokeStyle = '#d3b880';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(spear.x, spear.y);
    ctx.lineTo(spear.endX, spear.endY);
    ctx.stroke();
    const angle = Math.atan2(spear.endY - spear.y, spear.endX - spear.x);
    ctx.translate(spear.endX, spear.endY);
    ctx.rotate(angle);
    ctx.fillStyle = '#edf1d9';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-8, -4);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  for (const effect of game.areaEffects) {
    ctx.save();
    ctx.fillStyle = effect.kind === 'lightning' ? '#a5e6ff24' : '#e5c58b1c';
    ctx.strokeStyle = SKILLS[effect.kind].color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (effect.kind === 'lightning') {
      ctx.globalAlpha = effect.life / effect.max;
      for (let n = -1; n <= 1; n++) {
        const x = effect.x + n * 38;
        ctx.strokeStyle = '#80cdff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x - 22, game.projectileBounds.minY);
        ctx.lineTo(x + 12, effect.y - 118);
        ctx.lineTo(x - 12, effect.y - 72);
        ctx.lineTo(x + 9, effect.y - 35);
        ctx.lineTo(x, effect.y + 8);
        ctx.stroke();
        ctx.strokeStyle = '#f1ffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else {
      for (let n = 0; n < 14; n++) {
        const progress = ((effect.max - effect.life) * 1.9 + n * 0.173) % 1;
        const x = effect.x + Math.sin(n * 7.3) * effect.radius * 0.85;
        const y =
          effect.y - effect.radius - 95 + progress * (effect.radius * 2 + 95);
        ctx.strokeStyle = '#e7c592';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 20);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = '#f7edcf';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 6);
        ctx.lineTo(x - 4, y - 3);
        ctx.lineTo(x + 3, y - 5);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }
  if (game.selectedSkill && !game.paused) {
    const skill = SKILLS[game.selectedSkill];
    ctx.save();
    ctx.fillStyle = `${skill.color}22`;
    ctx.strokeStyle = skill.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(game.pointerX, game.pointerY, skill.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(game.pointerX - 10, game.pointerY);
    ctx.lineTo(game.pointerX + 10, game.pointerY);
    ctx.moveTo(game.pointerX, game.pointerY - 10);
    ctx.lineTo(game.pointerX, game.pointerY + 10);
    ctx.stroke();
    ctx.fillStyle = skill.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${skill.name} · 点击施放`,
      game.pointerX,
      game.pointerY - skill.radius - 12,
    );
    ctx.restore();
  }
  const preview = game.preview();
  if (preview && !game.paused) {
    const { x, y, landing, cx, cy, shape, card } = preview;
    if (card.kind === 'barricade') {
      ctx.fillStyle = '#a5cf8628';
      let start = game.projectileBounds.minX;
      for (const platform of PLATFORMS) {
        const left = platform.x - platform.width / 2;
        if (left > start) ctx.fillRect(start, GROUND - 2, left - start, 6);
        start = platform.x + platform.width / 2;
      }
      if (start < game.projectileBounds.maxX)
        ctx.fillRect(start, GROUND - 2, game.projectileBounds.maxX - start, 6);
      ctx.save();
      ctx.globalAlpha = 0.7;
      drawBarricade(ctx, x, GROUND);
      ctx.restore();
      ctx.strokeStyle = preview.valid ? '#bed5a1' : '#e99481';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        x - BARRICADE_WIDTH / 2 - 2,
        GROUND - 30,
        BARRICADE_WIDTH + 4,
        32,
      );
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(
        preview.valid ? '点击放置路障' : '请选空闲土路',
        x,
        GROUND - 43,
      );
    } else {
      const minX = Math.min(...shape.map((c) => c[0] - cx)) * CELL - CELL / 2,
        maxX = Math.max(...shape.map((c) => c[0] - cx)) * CELL + CELL / 2;
      ctx.fillStyle = 'rgba(140,207,151,.055)';
      ctx.fillRect(x + minX, y, maxX - minX, FLOOR - y);
      ctx.strokeStyle = 'rgba(178,222,154,.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(x + minX, y);
      ctx.lineTo(x + minX, FLOOR);
      ctx.moveTo(x + maxX, y);
      ctx.lineTo(x + maxX, FLOOR);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.translate(x, landing);
      piece(ctx, shape, card.kind, cx, cy);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.translate(x, y);
      piece(ctx, shape, card.kind, cx, cy);
      ctx.restore();
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#dce9c7';
      ctx.fillText('松手放下 · R 旋转', x, y - 48);
    }
  }
  for (const p of game.particles) {
    ctx.globalAlpha = Math.min(1, (p.life / p.max) * 2);
    ctx.fillStyle = p.color;
    if (p.text) {
      ctx.font = `bold ${p.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
    } else ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (game.hitFlash > 0) {
    ctx.fillStyle = `rgba(182,65,53,${game.hitFlash * 0.09})`;
    ctx.fillRect(0, 0, w, h);
  }
}
