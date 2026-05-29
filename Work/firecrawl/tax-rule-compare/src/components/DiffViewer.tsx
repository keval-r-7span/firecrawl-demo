import { useMemo, useState, type ReactNode } from 'react'
import type { LineChange } from '../lib/compare'

type ViewMode = 'unified' | 'split' | 'changes-only'

type Props = {
  lineChanges: LineChange[]
  baselineTitle: string
  latestTitle: string
}

export function DiffViewer({
  lineChanges,
  baselineTitle,
  latestTitle,
}: Props) {
  const [mode, setMode] = useState<ViewMode>('changes-only')

  const visible = useMemo(() => {
    if (mode !== 'changes-only') return lineChanges
    return lineChanges.filter((c) => c.kind !== 'unchanged')
  }, [lineChanges, mode])

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="font-semibold text-slate-900">Line-by-line diff</h3>
        <div className="flex gap-2">
          {(
            [
              ['changes-only', 'Changes only'],
              ['split', 'Side by side'],
              ['unified', 'Unified'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                mode === id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'split' ? (
        <div className="grid max-h-[520px] overflow-auto md:grid-cols-2">
          <Column title={baselineTitle} side="baseline">
            {visible.map((row, i) => (
              <SplitRow key={`b-${i}`} row={row} side="baseline" />
            ))}
          </Column>
          <Column title={latestTitle} side="latest">
            {visible.map((row, i) => (
              <SplitRow key={`l-${i}`} row={row} side="latest" />
            ))}
          </Column>
        </div>
      ) : (
        <div className="max-h-[520px] overflow-auto font-mono text-xs leading-5">
          {visible.map((row, i) => (
            <UnifiedRow key={i} row={row} />
          ))}
        </div>
      )}
    </section>
  )
}

function Column({
  title,
  children,
  side,
}: {
  title: string
  children: ReactNode
  side: 'baseline' | 'latest'
}) {
  return (
    <div
      className={`border-slate-200 ${side === 'latest' ? 'md:border-l' : ''}`}
    >
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function rowClass(kind: LineChange['kind'], side?: 'baseline' | 'latest') {
  if (kind === 'added')
    return side === 'baseline'
      ? 'bg-transparent text-slate-300'
      : 'bg-emerald-100 text-emerald-900'
  if (kind === 'removed')
    return side === 'latest'
      ? 'bg-transparent text-slate-300'
      : 'bg-rose-100 text-rose-900'
  if (kind === 'modified')
    return side === 'baseline'
      ? 'bg-amber-50 text-amber-900'
      : 'bg-amber-100 text-amber-950'
  return 'text-slate-600'
}

function SplitRow({
  row,
  side,
}: {
  row: LineChange
  side: 'baseline' | 'latest'
}) {
  const text = side === 'baseline' ? row.baseline : row.latest
  const lineNo =
    side === 'baseline' ? row.lineNumberBaseline : row.lineNumberLatest

  return (
    <div className={`flex gap-2 px-2 py-0.5 ${rowClass(row.kind, side)}`}>
      <span className="w-8 shrink-0 select-none text-right text-slate-400">
        {lineNo ?? ''}
      </span>
      <span className="break-all whitespace-pre-wrap">{text ?? ' '}</span>
    </div>
  )
}

function UnifiedRow({ row }: { row: LineChange }) {
  if (row.kind === 'modified') {
    return (
      <div className="border-b border-slate-100">
        <div className={`flex gap-2 px-2 py-0.5 ${rowClass('removed')}`}>
          <span className="w-6 shrink-0 font-bold text-rose-600">−</span>
          <span className="break-all whitespace-pre-wrap">{row.baseline}</span>
        </div>
        <div className={`flex gap-2 px-2 py-0.5 ${rowClass('added')}`}>
          <span className="w-6 shrink-0 font-bold text-emerald-700">+</span>
          <span className="break-all whitespace-pre-wrap">{row.latest}</span>
        </div>
      </div>
    )
  }

  const prefix =
    row.kind === 'added' ? '+' : row.kind === 'removed' ? '−' : ' '
  const text = row.latest ?? row.baseline ?? ''

  return (
    <div className={`flex gap-2 px-2 py-0.5 ${rowClass(row.kind)}`}>
      <span
        className={`w-6 shrink-0 font-bold ${
          row.kind === 'added'
            ? 'text-emerald-700'
            : row.kind === 'removed'
              ? 'text-rose-600'
              : 'text-slate-400'
        }`}
      >
        {prefix}
      </span>
      <span className="break-all whitespace-pre-wrap">{text}</span>
    </div>
  )
}
