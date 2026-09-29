export const MONSTERS = {
  grunt: {
    name: '步兵',
    tactic: '近身劈砍底层房间',
    counter: '弓箭手快速清理',
    color: '#b4a18a',
    wave: 1,
    health: 1,
    speed: 1,
    range: 116,
    interval: 1.3,
    damage: 8,
    reward: 1,
  },
  runner: {
    name: '冲锋兽',
    tactic: '快速突进，首次撞击更重',
    counter: '冰法师或号角截停冲锋',
    color: '#e1a66c',
    wave: 2,
    health: 1.3,
    speed: 2.2,
    range: 116,
    interval: 1.6,
    damage: 7,
    reward: 1,
  },
  shield: {
    name: '铁盾卫',
    tactic: '挡下大部分箭矢，缓慢推进',
    counter: '火炮、炸弹和激光破盾',
    color: '#99baca',
    wave: 3,
    health: 3.3,
    speed: 0.7,
    range: 116,
    interval: 2,
    damage: 14,
    reward: 2,
  },
  shooter: {
    name: '荒野弩手',
    tactic: '停在远处，瞄准上层房间射击',
    counter: '多搭高处火力，注意修复塔顶',
    color: '#d6a6bc',
    wave: 4,
    health: 1.4,
    speed: 0.95,
    range: 285,
    interval: 3.2,
    damage: 18,
    reward: 2,
  },
  sapper: {
    name: '爆破怪',
    tactic: '靠近后点燃炸药，范围破坏',
    counter: '在引信燃尽前击败或冻结',
    color: '#ee886b',
    wave: 6,
    health: 2,
    speed: 1.3,
    range: 130,
    interval: 1.5,
    damage: 52,
    reward: 2,
  },
  shaman: {
    name: '苔原萨满',
    tactic: '远处施法，定期治疗附近同伴',
    counter: '用范围攻击同时压低敌群血量',
    color: '#b7d895',
    wave: 8,
    health: 2.2,
    speed: 0.8,
    range: 320,
    interval: 4,
    damage: 12,
    reward: 3,
  },
  ironwarden: {
    name: '黑铁监军',
    tactic: '披重甲稳定推进，在中距离发射重弩轰击房间',
    counter: '火炮、炸弹和激光可绕过重甲，优先集火',
    color: '#9aa5a8',
    wave: 7,
    health: 11,
    speed: 0.62,
    range: 250,
    interval: 2.4,
    damage: 24,
    reward: 5,
  },
  razorhound: {
    name: '裂刃猎手',
    tactic: '高速逼近，在中距离连续释放锋利刃波',
    counter: '用冰冻延缓突袭，在其连续射击前集火',
    color: '#e07e68',
    wave: 10,
    health: 8,
    speed: 1.7,
    range: 205,
    interval: 1.1,
    damage: 18,
    reward: 5,
  },
  hexer: {
    name: '蚀骨术士',
    tactic: '在远处投射缓慢但高伤的蚀骨法球，优先轰击高层房间',
    counter: '用远程火力快速集火，避免高塔孤立',
    color: '#c28cd6',
    wave: 13,
    health: 9,
    speed: 0.72,
    range: 365,
    interval: 2.8,
    damage: 34,
    reward: 5,
  },
  brute: {
    name: '裂地暴君',
    tactic: '标记落石轰击；半血狂暴并召来援军',
    counter: '红圈出现时加固或修复目标，号角延缓落石',
    color: '#db867c',
    wave: 10,
    health: 45,
    speed: 0.65,
    range: 120,
    interval: 2.8,
    damage: 48,
    reward: 25,
  },
  sentinel: {
    name: '壁垒统领',
    tactic: '交替结阵与行军，结阵时为附近地面敌人减伤',
    counter: '火炮、炸弹、激光穿过护阵；解除结阵后集火',
    color: '#90c3cf',
    wave: 5,
    health: 18,
    speed: 0.85,
    range: 116,
    interval: 2,
    damage: 26,
    reward: 8,
  },
  berserker: {
    name: '狂战先锋',
    tactic: '蓄力横扫防线，半血后加速狂暴',
    counter: '蓄力时受到额外伤害，用号角争取集火时间',
    color: '#f0a06d',
    wave: 5,
    health: 16,
    speed: 1.25,
    range: 116,
    interval: 3.8,
    damage: 44,
    reward: 8,
  },
  bat: {
    name: '夜翼蝠',
    tactic: '飞越地面防线，扑击高处房间',
    counter: '弓箭、冰法、激光或远程士兵对空',
    color: '#bc9be2',
    wave: 3,
    health: 1.4,
    speed: 1.5,
    range: 85,
    interval: 1.6,
    damage: 12,
    reward: 1,
  },
  wyvern: {
    name: '焰翼龙',
    tactic: '悬停空中，向城堡发射火球',
    counter: '近战无法拦截，布置远程士兵',
    color: '#edac72',
    wave: 7,
    health: 3,
    speed: 0.9,
    range: 230,
    interval: 3,
    damage: 22,
    reward: 3,
  },
} as const;
export type EnemyKind = keyof typeof MONSTERS;
export const REWARD_CHAMPIONS = ['sentinel', 'berserker', 'brute'] as const;
export const WANDERING_ELITES = ['ironwarden', 'razorhound', 'hexer'] as const;
export const isRewardChampion = (kind: EnemyKind) =>
  (REWARD_CHAMPIONS as readonly EnemyKind[]).includes(kind);
export const isWanderingElite = (kind: EnemyKind) =>
  (WANDERING_ELITES as readonly EnemyKind[]).includes(kind);
export const isElite = (kind: EnemyKind) =>
  kind === 'sentinel' || kind === 'berserker' || isWanderingElite(kind);
export const isChampion = (kind: EnemyKind) =>
  isElite(kind) || kind === 'brute';
export const enemyScale = (kind: EnemyKind) =>
  kind === 'brute' ? 3 : isElite(kind) ? 2 : 1;
export const waveTier = (wave: number) =>
  wave > 0 && wave % 10 === 0
    ? 'boss'
    : wave > 0 && wave % 5 === 0
      ? 'elite'
      : 'normal';
export const isAirborne = (kind: EnemyKind) =>
  kind === 'bat' || kind === 'wyvern';
export const PERKS = {
  power: {
    name: '精工武器',
    description: '房间与士兵伤害 +15%，可叠加。',
    label: '火力',
    color: '#ecaa8f',
  },
  haste: {
    name: '疾风装填',
    description: '房间与士兵攻击速度 +12%，可叠加。',
    label: '攻速',
    color: '#9ccdde',
  },
  bounty: {
    name: '赏金契约',
    description: '每累计击败 3 个敌人额外获得 1 金币，可叠加。',
    label: '经济',
    color: '#e4c587',
  },
  masonry: {
    name: '随军工匠',
    description: '选择时及每波结束：修复房间 20 耐久、城堡 60 耐久。',
    label: '修复',
    color: '#afd398',
  },
  supply: {
    name: '应急补给',
    description: '立即获得 35 金币，并恢复城堡 100 耐久。',
    label: '补给',
    color: '#c5b3e4',
  },
} as const;
export type PerkId = keyof typeof PERKS;

export const SKILLS = {
  lightning: {
    name: '区域雷击',
    radius: 100,
    cooldown: 35,
    description: '点击范围造成雷电伤害并短暂眩晕，可对空',
    key: 'Q',
    color: '#ace4ff',
  },
  arrowRain: {
    name: '箭雨',
    radius: 115,
    cooldown: 42,
    description: '点击范围持续落箭 3 秒，可对空',
    key: 'E',
    color: '#f3d395',
  },
} as const;
export type SkillId = keyof typeof SKILLS;

export function waveRoster(wave: number): EnemyKind[] {
  const pool: EnemyKind[] = [];
  for (const kind of [
    'runner',
    'shield',
    'shooter',
    'sapper',
    'shaman',
    'bat',
    'wyvern',
  ] as const)
    if (wave >= MONSTERS[kind].wave) pool.push(kind);
  const roster: EnemyKind[] = [];
  const ordinaryCount = 5 + Math.floor(wave * 1.6);
  for (let n = 0; n < ordinaryCount; n++)
    roster.push(
      pool.length && n % 3 === 2
        ? pool[(Math.floor(n / 3) + wave - 1) % pool.length]
        : 'grunt',
    );
  if (waveTier(wave) === 'boss')
    roster[Math.floor(roster.length / 3)] = 'brute';
  else if (waveTier(wave) === 'elite') {
    const count = wave >= 15 ? 2 : 1;
    for (let n = 0; n < count; n++)
      roster[Math.floor(((n + 1) * roster.length) / (count + 1))] =
        n % 2 === 0 ? 'sentinel' : 'berserker';
  }

  const availableWanderers = WANDERING_ELITES.filter(
    (kind) => wave >= MONSTERS[kind].wave,
  );
  if (availableWanderers.length) {
    const count = Math.min(3, 1 + Math.floor(Math.max(0, wave - 7) / 7));
    for (let n = 0; n < count; n++) {
      const kind = availableWanderers[(wave + n) % availableWanderers.length];
      const index = Math.floor(((n + 1) * roster.length) / (count + 1));
      if (!isRewardChampion(roster[index])) roster[index] = kind;
      else roster[Math.min(roster.length - 1, index + 1)] = kind;
    }
  }
  return roster;
}

export function waveForecast(wave: number) {
  const roster = waveRoster(Math.min(30, Math.max(1, wave)));
  return [...new Set(roster)].map((kind) => ({
    kind,
    count: roster.filter((k) => k === kind).length,
  }));
}
