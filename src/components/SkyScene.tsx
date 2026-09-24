import { motion } from 'motion/react'
import type { Theme } from '../lib/useTheme'

const STARS = [
  [120, 90], [260, 140], [80, 220], [340, 80], [430, 190], [520, 70], [610, 150], [700, 100],
  [790, 200], [900, 60], [980, 170], [1070, 90], [1150, 210], [1230, 120], [1310, 60], [1390, 180],
  [1470, 100], [1540, 220], [60, 320], [980, 300], [1200, 300], [400, 300], [1450, 300], [200, 40],
].map(([x, y], i) => ({ x, y, delay: (i % 7) * 0.15 }))

const MOUNTAINS =
  'M0,900 L0,640 L90,560 L180,610 L260,520 L360,600 L460,540 L560,620 L660,560 L760,630 L860,570 ' +
  'L960,640 L1060,580 L1160,650 L1260,590 L1360,660 L1460,600 L1560,650 L1600,610 L1600,900 Z'

const HORIZON_X = 560

// A dense, overlapping pine treeline along the base of the mountains, in
// front of them, wide enough to fully cover the mountain rock at the very
// bottom of the screen instead of leaving gaps between trees. Positions and
// heights are deterministic (index-derived jitter), not random, so the
// scene renders identically on every pass.
const TREE_BASE_Y = 900
const TREE_COUNT = 80
const TREES = Array.from({ length: TREE_COUNT }, (_, i) => {
  const x = (i / TREE_COUNT) * 1680 - 40 + ((i * 13) % 19)
  const height = 70 + ((i * 29) % 90)
  const width = height * 0.62
  const baseY = TREE_BASE_Y - ((i * 7) % 16)
  const dark = i % 2 === 0
  return { x, height, width, baseY, dark }
})

function treePoints(t: (typeof TREES)[number]): string {
  return `${t.x},${t.baseY - t.height} ${t.x + t.width / 2},${t.baseY} ${t.x - t.width / 2},${t.baseY}`
}

export function SkyScene({ theme }: { theme: Theme }) {
  const isDark = theme === 'dark'

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
        <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="60%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde047" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#sky-day)" />
      <motion.rect
        width="1600"
        height="900"
        fill="url(#sky-night)"
        initial={false}
        animate={{ opacity: isDark ? 1 : 0 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      />

      {STARS.map((s, i) => (
        <motion.circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={i % 5 === 0 ? 2.4 : 1.4}
          fill="#f8fafc"
          initial={false}
          animate={{ opacity: isDark ? [0.2, 0.9, 0.2] : 0 }}
          transition={
            isDark
              ? { opacity: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: s.delay } }
              : { duration: 0.6 }
          }
        />
      ))}

      <motion.circle
        cx={HORIZON_X}
        r={110}
        fill="url(#sun-glow)"
        initial={false}
        animate={{ cy: isDark ? 760 : 555, opacity: isDark ? 0 : 1 }}
        transition={{ duration: 1.3, ease: 'easeInOut' }}
      />
      <motion.circle
        cx={HORIZON_X}
        r={46}
        fill="#fde047"
        initial={false}
        animate={{ cy: isDark ? 760 : 555, opacity: isDark ? 0 : 1 }}
        transition={{ duration: 1.3, ease: 'easeInOut' }}
      />

      <motion.circle
        cx={HORIZON_X}
        r={100}
        fill="url(#moon-glow)"
        initial={false}
        animate={{ cy: isDark ? 555 : 760, opacity: isDark ? 1 : 0 }}
        transition={{ duration: 1.3, ease: 'easeInOut' }}
      />
      <motion.circle
        cx={HORIZON_X}
        r={38}
        fill="#e2e8f0"
        initial={false}
        animate={{ cy: isDark ? 555 : 760, opacity: isDark ? 1 : 0 }}
        transition={{ duration: 1.3, ease: 'easeInOut' }}
      />

      <path d={MOUNTAINS} fill="#0b1220" opacity={isDark ? 0.55 : 0.35} />

      {/* Solid ground band so no rock shows through the gaps between tree bases. */}
      <rect x="0" y="860" width="1600" height="40" fill={isDark ? '#010a06' : '#052e16'} opacity={isDark ? 0.95 : 0.8} />

      {TREES.map((t, i) => (
        <polygon
          key={i}
          points={treePoints(t)}
          fill={isDark ? (t.dark ? '#010a06' : '#052e16') : t.dark ? '#052e16' : '#14532d'}
          opacity={isDark ? 0.95 : 0.8}
        />
      ))}
    </svg>
  )
}
