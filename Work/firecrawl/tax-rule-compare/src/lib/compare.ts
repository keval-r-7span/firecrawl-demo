import { diffLines, type Change } from 'diff'

export type ChangeKind = 'added' | 'removed' | 'modified' | 'unchanged'

export type LineChange = {
  kind: ChangeKind
  baseline?: string
  latest?: string
  lineNumberBaseline?: number
  lineNumberLatest?: number
}

export type ComparisonSummary = {
  addedCount: number
  removedCount: number
  modifiedCount: number
  unchangedCount: number
  highlights: string[]
  addedLines: string[]
  removedLines: string[]
  modifiedPairs: { before: string; after: string }[]
}

export type ComparisonResult = {
  lineChanges: LineChange[]
  summary: ComparisonSummary
}

const RATE_PATTERN =
  /£[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?%|20\d{2}[-–]to[-–]20\d{2}|20\d{2}[-/]20\d{2}/gi

function extractRateTokens(text: string): string[] {
  return [...text.matchAll(RATE_PATTERN)].map((m) => m[0])
}

function buildHighlights(
  addedLines: string[],
  removedLines: string[],
  modifiedPairs: { before: string; after: string }[],
): string[] {
  const highlights: string[] = []

  const addedRates = new Set(
    addedLines.flatMap((line) => extractRateTokens(line)),
  )
  const removedRates = new Set(
    removedLines.flatMap((line) => extractRateTokens(line)),
  )

  for (const rate of addedRates) {
    if (!removedRates.has(rate)) {
      highlights.push(`New figure or rate in latest rules: ${rate}`)
    }
  }

  for (const rate of removedRates) {
    if (!addedRates.has(rate)) {
      highlights.push(`Removed from baseline rules: ${rate}`)
    }
  }

  for (const { before, after } of modifiedPairs.slice(0, 8)) {
    const beforeRates = extractRateTokens(before)
    const afterRates = extractRateTokens(after)
    if (
      beforeRates.length &&
      afterRates.length &&
      beforeRates.join() !== afterRates.join()
    ) {
      highlights.push(
        `Rate/threshold updated: ${beforeRates.join(', ')} → ${afterRates.join(', ')}`,
      )
    }
  }

  if (addedLines.length > 0) {
    highlights.push(
      `${addedLines.length} line(s) appear only in the latest document (new or expanded rules).`,
    )
  }

  if (removedLines.length > 0) {
    highlights.push(
      `${removedLines.length} line(s) from the baseline document are absent in the latest version.`,
    )
  }

  if (modifiedPairs.length > 0) {
    highlights.push(
      `${modifiedPairs.length} line(s) were revised — latest text overrides the baseline wording.`,
    )
  }

  return [...new Set(highlights)].slice(0, 12)
}

function pairModified(changes: Change[]): LineChange[] {
  const result: LineChange[] = []
  let baselineLine = 1
  let latestLine = 1

  for (let i = 0; i < changes.length; i++) {
    const part = changes[i]
    const lines = part.value.replace(/\n$/, '').split('\n')
    const isLastEmpty = part.value.endsWith('\n') && lines[lines.length - 1] === ''

    if (isLastEmpty && lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop()
    }

    if (part.added) {
      for (const line of lines) {
        if (line === '' && lines.length === 1) continue
        result.push({ kind: 'added', latest: line, lineNumberLatest: latestLine++ })
      }
      continue
    }

    if (part.removed) {
      const next = changes[i + 1]
      if (next?.added) {
        const removedLines = lines
        const addedLines = next.value.replace(/\n$/, '').split('\n')
        const max = Math.max(removedLines.length, addedLines.length)

        for (let j = 0; j < max; j++) {
          const before = removedLines[j]
          const after = addedLines[j]

          if (before !== undefined && after !== undefined) {
            if (before === after) {
              result.push({
                kind: 'unchanged',
                baseline: before,
                latest: after,
                lineNumberBaseline: baselineLine++,
                lineNumberLatest: latestLine++,
              })
            } else {
              result.push({
                kind: 'modified',
                baseline: before,
                latest: after,
                lineNumberBaseline: baselineLine++,
                lineNumberLatest: latestLine++,
              })
            }
          } else if (before !== undefined) {
            result.push({
              kind: 'removed',
              baseline: before,
              lineNumberBaseline: baselineLine++,
            })
          } else if (after !== undefined) {
            result.push({
              kind: 'added',
              latest: after,
              lineNumberLatest: latestLine++,
            })
          }
        }
        i++
        continue
      }

      for (const line of lines) {
        result.push({
          kind: 'removed',
          baseline: line,
          lineNumberBaseline: baselineLine++,
        })
      }
      continue
    }

    for (const line of lines) {
      result.push({
        kind: 'unchanged',
        baseline: line,
        latest: line,
        lineNumberBaseline: baselineLine++,
        lineNumberLatest: latestLine++,
      })
    }
  }

  return result
}

export function compareDocuments(
  baselineMarkdown: string,
  latestMarkdown: string,
): ComparisonResult {
  const rawChanges = diffLines(baselineMarkdown, latestMarkdown, {
    newlineIsToken: false,
  })

  const lineChanges = pairModified(rawChanges)

  const addedLines = lineChanges
    .filter((c) => c.kind === 'added')
    .map((c) => c.latest!)
    .filter((l) => l.trim().length > 2)

  const removedLines = lineChanges
    .filter((c) => c.kind === 'removed')
    .map((c) => c.baseline!)
    .filter((l) => l.trim().length > 2)

  const modifiedPairs = lineChanges
    .filter((c) => c.kind === 'modified')
    .map((c) => ({ before: c.baseline!, after: c.latest! }))

  const summary: ComparisonSummary = {
    addedCount: lineChanges.filter((c) => c.kind === 'added').length,
    removedCount: lineChanges.filter((c) => c.kind === 'removed').length,
    modifiedCount: modifiedPairs.length,
    unchangedCount: lineChanges.filter((c) => c.kind === 'unchanged').length,
    highlights: buildHighlights(addedLines, removedLines, modifiedPairs),
    addedLines: addedLines.slice(0, 40),
    removedLines: removedLines.slice(0, 40),
    modifiedPairs: modifiedPairs.slice(0, 40),
  }

  return { lineChanges, summary }
}
