import { useEffect, useMemo, useState } from 'react'
import { compareDocuments } from './lib/compare'
import { scrapeUrl, type ScrapeResult } from './lib/firecrawl'
import { DiffSummary } from './components/DiffSummary'
import { DiffViewer } from './components/DiffViewer'
import { ScrapeProof } from './components/ScrapeProof'
import { ScrapedPreview } from './components/ScrapedPreview'

const EXAMPLE_BASELINE =
  'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2024-to-2025'
const EXAMPLE_LATEST =
  'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026'

type Phase = 'idle' | 'scraping' | 'done' | 'error'

export default function App() {
  const [baselineUrl, setBaselineUrl] = useState('')
  const [latestUrl, setLatestUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [baselineDoc, setBaselineDoc] = useState<ScrapeResult | null>(null)
  const [latestDoc, setLatestDoc] = useState<ScrapeResult | null>(null)
  const [comparedAt, setComparedAt] = useState<string | null>(null)
  const [progress, setProgress] = useState('')

  // Drop stale results when URLs change so comparison always matches latest input
  useEffect(() => {
    setBaselineDoc(null)
    setLatestDoc(null)
    setComparedAt(null)
    setPhase((p) => (p === 'scraping' ? p : 'idle'))
  }, [baselineUrl, latestUrl])

  const comparison = useMemo(() => {
    if (!baselineDoc || !latestDoc) return null
    return compareDocuments(baselineDoc.markdown, latestDoc.markdown)
  }, [baselineDoc, latestDoc])

  async function handleCompare() {
    const base = baselineUrl.trim()
    const latest = latestUrl.trim()

    if (!base || !latest) {
      setError('Enter both URLs before comparing.')
      return
    }
    if (base === latest) {
      setError('Baseline and latest URLs must be different sites or pages.')
      return
    }

    setPhase('scraping')
    setError(null)
    setBaselineDoc(null)
    setLatestDoc(null)
    setComparedAt(null)

    try {
      setProgress('Calling Firecrawl API for both URLs (fresh scrape, maxAge: 0)…')

      const [baseline, latestResult] = await Promise.all([
        scrapeUrl(base),
        scrapeUrl(latest),
      ])

      setBaselineDoc(baseline)
      setLatestDoc(latestResult)
      setComparedAt(new Date().toISOString())
      setPhase('done')
      setProgress('')
    } catch (e) {
      setPhase('error')
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setProgress('')
    }
  }

  const hasKey = Boolean(import.meta.env.VITE_FIRECRAWL_API_KEY)
  const hasResults = Boolean(comparison && baselineDoc && latestDoc && comparedAt)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
              POC · Firecrawl + React
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Tax Rule Change Comparator
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Each compare run scrapes both URLs live via Firecrawl, then diffs
              the returned markdown. Nothing is pre-loaded or static.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-800">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            Live API · v2/scrape
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {!hasKey && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            Add <code className="rounded bg-rose-100 px-1">VITE_FIRECRAWL_API_KEY</code>{' '}
            to <code className="rounded bg-rose-100 px-1">.env.local</code> and restart
            the dev server.
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <div className="grid gap-6 lg:grid-cols-2">
            <UrlField
              id="baseline"
              label="Baseline rules (older year / first site)"
              hint="Scraped live when you click compare"
              value={baselineUrl}
              onChange={setBaselineUrl}
            />
            <UrlField
              id="latest"
              label="Latest rules (newer year / second site)"
              hint="Scraped live when you click compare"
              value={latestUrl}
              onChange={setLatestUrl}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={phase === 'scraping' || !hasKey}
              onClick={handleCompare}
              className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {phase === 'scraping'
                ? 'Scraping both sites…'
                : 'Scrape both sites & compare'}
            </button>
            <button
              type="button"
              disabled={phase === 'scraping'}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              onClick={() => {
                setBaselineUrl(EXAMPLE_BASELINE)
                setLatestUrl(EXAMPLE_LATEST)
                setError(null)
              }}
            >
              Fill example URLs only
            </button>
          </div>

          {progress && (
            <p className="mt-4 text-sm font-medium text-orange-700">{progress}</p>
          )}
          {error && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </p>
          )}

          {!hasResults && phase !== 'scraping' && !error && (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No comparison yet. Enter two different URLs and click{' '}
              <strong>Scrape both sites & compare</strong> — Firecrawl will fetch
              each page and the diff is computed from that live content.
            </p>
          )}
        </section>

        {hasResults && baselineDoc && latestDoc && comparedAt && comparison && (
          <>
            <ScrapeProof
              baseline={baselineDoc}
              latest={latestDoc}
              comparedAt={comparedAt}
            />

            <div className="grid gap-3 lg:grid-cols-2">
              <SourceCard
                role="Baseline (scraped)"
                doc={baselineDoc}
              />
              <SourceCard
                role="Latest (scraped)"
                doc={latestDoc}
              />
            </div>

            <ScrapedPreview baseline={baselineDoc} latest={latestDoc} />

            <DiffSummary
              summary={comparison.summary}
              baselineLabel={baselineDoc.title}
              latestLabel={latestDoc.title}
            />

            <DiffViewer
              lineChanges={comparison.lineChanges}
              baselineTitle={baselineDoc.title}
              latestTitle={latestDoc.title}
            />
          </>
        )}

        <footer className="pb-12 text-center text-xs text-slate-500">
          Every compare triggers two POST requests to api.firecrawl.dev/v2/scrape.
          Change URLs and compare again for a new live diff.
        </footer>
      </main>
    </div>
  )
}

function UrlField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
      <input
        id={id}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-200"
        placeholder="https://example.com/tax-rules-2025"
      />
    </div>
  )
}

function SourceCard({ role, doc }: { role: string; doc: ScrapeResult }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-orange-600">
        {role}
      </span>
      <p className="mt-1 font-medium text-slate-900">{doc.title}</p>
      <a
        href={doc.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block truncate text-xs text-blue-600 hover:underline"
      >
        {doc.sourceUrl}
      </a>
      <p className="mt-2 text-xs text-slate-500">
        {doc.markdown.length.toLocaleString()} chars · scrape{' '}
        <span className="font-mono">{doc.scrapeId.slice(0, 8)}…</span>
      </p>
    </div>
  )
}
