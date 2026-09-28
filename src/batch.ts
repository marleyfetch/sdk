import { addresses, type Transport } from './core.js'
import type { BatchItem, BatchRequest, BatchStartedResponse } from './types.js'

/** Chainable batch send: one template to many recipients, or a list of prebuilt emails. */
export class BatchBuilder {
  private fields: BatchRequest = {}
  private template: { subject?: string; text_body?: string; html_body?: string } = {}

  constructor(private readonly transport: Transport) {}

  name(name: string): this {
    this.fields.name = name
    return this
  }

  from(from: string): this {
    this.fields.from = from
    return this
  }

  subject(subject: string): this {
    this.template.subject = subject
    return this
  }

  text_body(text: string): this {
    this.template.text_body = text
    return this
  }

  html_body(html: string): this {
    this.template.html_body = html
    return this
  }

  /** Use a saved template instead of subject()/text_body()/html_body(). */
  template_id(id: number): this {
    this.fields.template_id = id
    return this
  }

  recipients(...recipients: (string | string[])[]): this {
    this.fields.recipients = [...(this.fields.recipients ?? []), ...addresses(recipients)]
    return this
  }

  /** Send the template to a saved audience instead of an inline recipient list. */
  audience_id(id: number): this {
    this.fields.audience_id = id
    return this
  }

  /** Fully-formed emails, when one template won't do. */
  emails(emails: BatchItem[]): this {
    this.fields.emails = [...(this.fields.emails ?? []), ...emails]
    return this
  }

  /** The request body. Throws if the batch is incomplete. */
  build(): BatchRequest {
    const body: BatchRequest = { ...this.fields }
    if (this.template.subject) {
      body.template = { ...this.template, subject: this.template.subject }
    }

    const hasTemplate = Boolean(body.template || body.template_id)
    const hasRecipients = Boolean(body.recipients?.length || body.audience_id)
    if (!body.emails?.length && !(hasTemplate && hasRecipients)) {
      throw new Error(
        'batch needs emails(), or subject()/template_id() plus recipients()/audience_id()'
      )
    }
    if (body.template && body.template_id) {
      throw new Error('use subject()/text_body()/html_body() or template_id(), not both')
    }

    return body
  }

  /** POST /v1/send/batch — returns immediately; poll getBatch() for progress. */
  send(): Promise<BatchStartedResponse> {
    return this.transport('POST', '/v1/send/batch', this.build())
  }
}
