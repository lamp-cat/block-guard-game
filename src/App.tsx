
import { useEffect, useRef, useState } from 'react';
import {
  Castle,
  Coins,
  Shield,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  HelpCircle,
  ArrowUpRight,
  RefreshCw,
  ChevronRight,
  Flag,
  MousePointer2,
  Sprout,
  Swords,
  X,
  Hammer,
  HeartPulse,
  Snowflake,
  BookOpen,
  Fence,
  Tent,
  Sparkles,
  Zap,
  ArrowDownToLine,
} from 'lucide-react';
import {
  MONSTERS,
  PERKS,
  waveForecast,
  isElite,
  waveTier,
  SKILLS,
  type SkillId,
  type EnemyKind,
  type PerkId,
} from '@/lib/game/content';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import {
  Game,
  TYPES,
  CELL,
  CENTER,
  BUILD_HALF_WIDTH,
  type Card,
  type Snapshot,
} from '@/lib/game/engine';
import { render, getView, toWorld, piece, type View } from '@/lib/game/render';

function CardArt({ card }: { card: Card }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 200, 100);
    const cells = card.shape;
    const maxX = Math.max(...cells.map((c) => c[0])),
      maxY = Math.max(...cells.map((c) => c[1]));
    const scale = Math.min(1.05, 74 / ((maxY + 1) * CELL));
    ctx.save();
    ctx.translate(100, 49);
    ctx.scale(scale, scale);
    piece(ctx, cells, card.kind, maxX / 2, maxY / 2);
    ctx.restore();
  }, [card]);
  return <canvas ref={ref} width={200} height={100} aria-hidden="true" />;
}
const initial: Snapshot = {
  gold: 110,
  hp: 1000,
  wave: 0,
  phase: 'ready',
  paused: false,
  speed: 1,
  cards: [],
  selected: null,
  rotation: 0,
  kills: 0,
  rooms: 0,
  height: 0,
  best: 0,
  countdown: 0,
  notice: '选择一块房间，开始搭建你的堡垒',
  combo: 0,
  inspected: null,
  rewards: [],
  rewardSource: null,
  perks: { power: 0, haste: 0, bounty: 0, masonry: 0, supply: 0 },
  forecast: waveForecast(1),
  hornCooldown: 0,
  selectedSkill: null,
  skillCooldowns: { lightning: 0, arrowRain: 0 },
  blueprint: null,
  soldiers: 0,
  barricades: 0,
};
export default function App() {
  const [state, setState] = useState<Snapshot>(initial),
    [help, setHelp] = useState(false),
    [bestiary, setBestiary] = useState(false),
    [resetOpen, setResetOpen] = useState(false),
    [muted, setMuted] = useState(false),
    [run, setRun] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null),
    game = useRef<Game | null>(null),
    view = useRef<View>({ scale: 1, ground: 0, width: 960, height: 500 }),
    audio = useRef<AudioContext | null>(null),
    mute = useRef(false),
    dragging = useRef(false),
    startPoint = useRef({ x: 0, y: 0 }),
    pausedByHelp = useRef(false),
    lastSound = useRef(0);
  const done = state.phase === 'won' || state.phase === 'lost';
  function sound(kind: string) {
    if (mute.current) return;
    try {
      const now = performance.now();
      if (now - lastSound.current < 80) return;
      lastSound.current = now;
      audio.current ??= new AudioContext();
      const ac = audio.current;
      if (ac.state === 'suspended') void ac.resume();
      const osc = ac.createOscillator(),
        gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      const freq: Record<string, number> = {
        drop: 150,
        coin: 780,
        rotate: 320,
        merge: 660,
        boom: 70,
        laser: 920,
        break: 65,
        wave: 240,
        hurt: 85,
        win: 880,
        lose: 110,
      };
      osc.type = kind === 'boom' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq[kind] ?? 240, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        (freq[kind] ?? 240) * (kind === 'merge' ? 1.5 : 0.6),
        ac.currentTime + 0.15,
      );
      gain.gain.setValueAtTime(kind === 'boom' ? 0.025 : 0.035, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
      osc.start();
      osc.stop(ac.currentTime + 0.21);
    } catch {
      /* Audio is optional on browsers without Web Audio. */
    }
  }
  useEffect(() => {
    const surface = canvas.current;
    if (!surface) return;
    const ctx = surface.getContext('2d');
    if (!ctx) return;
    const g = new Game();
    game.current = g;
    g.onChange = setState;
    g.sound = sound;
    try {
      g.best = Number(localStorage.getItem('blockwatch-best') || 0);
    } catch {}
    g.emit();
    const heldArrows = new Set<string>();
    let frame = 0,
      last = 0;
    let size = { width: 1, height: 1 };
    const resize = () => {
      const rect = surface.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = { width: rect.width, height: rect.height };
      surface.width = Math.round(rect.width * dpr);
      surface.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    resize();
    const loop = (t: number) => {
      if (last && (g.selected !== null || g.selectedSkill) && !g.paused) {
        const direction =
          Number(heldArrows.has('ArrowRight')) -
          Number(heldArrows.has('ArrowLeft'));
        if (direction)
          g.pointerX = Math.max(
            g.blueprint?.kind === 'barricade' || g.selectedSkill
              ? g.projectileBounds.minX + 38
              : CENTER - BUILD_HALF_WIDTH,
            Math.min(
              g.blueprint?.kind === 'barricade' || g.selectedSkill
                ? g.projectileBounds.maxX - 38
                : CENTER + BUILD_HALF_WIDTH,
              g.pointerX + direction * 180 * Math.min((t - last) / 1000, 0.04),
            ),
          );
        if (g.selectedSkill) {
          const vertical =
            Number(heldArrows.has('ArrowDown')) -
            Number(heldArrows.has('ArrowUp'));
          g.pointerY = Math.max(
            g.projectileBounds.minY + 20,
            Math.min(
              570,
              g.pointerY + vertical * 180 * Math.min((t - last) / 1000, 0.04),
            ),
          );
        }
      }
      view.current = getView(g, size.width, size.height);
      const topLeft = toWorld(view.current, 0, 0),
        bottomRight = toWorld(view.current, size.width, size.height);
      g.projectileBounds = {
        minX: topLeft.x,
        maxX: bottomRight.x,
        minY: topLeft.y,
        maxY: bottomRight.y,
      };
      if (last) g.step((t - last) / 1000);
      last = t;
      view.current = getView(g, size.width, size.height);
      render(ctx, g, view.current);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const keyboard = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('[role="dialog"],[role="alertdialog"],input,textarea')
      )
        return;
      if (
        e.key === ' ' &&
        g.selected === null &&
        !g.selectedSkill &&
        e.target instanceof HTMLElement &&
        e.target.closest('button')
      )
        return;
      if (
        [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'q',
          'Q',
          'e',
          'E',
          ' ',
          'r',
          'R',
          'f',
          'F',
          'i',
          'I',
          'Escape',
          'p',
          'P',
        ].includes(e.key)
      )
        e.preventDefault();
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if ((g.selected !== null || g.selectedSkill) && !g.paused)
          heldArrows.add(e.key);
      }
      if (e.key === 'r' || e.key === 'R') g.rotate();
      if (e.key === 'Escape') g.cancel();
      if (e.key === 'p' || e.key === 'P') g.togglePause();
      if ((e.key === 'f' || e.key === 'F') && !e.repeat) g.activateHorn();
      if (e.key.toLowerCase() === 'q' && !e.repeat) g.selectSkill('lightning');
      if (e.key.toLowerCase() === 'e' && !e.repeat) g.selectSkill('arrowRain');
      if ((e.key === 'i' || e.key === 'I') && !e.repeat) g.inspectNext();
      if (e.key === ' ') {
        if (g.selectedSkill) g.castSkill();
        else if (g.selected === null) g.startWave();
        else g.drop();
      }
      if (['1', '2', '3'].includes(e.key)) g.select(Number(e.key) - 1);
    };
    window.addEventListener('keydown', keyboard);
    const releaseKey = (e: KeyboardEvent) => heldArrows.delete(e.key);
    const releaseKeys = () => heldArrows.clear();
    window.addEventListener('keyup', releaseKey);
    window.addEventListener('blur', releaseKeys);
    const hidden = () => {
      if (document.hidden) releaseKeys();
      if (document.hidden && !g.paused && g.phase === 'battle') g.togglePause();
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown', keyboard);
      window.removeEventListener('keyup', releaseKey);
      window.removeEventListener('blur', releaseKeys);
      document.removeEventListener('visibilitychange', hidden);
      g.dispose();
    };
  }, [run]);
  useEffect(() => {
    if (state.best)
      try {
        localStorage.setItem('blockwatch-best', String(state.best));
      } catch {}
  }, [state.best]);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current || !canvas.current || !game.current) return;
      const rect = canvas.current.getBoundingClientRect(),
        p = toWorld(view.current, e.clientX - rect.left, e.clientY - rect.top);
      game.current.pointerX = p.x;
      game.current.pointerY = p.y;
    };
    const up = (e: PointerEvent) => {
      if (!dragging.current || !canvas.current) return;
      dragging.current = false;
      const rect = canvas.current.getBoundingClientRect();
      if (
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom &&
        Math.hypot(
          e.clientX - startPoint.current.x,
          e.clientY - startPoint.current.y,
        ) > 8
      ) {
        const g = game.current;
        if (g) {
          const p = toWorld(
            view.current,
            e.clientX - rect.left,
            e.clientY - rect.top,
          );
          g.pointerX = p.x;
          g.pointerY = p.y;
          g.drop();
        }
      }
    };
    const cancel = () => {
      dragging.current = false;
      game.current?.cancel();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, []);
  const movePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const p = toWorld(
      view.current,
      e.clientX - rect.left,
      e.clientY - rect.top,
    );
    if (game.current) {
      game.current.pointerX = p.x;
      game.current.pointerY = p.y;
    }
  };
  const openHelp = (open: boolean) => {
    setHelp(open);
    if (open && game.current && !game.current.paused && !done) {
      game.current.togglePause();
      pausedByHelp.current = true;
    } else if (!open && pausedByHelp.current) {
      game.current?.togglePause();
      pausedByHelp.current = false;
    }
  };
  const openReset = (open: boolean) => {
    setResetOpen(open);
    if (open && game.current && !game.current.paused && !done) {
      game.current.togglePause();
      pausedByHelp.current = true;
    } else if (!open && pausedByHelp.current) {
      game.current?.togglePause();
      pausedByHelp.current = false;
    }
  };
  const openBestiary = (open: boolean) => {
    setBestiary(open);
    if (open && game.current && !game.current.paused && !done) {
      game.current.togglePause();
      pausedByHelp.current = true;
    } else if (!open && pausedByHelp.current) {
      game.current?.togglePause();
      pausedByHelp.current = false;
    }
  };
  const restart = () => {
    setResetOpen(false);
    pausedByHelp.current = false;
    setState(initial);
    setRun((n) => n + 1);
  };
  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Castle size={25} strokeWidth={1.6} />
          </div>
          <div>
            <h1>
              方块守卫<span className="brand-dot">.</span>
            </h1>
            <p>STACK & DEFEND</p>
          </div>
        </div>
        <div className="chapter">
          <span className="chapter-dash" />
          <span>无尽森林</span>
          <span className="chapter-dash" />
        </div>
        <div className="top-actions">
          <button
            className="icon-button"
            onClick={() => openHelp(true)}
            aria-label="查看玩法"
          >
            <HelpCircle size={19} />
          </button>
          <button
            className="icon-button"
            onClick={() => {
              setMuted(!muted);
              mute.current = !muted;
            }}
            aria-label={muted ? '开启音效' : '关闭音效'}
          >
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <span className="toolbar-separator" />
          <button
            className="icon-button"
            onClick={() => openReset(true)}
            aria-label="重新开始"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>
      <section className="battlefield" aria-label="城堡战场">
        <div className="stage-scenery" />
        <div className="stage-vignette" />
        <div className="battle-hud">
          <div className="health">
            <div className="health-label">
              <Shield size={15} />
              <span>城堡耐久</span>
              <b>
                {state.hp}
                <small> / 1000</small>
              </b>
            </div>
            <Progress
              className={`health-progress ${state.hp < 300 ? 'danger' : ''}`}
              value={state.hp / 10}
              aria-label="城堡耐久"
            />
          </div>
          <div className="wave">
            <span className="wave-label">
              {state.phase === 'ready'
                ? '准备迎敌'
                : state.phase === 'break'
                  ? '休整时间'
                  : '正在抵御'}
            </span>
            <div>
              第{' '}
              <strong>
                {String(Math.max(1, state.wave)).padStart(2, '0')}
              </strong>
              <span> / 30 波</span>
            </div>
            <div className="wave-pips">
              {Array.from({ length: 30 }, (_, i) => (
                <i
                  key={i}
                  className={`${i < state.wave ? 'lit' : ''} ${waveTier(i + 1)}`}
                  title={`第 ${i + 1} 波${waveTier(i + 1) === 'boss' ? ' · Boss' : waveTier(i + 1) === 'elite' ? ' · 精英波' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="battle-controls">
            <button
              className="speed-button"
              onClick={() => game.current?.toggleSpeed()}
              aria-label="切换战斗速度"
            >
              {state.speed}×
            </button>
            <button
              className="icon-button pause-button"
              onClick={() => game.current?.togglePause()}
              disabled={done}
              aria-label={state.paused ? '继续游戏' : '暂停游戏'}
            >
              {state.paused ? <Play size={17} /> : <Pause size={17} />}
            </button>
          </div>
        </div>
        <div className="field-info">
          <span>
            <span className="live-dot" />
            {state.rooms} 间房间
          </span>
          <span>塔高 {state.height} 格</span>
          <span>士兵 {state.soldiers}</span>
        </div>
        <div className="best-mark">
          <Flag size={13} />
          <span>最佳 {state.best} 波</span>
        </div>
        <canvas
          ref={canvas}
          className={`game-canvas ${state.selected !== null || state.selectedSkill ? 'is-placing' : ''}`}
          aria-label="在五座平台上自由搭建。点击已有房间加固修复。1、2、3 选卡，方向键移动，R 旋转，空格放置或施放，F 号角，Q 雷击，E 箭雨，Esc 取消。"
          tabIndex={0}
          onPointerMove={movePointer}
          onPointerDown={(e) => {
            startPoint.current = { x: e.clientX, y: e.clientY };
            if (state.selected !== null || state.selectedSkill) {
              e.currentTarget.setPointerCapture(e.pointerId);
              movePointer(e);
            }
          }}
          onPointerUp={(e) => {
            if (dragging.current) return;
            if (game.current?.selectedSkill) {
              movePointer(e);
              game.current.castSkill();
            } else if (state.selected !== null) {
              movePointer(e);
              game.current?.drop();
            } else if (
              Math.hypot(
                e.clientX - startPoint.current.x,
                e.clientY - startPoint.current.y,
              ) < 8
            ) {
              const rect = e.currentTarget.getBoundingClientRect();
              const point = toWorld(
                view.current,
                e.clientX - rect.left,
                e.clientY - rect.top,
              );
              game.current?.inspectAt(point.x, point.y);
            }
          }}
        />
        {state.phase === 'ready' &&
          state.selected === null &&
          state.inspected === null &&
          !state.paused && (
            <div className="intro-hint">
              <div className="hint-rule" />
              <p>一块一块，守住这座城。</p>
              <span>搭稳你的堡垒，抵御 30 波来敌</span>
            </div>
          )}
        {state.phase === 'break' && !state.paused && !state.rewards.length && (
          <div className="wave-banner">
            <Shield size={18} />
            <span>防守成功</span>
            <small>{state.countdown} 秒后下一波</small>
          </div>
        )}
        {state.paused && !help && !bestiary && !resetOpen && !done && (
          <div className="pause-overlay">
            <Pause size={30} />
            <h2>稍事休息</h2>
            <p>你的堡垒正在等你</p>
            <button
              className="primary-button"
              onClick={() => game.current?.togglePause()}
            >
              <Play size={17} />
              继续守卫
            </button>
          </div>
        )}
        {done && (
          <div className="result-overlay">
            <div className="result-card">
              <div className="result-emblem">
                {state.phase === 'won' ? (
                  <Flag size={34} />
                ) : (
                  <Castle size={34} />
                )}
              </div>
              <p className="eyebrow">
                {state.phase === 'won'
                  ? 'THE FOREST IS SAFE'
                  : 'A NEW BEGINNING'}
              </p>
              <h2>
                {state.phase === 'won'
                  ? '三十波，全数守住！'
                  : '堡垒倒下，勇气还在'}
              </h2>
              <p>
                {state.phase === 'won'
                  ? '你把一块块房间，搭成了一座传奇。'
                  : '试着把底座铺宽，用藤蔓连接悬空的房间。'}
              </p>
              <div className="result-stats">
                <div>
                  <strong>{state.wave}</strong>
                  <span>抵御波次</span>
                </div>
                <div>
                  <strong>{state.kills}</strong>
                  <span>击退敌人</span>
                </div>
                <div>
                  <strong>{state.combo}</strong>
                  <span>兵种合成</span>
                </div>
              </div>
              <button className="primary-button" onClick={restart}>
                <RotateCcw size={16} />
                再筑一座城
              </button>
            </div>
          </div>
        )}
        <div className="ground-caption">
          <span>← 西侧来敌</span>
          <span className="foundation-label">THE KEEP</span>
          <span>东侧来敌 →</span>
        </div>
      </section>
      <section className="build-panel" aria-label="建造面板">
        <div className="build-heading">
          <div className="build-title">
            <span className="build-number">01—</span>
            <h2>建造你的防线</h2>
            <span className="desktop-hint">拖放搭建 · 点击已有房间加固</span>
          </div>
          <div className="gold">
            <Coins size={19} />
            <strong>{state.gold}</strong>
            <span>金币</span>
          </div>
        </div>
        <div className="tactics-strip">
          <span>
            {state.phase === 'battle' ? '本波' : '下一波'}
            {state.forecast.some(({ kind }) => kind === 'brute')
              ? ' · Boss'
              : state.forecast.some(({ kind }) => isElite(kind))
                ? ' · 精英'
                : '敌情'}
          </span>
          <div className="enemy-roster">
            {state.forecast.map(({ kind, count }) => (
              <span
                key={kind}
                style={
                  {
                    '--enemy-color': MONSTERS[kind].color,
                  } as React.CSSProperties
                }
                title={`${MONSTERS[kind].tactic} · ${MONSTERS[kind].counter}`}
              >
                <i />
                {MONSTERS[kind].name} <b>×{count}</b>
              </span>
            ))}
          </div>
          <button onClick={() => openBestiary(true)}>
            <BookOpen size={15} />
            怪物图鉴
          </button>
        </div>
        <div className="support-builds" aria-label="支援建筑">
          {(['barricade', 'barracks', 'fortress'] as const).map((kind) => (
            <button
              key={kind}
              aria-pressed={state.blueprint === kind}
              disabled={done || state.paused || state.gold < TYPES[kind].price}
              onPointerDown={(e) => {
                game.current?.selectBlueprint(kind);
                dragging.current = true;
                startPoint.current = { x: e.clientX, y: e.clientY };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onClick={(e) => {
                if (e.detail === 0) game.current?.selectBlueprint(kind);
              }}
            >
              {kind === 'barricade' ? (
                <Fence size={20} />
              ) : kind === 'fortress' ? (
                <Shield size={20} />
              ) : (
                <Tent size={20} />
              )}
              <span>
                <strong>{TYPES[kind].name}</strong>
                <small>
                  {kind === 'barricade'
                    ? `土路拦截 · ${state.barricades}/12`
                    : kind === 'fortress'
                      ? '底层拦截 · 长矛近战'
                      : '定时出兵 · 可切换兵种'}
                </small>
              </span>
              <b>
                <Coins size={13} />
                {TYPES[kind].price}
              </b>
            </button>
          ))}
        </div>
        <div className="area-skill-bar" aria-label="区域技能">
          {(Object.keys(SKILLS) as SkillId[]).map((kind) => (
            <button
              key={kind}
              className="area-skill-button"
              aria-pressed={state.selectedSkill === kind}
              disabled={
                done ||
                state.paused ||
                state.phase !== 'battle' ||
                state.skillCooldowns[kind] > 0
              }
              title={`${SKILLS[kind].description}；冷却 ${SKILLS[kind].cooldown} 秒`}
              onClick={() => game.current?.selectSkill(kind)}
            >
              {kind === 'lightning' ? (
                <Zap size={18} />
              ) : (
                <ArrowDownToLine size={18} />
              )}
              <strong>{SKILLS[kind].name}</strong>
              <span>
                {state.skillCooldowns[kind] > 0
                  ? `${state.skillCooldowns[kind]}s`
                  : state.selectedSkill === kind
                    ? '点击战场施放'
                    : '选择范围'}
              </span>
              <kbd>{SKILLS[kind].key}</kbd>
            </button>
          ))}
        </div>
        {state.inspected && (
          <div className="room-inspector" aria-label="选中房间">
            <div className="room-summary">
              <strong>
                {TYPES[state.inspected.kind].name}{' '}
                <small>#{state.inspected.id}</small>
              </strong>
              <span>
                {state.inspected.fortification
                  ? `加固 ${state.inspected.fortification} 级 · 减伤 ${state.inspected.fortification * 18}%`
                  : '未加固 · 可升级至 3 级'}
              </span>
              <Progress
                value={(state.inspected.hp / state.inspected.maxHp) * 100}
                className="health-progress"
                aria-label="房间耐久"
              />
              <small>
                耐久 {state.inspected.hp} / {state.inspected.maxHp}
              </small>
            </div>
            <div className="room-actions">
              <button
                className="tool-button reinforce-button"
                disabled={
                  done ||
                  state.paused ||
                  state.inspected.fortification >= 3 ||
                  state.gold < state.inspected.reinforceCost
                }
                onClick={() => game.current?.reinforceRoom()}
              >
                <Hammer size={16} />
                {state.inspected.fortification >= 3 ? '已满级' : '加固并修复'}
                {state.inspected.fortification < 3 && (
                  <small>
                    <Coins size={12} />
                    {state.inspected.reinforceCost}
                  </small>
                )}
              </button>
              <button
                className="tool-button"
                disabled={
                  done ||
                  state.paused ||
                  state.gold < 12 ||
                  state.inspected.hp >= state.inspected.maxHp
                }
                onClick={() => game.current?.repairRoom()}
              >
                <HeartPulse size={16} />
                修复
                <small>
                  <Coins size={12} />
                  12
                </small>
              </button>
              <button
                className="icon-button"
                onClick={() => game.current?.inspectNext()}
                aria-label="选择下一个房间"
              >
                <ChevronRight size={17} />
              </button>
              <button
                className="icon-button"
                onClick={() => game.current?.cancel()}
                aria-label="关闭房间详情"
              >
                <X size={17} />
              </button>
            </div>
              <p>每级 +80 耐久上限、+18% 减伤。跌出平台仍会损毁。</p>
              {state.inspected.kind === 'engineer' && (
                <p>工程师每 4 秒修复半径 165 内的受损房间，等级越高修复量越大。</p>
              )}
              {state.inspected.kind === 'shieldRoom' && (
                <div className="recruit-settings">
                  <div>
                    <strong>区域护盾</strong>
                    <span>半径 175 内的房间免受敌方远程弹道伤害</span>
                  </div>
                  <small>
                    护盾 {state.inspected.shield} / {state.inspected.maxShield}，每秒自动恢复
                  </small>
                </div>
              )}
            {state.inspected.kind === 'barracks' && (
              <div className="recruit-settings" aria-label="兵营训练设置">
                <div>
                  <strong>训练兵种</strong>
                  <span>
                    每 8 秒 1 人，交替支援两侧 · 本营 {state.inspected.recruits}
                    /6 人，全场最多 30 人
                  </span>
                </div>
                <button
                  aria-pressed={state.inspected.recruitKind === 'melee'}
                  disabled={done || state.paused}
                  onClick={() => game.current?.setRecruitKind('melee')}
                >
                  <Shield size={16} />
                  近战 · 阻拦地面
                </button>
                <button
                  aria-pressed={state.inspected.recruitKind === 'ranged'}
                  disabled={done || state.paused}
                  onClick={() => game.current?.setRecruitKind('ranged')}
                >
                  <Swords size={16} />
                  远程 · 射击对空
                </button>
                <small>
                  {state.phase !== 'battle'
                    ? '开战后招募'
                    : state.inspected.recruits >= 6
                      ? '本营满员，阵亡后补充'
                      : `下次招募约 ${state.inspected.recruitTimer}s · 兵营须保持落稳`}
                </small>
              </div>
            )}
          </div>
        )}
        <div className="build-content">
          <div className="shop">
            {state.cards.length > 0 ? (
              state.cards.map((card, index) => (
                <button
                  key={card.id}
                  className={`room-card ${state.selected === index ? 'selected' : ''} ${state.gold < TYPES[card.kind].price ? 'unaffordable' : ''}`}
                  style={
                    {
                      '--room-color': TYPES[card.kind].light,
                    } as React.CSSProperties
                  }
                  disabled={
                    done || state.paused || state.gold < TYPES[card.kind].price
                  }
                  onPointerDown={(e) => {
                    game.current?.select(index);
                    dragging.current = true;
                    startPoint.current = { x: e.clientX, y: e.clientY };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onClick={(e) => {
                    if (e.detail === 0) game.current?.select(index);
                  }}
                  aria-label={`${TYPES[card.kind].name}，${TYPES[card.kind].role}，${TYPES[card.kind].price} 金币`}
                  aria-pressed={state.selected === index}
                >
                  <span className="card-shortcut">{index + 1}</span>
                  <span className="card-price">
                    <Coins size={12} />
                    {TYPES[card.kind].price}
                  </span>
                  <CardArt card={card} />
                  <div className="card-bottom">
                    <span>{TYPES[card.kind].name}</span>
                    <small>{TYPES[card.kind].role}</small>
                  </div>
                </button>
              ))
            ) : (
              <div className="shop-empty">
                <RefreshCw size={24} />
                <strong>本轮房间已用完</strong>
                <span>花费 20 金币重置三个新房间</span>
              </div>
            )}
          </div>
          <div className="build-tools">
            <button
              className="tool-button"
              onClick={() => game.current?.refresh()}
              disabled={
                done || state.paused || state.cards.length > 0 || state.gold < 20
              }
            >
              <RefreshCw size={17} />
              <span>{state.cards.length ? '用完后重置' : '重置三个房间'}</span>
              <small>
                <Coins size={12} />
                20
              </small>
            </button>
            <button
              className="tool-button"
              onClick={() => game.current?.rotate()}
              disabled={
                state.selected === null ||
                state.blueprint === 'barricade' ||
                state.paused ||
                done
              }
            >
              <RotateCw size={17} />
              <span>旋转方块</span>
              <kbd>R</kbd>
            </button>
            <button
              className="tool-button"
              onClick={() => game.current?.inspectNext()}
              disabled={done || state.rooms === 0}
            >
              <Hammer size={17} />
              检视房间<kbd>I</kbd>
            </button>
          </div>
          <div className="battle-action">
            <button
              className="horn-button"
              onClick={() => game.current?.activateHorn()}
              disabled={
                done ||
                state.paused ||
                state.phase !== 'battle' ||
                state.hornCooldown > 0
              }
              title="冻结普通敌人 3 秒、精英 2.2 秒、Boss 1.8 秒；30 秒冷却"
            >
              <Snowflake size={17} />
              <span>
                {state.hornCooldown > 0
                  ? `号角冷却 ${state.hornCooldown}s`
                  : '冰霜号角'}
              </span>
              <kbd>F</kbd>
            </button>
            <p>
              <Swords size={14} />
              {state.phase === 'ready'
                ? '准备好了，就让他们来吧'
                : state.phase === 'battle'
                  ? `已击退 ${state.kills} 名敌人`
                  : '加固城堡，迎接下一波'}
            </p>
            <button
              className="primary-button"
              onClick={() => game.current?.startWave()}
              disabled={state.phase === 'battle' || state.paused || done}
            >
              {state.phase === 'ready' ? (
                <Play size={17} />
              ) : state.phase === 'battle' ? (
                <Shield size={18} />
              ) : (
                <ChevronRight size={19} />
              )}
              <span>
                {state.phase === 'ready'
                  ? '开始守卫'
                  : state.phase === 'battle'
                    ? '守卫进行中'
                    : `迎战下一波${state.countdown > 0 ? ` · ${state.countdown}s` : ''}`}
              </span>
              {state.phase === 'ready' && <ArrowUpRight size={18} />}
            </button>
          </div>
        </div>
        {Object.values(state.perks).some((n) => n > 0) && (
          <div className="perk-strip" aria-label="已获得的战利品">
            <Sparkles size={14} />
            {(Object.keys(PERKS) as PerkId[])
              .filter((id) => state.perks[id] > 0)
              .map((id) => (
                <span key={id} title={PERKS[id].description}>
                  {PERKS[id].name} ×{state.perks[id]}
                </span>
              ))}
          </div>
        )}
        <div className="status-line">
          <p aria-live="polite">
            <span className="status-spark">✦</span>
            {state.notice}
          </p>
          <span className="keyboard-hint">
            1–3 选卡 <i /> R 旋转 <i /> 空格放下
          </span>
          {(state.selected !== null || state.selectedSkill) && (
            <button
              onClick={() => game.current?.cancel()}
              aria-label="取消选择"
            >
              <X size={14} />
              取消
            </button>
          )}
        </div>
      </section>
      <footer>
        <span>方寸之间，筑起堡垒。</span>
        <button onClick={() => openHelp(true)}>
          玩法说明
          <ArrowUpRight size={13} />
        </button>
      </footer>
      <Dialog open={state.rewards.length > 0} onOpenChange={() => {}}>
        <DialogContent
          className="game-dialog reward-dialog"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>
              {state.rewardSource
                ? `击败${MONSTERS[state.rewardSource].name}`
                : '击杀战利品'}{' '}
              · 三选一
            </DialogTitle>
            <DialogDescription>
              战场已暂停。每击杀一名精英或 Boss 获得一次增益，选择后继续战斗。
            </DialogDescription>
          </DialogHeader>
          <div className="reward-options">
            {state.rewards.map((id) => (
              <button
                key={id}
                onClick={() => game.current?.chooseReward(id)}
                style={
                  { '--reward-color': PERKS[id].color } as React.CSSProperties
                }
              >
                <span>{PERKS[id].label}</span>
                <Sparkles size={26} />
                <strong>{PERKS[id].name}</strong>
                <p>{PERKS[id].description}</p>
                <small>
                  选择强化 <ChevronRight size={14} />
                </small>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={bestiary} onOpenChange={openBestiary}>
        <DialogContent className="game-dialog bestiary-dialog">
          <DialogHeader>
            <DialogTitle>林中来敌</DialogTitle>
            <DialogDescription>
              所有敌人的血量随关卡增长。精英体型为普通步兵的 2 倍；护阵统领、狂战先锋与 Boss 会掉落增益，游荡精英只掉落金币。Boss 体型 3 倍、基础血量 45 倍。
            </DialogDescription>
          </DialogHeader>
          <div className="bestiary-list">
            {(Object.keys(MONSTERS) as EnemyKind[]).map((kind) => (
              <div
                key={kind}
                style={
                  {
                    '--enemy-color': MONSTERS[kind].color,
                  } as React.CSSProperties
                }
              >
                <strong>
                  <i />
                  {MONSTERS[kind].name}
                  <small>
                    {kind === 'brute'
                      ? '第 10 / 20 / 30 波 · 掉落增益'
                      : kind === 'sentinel' || kind === 'berserker'
                        ? '第 5 / 15 / 25 波 · 掉落增益'
                        : isElite(kind)
                          ? `第 ${MONSTERS[kind].wave} 波起 · 不掉增益`
                          : `第 ${MONSTERS[kind].wave} 波起`}
                  </small>
                </strong>
                <p>{MONSTERS[kind].tactic}</p>
                <span>{MONSTERS[kind].counter}</span>
              </div>
            ))}
          </div>
          <button
            className="primary-button"
            onClick={() => openBestiary(false)}
          >
            返回战场
            <ChevronRight size={17} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={help} onOpenChange={openHelp}>
        <DialogContent className="game-dialog">
          <DialogHeader>
            <DialogTitle>每一块，都是你的防线</DialogTitle>
            <DialogDescription>
              一边搭城堡，一边抵御两侧敌人。守住 30 波即可获胜。
            </DialogDescription>
          </DialogHeader>
          <div className="rules">
            <div>
              <MousePointer2 />
              <p>
                <b>拖放搭建</b>
                <span>
                  选下方房间，自由移动到想要的落点后松手。也可以先点击房间，再点击战场放下。R
                  或旋转按钮调整朝向。中央主平台最大，左右各有两座小平台，均可搭建。路障只能放在平台之间或外侧的土路。
                </span>
              </p>
            </div>
            <div>
              <Swords />
              <p>
                <b>自动攻击 · 相邻合成</b>
                <span>
                  弓箭手连射，冰法师减速。火炮范围伤害，投弹手抛出炸弹，激光塔贯穿整条射线。在途子弹不会因目标先被击败而消失。同类同级房间相邻时会升星。
                </span>
              </p>
            </div>
            <div>
              <Sprout />
              <p>
                <b>保持平衡 · 藤蔓固定</b>
                <span>
                  房间对周围有摩擦力，不会轻易滑落。藤蔓从第 2
                  波起出现在商店，保持附近房间原有位置和朝向，固定为整体。房间碰到平台外的地面就会损毁，损失
                  30 耐久。
                </span>
              </p>
            </div>
            <div>
              <Tent />
              <p>
                <b>兵营出兵 · 空地协同</b>
                <span>
                  兵营落稳后在战斗中每 8
                  秒招募一名士兵。主平台兵营交替支援左右，侧翼兵营就地向外增援。本营最多
                  6 人，全场最多 30
                  人。点选兵营切换兵种：近战阻拦地面敌人，远程在后排射击并可对空，被贴身时会后撤，没有近战能力。
                </span>
              </p>
            </div>
            <div>
              <Fence />
              <p>
                <b>路障拦截 · 防备空袭</b>
                <span>
                  路障有 230 耐久，只能放在非铺装土路上，最多 12
                  个，被击破后敌人继续前进。夜翼蝠和焰翼龙会飞越地面防线；弓箭、冰法、激光和远程士兵可以对空。
                </span>
              </p>
            </div>
            <div>
              <Shield />
              <p>
                <b>近战堡垒 · 长矛防线</b>
                <span>
                  堡垒有 420
                  基础耐久，放在平台底层并落稳后，可以阻挡接近的地面敌人。长矛只攻击附近地面单位；架在高处不能阻拦地面敌人。可照常加固、修复。
                </span>
              </p>
            </div>
            <div>
              <Zap />
              <p>
                <b>选择范围 · 雷击与箭雨</b>
                <span>
                  战斗中按 Q 选择雷击，按 E
                  选择箭雨，再点击战场施放；也可用方向键瞄准、空格施放，Esc
                  取消。雷击造成范围伤害并短暂眩晕，冷却 35 秒；箭雨持续 3
                  秒，冷却 42 秒。两者都可对空且不消耗金币。
                </span>
              </p>
            </div>
            <div>
              <Hammer />
              <p>
                <b>点选房间 · 定向加固</b>
                <span>
                  点击已有房间，或按 I 轮选。加固每级增加 80 耐久和 18%
                  减伤，最多 3 级，并修复房间。也可花 12
                  金币单独修复。跌出平台仍会损毁。
                </span>
              </p>
            </div>
            <div>
              <Snowflake />
              <p>
                <b>主动控场 · 战利品</b>
                <span>
                  战斗中按 F 或点击冰霜号角，冻结普通敌人 3 秒、精英 2.2
                  秒、Boss 1.8 秒，冷却 30 秒。只有击杀护阵统领、狂战先锋或 Boss
                  才能三选一获得增益；游荡精英只掉落金币，连续奖励会依次选择，期间战场暂停。
                </span>
              </p>
            </div>
            <div>
              <HeartPulse />
              <p>
                <b>工程师 · 范围修复</b>
                <span>
                  工程师每 4 秒修复半径 165 内的受损房间，每级修复量更高；自身受损时也可以被修复。
                </span>
              </p>
            </div>
            <div>
              <Shield />
              <p>
                <b>护盾房间 · 拦截远程</b>
                <span>
                  护盾房间保护半径 175 内的房间，敌方远程弹道命中时优先消耗护盾。护盾耗尽后失效，并会随时间自动恢复。
                </span>
              </p>
            </div>
            <div>
              <Coins />
              <p>
                <b>三个房间 · 用完重置</b>
                <span>
                  每次获得三个房间，放置后卡牌会消耗且不会自动补充。三个房间全部用完后，花费 20 金币重置一组新房间。飞行敌人的血量比同级地面单位低 30%。
                </span>
              </p>
            </div>
          </div>
          <button className="primary-button" onClick={() => openHelp(false)}>
            明白了，开始搭建
            <ChevronRight size={17} />
          </button>
        </DialogContent>
      </Dialog>
      <AlertDialog open={resetOpen} onOpenChange={openReset}>
        <AlertDialogContent className="game-dialog reset-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>重新筑起一座城？</AlertDialogTitle>
            <AlertDialogDescription>
              本局进度会重置，最佳波次会保留。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="reset-actions">
            <button
              className="secondary-button"
              onClick={() => openReset(false)}
            >
              继续这一局
            </button>
            <button className="primary-button" onClick={restart}>
              重新开始
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
