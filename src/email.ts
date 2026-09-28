import { addresses, type Transport } from './core.js'
import type { EnqueueResponse, SendRequest, SendResponse } from './types.js'

/**
 * Chainable single email, in the spirit of Perl's Email::Stuffer.
 * Setters are named after the API's JSON fields; recipients accumulate.
 */
export class EmailBuilder {
  private readonly recipients = { to: [] as string[], cc: [] as string[], bcc: [] as string[] }
  private fields: Partial<SendRequest> = {}

  constructor(private readonly transport: Transport) {}

  to(...to: (string | string[])[]): this {
    this.recipients.to.push(...addresses(to))
    return this
  }

  cc(...cc: (string | string[])[]): this {
    this.recipients.cc.push(...addresses(cc))
    return this
  }

  bcc(...bcc: (string | string[])[]): this {
    this.recipients.bcc.push(...addresses(bcc))
    return this
  }

  /** Must be an address on one of your connections; defaults to your default connection. */
  from(from: string): this {
    this.fields.from = from
    return this
  }

  subject(subject: string): this {
    this.fields.subject = subject
    return this
  }

  text_body(text: string): this {
    this.fields.text_body = text
    return this
  }

  html_body(html: string): this {
    this.fields.html_body = html
    return this
  }

  /** The request body. Throws if the email is incomplete. */
  build(): SendRequest {
    const { to, cc, bcc } = this.recipients
    if (!to.length) throw new Error('to() is required')
    if (!this.fields.subject) throw new Error('subject() is required')
    if (!this.fields.text_body && !this.fields.html_body) {
      throw new Error('text_body() or html_body() is required')
    }

    const body: SendRequest = { ...this.fields, to, subject: this.fields.subject }
    if (cc.length) body.cc = cc
    if (bcc.length) body.bcc = bcc
    return body
  }

  /** POST /v1/send — waits for delivery. Max 10 recipients across to/cc/bcc. */
  send(): Promise<SendResponse> {
    return this.transport('POST', '/v1/send', this.build())
  }

  /** POST /v1/enqueue — returns as soon as it's queued (Pro). */
  enqueue(): Promise<EnqueueResponse> {
    return this.transport('POST', '/v1/enqueue', this.build())
  }
}
