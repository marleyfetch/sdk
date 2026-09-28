import { createTransport, type Transport } from './core.js'
import { EmailBuilder } from './email.js'
import { BatchBuilder } from './batch.js'
import type { BatchStatusResponse, DeletedResponse, MarleyFetchConfig } from './types.js'

/**
 * Convenience facade over every endpoint. Any email setter starts a chain, in any order,
 * and `.send()` or `.enqueue()` ends it:
 *
 *     mf.to('a@example.com').cc('b@example.com').subject('Hi').text_body('Hi').send()
 *
 * Importing it pulls in both builders — if you only send single emails, import
 * `createTransport` + `EmailBuilder` from the `/core` and `/email` subpaths instead.
 */
export class MarleyFetch {
  private readonly transport: Transport

  constructor(config: MarleyFetchConfig) {
    this.transport = createTransport(config)
  }

  private newEmail(): EmailBuilder {
    return new EmailBuilder(this.transport)
  }

  to(...to: (string | string[])[]): EmailBuilder {
    return this.newEmail().to(...to)
  }

  cc(...cc: (string | string[])[]): EmailBuilder {
    return this.newEmail().cc(...cc)
  }

  bcc(...bcc: (string | string[])[]): EmailBuilder {
    return this.newEmail().bcc(...bcc)
  }

  from(from: string): EmailBuilder {
    return this.newEmail().from(from)
  }

  subject(subject: string): EmailBuilder {
    return this.newEmail().subject(subject)
  }

  text_body(text: string): EmailBuilder {
    return this.newEmail().text_body(text)
  }

  html_body(html: string): EmailBuilder {
    return this.newEmail().html_body(html)
  }

  /** Start a batch send: POST /v1/send/batch (Pro). */
  batch(): BatchBuilder {
    return new BatchBuilder(this.transport)
  }

  getBatch(id: number): Promise<BatchStatusResponse> {
    return this.transport('GET', `/v1/batches/${id}`)
  }

  /** Only allowed once the batch is completed or failed. */
  deleteBatch(id: number): Promise<DeletedResponse> {
    return this.transport('DELETE', `/v1/batches/${id}`)
  }
}
