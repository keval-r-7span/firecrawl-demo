import { useState } from 'react'
import type { ScrapeResult } from '../lib/firecrawl'

type Tab = 'baseline' | 'latest'

type Props = {
  baseline: ScrapeResult
  latest: ScrapeResult
}

export function ScrapedPreview({ baseline, latest }: Props) {
  const [tab, setTab] = useState<Tab>('baseline')
  const [open, setOpen] = useState(false)
  const active = tab === 'baseline' ? baseline : latest

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h3 className="font-semibold text-slate-900">
            View scraped markdown (raw from Firecrawl)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Proof that content came from the live API, not a static file
          </p>
        </div>
        <span className="text-sm text-orange-600">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-200 px-5 pb-5">
          <div className="mt-3 flex gap-2">
            {(
              [
                ['baseline', `Baseline (${baseline.markdown.length.toLocaleString()} chars)`],
                ['latest', `Latest (${latest.markdown.length.toLocaleString()} chars)`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  tab === id
                    ? 'bg-orange-500 text-white'
                    : 'border border-slate-300 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <pre className="mt-3 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-800">
            {active.markdown.slice(0, 12000)}
            {active.markdown.length > 12000 && (
              <span className="block mt-4 text-slate-500">
                … truncated for display ({active.markdown.length.toLocaleString()}{' '}
                characters total)
              </span>
            )}
          </pre>
        </div>
      )}
    </section>
  )
}
