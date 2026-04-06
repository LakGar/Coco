'use client'

import { useEffect, useRef, useState } from 'react'

const RIBBON_TEXT =
  'Find peace in overwhelming moments — We slow down the pace of caregiving — Create space for connection and calm — '

const STATS = [
  { end: 1000, suffix: '+', label: 'Routine created' },
  { end: 10000, suffix: '+', label: 'Task completed' },
  { end: 500, suffix: '+', label: 'Mood logged' },
  { end: 50, suffix: '+', label: 'Careplans' },
]

const DURATION_MS = 2000
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4

function formatCount(n: number) {
  return n.toLocaleString()
}

export default function VideoStatsSection() {
  const statsRef = useRef<HTMLDivElement>(null)
  const [displayValues, setDisplayValues] = useState<number[]>(
    STATS.map(() => 0)
  )
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const el = statsRef.current
    if (!el || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || hasAnimated) return
        setHasAnimated(true)

        const start = performance.now()
        const run = (now: number) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / DURATION_MS, 1)
          const eased = easeOutQuart(progress)

          setDisplayValues(STATS.map((stat) => Math.round(stat.end * eased)))

          if (progress < 1) requestAnimationFrame(run)
        }
        requestAnimationFrame(run)
      },
      { threshold: 0.2, rootMargin: '0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasAnimated])

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-end overflow-hidden">
      {/* Video background */}
      <video
        src="/videos/landing/stat.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden
      />

      {/* Gradient overlay: transparent top → primary bottom */}
      <div
        className="absolute inset-0 z-1"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(56, 29, 4, 0.4) 70%, var(--primary) 100%)',
        }}
      />

      {/* Ribbon: stroked path + text on path with SVG animate */}
      <div className="absolute inset-0 w-full flex items-center justify-center z-10 pointer-events-none">
        <svg
          className="ribbon w-full h-full max-h-[85vh]"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Single wave – peak higher, low lower */}
            <path
              id="text-path"
              fill="none"
              d="M-320 540 C 200 200 1720 880 2320 540"
            />
          </defs>
          <path
            className="ribbon__path"
            strokeMiterlimit={0}
            fill="none"
            stroke="#FAE6b9"
            d="M-320 540 C 200 200 1720 880 2320 540"
          />
          <text className="ribbon__text">
            <textPath
              href="#text-path"
              startOffset="0"
              textAnchor="middle"
              alignmentBaseline="central"
            >
              <animate
                attributeName="startOffset"
                from="0%"
                to="-50%"
                begin="0s"
                dur="25s"
                repeatCount="indefinite"
              />
              {RIBBON_TEXT.repeat(4)}
            </textPath>
          </text>
        </svg>
      </div>

      {/* Stats row at bottom – count-up when in view */}
      <div
        ref={statsRef}
        className="relative z-10 w-full px-4 pb-12 md:pb-16 pt-4"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center md:text-left">
              <p className="text-white text-3xl md:text-4xl font-bold tabular-nums">
                {formatCount(displayValues[i])}
                {stat.suffix}
              </p>
              <p className="text-white/90 text-sm md:text-base mt-1 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
