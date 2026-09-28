# Changelog

## [1.0.1] - 2026-09-28

No code changes. The first release built and published by this repository's GitHub Actions
workflow through npm trusted publishing, so it carries a provenance attestation linking the
package to the commit it was built from.

## [1.0.0] - 2026-09-28

Initial release, as `@marleyfetch/sdk`. Nothing was ever published before, so the
pre-rewrite `MarleyFetchClient` interface is not documented here as a breaking change.

- `MarleyFetch` client with an Email::Stuffer-style chainable builder:
  `mf.to(...).cc(...).subject(...).text_body(...).send()`. Any setter opens a chain, in any
  order; `.send()` / `.enqueue()` close it. Setters mirror the API's request fields exactly.
- `.send()` (sync), `.enqueue()` (async, Pro), `.build()` to inspect the request body
- Batch sending: `mf.batch()` builder, `getBatch()`, `deleteBatch()`
- `MarleyFetchError` (a real `Error`) carrying `status`, `code`, `details` and `retryAfter`
- `from()` is the only connection selector — `connection_id` was dropped from the send,
  enqueue and batch request bodies (API side too), since connection emails are unique
- Talks to `https://api.marleyfetch.com/v1`; `baseUrl` overridable for local dev
- ESM-only, zero dependencies, native `fetch`, `sideEffects: false`
- Tree-shakable: `createTransport` + subpath exports (`/core`, `/email`, `/batch`) let you
  import just the email builder (812 B gzipped) instead of the full facade (1.1 kB)
