import Matter from 'matter-js';
import {
  MONSTERS,
  PERKS,
  waveRoster,
  waveForecast,
  isAirborne,
  isElite,
  isChampion,
  isRewardChampion,
  isWanderingElite,
  waveTier,
  enemyScale,
  SKILLS,
  type SkillId,
  type EnemyKind,
  type PerkId,
} from './content.ts';

export const CELL = 28;
export const FLOOR = 570;
export const CENTER = 480;
export const PLATFORM_HALF = 113;
export const PLATFORMS = [-400, -240, 0, 240, 400].map((offset) => ({
  x: CENTER + offset,
  width: offset === 0 ? PLATFORM_HALF * 2 : 84,
}));
export const BUILD_HALF_WIDTH = 442;
export const onPlatform = (x: number, margin = 0) =>
  PLATFORMS.some((p) => Math.abs(x - p.x) <= p.width / 2 + margin);
export const GROUND = FLOOR + 12;
export const BARRICADE_WIDTH = 56;
const BOMB_GRAVITY = 320;
const ROOM_SURFACE = { friction: 1, frictionStatic: 5 };
const PHYSICS_STEP = 1 / 120;
export type Kind =
  | 'archer'
  | 'cannon'
  | 'frost'
  | 'mint'
  | 'vine'
  | 'bomber'
  | 'laser'
  | 'engineer'
  | 'shieldRoom'
  | 'barracks'
  | 'fortress'
  | 'barricade';
export type Shape = number[][];
export const SHAPES: Shape[] = [
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
];
export const TYPES: Record<
  Kind,
  {
    name: string;
    role: string;
    color: string;
    light: string;
    price: number;
    damage: number;
    rate: number;
  }
> = {
  archer: {
    name: '弓箭手',
    role: '快速连射',
    color: '#906037',
    light: '#e5bb79',
    price: 18,
    damage: 12,
    rate: 0.7,
  },
  cannon: {
    name: '火炮',
    role: '范围轰炸',
    color: '#84404b',
    light: '#f3a3a0',
    price: 28,
    damage: 36,
    rate: 2.1,
  },
  frost: {
    name: '冰法师',
    role: '冰冻减速',
    color: '#3a6777',
    light: '#a6ddec',
    price: 24,
    damage: 10,
    rate: 1.5,
  },
  bomber: {
    name: '投弹手',
    role: '抛物线范围爆炸',
    color: '#805330',
    light: '#ffbf7d',
    price: 32,
    damage: 48,
    rate: 3,
  },
  laser: {
    name: '激光塔',
    role: '直线贯穿攻击',
    color: '#555184',
    light: '#cec0ff',
    price: 38,
    damage: 26,
    rate: 2.2,
  },
  engineer: {
    name: '工程师',
    role: '范围修复房间',
    color: '#52745f',
    light: '#b8e0bd',
    price: 30,
    damage: 0,
    rate: 4,
  },
  shieldRoom: {
    name: '护盾房间',
    role: '范围拦截远程攻击',
    color: '#45667f',
    light: '#a8dcf5',
    price: 36,
    damage: 0,
    rate: 1,
  },
  mint: {
    name: '金库',
    role: '每波产出金币',
    color: '#876e2b',
    light: '#f6d984',
    price: 22,
    damage: 0,
    rate: 99,
  },
  vine: {
    name: '藤蔓',
    role: '连接并加固房间',
    color: '#37674a',
    light: '#b7da81',
    price: 16,
    damage: 0,
    rate: 99,
  },
  barracks: {
    name: '兵营',
    role: '定时招募士兵',
    color: '#385e70',
    light: '#aacddb',
    price: 40,
    damage: 0,
    rate: 8,
  },
  barricade: {
    name: '路障',
    role: '土路阻拦敌人',
    color: '#725231',
    light: '#d7b47b',
    price: 16,
    damage: 0,
    rate: 99,
  },
  fortress: {
    name: '近战堡垒',
    role: '长矛拦截地面敌人',
    color: '#557078',
    light: '#d2e1d8',
    price: 34,
    damage: 26,
    rate: 1.1,
  },
};
export type SoldierKind = 'melee' | 'ranged';
export type Soldier = {
  id: number;
  homeId: number;
  kind: SoldierKind;
  side: number;
  x: number;
  hp: number;
  maxHp: number;
  damage: number;
  cooldown: number;
  phase: number;
  rallyX?: number;
};
export type Barricade = { id: number; x: number; hp: number; maxHp: number };
type Blocker =
  | { type: 'fortress'; entity: Room; reach: number }
  | { type: 'soldier'; entity: Soldier; reach: number }
  | { type: 'barricade'; entity: Barricade; reach: number };
export type Card = { id: number; kind: Kind; shape: Shape };
export type Room = {
  id: number;
  body: Matter.Body;
  cells: Shape;
  kind: Kind;
  level: number;
  cooldown: number;
  age: number;
  glued: boolean;
  merged: boolean;
  cx: number;
  cy: number;
  group: number | null;
  offset: Matter.Vector;
  localAngle: number;
  vineActivated: boolean;
  hp: number;
  maxHp: number;
  fortification: number;
  hitFlash: number;
  recruitKind: SoldierKind;
  recruitTimer: number;
  recruitSide: number;
  shield: number;
  maxShield: number;
};
export type Enemy = {
  id: number;
  x: number;
  side: number;
  hp: number;
  maxHp: number;
  speed: number;
  slow: number;
  attack: number;
  boss: boolean;
  phase: number;
  kind: EnemyKind;
  frozen: number;
  charged: boolean;
  fuse: number | null;
  healTimer: number;
  y: number;
  flightY: number;
  blocked: boolean;
  abilityTimer: number;
  guarding: boolean;
  enraged: boolean;
  summonTimer: number;
  windup: {
    x: number;
    y: number;
    remaining: number;
    duration: number;
    radius: number;
    damage: number;
  } | null;
};
export type EnemyShot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  kind: EnemyKind;
};
export type CombatPulse = {
  x: number;
  y: number;
  radius: number;
  life: number;
  max: number;
  color: string;
};
export type RoomInspection = {
  id: number;
  kind: Kind;
  hp: number;
  maxHp: number;
  fortification: number;
  reinforceCost: number;
  recruitKind: SoldierKind;
  recruits: number;
  recruitTimer: number;
  shield: number;
  maxShield: number;
};
export type Projectile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  kind: Kind;
  damage: number;
  life: number;
  trail: { x: number; y: number }[];
};
export type Beam = {
  x: number;
  y: number;
  endX: number;
  endY: number;
  life: number;
  max: number;
};
export type AreaEffect = {
  kind: SkillId;
  x: number;
  y: number;
  radius: number;
  life: number;
  max: number;
  tick: number;
  damage: number;
};
export type Blast = {
  x: number;
  y: number;
  radius: number;
  life: number;
  max: number;
  kind: Kind;
};
type RigidGroup = { body: Matter.Body; rooms: number[] };
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  text?: string;
};
export type Snapshot = {
  gold: number;
  hp: number;
  wave: number;
  phase: 'ready' | 'battle' | 'break' | 'lost' | 'won';
  paused: boolean;
  speed: number;
  cards: Card[];
  selected: number | null;
  rotation: number;
  kills: number;
  rooms: number;
  height: number;
  best: number;
  countdown: number;
  notice: string;
  combo: number;
  inspected: RoomInspection | null;
  rewards: PerkId[];
  rewardSource: EnemyKind | null;
  perks: Record<PerkId, number>;
  forecast: ReturnType<typeof waveForecast>;
  hornCooldown: number;
  selectedSkill: SkillId | null;
  skillCooldowns: Record<SkillId, number>;
  blueprint: Kind | null;
  soldiers: number;
  barricades: number;
};

export function rotateShape(shape: Shape, turns: number): Shape {
  let result = shape.map(([x, y]) => [x, y]);
  for (let n = 0; n < ((turns % 4) + 4) % 4; n++)
    result = result.map(([x, y]) => [-y, x]);
  const minX = Math.min(...result.map((c) => c[0])),
    minY = Math.min(...result.map((c) => c[1]));
  return result.map(([x, y]) => [x - minX, y - minY]);
}

// Swept collision catches small enemies even at double speed.
export function segmentHit(
  x: number,
  y: number,
  nx: number,
  ny: number,
  cx: number,
  cy: number,
  radius: number,
): number | null {
  const dx = nx - x,
    dy = ny - y,
    ox = x - cx,
    oy = y - cy;
  const c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a === 0) return null;
  const b = 2 * (ox * dx + oy * dy),
    d = b * b - 4 * a * c;
  if (d < 0) return null;
  const t = (-b - Math.sqrt(d)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

function segmentPolygonHit(
  x: number,
  y: number,
  nx: number,
  ny: number,
  vertices: Matter.Vector[],
) {
  if (Matter.Vertices.contains(vertices, { x, y })) return 0;
  const dx = nx - x,
    dy = ny - y;
  let first = Infinity;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i],
      b = vertices[(i + 1) % vertices.length];
    const ex = b.x - a.x,
      ey = b.y - a.y,
      cross = dx * ey - dy * ex;
    if (Math.abs(cross) < 1e-9) continue;
    const ax = a.x - x,
      ay = a.y - y;
    const t = (ax * ey - ay * ex) / cross,
      u = (ax * dy - ay * dx) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) first = Math.min(first, t);
  }
  return first;
}

// Include each cell's distance from the centre when computing resistance to rotation.
function applyCompoundInertia(body: Matter.Body) {
  if (body.parts.length < 2) return;
  Matter.Body.setInertia(
    body,
    body.parts
      .slice(1)
      .reduce(
        (sum, part) =>
          sum +
          part.inertia +
          part.mass *
            ((part.position.x - body.position.x) ** 2 +
              (part.position.y - body.position.y) ** 2),
        0,
      ),
  );
}

export class Game {
  physics = Matter.Engine.create({
    gravity: { x: 0, y: 1.1 },
    enableSleeping: true,
    positionIterations: 8,
    velocityIterations: 8,
  });
  rooms: Room[] = [];
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  links: { a: number; b: number }[] = [];
  groups = new Map<number, RigidGroup>();
  beams: Beam[] = [];
  spears: Beam[] = [];
  areaEffects: AreaEffect[] = [];
  selectedSkill: SkillId | null = null;
  skillCooldowns: Record<SkillId, number> = { lightning: 0, arrowRain: 0 };
  blasts: Blast[] = [];
  enemyShots: EnemyShot[] = [];
  soldiers: Soldier[] = [];
  barricades: Barricade[] = [];
  blueprint: Card | null = null;
  pulses: CombatPulse[] = [];
  inspectedRoom: number | null = null;
  rewards: PerkId[] = [];
  rewardSource: EnemyKind | null = null;
  rewardQueue: EnemyKind[] = [];
  flightLane = 0;
  perks: Record<PerkId, number> = {
    power: 0,
    haste: 0,
    bounty: 0,
    masonry: 0,
    supply: 0,
  };
  hornCooldown = 0;
  waveEnemies: EnemyKind[] = [];
  projectileBounds = {
    minX: CENTER - 600,
    maxX: CENTER + 600,
    minY: -1500,
    maxY: FLOOR + 100,
  };
  gold = 110;
  hp = 1000;
  wave = 0;
  phase: Snapshot['phase'] = 'ready';
  paused = false;
  speed = 1;
  cards: Card[] = [];
  selected: number | null = null;
  rotation = 0;
  pointerX = CENTER;
  pointerY = 300;
  kills = 0;
  best = 0;
  countdown = 0;
  notice = '选择一块房间，开始搭建你的堡垒';
  combo = 0;
  mergedPairs = new Set<string>();
  time = 0;
  spawnTimer = 0;
  leftToSpawn = 0;
  uid = 0;
  noticeTime = 0;
  mergeTime = 0;
  hitFlash = 0;
  tick = 0;
  active = true;
  onChange: ((state: Snapshot) => void) | null = null;
  sound: ((kind: string) => void) | null = null;
  random: () => number;
  private physicsRemainder = 0;
  constructor(random: () => number = Math.random) {
    this.random = random;
    Matter.Composite.add(this.physics.world, [
      Matter.Bodies.rectangle(CENTER, FLOOR + 42, 1600, 60, {
        isStatic: true,
        friction: 0.9,
        label: 'ground',
      }),
      ...PLATFORMS.map((p) =>
        Matter.Bodies.rectangle(p.x, FLOOR + 6, p.width, 12, {
          isStatic: true,
          friction: 1,
          label: 'foundation',
        }),
      ),
    ]);
    this.cards = [
      this.makeCard('archer'),
      this.makeCard('bomber'),
      this.makeCard('laser'),
    ];
  }
  makeCard(force?: Kind): Card {
    const pool: Kind[] =
      this.wave >= 2
        ? [
            'archer',
            'cannon',
            'frost',
            'bomber',
            'laser',
            'mint',
            'vine',
            'engineer',
            'shieldRoom',
          ]
        : [
            'archer',
            'cannon',
            'frost',
            'bomber',
            'laser',
            'mint',
            'engineer',
            'shieldRoom',
          ];
    const kind = force ?? pool[Math.floor(this.random() * pool.length)];
    return {
      id: ++this.uid,
      kind,
      shape:
        kind === 'vine'
          ? SHAPES[0]
          : kind === 'mint' || kind === 'engineer' || kind === 'shieldRoom'
            ? SHAPES[3]
            : SHAPES[Math.floor(this.random() * SHAPES.length)],
    };
  }
  addRoom(kind: Kind, shape: Shape, x: number, y: number, level = 1) {
    const cx = shape.reduce((n, c) => n + c[0], 0) / shape.length,
      cy = shape.reduce((n, c) => n + c[1], 0) / shape.length;
    const parts = shape.map(([a, b]) =>
      Matter.Bodies.rectangle((a - cx) * CELL, (b - cy) * CELL, CELL, CELL, {
        ...ROOM_SURFACE,
        restitution: 0.015,
        density: 0.0022,
      }),
    );
    const body = Matter.Body.create({
      parts,
      ...ROOM_SURFACE,
      frictionAir: 0.018,
      restitution: 0.01,
      density: 0.0022,
      sleepThreshold: 90,
    });
    applyCompoundInertia(body);
    Matter.Body.setPosition(body, { x, y });
    this.watchWake(body);
    const room: Room = {
      id: ++this.uid,
      body,
      cells: shape,
      kind,
      level: Math.max(1, level),
      cooldown: this.random(),
      age: level === 0 ? 8 : 0,
      group: null,
      offset: { x: 0, y: 0 },
      localAngle: 0,
      vineActivated: false,
      glued: false,
      merged: false,
      cx,
      cy,
      hp: (kind === 'fortress' ? 320 : 90) + shape.length * 25,
      maxHp: (kind === 'fortress' ? 320 : 90) + shape.length * 25,
      fortification: 0,
      hitFlash: 0,
      recruitKind: 'melee',
      recruitTimer: 2,
      recruitSide: -1,
      shield: kind === 'shieldRoom' ? 160 : 0,
      maxShield: kind === 'shieldRoom' ? 160 : 0,
    };
    this.rooms.push(room);
    Matter.Composite.add(this.physics.world, body);
    return room;
  }
  snapshot(): Snapshot {
    const room = this.rooms.find((r) => r.id === this.inspectedRoom);
    return {
      gold: this.gold,
      hp: Math.ceil(this.hp),
      wave: this.wave,
      phase: this.phase,
      paused: this.paused,
      speed: this.speed,
      cards: [...this.cards],
      selected: this.selected,
      rotation: this.rotation,
      kills: this.kills,
      rooms: this.rooms.length,
      height: Math.round(this.towerHeight() / CELL),
      best: this.best,
      countdown: Math.ceil(this.countdown),
      notice: this.notice,
      combo: this.combo,
      inspected: room
        ? {
            id: room.id,
            kind: room.kind,
            hp: Math.ceil(room.hp),
            maxHp: room.maxHp,
            fortification: room.fortification,
            reinforceCost: 24 + room.fortification * 18,
            recruitKind: room.recruitKind,
            recruits: this.soldiers.filter(
              (s) => s.homeId === room.id && s.hp > 0,
            ).length,
            recruitTimer: Math.ceil(room.recruitTimer),
            shield: Math.ceil(room.shield),
            maxShield: room.maxShield,
          }
        : null,
      rewards: [...this.rewards],
      rewardSource: this.rewardSource,
      perks: { ...this.perks },
      forecast: waveForecast(
        this.phase === 'battle' ? this.wave : this.wave + 1,
      ),
      hornCooldown: Math.ceil(this.hornCooldown),
      selectedSkill: this.selectedSkill,
      skillCooldowns: {
        lightning: Math.ceil(this.skillCooldowns.lightning),
        arrowRain: Math.ceil(this.skillCooldowns.arrowRain),
      },
      blueprint: this.selected === -1 ? (this.blueprint?.kind ?? null) : null,
      soldiers: this.soldiers.filter((s) => s.hp > 0).length,
      barricades: this.barricades.length,
    };
  }
  emit() {
    this.onChange?.(this.snapshot());
  }
  tell(message: string) {
    this.notice = message;
    this.noticeTime = 4;
    this.emit();
  }
  towerHeight() {
    return Math.max(
      0,
      ...this.rooms
        .filter((r) => Math.abs(r.body.position.x - CENTER) <= BUILD_HALF_WIDTH)
        .map((r) => FLOOR - r.body.bounds.min.y),
    );
  }
  select(index: number) {
    if (!this.canAct()) return;
    const card = this.cards[index];
    if (!card) return;
    if (this.gold < TYPES[card.kind].price) {
      this.tell('金币不足，消灭敌人可以赚取金币');
      return;
    }
    this.selected = index;
    this.selectedSkill = null;
    this.blueprint = null;
    this.inspectedRoom = null;
    this.rotation = 0;
    this.pointerX = CENTER;
    this.pointerY = FLOOR - this.towerHeight() - 90;
    this.emit();
  }
  rotate() {
    if (this.selected === null || !this.canAct()) return;
    if (this.blueprint?.kind === 'barricade') return;
    this.rotation = (this.rotation + 1) % 4;
    this.sound?.('rotate');
    this.emit();
  }
  cancel() {
    this.selected = null;
    this.selectedSkill = null;
    this.blueprint = null;
    this.inspectedRoom = null;
    this.emit();
  }
  inspectRoom(id: number) {
    if (!this.rooms.some((r) => r.id === id)) return;
    this.selected = null;
    this.selectedSkill = null;
    this.blueprint = null;
    this.inspectedRoom = id;
    this.emit();
  }
  inspectAt(x: number, y: number) {
    const room = [...this.rooms]
      .reverse()
      .find((r) => Matter.Query.point(this.roomParts(r), { x, y }).length > 0);
    this.inspectedRoom = room?.id ?? null;
    this.emit();
  }
  inspectNext() {
    if (!this.rooms.length) return;
    const index = this.rooms.findIndex((r) => r.id === this.inspectedRoom);
    this.inspectRoom(this.rooms[(index + 1) % this.rooms.length].id);
  }
  selectBlueprint(kind: 'barracks' | 'barricade' | 'fortress') {
    if (!this.canAct()) return;
    if (this.gold < TYPES[kind].price) {
      this.tell('金币不足');
      return;
    }
    this.blueprint = {
      id: ++this.uid,
      kind,
      shape:
        kind !== 'barricade'
          ? SHAPES[3]
          : [
              [0, 0],
              [1, 0],
            ],
    };
    this.selected = -1;
    this.selectedSkill = null;
    this.inspectedRoom = null;
    this.rotation = 0;
    this.pointerX = kind === 'barricade' ? CENTER - 155 : CENTER;
    this.pointerY = FLOOR - this.towerHeight() - 90;
    this.tell(
      kind === 'barricade'
        ? '移动到平台两侧土路，点击放置路障'
        : kind === 'fortress'
          ? '把近战堡垒放在平台底层，落稳后以长矛拦截地面敌人'
          : '把兵营搭在任意平台上，落稳后将定时出兵',
    );
  }
  canPlaceBarricade(x: number) {
    const half = BARRICADE_WIDTH / 2;
    return (
      this.barricades.length < 12 &&
      !PLATFORMS.some((p) => Math.abs(x - p.x) < p.width / 2 + half + 6) &&
      x >= this.projectileBounds.minX + half + 10 &&
      x <= this.projectileBounds.maxX - half - 10 &&
      !this.barricades.some((b) => Math.abs(b.x - x) < BARRICADE_WIDTH + 8) &&
      !this.enemies.some(
        (e) =>
          e.hp > 0 &&
          !isAirborne(e.kind ?? 'grunt') &&
          Math.abs(e.x - x) < half + 20,
      ) &&
      !this.soldiers.some((s) => s.hp > 0 && Math.abs(s.x - x) < half + 14)
    );
  }
  setRecruitKind(kind: SoldierKind, id = this.inspectedRoom) {
    const room = this.rooms.find((r) => r.id === id && r.kind === 'barracks');
    if (!this.canAct() || !room) return false;
    room.recruitKind = kind;
    this.tell(
      kind === 'melee'
        ? '兵营改为训练近战士兵：在前线阻拦地面敌人'
        : '兵营改为训练远程士兵：后排射击，可对空，不能阻拦敌人',
    );
    return true;
  }
  recruit(room: Room) {
    if (
      room.kind !== 'barracks' ||
      !this.rooms.includes(room) ||
      this.phase !== 'battle'
    )
      return false;
    if (
      this.soldiers.filter((s) => s.hp > 0 && s.homeId === room.id).length >=
        6 ||
      this.soldiers.filter((s) => s.hp > 0).length >= 30
    )
      return false;
    const melee = room.recruitKind === 'melee';
    const hp = (melee ? 100 : 55) + (room.level - 1) * 20;
    const platform = PLATFORMS.reduce((best, p) =>
      Math.abs(p.x - room.body.position.x) <
      Math.abs(best.x - room.body.position.x)
        ? p
        : best,
    );
    const side =
      platform.x === CENTER ? room.recruitSide : Math.sign(platform.x - CENTER);
    this.soldiers.push({
      id: ++this.uid,
      homeId: room.id,
      kind: room.recruitKind,
      side,
      x: platform.x + side * (platform.width / 2 + 14),
      rallyX: platform.x + side * (platform.width / 2 + 25),
      hp,
      maxHp: hp,
      damage: (melee ? 14 : 11) + (room.level - 1) * 5,
      cooldown: 0.3,
      phase: this.random() * 6,
    });
    room.recruitSide *= -1;
    this.sparks(room.body.position.x, room.body.position.y, '#a9d4e1', 6);
    return true;
  }
  enemyY(enemy: Enemy) {
    return enemy.y ?? FLOOR - 7;
  }
  enemyRadius(enemy: Enemy) {
    return 12 * enemyScale(enemy.kind ?? 'grunt');
  }
  fortressGrounded(room: Room) {
    return (
      room.kind === 'fortress' &&
      room.age > 0.8 &&
      room.hp > 0 &&
      Math.abs(room.body.angle) < 0.45 &&
      this.physicsBody(room).speed < 0.8 &&
      room.body.bounds.max.y >= FLOOR - 6 &&
      room.body.bounds.max.y < FLOOR + 7
    );
  }
  blockerX(blocker: Blocker) {
    return blocker.type === 'fortress'
      ? blocker.entity.body.position.x
      : blocker.entity.x;
  }
  spearReach(room: Room, enemy: Enemy) {
    const bounds = room.body.bounds;
    const dx = Math.max(bounds.min.x - enemy.x, 0, enemy.x - bounds.max.x);
    const dy = Math.max(
      bounds.min.y - this.enemyY(enemy),
      0,
      this.enemyY(enemy) - bounds.max.y,
    );
    return (
      !isAirborne(enemy.kind) &&
      Math.hypot(dx, dy) <= 80 + this.enemyRadius(enemy)
    );
  }
  blockersAhead(enemy: Enemy): Blocker | null {
    if (isAirborne(enemy.kind ?? 'grunt')) return null;
    const candidates: Blocker[] = [
      ...this.rooms
        .filter(
          (r) =>
            this.fortressGrounded(r) &&
            (r.body.position.x - CENTER) * enemy.side >= -10,
        )
        .map((entity) => ({
          type: 'fortress' as const,
          entity,
          reach:
            (entity.body.bounds.max.x - entity.body.bounds.min.x) / 2 +
            this.enemyRadius(enemy) +
            80,
        })),
      ...this.barricades
        .filter((b) => b.hp > 0 && (b.x - CENTER) * enemy.side > 0)
        .map((entity) => ({
          type: 'barricade' as const,
          entity,
          reach: BARRICADE_WIDTH / 2 + this.enemyRadius(enemy) + 1,
        })),
      ...this.soldiers
        .filter((s) => s.hp > 0 && s.kind === 'melee' && s.side === enemy.side)
        .map((entity) => ({
          type: 'soldier' as const,
          entity,
          reach: this.enemyRadius(enemy) + 11,
        })),
    ];
    return (
      candidates
        .filter((b) => (enemy.x - this.blockerX(b)) * enemy.side >= -4)
        .sort(
          (a, b) =>
            (enemy.x - this.blockerX(a)) * enemy.side -
            a.reach -
            ((enemy.x - this.blockerX(b)) * enemy.side - b.reach),
        )[0] ?? null
    );
  }
  hurtBlocker(blocker: Blocker, damage: number) {
    if (blocker.type === 'fortress') {
      this.damageRoom(blocker.entity, damage);
      return;
    }
    const entity = blocker.entity;
    if (entity.hp <= 0) return;
    entity.hp = Math.max(0, entity.hp - damage);
    this.sparks(
      entity.x,
      FLOOR - 8,
      blocker.type === 'barricade' ? '#cda975' : '#b4d4df',
      entity.hp > 0 ? 3 : 9,
    );
    if (entity.hp <= 0 && blocker.type === 'barricade') {
      this.barricades = this.barricades.filter((b) => b.id !== entity.id);
      this.burst(entity.x, FLOOR - 38, '路障被击破', '#e5b38b');
    }
  }
  blastDefenders(x: number, y: number, radius: number, damage: number) {
    for (const b of this.barricades)
      if (Math.hypot(b.x - x, FLOOR - 8 - y) < radius)
        this.hurtBlocker({ type: 'barricade', entity: b, reach: 0 }, damage);
    for (const s of this.soldiers)
      if (Math.hypot(s.x - x, FLOOR - 7 - y) < radius)
        this.hurtBlocker({ type: 'soldier', entity: s, reach: 0 }, damage);
    for (const room of this.rooms)
      if (
        Math.hypot(room.body.position.x - x, room.body.position.y - y) < radius
      )
        this.damageRoom(room, damage);
  }
  stepSoldiers(dt: number) {
    for (const soldier of this.soldiers) {
      if (soldier.hp <= 0) continue;
      soldier.cooldown -= dt;
      soldier.phase += dt * 8;
      const candidates = this.enemies.filter(
        (e) =>
          e.hp > 0 &&
          (soldier.kind === 'ranged' || !isAirborne(e.kind ?? 'grunt')) &&
          (e.x - CENTER) * soldier.side > 0 &&
          (soldier.kind !== 'ranged' ||
            Math.hypot(e.x - soldier.x, this.enemyY(e) - (FLOOR - 7)) <= 360),
      );
      const target = candidates.sort((a, b) => {
        const score = (e: Enemy) =>
          Math.hypot(e.x - soldier.x, this.enemyY(e) - (FLOOR - 7)) -
          (soldier.kind === 'ranged' && isAirborne(e.kind) ? 70 : 0);
        return score(a) - score(b);
      })[0];
      if (soldier.kind === 'melee') {
        const limit =
          soldier.side < 0
            ? Math.max(
                Math.min(CENTER - 330, (soldier.rallyX ?? CENTER) - 80),
                this.projectileBounds.minX + 45,
              )
            : Math.min(
                Math.max(CENTER + 330, (soldier.rallyX ?? CENTER) + 80),
                this.projectileBounds.maxX - 45,
              );
        const goal = target
          ? target.x - soldier.side * (this.enemyRadius(target) + 10)
          : limit;
        const delta = goal - soldier.x;
        soldier.x += Math.sign(delta) * Math.min(Math.abs(delta), dt * 42);
        if (
          target &&
          Math.abs(target.x - soldier.x) <= this.enemyRadius(target) + 13 &&
          soldier.cooldown <= 0
        ) {
          this.hit(
            target,
            soldier.damage * (1 + this.perks.power * 0.15),
            'barracks',
          );
          soldier.cooldown = 0.9 / (1 + this.perks.haste * 0.12);
          this.sparks(target.x, this.enemyY(target), '#e6e3bd', 3);
        }
      } else {
        const threat = this.enemies.some(
          (e) =>
            e.hp > 0 &&
            !isAirborne(e.kind ?? 'grunt') &&
            Math.abs(e.x - soldier.x) < 45,
        );
        const goal =
          (soldier.rallyX ?? CENTER + soldier.side * (PLATFORM_HALF + 25)) -
          (threat ? soldier.side * 22 : 0);
        soldier.x +=
          Math.sign(goal - soldier.x) *
          Math.min(Math.abs(goal - soldier.x), dt * 30);
        if (
          target &&
          Math.hypot(target.x - soldier.x, this.enemyY(target) - (FLOOR - 7)) <=
            360 &&
          (isAirborne(target.kind) || Math.abs(target.x - soldier.x) > 28) &&
          soldier.cooldown <= 0
        ) {
          const seconds =
            Math.hypot(
              target.x - soldier.x,
              this.enemyY(target) - (FLOOR - 7),
            ) / 360;
          const dx = this.predictedX(target, seconds) - soldier.x,
            dy = this.enemyY(target) - (FLOOR - 12),
            length = Math.hypot(dx, dy) || 1;
          this.projectiles.push({
            x: soldier.x,
            y: FLOOR - 12,
            vx: (dx / length) * 360,
            vy: (dy / length) * 360,
            gravity: 0,
            kind: 'archer',
            damage: soldier.damage * (1 + this.perks.power * 0.15),
            life: 1,
            trail: [],
          });
          soldier.cooldown = 1.15 / (1 + this.perks.haste * 0.12);
        }
      }
    }
    this.soldiers = this.soldiers.filter((s) => s.hp > 0);
  }
  canAct() {
    return (
      this.active &&
      !this.paused &&
      this.phase !== 'lost' &&
      this.phase !== 'won' &&
      !this.rewards.length
    );
  }
  reinforceRoom(id = this.inspectedRoom) {
    const room = this.rooms.find((r) => r.id === id);
    if (!this.canAct() || !room || room.fortification >= 3) return false;
    const cost = 24 + room.fortification * 18;
    if (this.gold < cost) {
      this.tell('金币不足，暂时无法加固');
      return false;
    }
    this.gold -= cost;
    room.fortification++;
    room.maxHp += 80;
    room.hp = room.maxHp;
    this.sparks(room.body.position.x, room.body.position.y, '#b5d9de', 16);
    this.tell(
      `${TYPES[room.kind].name}已加固至 ${room.fortification} 级：耐久提升、减伤增强，并已修复`,
    );
    this.sound?.('merge');
    return true;
  }
  repairRoom(id = this.inspectedRoom) {
    const room = this.rooms.find((r) => r.id === id);
    if (!this.canAct() || !room || room.hp >= room.maxHp || this.gold < 12)
      return false;
    this.gold -= 12;
    room.hp = room.maxHp;
    this.tell(`${TYPES[room.kind].name}已完全修复`);
    this.sound?.('coin');
    return true;
  }
  damageRoom(room: Room, damage: number) {
    if (!this.rooms.includes(room)) return;
    const actual = damage * (1 - room.fortification * 0.18);
    room.hp = Math.max(0, room.hp - actual);
    room.hitFlash = 0.3;
    this.sparks(room.body.position.x, room.body.position.y, '#e8937d', 5);
    if (room.hp <= 0) this.destroyRooms([room]);
  }
  shieldProtectors() {
    return this.rooms.filter(
      (room) =>
        room.kind === 'shieldRoom' &&
        room.hp > 0 &&
        room.shield > 0 &&
        room.age > 0.8,
    );
  }
  shieldForPoint(x: number, y: number) {
    return (
      this.shieldProtectors()
        .filter(
          (room) =>
            Math.hypot(room.body.position.x - x, room.body.position.y - y) <= 175,
        )
        .sort((a, b) => a.shield - b.shield)[0] ?? null
    );
  }
  absorbEnemyShot(room: Room, damage: number) {
    if (room.shield <= 0) return false;
    room.shield = Math.max(0, room.shield - damage);
    this.pulses.push({
      x: room.body.position.x,
      y: room.body.position.y,
      radius: 175,
      life: 0.45,
      max: 0.45,
      color: '#a8dcf5',
    });
    this.burst(
      room.body.position.x,
      room.body.position.y - 35,
      room.shield > 0 ? `护盾 -${Math.ceil(damage)}` : '护盾破碎',
      '#bce8ff',
    );
    this.sound?.('hurt');
    return true;
  }
  stepSupportRooms(dt: number) {
    for (const room of this.rooms) {
      if (room.age <= 0.8 || Math.abs(room.body.angle) >= 1.2) continue;
      if (room.kind === 'engineer' && room.cooldown <= 0) {
        let healed = 0;
        for (const target of this.rooms)
          if (
            target.hp > 0 &&
            target.hp < target.maxHp &&
            Math.hypot(
              target.body.position.x - room.body.position.x,
              target.body.position.y - room.body.position.y,
            ) <= 165
          ) {
            const amount = Math.min(target.maxHp - target.hp, 26 * room.level);
            target.hp += amount;
            healed += amount;
            this.sparks(target.body.position.x, target.body.position.y, '#aee0b4', 4);
          }
        if (healed > 0) {
          room.cooldown = TYPES.engineer.rate;
          this.burst(room.body.position.x, room.body.position.y - 32, `修复 +${Math.ceil(healed)}`, '#b8e0bd');
        } else room.cooldown = 0.5;
      }
      if (room.kind === 'shieldRoom') {
        room.shield = Math.min(room.maxShield, room.shield + 12 * dt * room.level);
      }
    }
  }
  activateHorn() {
    if (!this.canAct() || this.phase !== 'battle' || this.hornCooldown > 0)
      return false;
    for (const e of this.enemies)
      if (e.hp > 0)
        e.frozen = Math.max(e.frozen, e.boss ? 1.8 : isElite(e.kind) ? 2.2 : 3);
    this.hornCooldown = 30;
    this.pulses.push({
      x: CENTER,
      y: FLOOR,
      radius: 550,
      life: 0.8,
      max: 0.8,
      color: '#a3e7f6',
    });
    this.tell('冰霜号角！普通敌人冻结 3 秒，精英 2.2 秒，Boss 1.8 秒');
    this.sound?.('wave');
    return true;
  }
  selectSkill(kind: SkillId) {
    if (
      !this.canAct() ||
      this.phase !== 'battle' ||
      this.skillCooldowns[kind] > 0
    )
      return false;
    if (this.selectedSkill === kind) {
      this.cancel();
      return true;
    }
    this.selectedSkill = kind;
    this.selected = null;
    this.blueprint = null;
    this.inspectedRoom = null;
    this.pointerX = CENTER;
    this.pointerY = FLOOR - 50;
    this.tell(`选择${SKILLS[kind].name}范围：点击战场施放，Esc 取消`);
    return true;
  }
  castSkill(x = this.pointerX, y = this.pointerY) {
    const kind = this.selectedSkill;
    if (
      !kind ||
      !this.canAct() ||
      this.phase !== 'battle' ||
      this.skillCooldowns[kind] > 0 ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    )
      return false;
    const b = this.projectileBounds;
    if (x < b.minX || x > b.maxX || y < b.minY || y > GROUND) return false;
    const max = kind === 'lightning' ? 0.65 : 3;
    const effect: AreaEffect = {
      kind,
      x,
      y,
      radius: SKILLS[kind].radius,
      life: max,
      max,
      tick: 0.5,
      damage:
        (kind === 'lightning' ? 140 + this.wave * 10 : 20 + this.wave * 2) *
        (1 + this.perks.power * 0.15),
    };
    this.areaEffects.push(effect);
    this.skillCooldowns[kind] = SKILLS[kind].cooldown;
    this.selectedSkill = null;
    this.hitSkillArea(effect);
    this.sound?.(kind === 'lightning' ? 'boom' : 'wave');
    this.tell(`${SKILLS[kind].name}已施放`);
    return true;
  }
  hitSkillArea(effect: AreaEffect) {
    for (const enemy of this.enemies) {
      if (
        enemy.hp <= 0 ||
        Math.hypot(enemy.x - effect.x, this.enemyY(enemy) - effect.y) >
          effect.radius + this.enemyRadius(enemy)
      )
        continue;
      this.hit(
        enemy,
        effect.damage,
        effect.kind === 'lightning' ? 'laser' : 'archer',
      );
      if (effect.kind === 'lightning')
        enemy.frozen = Math.max(enemy.frozen, isChampion(enemy.kind) ? 0.4 : 1);
    }
  }
  stepSkills(dt: number) {
    for (const effect of this.areaEffects) {
      effect.life -= dt;
      effect.tick -= dt;
      if (
        effect.kind === 'arrowRain' &&
        effect.life > 1e-8 &&
        effect.tick <= 1e-8
      ) {
        this.hitSkillArea(effect);
        effect.tick += 0.5;
      }
    }
    this.areaEffects = this.areaEffects.filter((e) => e.life > 0);
  }
  offerRewards() {
    if (
      this.hp <= 0 ||
      this.phase === 'lost' ||
      this.rewards.length ||
      !this.rewardQueue.length
    )
      return;
    this.rewardSource = this.rewardQueue.shift()!;
    const pool = Object.keys(PERKS) as PerkId[];
    this.rewards = [];
    while (this.rewards.length < 3) {
      const index = Math.floor(this.random() * pool.length);
      this.rewards.push(pool.splice(index, 1)[0]);
    }
    this.selected = null;
    this.selectedSkill = null;
  }
  chooseReward(id: PerkId) {
    if (
      this.phase === 'lost' ||
      this.phase === 'won' ||
      this.hp <= 0 ||
      this.paused ||
      !this.rewards.includes(id)
    )
      return false;
    this.perks[id]++;
    if (id === 'supply') {
      this.gold += 35;
      this.hp = Math.min(1000, this.hp + 100);
    }
    if (id === 'masonry') this.restoreFortress(1);
    this.rewards = [];
    this.rewardSource = null;
    this.offerRewards();
    this.tell(`获得「${PERKS[id].name}」· ${PERKS[id].description}`);
    this.sound?.('merge');
    return true;
  }
  restoreFortress(stacks: number) {
    this.hp = Math.min(1000, this.hp + 60 * stacks);
    for (const room of this.rooms)
      room.hp = Math.min(room.maxHp, room.hp + 20 * stacks);
  }
  preview() {
    if (this.selected === null) return null;
    const card =
      this.selected === -1 ? this.blueprint : this.cards[this.selected];
    if (!card) return null;
    const shape = rotateShape(card.shape, this.rotation);
    const cx = shape.reduce((s, c) => s + c[0], 0) / shape.length,
      cy = shape.reduce((s, c) => s + c[1], 0) / shape.length;
    const x = this.pointerX;
    if (card.kind === 'barricade') {
      const y = GROUND - CELL / 2;
      return {
        card,
        shape,
        cx,
        cy,
        x,
        y,
        landing: y,
        low: CELL / 2,
        high: -CELL / 2,
        valid: this.canPlaceBarricade(x),
      };
    }
    let y = Math.min(this.pointerY, FLOOR - this.towerHeight() - 55);
    const low = Math.max(...shape.map((c) => c[1] - cy)) * CELL + CELL / 2;
    const high = Math.min(...shape.map((c) => c[1] - cy)) * CELL - CELL / 2;
    let landing = FLOOR - low;
    for (const room of this.rooms) {
      if (room.body.bounds.min.y > FLOOR + 3) continue;
      for (const part of room.body.parts.length > 1
        ? room.body.parts.slice(1)
        : room.body.parts) {
        for (const [sx, sy] of shape) {
          const px = x + (sx - cx) * CELL;
          if (
            px + CELL / 2 > part.bounds.min.x + 2 &&
            px - CELL / 2 < part.bounds.max.x - 2
          ) {
            landing = Math.min(
              landing,
              part.bounds.min.y - (sy - cy) * CELL - CELL / 2,
            );
          }
        }
      }
    }
    y = Math.min(y, landing - 45);
    return {
      card,
      shape,
      cx,
      cy,
      x,
      y,
      landing,
      low,
      high,
      valid: Math.abs(x - CENTER) <= BUILD_HALF_WIDTH,
    };
  }
  drop() {
    if (this.selected === null || !this.canAct()) return false;
    const p = this.preview();
    if (!p) return false;
    if (this.gold < TYPES[p.card.kind].price) return false;
    if (p.card.kind === 'barricade') {
      if (!this.canPlaceBarricade(p.x)) {
        this.tell('路障放在平台两侧土路上，避开单位和已有路障（最多 12 个）');
        return false;
      }
      this.gold -= TYPES.barricade.price;
      this.barricades.push({ id: ++this.uid, x: p.x, hp: 230, maxHp: 230 });
      this.cancel();
      this.tell('路障已布置：挡住地面敌人，空中敌人可飞越');
      this.sound?.('drop');
      return true;
    }
    if (p.x < CENTER - BUILD_HALF_WIDTH || p.x > CENTER + BUILD_HALF_WIDTH) {
      this.tell('把房间放在五座平台上方');
      return false;
    }
    const index = this.selected;
    this.gold -= TYPES[p.card.kind].price;
    const placed = this.addRoom(p.card.kind, p.shape, p.x, p.y);
    if (p.card.kind === 'barracks') this.inspectedRoom = placed.id;
    if (index >= 0) this.cards.splice(index, 1);
    this.selected = null;
    this.blueprint = null;
    this.sound?.('drop');
    this.tell(
      p.card.kind === 'vine'
        ? '藤蔓落稳后会把附近房间原位固定成整体'
        : p.card.kind === 'barracks'
          ? '兵营已部署：在房间详情中切换近战或远程士兵'
          : '房间已部署，注意保持左右平衡',
    );
    this.emit();
    return true;
  }
  refresh() {
    if (this.cards.length > 0) {
      this.tell('先用完当前三个房间，卡槽清空后才能重置');
      return;
    }
    if (this.gold < 20) {
      this.tell('重置房间需要 20 金币');
      return;
    }
    if (!this.canAct()) return;
    this.gold -= 20;
    this.cards = [this.makeCard(), this.makeCard(), this.makeCard()];
    this.selected = null;
    this.sound?.('coin');
    this.tell('房间已重置：获得三个新房间');
    this.emit();
  }
  startWave() {
    if (
      this.paused ||
      this.phase === 'battle' ||
      this.phase === 'lost' ||
      this.phase === 'won' ||
      this.rewards.length > 0
    )
      return;
    if (this.wave >= 30) {
      this.phase = 'won';
      this.emit();
      return;
    }
    this.wave++;
    this.phase = 'battle';
    this.waveEnemies = waveRoster(this.wave);
    this.leftToSpawn = this.waveEnemies.length;
    this.spawnTimer = 0.7;
    this.countdown = 0;
    if (this.wave > 1) {
      const bonus = this.rooms
        .filter((r) => r.kind === 'mint' && r.body.position.y < FLOOR)
        .reduce((n, r) => n + 3 * r.level, 0);
      this.gold += bonus;
      if (bonus) this.burst(CENTER, FLOOR - 80, `金库 +${bonus}`, '#f8d075');
    }
    const wandering = this.waveEnemies.filter(isWanderingElite).length;
    this.tell(
      waveTier(this.wave) === 'boss'
        ? `Boss 裂地暴君来袭！本波另有 ${wandering} 名无增益游荡精英`
        : waveTier(this.wave) === 'elite'
          ? `精英波！奖励精英可选增益，另有 ${wandering} 名游荡精英只掉金币`
          : wandering
            ? `第 ${this.wave} 波来袭：侦测到 ${wandering} 名无增益游荡精英`
            : `第 ${this.wave} 波来袭，守住城堡！`,
    );
    this.sound?.('wave');
    this.emit();
  }
  togglePause() {
    if (this.phase === 'lost' || this.phase === 'won') return;
    this.paused = !this.paused;
    this.emit();
  }
  toggleSpeed() {
    this.speed = this.speed === 1 ? 2 : 1;
    this.emit();
  }
  burst(x: number, y: number, text: string, color: string) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -22,
      life: 1.5,
      max: 1.5,
      color,
      size: 14,
      text,
    });
  }
  sparks(x: number, y: number, color: string, n = 8) {
    for (let i = 0; i < n; i++)
      this.particles.push({
        x,
        y,
        vx: (this.random() - 0.5) * 110,
        vy: (this.random() - 0.7) * 110,
        life: 0.6,
        max: 0.6,
        color,
        size: 2 + this.random() * 3,
      });
  }
  spawnEnemy(force?: EnemyKind, summoned = false) {
    const side = this.random() < 0.5 ? -1 : 1;
    const kind = force ?? this.waveEnemies.shift() ?? 'grunt';
    const type = MONSTERS[kind];
    const boss = kind === 'brute';
    const hp =
      (30 + this.wave * 9) *
      type.health *
      (isChampion(kind) ? 1 : 2.4) *
      (isAirborne(kind) ? 0.7 : 1) *
      (1 + Math.max(0, this.wave - 4) * 0.018);
    const flightTop = Math.max(
      this.projectileBounds.minY + 70,
      FLOOR - Math.max(330, this.towerHeight() + 120),
    );
    const flightBottom = FLOOR - 90;
    const lane = this.flightLane % 4;
    const flightY = isAirborne(kind)
      ? Math.min(
          flightBottom,
          flightTop +
            ((lane + 0.15 + this.random() * 0.7) / 4) *
              Math.max(0, flightBottom - flightTop),
        )
      : FLOOR + 7 - 14 * enemyScale(kind);
    if (isAirborne(kind)) this.flightLane++;
    const enemy: Enemy = {
      id: ++this.uid,
      x:
        side < 0
          ? this.projectileBounds.minX + 12
          : this.projectileBounds.maxX - 12,
      y: flightY,
      flightY,
      blocked: false,
      side,
      hp,
      maxHp: hp,
      speed: (18 + this.wave * 0.4 + this.random() * 9) * type.speed,
      slow: 0,
      attack:
        kind === 'shooter' ||
        kind === 'shaman' ||
        isWanderingElite(kind)
          ? 0.8
          : 0,
      boss,
      phase: this.random() * 10,
      kind,
      frozen: 0,
      charged: false,
      fuse: null,
      healTimer: 3,
      abilityTimer:
        kind === 'sentinel'
          ? 3
          : kind === 'brute'
            ? 4
            : kind === 'hexer'
              ? 1.2
              : 0,
      guarding: kind === 'sentinel',
      enraged: false,
      summonTimer: 10,
      windup: null,
    };
    this.enemies.push(enemy);
    if (!summoned) this.leftToSpawn = Math.max(0, this.leftToSpawn - 1);
    if (isChampion(kind)) {
      this.burst(enemy.x, FLOOR - 65, type.name, type.color);
      this.tell(`${type.name}入场：${type.tactic}`);
    }
    return enemy;
  }
  targetRoom(enemy: Enemy, high = false) {
    const rooms = this.rooms.filter(
      (r) => r.age > 0.8 && r.body.bounds.min.y < FLOOR,
    );
    return rooms.sort((a, b) => {
      const score = (r: Room) =>
        Math.abs(r.body.position.x - enemy.x) * 0.3 +
        (high ? r.body.position.y : FLOOR - r.body.position.y);
      return score(a) - score(b);
    })[0];
  }
  shootAtRoom(enemy: Enemy) {
    const room = this.targetRoom(enemy, true);
    const x = enemy.x,
      y = this.enemyY(enemy) - 8;
    const target = room?.body.position ?? { x: CENTER, y: FLOOR + 5 };
    const distance = Math.hypot(target.x - x, target.y - y) || 1;
    const speed =
      enemy.kind === 'hexer'
        ? 175
        : enemy.kind === 'ironwarden'
          ? 285
          : enemy.kind === 'razorhound'
            ? 360
            : 230;
    const damageMultiplier =
      enemy.kind === 'hexer'
        ? 1.35
        : enemy.kind === 'ironwarden'
          ? 1.1
          : enemy.kind === 'razorhound'
            ? 0.8
            : 1;
    this.enemyShots.push({
      x,
      y,
      vx: ((target.x - x) / distance) * speed,
      vy: ((target.y - y) / distance) * speed,
      damage:
        (MONSTERS[enemy.kind].damage + this.wave * 0.6) * damageMultiplier,
      life: 8,
      kind: enemy.kind,
    });
    this.sparks(x, y, MONSTERS[enemy.kind].color, isWanderingElite(enemy.kind) ? 9 : 4);
    if (isWanderingElite(enemy.kind))
      this.burst(
        x,
        y - 30,
        enemy.kind === 'hexer'
          ? '蚀骨法球'
          : enemy.kind === 'ironwarden'
            ? '重弩齐射'
            : '裂刃波',
        MONSTERS[enemy.kind].color,
      );
  }
  summonReinforcements(enemy: Enemy) {
    if (this.enemies.filter((e) => e.hp > 0).length >= 100) return;
    for (const side of [-1, 1]) {
      const recruit = this.spawnEnemy(side < 0 ? 'shield' : 'runner', true);
      recruit.side = side;
      recruit.x =
        side < 0
          ? this.projectileBounds.minX + 12
          : this.projectileBounds.maxX - 12;
    }
    this.burst(enemy.x, FLOOR - 75, '召唤援军', '#f3a07c');
  }
  stepChampion(enemy: Enemy, dt: number) {
    if (!isChampion(enemy.kind)) return false;
    if (
      enemy.kind !== 'sentinel' &&
      !isWanderingElite(enemy.kind) &&
      !enemy.enraged &&
      enemy.hp <= enemy.maxHp * 0.5
    ) {
      enemy.enraged = true;
      this.burst(enemy.x, FLOOR - 65, '半血狂暴！', '#ff9773');
      if (enemy.boss) this.summonReinforcements(enemy);
    }
    if (enemy.kind === 'sentinel') {
      enemy.abilityTimer -= dt;
      if (enemy.abilityTimer <= 0) {
        enemy.guarding = !enemy.guarding;
        enemy.abilityTimer = enemy.guarding ? 4 : 3;
        this.burst(
          enemy.x,
          FLOOR - 55,
          enemy.guarding ? '结阵护卫' : '护阵解除',
          '#a9d5e0',
        );
      }
      if (enemy.guarding) {
        enemy.blocked = true;
        return true;
      }
    }
    if (enemy.boss && enemy.enraged) {
      enemy.summonTimer -= dt;
      if (enemy.summonTimer <= 0) {
        enemy.summonTimer = 10;
        this.summonReinforcements(enemy);
      }
    }
    if (enemy.windup) {
      enemy.blocked = true;
      enemy.windup.remaining -= dt;
      if (enemy.windup.remaining <= 0) {
        const strike = enemy.windup;
        this.blastDefenders(strike.x, strike.y, strike.radius, strike.damage);
        if (
          Math.abs(strike.x - CENTER) <= PLATFORM_HALF &&
          strike.y >= FLOOR - 70
        )
          this.hp = Math.max(0, this.hp - strike.damage * 0.5);
        this.pulses.push({
          x: strike.x,
          y: strike.y,
          radius: strike.radius,
          life: 0.6,
          max: 0.6,
          color: '#ff9273',
        });
        this.sound?.('boom');
        enemy.windup = null;
      }
      return true;
    }
    if (enemy.boss) {
      enemy.abilityTimer -= dt;
      if (enemy.abilityTimer <= 0 && Math.abs(enemy.x - CENTER) < 520) {
        const target = this.targetRoom(enemy, true)?.body.position ?? {
          x: CENTER,
          y: FLOOR - 12,
        };
        enemy.abilityTimer = enemy.enraged ? 5 : 8;
        enemy.windup = {
          x: target.x,
          y: target.y,
          remaining: 1.6,
          duration: 1.6,
          radius: 80,
          damage: 58 + this.wave * 1.4,
        };
        enemy.blocked = true;
        this.burst(target.x, target.y - 45, '落石标记！', '#ffad83');
        return true;
      }
    }
    return false;
  }
  stepEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      if (enemy.frozen > 0) {
        enemy.frozen = Math.max(0, enemy.frozen - dt);
        continue;
      }
      const type = MONSTERS[enemy.kind ?? 'grunt'];
      enemy.phase += dt * 8;
      enemy.slow = Math.max(0, enemy.slow - dt);
      enemy.attack -= dt;
      enemy.blocked = false;
      if (this.stepChampion(enemy, dt)) continue;
      if (isAirborne(enemy.kind)) {
        if (
          Math.abs(enemy.x - CENTER) > type.range &&
          !(enemy.kind === 'bat' && enemy.charged)
        ) {
          const next =
            enemy.x -
            enemy.side * enemy.speed * (enemy.slow > 0 ? 0.38 : 1) * dt;
          enemy.x =
            enemy.side < 0
              ? Math.min(next, CENTER - type.range)
              : Math.max(next, CENTER + type.range);
          enemy.y = enemy.flightY + Math.sin(enemy.phase * 0.4) * 7;
        } else {
          const room = this.targetRoom(enemy, true);
          if (enemy.kind === 'bat' && room) {
            enemy.charged = true;
            enemy.x +=
              (room.body.position.x + enemy.side * 28 - enemy.x) *
              Math.min(1, dt * 1.5);
            enemy.y += (room.body.position.y - enemy.y) * Math.min(1, dt * 1.5);
          }
          if (enemy.attack <= 0) {
            if (
              enemy.kind === 'bat' &&
              room &&
              Math.hypot(
                room.body.position.x - enemy.x,
                room.body.position.y - enemy.y,
              ) > 48
            )
              continue;
            enemy.attack = type.interval;
            if (enemy.kind === 'wyvern') this.shootAtRoom(enemy);
            else if (room) {
              this.damageRoom(room, type.damage + this.wave * 0.5);
              this.sparks(
                room.body.position.x,
                room.body.position.y,
                type.color,
                5,
              );
            } else this.hp = Math.max(0, this.hp - type.damage);
          }
        }
        continue;
      }
      if (enemy.kind === 'shaman') {
        enemy.healTimer -= dt;
        if (enemy.healTimer <= 0) {
          enemy.healTimer = 4;
          for (const other of this.enemies)
            if (
              other !== enemy &&
              other.hp > 0 &&
              Math.hypot(
                other.x - enemy.x,
                this.enemyY(other) - this.enemyY(enemy),
              ) < 160
            )
              other.hp = Math.min(other.maxHp, other.hp + other.maxHp * 0.15);
          this.pulses.push({
            x: enemy.x,
            y: FLOOR - 12,
            radius: 160,
            life: 0.7,
            max: 0.7,
            color: '#b7da81',
          });
          this.burst(enemy.x, FLOOR - 42, '治疗', '#b7da81');
        }
      }
      const blocker = this.blockersAhead(enemy);
      const stop = Math.max(
        type.range,
        blocker
          ? (this.blockerX(blocker) - CENTER) * enemy.side + blocker.reach
          : 0,
      );
      const moving = Math.abs(enemy.x - CENTER) > stop + 0.01;
      if (moving) {
        const next =
          enemy.x -
          enemy.side *
            enemy.speed *
            (enemy.enraged ? 1.45 : 1) *
            (enemy.slow > 0 ? 0.38 : 1) *
            dt;
        enemy.x =
          enemy.side < 0
            ? Math.min(next, CENTER - stop)
            : Math.max(next, CENTER + stop);
        // Archers can be attacked while the enemy keeps advancing; they never pin it.
        const exposed = this.soldiers.find(
          (s) =>
            s.hp > 0 && s.kind === 'ranged' && Math.abs(s.x - enemy.x) < 27,
        );
        if (exposed && enemy.attack <= 0) {
          this.hurtBlocker(
            { type: 'soldier', entity: exposed, reach: 0 },
            type.damage * 2,
          );
          enemy.attack = type.interval / (enemy.enraged ? 1.5 : 1);
        }
        continue;
      }
      enemy.blocked =
        !!blocker &&
        (enemy.x - this.blockerX(blocker)) * enemy.side <= blocker.reach + 1;
      if (enemy.kind === 'sapper') {
        if (enemy.fuse === null) {
          enemy.fuse = 1.5;
          this.burst(enemy.x, FLOOR - 40, '即将爆炸！', '#ff997c');
        }
        enemy.fuse -= dt;
        if (enemy.fuse <= 0) {
          enemy.hp = 0;
          const x = enemy.x,
            y = FLOOR - 25;
          this.pulses.push({
            x,
            y,
            radius: 135,
            life: 0.5,
            max: 0.5,
            color: '#ff9478',
          });
          this.blastDefenders(x, y, 135, type.damage + this.wave);
          if (Math.abs(x - CENTER) <= PLATFORM_HALF + 45)
            this.hp = Math.max(0, this.hp - 24);
          this.hitFlash = 0.6;
          this.sound?.('boom');
        }
        continue;
      }
      if (enemy.attack > 0) continue;
      enemy.attack = type.interval / (enemy.enraged ? 1.5 : 1);
      if (enemy.kind === 'berserker') {
        const position =
          enemy.blocked && blocker
            ? { x: this.blockerX(blocker), y: FLOOR - 10 }
            : (this.targetRoom(enemy)?.body.position ?? {
                x: CENTER,
                y: FLOOR - 10,
              });
        enemy.windup = {
          x: position.x,
          y: position.y,
          remaining: 1.2,
          duration: 1.2,
          radius: 65,
          damage: (type.damage + this.wave) * (enemy.enraged ? 1.25 : 1),
        };
        this.burst(enemy.x, FLOOR - 55, '蓄力 · 破绽！', '#ffd293');
        continue;
      }
      const exposed =
        !enemy.blocked &&
        this.soldiers.find(
          (s) =>
            s.hp > 0 && s.kind === 'ranged' && Math.abs(s.x - enemy.x) < 27,
        );
      if (exposed) {
        this.hurtBlocker(
          { type: 'soldier', entity: exposed, reach: 0 },
          type.damage * 2,
        );
        continue;
      }
      const charging =
        (enemy.kind === 'runner' || enemy.kind === 'razorhound') && !enemy.charged;
      const chargeMultiplier = enemy.kind === 'razorhound' ? 2.4 : 3;
      const damage =
        (type.damage + Math.floor(this.wave / 5)) *
        (charging ? chargeMultiplier : 1);
      enemy.charged = true;
      if (enemy.blocked && blocker) {
        if (enemy.boss)
          this.blastDefenders(this.blockerX(blocker), FLOOR - 10, 85, damage);
        else this.hurtBlocker(blocker, damage);
        this.sound?.('hurt');
        continue;
      }
      if (
        enemy.kind === 'shooter' ||
        enemy.kind === 'shaman' ||
        isWanderingElite(enemy.kind)
      ) {
        this.shootAtRoom(enemy);
        continue;
      }
      this.hp = Math.max(
        0,
        this.hp -
          (charging ? (enemy.kind === 'razorhound' ? 28 : 16) : type.damage),
      );
      this.hitFlash = 0.35;
      const room = this.targetRoom(enemy);
      if (room) {
        const position = { x: room.body.position.x, y: room.body.position.y },
          body = this.physicsBody(room);
        Matter.Body.applyForce(body, position, {
          x: -enemy.side * (enemy.boss ? 0.012 : charging ? 0.006 : 0.001),
          y: 0,
        });
        if (enemy.boss) {
          this.blastDefenders(position.x, position.y, 105, damage);
          this.pulses.push({
            x: position.x,
            y: position.y,
            radius: 105,
            life: 0.4,
            max: 0.4,
            color: type.color,
          });
        } else this.damageRoom(room, damage);
      }
      if (charging) this.burst(enemy.x, FLOOR - 38, '冲撞', type.color);
      this.sound?.('hurt');
    }
  }
  stepEnemyShots(dt: number) {
    for (const shot of this.enemyShots) {
      const nx = shot.x + shot.vx * dt,
        ny = shot.y + shot.vy * dt;
      let first = Infinity,
        target: Room | null = null;
      let defender: Blocker | null = null;
      for (const room of this.rooms)
        for (const part of this.roomParts(room)) {
          const t = segmentPolygonHit(shot.x, shot.y, nx, ny, part.vertices);
          if (t < first) {
            first = t;
            target = room;
          }
        }
      for (const soldier of this.soldiers) {
        if (soldier.hp <= 0) continue;
        const t = segmentHit(shot.x, shot.y, nx, ny, soldier.x, FLOOR - 7, 12);
        if (t !== null && t < first) {
          first = t;
          target = null;
          defender = { type: 'soldier', entity: soldier, reach: 0 };
        }
      }
      for (const barricade of this.barricades) {
        const half = BARRICADE_WIDTH / 2;
        const t = segmentPolygonHit(shot.x, shot.y, nx, ny, [
          { x: barricade.x - half, y: GROUND - CELL },
          { x: barricade.x + half, y: GROUND - CELL },
          { x: barricade.x + half, y: GROUND },
          { x: barricade.x - half, y: GROUND },
        ]);
        if (t < first) {
          first = t;
          target = null;
          defender = { type: 'barricade', entity: barricade, reach: 0 };
        }
      }
      if (defender) {
        this.hurtBlocker(defender, shot.damage);
        shot.life = 0;
      } else if (target) {
        const shieldRoom = this.shieldForPoint(
          target.body.position.x,
          target.body.position.y,
        );
        if (shieldRoom) this.absorbEnemyShot(shieldRoom, shot.damage);
        else this.damageRoom(target, shot.damage);
        shot.life = 0;
      } else if (ny >= FLOOR + 5 && Math.abs(nx - CENTER) <= PLATFORM_HALF) {
        this.hp = Math.max(0, this.hp - shot.damage);
        this.hitFlash = 0.3;
        shot.life = 0;
      }
      shot.x = nx;
      shot.y = ny;
      shot.life -= dt;
      if (
        nx < this.projectileBounds.minX - 50 ||
        nx > this.projectileBounds.maxX + 50 ||
        ny > FLOOR + 80 ||
        ny < this.projectileBounds.minY - 50
      )
        shot.life = 0;
    }
    this.enemyShots = this.enemyShots.filter((p) => p.life > 0);
  }
  physicsBody(room: Room) {
    return room.group === null ? room.body : this.groups.get(room.group)!.body;
  }
  roomParts(room: Room) {
    return room.body.parts.length > 1 ? room.body.parts.slice(1) : [room.body];
  }
  watchWake(body: Matter.Body) {
    // Wake touching rooms before their support moves, even under a gentle push.
    // This only changes their sleep state; it adds no force or connection.
    Matter.Events.on(body, 'sleepEnd', () => {
      const others = Matter.Composite.allBodies(this.physics.world).filter(
        (other) => other !== body && other.isSleeping,
      );
      for (const part of body.parts.length > 1 ? body.parts.slice(1) : [body])
        for (const collision of Matter.Query.collides(part, others))
          for (const other of [collision.bodyA.parent, collision.bodyB.parent])
            if (other !== body && other.isSleeping)
              Matter.Sleeping.set(other, false);
    });
  }
  wakeRooms() {
    // Changing support geometry must also release resting rooms above it.
    for (const body of new Set(this.rooms.map((r) => this.physicsBody(r))))
      Matter.Sleeping.set(body, false);
  }
  syncGroups() {
    for (const room of this.rooms) {
      if (room.group === null) continue;
      const body = this.groups.get(room.group)!.body;
      const offset = Matter.Vector.rotate(room.offset, body.angle);
      Matter.Body.setPosition(
        room.body,
        Matter.Vector.add(body.position, offset),
      );
      Matter.Body.setAngle(room.body, body.angle + room.localAngle);
      // Room bodies are transform proxies; only the group's flat compound body simulates.
      Matter.Body.setVelocity(room.body, {
        x: body.velocity.x - body.angularVelocity * offset.y,
        y: body.velocity.y + body.angularVelocity * offset.x,
      });
      Matter.Body.setAngularVelocity(room.body, body.angularVelocity);
    }
  }
  rigidify(members: Room[]) {
    if (!members.length) return;
    this.wakeRooms();
    const bodies = [...new Set(members.map((r) => this.physicsBody(r)))];
    const total = bodies.reduce((n, b) => n + b.mass, 0);
    const velocity = {
      x: bodies.reduce((n, b) => n + b.velocity.x * b.mass, 0) / total,
      y: bodies.reduce((n, b) => n + b.velocity.y * b.mass, 0) / total,
    };
    const angular =
      bodies.reduce((n, b) => n + b.angularVelocity * b.mass, 0) / total;
    for (const body of bodies)
      Matter.Composite.remove(this.physics.world, body);
    for (const room of members)
      if (room.group !== null) this.groups.delete(room.group);
    const parts = members.flatMap((room) =>
      room.cells.map(([x, y]) => {
        const offset = Matter.Vector.rotate(
          { x: (x - room.cx) * CELL, y: (y - room.cy) * CELL },
          room.body.angle,
        );
        const part = Matter.Bodies.rectangle(
          room.body.position.x + offset.x,
          room.body.position.y + offset.y,
          CELL,
          CELL,
          { density: 0.0022, ...ROOM_SURFACE, restitution: 0.01 },
        );
        Matter.Body.setAngle(part, room.body.angle);
        return part;
      }),
    );
    const body = Matter.Body.create({
      parts,
      ...ROOM_SURFACE,
      frictionAir: 0.018,
      restitution: 0.01,
      sleepThreshold: 90,
    });
    applyCompoundInertia(body);
    this.watchWake(body);
    Matter.Body.setVelocity(body, velocity);
    Matter.Body.setAngularVelocity(body, angular);
    const id = ++this.uid;
    this.groups.set(id, { body, rooms: members.map((r) => r.id) });
    for (const room of members) {
      room.group = id;
      room.offset = Matter.Vector.sub(room.body.position, body.position);
      room.localAngle = room.body.angle;
      room.glued = true;
    }
    Matter.Composite.add(this.physics.world, body);
  }
  glue(room: Room) {
    if (room.vineActivated) return;
    const near = this.rooms.filter(
      (r) =>
        r !== room &&
        Math.hypot(
          r.body.position.x - room.body.position.x,
          r.body.position.y - room.body.position.y,
        ) < 125,
    );
    if (!near.length) return;
    // Union existing groups as well, so overlapping vines never detach old members.
    const chosen = new Set([room.id, ...near.map((r) => r.id)]);
    const groupIds = new Set(
      [room, ...near].map((r) => r.group).filter((id) => id !== null),
    );
    for (const r of this.rooms)
      if (r.group !== null && groupIds.has(r.group)) chosen.add(r.id);
    room.vineActivated = true;
    for (const other of near)
      if (
        !this.links.some(
          (l) =>
            (l.a === room.id && l.b === other.id) ||
            (l.b === room.id && l.a === other.id),
        )
      )
        this.links.push({ a: room.id, b: other.id });
    this.rigidify(this.rooms.filter((r) => chosen.has(r.id)));
    this.sparks(room.body.position.x, room.body.position.y, '#b7da81', 18);
    this.burst(
      room.body.position.x,
      room.body.position.y - 35,
      '原位固定',
      '#b7da81',
    );
    this.sound?.('merge');
  }
  destroyRooms(fallen: Room[]) {
    if (!fallen.length) return;
    this.wakeRooms();
    const ids = new Set(fallen.map((r) => r.id));
    const affected = new Set(
      fallen.map((r) => r.group).filter((id) => id !== null),
    );
    for (const room of fallen) {
      if (room.group === null)
        Matter.Composite.remove(this.physics.world, room.body);
      this.sparks(
        room.body.position.x,
        room.body.position.y,
        TYPES[room.kind].light,
        16,
      );
      this.burst(room.body.position.x, FLOOR - 40, '房间损毁 −30', '#ff9c91');
    }
    this.rooms = this.rooms.filter((r) => !ids.has(r.id));
    if (this.inspectedRoom !== null && ids.has(this.inspectedRoom))
      this.inspectedRoom = null;
    this.links = this.links.filter((l) => !ids.has(l.a) && !ids.has(l.b));
    for (const id of affected) {
      const group = this.groups.get(id)!;
      const remaining = this.rooms.filter((r) => r.group === id);
      if (remaining.length > 1) this.rigidify(remaining);
      else {
        Matter.Composite.remove(this.physics.world, group.body);
        this.groups.delete(id);
        if (remaining.length) {
          const r = remaining[0];
          r.group = null;
          r.glued = false;
          Matter.Sleeping.set(r.body, false);
          Matter.Composite.add(this.physics.world, r.body);
        }
      }
    }
    this.hp = Math.max(0, this.hp - fallen.length * 30);
    this.hitFlash = 0.4;
    this.sound?.('break');
  }
  checkFallenRooms() {
    const fallen = this.rooms.filter(
      (room) =>
        Math.abs(room.body.position.x - CENTER) > 800 ||
        room.body.bounds.min.y > GROUND + 80 ||
        this.roomParts(room).some((part) =>
          part.vertices.some((v) => v.y >= GROUND - 2 && !onPlatform(v.x, 1)),
        ),
    );
    this.destroyRooms(fallen);
  }
  merge() {
    for (const room of this.rooms) {
      if (
        room.age < 2 ||
        room.level >= 3 ||
        room.kind === 'vine' ||
        room.kind === 'mint' ||
        room.body.speed > 0.6
      )
        continue;
      const other = this.rooms.find(
        (r) =>
          r.id !== room.id &&
          !this.mergedPairs.has(
            [room.id, r.id].sort((a, b) => a - b).join(':'),
          ) &&
          r.age > 2 &&
          r.kind === room.kind &&
          r.level === room.level &&
          r.body.speed < 0.6 &&
          Matter.Bounds.overlaps(
            {
              min: {
                x: room.body.bounds.min.x - 4,
                y: room.body.bounds.min.y - 4,
              },
              max: {
                x: room.body.bounds.max.x + 4,
                y: room.body.bounds.max.y + 4,
              },
            },
            r.body.bounds,
          ),
      );
      if (other) {
        this.mergedPairs.add(
          [room.id, other.id].sort((a, b) => a - b).join(':'),
        );
        room.level++;
        other.level++;
        room.merged = true;
        other.merged = true;
        this.combo++;
        this.burst(
          room.body.position.x,
          room.body.position.y - 40,
          `合成 ★${room.level}`,
          '#ffe095',
        );
        this.sparks(room.body.position.x, room.body.position.y, '#ffe095', 16);
        this.sound?.('merge');
      }
    }
  }
  hit(enemy: Enemy, damage: number, kind: Kind) {
    if (enemy.hp <= 0) return;
    if (enemy.kind === 'shield' && (kind === 'archer' || kind === 'frost'))
      damage *= 0.45;
    if (
      enemy.kind === 'ironwarden' &&
      !['cannon', 'bomber', 'laser'].includes(kind)
    )
      damage *= 0.32;
    if (
      !isAirborne(enemy.kind) &&
      !['cannon', 'bomber', 'laser'].includes(kind)
    ) {
      const guardian = this.enemies.find(
        (e) =>
          e.hp > 0 &&
          e.kind === 'sentinel' &&
          e.guarding &&
          Math.abs(e.x - enemy.x) <= 120,
      );
      if (guardian) damage *= guardian === enemy ? 0.3 : 0.5;
    }
    if (enemy.kind === 'berserker' && enemy.windup) damage *= 1.5;
    enemy.hp -= damage;
    if (kind === 'frost') enemy.slow = 2.3;
    this.sparks(enemy.x, this.enemyY(enemy), TYPES[kind].light, 3);
    this.burst(
      enemy.x + (this.random() - 0.5) * 18,
      this.enemyY(enemy) - 20,
      String(Math.round(damage)),
      TYPES[kind].light,
    );
    if (enemy.hp <= 0) {
      const reward =
        MONSTERS[enemy.kind ?? 'grunt'].reward +
        ((this.kills + 1) % 3 === 0 ? this.perks.bounty : 0);
      this.gold += reward;
      this.kills++;
      this.sparks(enemy.x, this.enemyY(enemy), '#e5bd80', 8);
      if (isRewardChampion(enemy.kind)) {
        this.burst(
          enemy.x,
          FLOOR - 45,
          `+${reward} 金币 · 增益解锁`,
          '#f9d67e',
        );
        if (this.phase === 'battle' && this.hp > 0)
          this.rewardQueue.push(enemy.kind);
      } else if (isWanderingElite(enemy.kind)) {
        this.burst(
          enemy.x,
          FLOOR - 45,
          `+${reward} 金币 · 无增益`,
          '#c7b5d9',
        );
      }
    }
  }
  predictedX(enemy: Enemy, seconds: number) {
    if (
      enemy.blocked ||
      enemy.frozen > 0 ||
      (enemy.fuse !== null && enemy.fuse !== undefined)
    )
      return enemy.x;
    const speed =
      enemy.speed * (enemy.enraged ? 1.45 : 1) * (enemy.slow > 0 ? 0.38 : 1);
    const x = enemy.x - enemy.side * speed * seconds;
    const range = MONSTERS[enemy.kind ?? 'grunt'].range;
    return enemy.side < 0
      ? Math.min(x, CENTER - range)
      : Math.max(x, CENTER + range);
  }
  fire(room: Room, target: Enemy) {
    const { x, y } = room.body.position,
      kind = room.kind,
      damage =
        TYPES[kind].damage *
        Math.pow(1.7, room.level - 1) *
        (1 + this.perks.power * 0.15);
    if (!damage) return;
    if (kind === 'fortress') {
      if (!this.spearReach(room, target)) return;
      this.hit(target, damage, kind);
      this.spears.push({
        x,
        y,
        endX: target.x,
        endY: this.enemyY(target),
        life: 0.24,
        max: 0.24,
      });
      return;
    }
    const aimY = this.enemyY(target);
    if (kind === 'laser') {
      const dx = target.x - x,
        dy = aimY - y,
        length = Math.hypot(dx, dy) || 1;
      const endX = x + (dx / length) * 1600,
        endY = y + (dy / length) * 1600;
      for (const e of this.enemies)
        if (
          e.hp > 0 &&
          segmentHit(
            x,
            y,
            endX,
            endY,
            e.x,
            this.enemyY(e),
            this.enemyRadius(e) + 7,
          ) !== null
        )
          this.hit(e, damage, kind);
      this.beams.push({ x, y, endX, endY, life: 0.25, max: 0.25 });
      this.sound?.('laser');
      return;
    }
    if (kind === 'bomber') {
      const flight = Math.min(
        1.65,
        Math.max(0.85, Math.abs(target.x - x) / 280),
      );
      this.projectiles.push({
        x,
        y,
        vx: (this.predictedX(target, flight) - x) / flight,
        vy: (aimY - y - 0.5 * BOMB_GRAVITY * flight * flight) / flight,
        gravity: BOMB_GRAVITY,
        kind,
        damage,
        life: 1,
        trail: [],
      });
      return;
    }
    const speed = kind === 'archer' ? 420 : 310;
    let aimX = target.x;
    for (let n = 0; n < 4; n++)
      aimX = this.predictedX(target, Math.hypot(aimX - x, aimY - y) / speed);
    const dx = aimX - x,
      dy = aimY - y,
      length = Math.hypot(dx, dy) || 1;
    this.projectiles.push({
      x,
      y,
      vx: (dx / length) * speed,
      vy: (dy / length) * speed,
      gravity: 0,
      kind,
      damage,
      life: 1,
      trail: [],
    });
  }
  explode(x: number, y: number, damage: number, kind: Kind) {
    const radius = kind === 'bomber' ? 92 : 55;
    for (const enemy of this.enemies)
      if (
        enemy.hp > 0 &&
        Math.hypot(enemy.x - x, this.enemyY(enemy) - y) <
          radius + this.enemyRadius(enemy) - 2
      )
        this.hit(enemy, damage, kind);
    this.blasts.push({ x, y, radius, life: 0.5, max: 0.5, kind });
    this.sparks(x, y, TYPES[kind].light, kind === 'bomber' ? 28 : 18);
    this.sound?.('boom');
  }
  stepProjectiles(dt: number) {
    for (const p of this.projectiles) {
      const oldX = p.x,
        oldY = p.y,
        nx = p.x + p.vx * dt,
        ny = p.y + p.vy * dt + 0.5 * p.gravity * dt * dt;
      p.vy += p.gravity * dt;
      p.trail.unshift({ x: oldX, y: oldY });
      if (p.trail.length > 8) p.trail.pop();
      let first: Enemy | null = null,
        firstT = Infinity;
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const t = segmentHit(
          oldX,
          oldY,
          nx,
          ny,
          enemy.x,
          this.enemyY(enemy),
          this.enemyRadius(enemy),
        );
        if (t !== null && t < firstT) {
          first = enemy;
          firstT = t;
        }
      }
      const groundT =
        p.gravity > 0 && ny >= FLOOR + 5 && ny > oldY
          ? Math.max(0, (FLOOR + 5 - oldY) / (ny - oldY))
          : Infinity;
      if (first && firstT <= groundT) {
        p.x = oldX + (nx - oldX) * firstT;
        p.y = oldY + (ny - oldY) * firstT;
        p.life = 0;
        if (p.kind === 'cannon' || p.kind === 'bomber')
          this.explode(p.x, p.y, p.damage, p.kind);
        else this.hit(first, p.damage, p.kind);
      } else if (groundT <= 1) {
        p.x = oldX + (nx - oldX) * groundT;
        p.y = FLOOR + 5;
        p.life = 0;
        this.explode(p.x, p.y, p.damage, p.kind);
      } else {
        p.x = nx;
        p.y = ny;
      }
      const b = this.projectileBounds;
      if (
        p.x < b.minX - 40 ||
        p.x > b.maxX + 40 ||
        p.y < b.minY - 40 ||
        p.y > b.maxY + 40
      )
        p.life = 0;
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0);
  }
  step(dt: number) {
    if (
      !this.active ||
      this.paused ||
      this.phase === 'lost' ||
      this.phase === 'won' ||
      this.rewards.length > 0
    )
      return;
    if (this.rewardQueue.length && this.hp > 0) {
      this.offerRewards();
      this.emit();
      return;
    }
    dt = Math.min(dt, 0.04) * this.speed;
    this.time += dt;
    this.hornCooldown = Math.max(0, this.hornCooldown - dt);
    for (const key of Object.keys(SKILLS) as SkillId[])
      this.skillCooldowns[key] = Math.max(0, this.skillCooldowns[key] - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2);
    this.noticeTime -= dt;
    this.physicsRemainder += dt;
    while (this.physicsRemainder + 1e-10 >= PHYSICS_STEP) {
      this.physicsRemainder = Math.max(0, this.physicsRemainder - PHYSICS_STEP);
      Matter.Engine.update(this.physics, PHYSICS_STEP * 1000);
      this.syncGroups();
      this.checkFallenRooms();
    }
    for (const room of this.rooms) {
      room.age += dt;
      room.hitFlash = Math.max(0, room.hitFlash - dt);
      room.cooldown -= dt;
      if (
        room.kind === 'barracks' &&
        this.phase === 'battle' &&
        room.age > 1 &&
        Math.abs(room.body.angle) < 1.2 &&
        this.physicsBody(room).speed < 0.8
      ) {
        room.recruitTimer = Math.max(0, room.recruitTimer - dt);
        if (room.recruitTimer <= 0 && this.recruit(room))
          room.recruitTimer = TYPES.barracks.rate;
      }
      if (
        room.kind === 'vine' &&
        room.age > 1 &&
        room.body.speed < 0.8 &&
        !room.vineActivated
      )
        this.glue(room);
      if (
        TYPES[room.kind].damage &&
        room.cooldown <= 0 &&
        Math.abs(room.body.angle) < 1.2 &&
        room.age > 0.8
      ) {
        const enemies = this.enemies.filter(
          (e) =>
            e.hp > 0 &&
            (room.kind !== 'fortress' || this.spearReach(room, e)) &&
            (!isAirborne(e.kind ?? 'grunt') ||
              ['archer', 'frost', 'laser'].includes(room.kind)),
        );
        if (enemies.length) {
          const target = enemies.reduce((best, e) =>
            Math.abs(e.x - CENTER) < Math.abs(best.x - CENTER) ? e : best,
          );
          this.fire(room, target);
          room.cooldown = TYPES[room.kind].rate / (1 + this.perks.haste * 0.12);
        }
      }
    }
    this.stepSupportRooms(dt);
    this.mergeTime += dt;
    if (this.mergeTime > 0.7) {
      this.mergeTime = 0;
      this.merge();
    }
    this.stepSkills(dt);
    if (this.phase === 'battle') {
      this.spawnTimer -= dt;
      if (this.leftToSpawn > 0 && this.spawnTimer <= 0) {
        this.spawnEnemy();
        this.spawnTimer = Math.max(0.23, 0.82 - this.wave * 0.02);
      }
      this.stepSoldiers(dt);
      this.stepEnemies(dt);
      this.stepEnemyShots(dt);
      this.soldiers = this.soldiers.filter((s) => s.hp > 0);
      if (
        this.hp > 0 &&
        this.rewardQueue.length === 0 &&
        this.rewards.length === 0 &&
        this.leftToSpawn === 0 &&
        !this.enemies.some((e) => e.hp > 0) &&
        this.enemyShots.length === 0
      ) {
        this.gold += 12 + Math.floor(this.wave * 0.6);
        this.restoreFortress(this.perks.masonry);
        this.best = Math.max(this.best, this.wave);
        if (this.wave >= 30) {
          this.phase = 'won';
          this.sound?.('win');
        } else {
          this.phase = 'break';
          this.countdown = 15;
          this.tell(
            `第 ${this.wave} 波守住了！+${12 + Math.floor(this.wave * 0.6)} 金币，继续加固`,
          );
          this.sound?.('coin');
        }
      }
    } else if (this.phase === 'break') {
      this.countdown -= dt;
      if (this.countdown <= 0) this.startWave();
    }
    this.stepProjectiles(dt);
    for (const beam of this.beams) beam.life -= dt;
    for (const spear of this.spears) spear.life -= dt;
    this.spears = this.spears.filter((s) => s.life > 0);
    for (const blast of this.blasts) blast.life -= dt;
    for (const pulse of this.pulses) pulse.life -= dt;
    this.pulses = this.pulses.filter((p) => p.life > 0);
    this.beams = this.beams.filter((b) => b.life > 0);
    this.blasts = this.blasts.filter((b) => b.life > 0);
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!p.text) p.vy += 150 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0).slice(-350);
    if (this.hp <= 0) {
      this.hp = 0;
      this.phase = 'lost';
      this.selected = null;
      this.selectedSkill = null;
      this.rewards = [];
      this.rewardQueue = [];
      this.rewardSource = null;
      this.sound?.('lose');
      this.emit();
    }
    if (this.rewardQueue.length && this.hp > 0) {
      this.offerRewards();
      this.emit();
    }
    if (this.noticeTime < 0 && this.phase === 'battle')
      this.notice = this.selectedSkill
        ? `点击战场施放${SKILLS[this.selectedSkill].name} · Esc 取消`
        : this.selected === null
          ? '战斗中也可以搭建 · 同类同级房间相邻会自动升星'
          : '移动到城堡上方，点击或松手放下';
    this.tick += dt;
    if (this.tick > 0.12) {
      this.tick = 0;
      this.emit();
    }
  }
  dispose() {
    this.active = false;
    Matter.Composite.clear(this.physics.world, false);
    Matter.Engine.clear(this.physics);
    this.onChange = null;
    this.groups.clear();
    this.links = [];
    this.beams = [];
    this.spears = [];
    this.areaEffects = [];
    this.selectedSkill = null;
    this.blasts = [];
    this.enemyShots = [];
    this.pulses = [];
    this.rewards = [];
    this.rewardQueue = [];
    this.rewardSource = null;
    this.soldiers = [];
    this.barricades = [];
    this.blueprint = null;
  }
}
