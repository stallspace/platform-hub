'use client'

import { useState } from 'react'

interface Day {
  day: string
  visitors: number
  views: number
}

/**
 * Daily visitors over the selected window.
 *
 * One series, so no legend — the heading names it. Inline SVG rather than a
 * charting library: it is one area and a baseline, and pulling in a dependency
 * for that would cost more than it gives.
 */
export default function TrafficChart({ data }: { data: Day[] }) {
  const [hover, setHover] = useState<number | null>(null)

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-12 text-center">No visits recorded yet.</p>
  }

  const W = 720
  const H = 180
  const PAD_L = 34
  const PAD_B = 22
  const PAD_T = 12

  const max = Math.max(1, ...data.map(d => d.visitors))
  // Round the top of the scale up to something a person would choose, so the
  // axis labels are readable numbers rather than whatever the peak happened
  // to be.
  const niceMax = max <= 5 ? 5 : Math.ceil(max / 5) * 5

  const plotW = W - PAD_L
  const plotH = H - PAD_B - PAD_T
  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0

  const x = (i: number) => PAD_L + i * stepX
  const y = (v: number) => PAD_T + plotH - (v / niceMax) * plotH

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.visitors).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(data.length - 1).toFixed(1)} ${PAD_T + plotH} L ${PAD_L} ${PAD_T + plotH} Z`

  const ticks = [0, niceMax / 2, niceMax]
  const active = hover !== null ? data[hover] : null
  const last = data[data.length - 1]

  function fmtDay(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
  }

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-3xl font-bold text-[#0D3B2E] tabular-nums">
          {(active ?? last).visitors.toLocaleString('en-ZA')}
        </span>
        <span className="text-sm text-gray-500">
          {active ? `visitors on ${fmtDay(active.day)}` : 'visitors today'}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Daily visitors over the last ${data.length} days`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map(t => (
          <g key={t}>
            <line
              x1={PAD_L} x2={W} y1={y(t)} y2={y(t)}
              stroke="#E5E7EB" strokeWidth="1"
            />
            <text
              x={PAD_L - 8} y={y(t) + 4} textAnchor="end"
              fill="#9CA3AF" fontSize="11"
            >
              {t}
            </text>
          </g>
        ))}

        <path d={area} fill="#2ECC8E" fillOpacity="0.12" />
        <path d={line} fill="none" stroke="#2ECC8E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {hover !== null && (
          <g>
            <line
              x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={PAD_T + plotH}
              stroke="#0D3B2E" strokeWidth="1" strokeDasharray="3 3"
            />
            <circle cx={x(hover)} cy={y(data[hover].visitors)} r="4.5" fill="#2ECC8E" stroke="#fff" strokeWidth="2" />
          </g>
        )}

        {/* Hit targets wider than the marks, so hovering is not fiddly. */}
        {data.map((d, i) => (
          <rect
            key={d.day}
            x={x(i) - stepX / 2} y={PAD_T}
            width={Math.max(stepX, 6)} height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        <text x={PAD_L} y={H - 4} fill="#9CA3AF" fontSize="11">{fmtDay(data[0].day)}</text>
        <text x={W} y={H - 4} textAnchor="end" fill="#9CA3AF" fontSize="11">{fmtDay(last.day)}</text>
      </svg>

      {/* The numbers behind the picture, for anyone who wants them exactly. */}
      <details className="mt-3">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
          Show the daily figures
        </summary>
        <div className="mt-2 max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="text-gray-400 text-left sticky top-0 bg-white">
              <tr><th className="py-1 font-medium">Day</th><th className="py-1 font-medium text-right">Visitors</th><th className="py-1 font-medium text-right">Views</th></tr>
            </thead>
            <tbody className="text-gray-600 tabular-nums">
              {[...data].reverse().map(d => (
                <tr key={d.day} className="border-t border-gray-50">
                  <td className="py-1">{fmtDay(d.day)}</td>
                  <td className="py-1 text-right">{d.visitors}</td>
                  <td className="py-1 text-right">{d.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
