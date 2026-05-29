import type { ComparisonSummary } from '../lib/compare'

type Props = {
  summary: ComparisonSummary
  baselineLabel: string
  latestLabel: string
}

export function DiffSummary({ summary, baselineLabel, latestLabel }: Props) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New in latest"
          value={summary.addedCount}
          tone="emerald"
          hint="Lines only in newer rules"
        />
        <StatCard
          label="Removed"
          value={summary.removedCount}
          tone="rose"
          hint="Baseline lines missing in latest"
        />
        <StatCard
          label="Overridden"
          value={summary.modifiedCount}
          tone="amber"
          hint="Same topic, different wording/values"
        />
        <StatCard
          label="Unchanged"
          value={summary.unchangedCount}
          tone="slate"
          hint="Identical between both sources"
        />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-900">
          What changed for your client
        </h2>
        <p className="mt-2 text-sm text-amber-800/90">
          Comparing <strong>{baselineLabel}</strong> →{' '}
          <strong>{latestLabel}</strong>. Latest rules override baseline where
          text differs.
        </p>
        <ul className="mt-4 space-y-2">
          {summary.highlights.map((item) => (
            <li
              key={item}
              className="flex gap-2 text-sm text-amber-900/90 before:content-['→'] before:font-bold before:text-amber-600"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {summary.modifiedPairs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Key overrides (from live diff)</h3>
          <div className="mt-4 space-y-4">
            {summary.modifiedPairs.slice(0, 6).map((pair, i) => (
              <div
                key={`${pair.before}-${i}`}
                className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-2"
              >
                <div>
                  <span className="text-xs font-medium uppercase text-rose-600">
                    Baseline
                  </span>
                  <p className="mt-1 font-mono text-rose-900/90">{pair.before}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase text-emerald-700">
                    Latest (wins)
                  </span>
                  <p className="mt-1 font-mono text-emerald-900/90">{pair.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: number
  hint: string
  tone: 'emerald' | 'rose' | 'amber' | 'slate'
}) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    slate: 'border-slate-200 bg-white text-slate-800',
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-slate-600">{hint}</p>
    </div>
  )
}
