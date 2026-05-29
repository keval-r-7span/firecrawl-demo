export type ScrapeResult = {
  markdown: string
  title: string
  sourceUrl: string
  scrapeId: string
  cacheState: string
  statusCode: number
  scrapedAt: string
}

type FirecrawlScrapeResponse = {
  success: boolean
  error?: string
  data?: {
    markdown?: string
    metadata?: {
      title?: string
      sourceURL?: string
      url?: string
      statusCode?: number
      scrapeId?: string
      cacheState?: string
    }
  }
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) throw new Error('URL is required')
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** Live scrape via Firecrawl API — maxAge 0 forces a fresh fetch (no stale cache). */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY
  if (!apiKey) {
    throw new Error(
      'Missing VITE_FIRECRAWL_API_KEY. Copy .env.example to .env.local and add your Firecrawl API key.',
    )
  }

  const targetUrl = normalizeUrl(url)

  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: targetUrl,
      formats: ['markdown'],
      maxAge: 0,
    }),
  })

  const payload = (await response.json()) as FirecrawlScrapeResponse

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.error ?? `Scrape failed (${response.status}) for ${targetUrl}`,
    )
  }

  const markdown = payload.data?.markdown?.trim() ?? ''
  if (!markdown) {
    throw new Error(`No content returned for ${targetUrl}`)
  }

  const meta = payload.data?.metadata
  const statusCode = meta?.statusCode ?? 200
  if (statusCode >= 400) {
    throw new Error(`Page returned HTTP ${statusCode} for ${targetUrl}`)
  }

  return {
    markdown,
    title: meta?.title ?? targetUrl,
    sourceUrl: meta?.sourceURL ?? meta?.url ?? targetUrl,
    scrapeId: meta?.scrapeId ?? 'unknown',
    cacheState: meta?.cacheState ?? 'unknown',
    statusCode,
    scrapedAt: new Date().toISOString(),
  }
}
