# 方块守卫

一款基于 React、TypeScript、Vite、Matter.js 和 Canvas 的物理堆叠塔防网页游戏。

## 玩法

- 使用三个随机房间搭建堡垒，卡牌用完后花费金币重置。
- 房间包含弓箭、火炮、冰法、投弹、激光、工程师、护盾、金库和藤蔓等类型。
- 抵御地面、飞行、精英与 Boss 敌人，守住 30 波即可获胜。
- 支持房间加固、修复、兵营招募、区域技能和主动控场。

## 本地运行

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run build
```

构建产物生成在 `dist/` 目录。

## 测试

```bash
node --experimental-strip-types --test tests/*.test.mjs
```
