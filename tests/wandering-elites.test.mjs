import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/lib/game/engine.ts';
import {
  WANDERING_ELITES,
  isElite,
  isRewardChampion,
  isWanderingElite,
  waveRoster,
} from '../src/lib/game/content.ts';

test('wandering elites enter progressively and never replace reward champions', () => {
  assert.equal(waveRoster(6).some(isWanderingElite), false);
  assert.equal(waveRoster(7).filter(isWanderingElite).length, 1);
  assert.equal(waveRoster(14).filter(isWanderingElite).length, 2);
  assert.equal(waveRoster(21).filter(isWanderingElite).length, 3);
  assert.equal(waveRoster(25).filter(isRewardChampion).length, 2);
  assert.equal(waveRoster(30).filter((kind) => kind === 'brute').length, 1);
  for (const kind of WANDERING_ELITES) {
    assert(isElite(kind));
    assert.equal(isRewardChampion(kind), false);
  }
});

test('wandering elite kills grant coins but never queue perk choices', () => {
  for (const kind of WANDERING_ELITES) {
    const game = new Game(() => 0.4);
    game.wave = 20;
    game.phase = 'battle';
    const gold = game.gold;
    const enemy = game.spawnEnemy(kind);
    game.hit(enemy, 1_000_000, 'laser');
    assert(game.gold > gold, `${kind} should still grant coins`);
    assert.equal(game.rewardQueue.length, 0, `${kind} must not queue a perk`);
    assert.equal(game.rewards.length, 0, `${kind} must not open perk choices`);
    game.dispose();
  }
});

test('black iron warden resists ordinary damage but not siege damage', () => {
  const game = new Game(() => 0.4);
  game.wave = 20;
  const archerTarget = game.spawnEnemy('ironwarden');
  const archerHp = archerTarget.hp;
  game.hit(archerTarget, 100, 'archer');
  assert.equal(archerHp - archerTarget.hp, 32);

  const cannonTarget = game.spawnEnemy('ironwarden');
  const cannonHp = cannonTarget.hp;
  game.hit(cannonTarget, 100, 'cannon');
  assert.equal(cannonHp - cannonTarget.hp, 100);
  game.dispose();
});

test('all wandering elites fire visible projectiles that damage rooms', () => {
  for (const kind of WANDERING_ELITES) {
    const game = new Game(() => 0.4);
    game.wave = 20;
    game.phase = 'battle';
    const room = game.addRoom('archer', [[0, 0]], 480, 500);
    room.age = 3;
    const enemy = game.spawnEnemy(kind);
    enemy.side = -1;
    enemy.x = 480 - 180;
    enemy.y = 549;
    enemy.flightY = 549;
    enemy.attack = 0;

    game.stepEnemies(0.01);
    assert.equal(game.enemyShots.length, 1, `${kind} should fire a projectile`);
    assert.equal(game.enemyShots[0].kind, kind);
    const hp = room.hp;
    for (let frame = 0; frame < 180 && game.enemyShots.length; frame++)
      game.stepEnemyShots(1 / 60);
    assert(room.hp < hp, `${kind} projectile should damage a room`);
    game.dispose();
  }
});

test('ordinary waves trade enemy count for sturdier individual troops', () => {
  for (const wave of [1, 10, 20, 30]) {
    assert.equal(waveRoster(wave).length, 5 + Math.floor(wave * 1.6));
  }
  const game = new Game(() => 0.4);
  game.wave = 20;
  const grunt = game.spawnEnemy('grunt');
  const elite = game.spawnEnemy('ironwarden');
  const baseHp = (30 + game.wave * 9) * (1 + (game.wave - 4) * 0.018);
  assert.equal(grunt.maxHp, baseHp * 2.4);
  assert.equal(elite.maxHp, baseHp * 11);
  game.dispose();
});

test('reward champions retain their perk drops', () => {
  for (const kind of ['sentinel', 'berserker', 'brute']) {
    const game = new Game(() => 0.4);
    game.wave = 20;
    game.phase = 'battle';
    game.hit(game.spawnEnemy(kind), 1_000_000, 'laser');
    assert.equal(game.rewardQueue.length, 1, `${kind} should still queue a perk`);
    game.dispose();
  }
});
