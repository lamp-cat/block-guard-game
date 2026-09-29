import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CENTER, FLOOR } from '../src/lib/game/engine.ts';

const game = () => {
  const g = new Game(() => 0.4);
  g.gold = 1000;
  return g;
};

test('engineer heals damaged rooms in range but not outside its radius', () => {
  const g = game();
  const engineer = g.addRoom('engineer', [[0, 0]], CENTER, FLOOR - 100);
  const near = g.addRoom('archer', [[0, 0]], CENTER + 100, FLOOR - 100);
  const far = g.addRoom('archer', [[0, 0]], CENTER + 240, FLOOR - 100);
  for (const room of [engineer, near, far]) room.age = 3;
  engineer.cooldown = 0;
  near.hp -= 50;
  far.hp -= 50;
  const nearBefore = near.hp;
  const farBefore = far.hp;
  g.stepSupportRooms(0.01);
  assert.equal(near.hp, nearBefore + 26);
  assert.equal(far.hp, farBefore);
  assert.equal(engineer.cooldown, 4);
  g.dispose();
});

test('shield room absorbs hostile projectiles before protected room takes damage', () => {
  const g = game();
  const shield = g.addRoom('shieldRoom', [[0, 0]], CENTER, FLOOR - 100);
  const target = g.addRoom('archer', [[0, 0]], CENTER + 110, FLOOR - 100);
  shield.age = 3;
  target.age = 3;
  const targetHp = target.hp;
  const shieldBefore = shield.shield;
  g.enemyShots.push({
    x: CENTER + 180,
    y: FLOOR - 100,
    vx: -300,
    vy: 0,
    damage: 40,
    life: 2,
    kind: 'hexer',
  });
  g.stepEnemyShots(0.3);
  assert.equal(target.hp, targetHp);
  assert.equal(shield.shield, shieldBefore - 40);
  assert.equal(g.enemyShots.length, 0);
  g.dispose();
});

test('three room cards are consumed and can only be reset after all are used', () => {
  const g = game();
  g.cards = [
    { id: 1001, kind: 'archer', shape: [[0, 0]] },
    { id: 1002, kind: 'engineer', shape: [[0, 0]] },
    { id: 1003, kind: 'shieldRoom', shape: [[0, 0]] },
  ];
  const goldBeforeEarlyRefresh = g.gold;
  g.refresh();
  assert.equal(g.gold, goldBeforeEarlyRefresh);
  assert.equal(g.cards.length, 3);

  for (const x of [CENTER - 56, CENTER, CENTER + 56]) {
    g.select(0);
    g.pointerX = x;
    g.pointerY = FLOOR - 200;
    assert(g.drop());
  }
  assert.equal(g.cards.length, 0);
  const goldBeforeReset = g.gold;
  g.refresh();
  assert.equal(g.gold, goldBeforeReset - 20);
  assert.equal(g.cards.length, 3);
  g.dispose();
});

test('airborne enemies receive the exact 30 percent health reduction', () => {
  const g = game();
  g.wave = 20;
  const bat = g.spawnEnemy('bat');
  const wyvern = g.spawnEnemy('wyvern');
  const growth = 1 + (g.wave - 4) * 0.018;
  const base = (30 + g.wave * 9) * 2.4 * growth;
  assert(Math.abs(bat.maxHp - base * 1.4 * 0.7) < 1e-9);
  assert(Math.abs(wyvern.maxHp - base * 3 * 0.7) < 1e-9);
  g.dispose();
});
