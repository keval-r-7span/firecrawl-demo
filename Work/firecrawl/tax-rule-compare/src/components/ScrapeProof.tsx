import type { ScrapeResult } from '../lib/firecrawl'

type Props = {
  baseline: ScrapeResult
  latest: ScrapeResult
  comparedAt: string
}

export function ScrapeProof({ baseline, latest, comparedAt }: Props) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
          Live scrape
        </span>
        <p className="text-sm font-medium text-emerald-900">
          Both pages were fetched from Firecrawl just now — comparison uses this
          fresh content only.
        </p>
      </div>
      <p className="mt-2 text-xs text-emerald-800">
        Compared at {new Date(comparedAt).toLocaleString()} ·{' '}
        <code className="rounded bg-white/60 px-1">maxAge: 0</code> (no cached
        snapshot)
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ProofCard role="Baseline" doc={baseline} />
        <ProofCard role="Latest" doc={latest} />
      </div>
    </section>
  )
}

function ProofCard({ role, doc }: { role: string; doc: ScrapeResult }) {
  return (
    <div className="rounded-xl border border-emerald-200/80 bg-white p-4 text-sm">
      <p className="font-semibold text-slate-800">{role}</p>
      <dl className="mt-2 space-y-1.5 text-xs text-slate-600">
        <div className="flex justify-between gap-2">
          <dt>Scrape ID</dt>
          <dd className="truncate font-mono text-slate-800">{doc.scrapeId}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Cache</dt>
          <dd className="font-medium text-slate-800">{doc.cacheState}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>HTTP</dt>
          <dd>{doc.statusCode}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Characters</dt>
          <dd>{doc.markdown.length.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Scraped</dt>
          <dd>{new Date(doc.scrapedAt).toLocaleTimeString()}</dd>
        </div>
      </dl>
    </div>
  )
}
