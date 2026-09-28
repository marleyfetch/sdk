# MarleyFetch SDK

Send email through your own SMTP connections, with a chainable API inspired by Perl's
[Email::Stuffer](https://metacpan.org/pod/Email::Stuffer).

Zero dependencies, native `fetch`. Works anywhere that has it: Node.js 18+, Cloudflare
Workers, Vercel, Netlify, Deno, Bun.

```bash
npm install @marleyfetch/sdk
```

Full documentation: **https://docs.marleyfetch.com/sdk** · API reference: https://docs.marleyfetch.com/api/

## Quick start

```typescript
import { MarleyFetch } from '@marleyfetch/sdk'

const mf = new MarleyFetch({ apiKey: process.env.MARLEYFETCH_API_KEY })

await mf.to('recipient@example.com')
  .subject('Hello from MarleyFetch')
  .text_body('Plain text version')
  .html_body('<h1>Hello!</h1>')
  .send()
```

Any setter starts a chain, in any order — `mf.subject(...)` and `mf.from(...)` open one just
as well as `mf.to(...)`. Every setter is named after the field the API takes and returns the
builder. Nothing is sent until `.send()` or `.enqueue()` ends the chain.

## Emails

```typescript
await mf
  .from('me@example.com')       // must be an address on one of your connections
  .to('a@example.com', 'b@example.com')
  .to(['c@example.com'])        // recipients accumulate across calls
  .cc('cc@example.com, cc2@example.com')  // comma-separated strings work too
  .bcc('bcc@example.com')
  .subject('Monthly report')
  .html_body('<p>Numbers are up</p>')
  .send()
```

`.from()` is the only connection selector: addresses are unique across connections, so the
address picks the connection it belongs to. Omit it and MarleyFetch uses your default
connection.

| Method | What it does |
| --- | --- |
| `.send()` | `POST /v1/send` — waits for delivery, returns `messageId`. Max 10 recipients across to/cc/bcc. |
| `.enqueue()` | `POST /v1/enqueue` — returns as soon as it's queued (Pro). |
| `.build()` | Returns the request body without sending. Useful in tests. |

## Batches

For 11–1000 recipients. One template, many recipients:

```typescript
const { batch_id } = await mf.batch()
  .name('July newsletter')
  .subject('July newsletter')
  .html_body('<p>News</p>')
  .audience_id(12)              // or .recipients(['a@example.com', ...])
  .send()

const { batch } = await mf.getBatch(batch_id)
console.log(batch.status, batch.sent_count, '/', batch.total_count)

await mf.deleteBatch(batch_id)  // once completed or failed
```

Use `.template_id(3)` instead of `.subject()`/`.html_body()` to send a saved template, or
`.emails([...])` to pass fully-formed messages when one template won't do.

Batch sending is a Pro feature.

## Errors

Any non-2xx response throws a `MarleyFetchError`. Network failures throw whatever the
runtime's `fetch` throws.

```typescript
import { MarleyFetch, MarleyFetchError } from '@marleyfetch/sdk'

try {
  await mf.to('a@example.com').subject('Hi').text_body('Hi').send()
} catch (error) {
  if (error instanceof MarleyFetchError) {
    console.error(error.status, error.code, error.message)
    if (error.code === 'RATE_LIMITED') await sleep(error.retryAfter * 1000)
  }
}
```

Common codes: `UNAUTHORIZED`, `NO_CONNECTION`, `CONNECTION_NOT_FOUND`, `TOO_MANY_RECIPIENTS`,
`RATE_LIMITED`, `QUOTA_EXCEEDED`, `DAILY_LIMIT_REACHED`, `FEATURE_NOT_AVAILABLE`, `SEND_FAILED`.

Incomplete emails throw a plain `Error` from `.build()`, before any request is made.

## Configuration

```typescript
new MarleyFetch({
  apiKey: 'your-api-token',            // required
  baseUrl: 'http://localhost:8787',    // optional — only for local API dev
})
```

The package is ESM-only. In Deno, import from `npm:@marleyfetch/sdk`.

## Size

No dependencies, ESM, `sideEffects: false`. The whole SDK is **1.1 kB gzipped** (3.3 kB
minified). `MarleyFetch` is a convenience facade, so importing it pulls in both builders.
If you only send single emails, skip it and drop to **812 B gzipped**:

```typescript
import { createTransport } from '@marleyfetch/sdk/core'
import { EmailBuilder } from '@marleyfetch/sdk/email'

const transport = createTransport({ apiKey: process.env.MARLEYFETCH_API_KEY })

await new EmailBuilder(transport)
  .to('recipient@example.com')
  .subject('Hello')
  .text_body('Hi')
  .send()
```

Subpaths: `@marleyfetch/sdk/core` (transport + `MarleyFetchError`), `/email`, `/batch`.
`createTransport` returns a plain `(method, path, body) => Promise` — stub it in tests.

Create an API key at https://app.marleyfetch.com/tokens. Read it from the environment
(`process.env` on Node/Vercel/Next, the `env` argument on Workers, `Deno.env.get`,
`Bun.env`) — never commit it.

## Development

```bash
npm test     # builds, then runs test.mjs against a stubbed fetch
npm publish  # builds via prepublishOnly
```

## License

MIT
