import type { MarleyFetchConfig } from './types.js'

/** Any non-2xx response from the API. Network failures surface as the runtime's own fetch error. */
export class MarleyFetchError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'MarleyFetchError'
  }

  /** Seconds to wait before retrying, when the API says so (429). */
  get retryAfter(): number | undefined {
    return this.details?.retryAfter as number | undefined
  }
}

/** The one authenticated call the builders need. Swap it out in tests. */
export type Transport = <T>(method: string, path: string, body?: unknown) => Promise<T>

export function createTransport(config: MarleyFetchConfig): Transport {
  if (!config?.apiKey) throw new Error('apiKey is required')
  const baseUrl = (config.baseUrl ?? 'https://api.marleyfetch.com').replace(/\/+$/, '')

  return async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({})) as any

    if (!response.ok) {
      throw new MarleyFetchError(
        response.status,
        data?.code ?? 'INTERNAL_ERROR',
        data?.message ?? response.statusText,
        data?.details
      )
    }

    return data as T
  }
}

/** 'a@b.com', ['a@b.com'], 'a@b.com, c@d.com' -> ['a@b.com', 'c@d.com'] */
export const addresses = (values: (string | string[])[]): string[] =>
  values
    .flat()
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .filter(Boolean)
