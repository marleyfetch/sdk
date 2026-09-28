// Run with: npm test  (builds, then runs this)
import assert from 'node:assert/strict'
import { MarleyFetch, MarleyFetchError } from './dist/index.js'
import { createTransport } from './dist/core.js'
import { EmailBuilder } from './dist/email.js'

const calls = []
globalThis.fetch = async (url, init) => {
  calls.push({ url, ...init, json: JSON.parse(init.body ?? 'null') })
  return new Response(JSON.stringify({ success: true, messageId: 'm1', outboxId: 1 }), {
    headers: { 'content-type': 'application/json' },
  })
}

const mf = new MarleyFetch({ apiKey: 'k', baseUrl: 'http://localhost:8787/' })

// chaining builds the request the API expects; recipients accumulate and split on commas
await mf
  .to('a@example.com', ['b@example.com, c@example.com'])
  .cc('cc@example.com')
  .from('me@example.com')
  .subject('Hello')
  .text_body('hi')
  .html_body('<p>hi</p>')
  .send()

assert.equal(calls[0].url, 'http://localhost:8787/v1/send')
assert.equal(calls[0].headers.Authorization, 'Bearer k')
assert.deepEqual(calls[0].json, {
  to: ['a@example.com', 'b@example.com', 'c@example.com'],
  cc: ['cc@example.com'],
  from: 'me@example.com',
  subject: 'Hello',
  text_body: 'hi',
  html_body: '<p>hi</p>',
})

// any setter starts a chain, and each start is a fresh email
await mf.subject('s').to('a@example.com').text_body('t').enqueue()
assert.equal(calls[1].url, 'http://localhost:8787/v1/enqueue')
assert.deepEqual(calls[1].json, { to: ['a@example.com'], subject: 's', text_body: 't' })

// batch: template fields collapse into `template`
await mf.batch().subject('News').html_body('<p>x</p>').audience_id(7).send()
assert.deepEqual(calls[2].json, {
  template: { subject: 'News', html_body: '<p>x</p>' },
  audience_id: 7,
})

// GET sends no body
await mf.getBatch(7)
assert.equal(calls[3].url, 'http://localhost:8787/v1/batches/7')
assert.equal(calls[3].body, undefined)

// the builder works standalone, without importing the client facade
await new EmailBuilder(createTransport({ apiKey: 'k', baseUrl: 'http://localhost:8787' }))
  .to('a@example.com')
  .subject('s')
  .text_body('t')
  .send()
assert.equal(calls[4].url, 'http://localhost:8787/v1/send')

// incomplete emails fail locally, before the round trip
const before = calls.length
assert.throws(() => mf.to('a@example.com').subject('s').build(), /text_body/)
assert.throws(() => mf.subject('s').text_body('t').build(), /to\(\)/)
assert.throws(() => mf.batch().subject('s').send(), /recipients/)
assert.equal(calls.length, before)

// API errors become MarleyFetchError, retryAfter included
globalThis.fetch = async () =>
  new Response(JSON.stringify({ code: 'RATE_LIMITED', message: 'slow down', details: { retryAfter: 30 } }), {
    status: 429,
    headers: { 'content-type': 'application/json' },
  })

await assert.rejects(
  () => mf.to('a@example.com').subject('s').text_body('t').send(),
  err => {
    assert.ok(err instanceof MarleyFetchError)
    assert.equal(err.status, 429)
    assert.equal(err.code, 'RATE_LIMITED')
    assert.equal(err.retryAfter, 30)
    return true
  }
)

console.log('ok')
