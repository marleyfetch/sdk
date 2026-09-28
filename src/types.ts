export interface MarleyFetchConfig {
  apiKey: string
  /** Override the API host. Only needed for local dev, e.g. http://localhost:8787 */
  baseUrl?: string
}

/** Body of POST /v1/send and /v1/enqueue */
export interface SendRequest {
  to: string[]
  subject: string
  cc?: string[]
  bcc?: string[]
  text_body?: string
  html_body?: string
  from?: string
}

/** Body of POST /v1/send/batch */
export interface BatchRequest {
  name?: string
  from?: string
  emails?: BatchItem[]
  template?: { subject: string; text_body?: string; html_body?: string }
  template_id?: number
  recipients?: string[]
  audience_id?: number
}

/** One email per item: a batch delivers each to a single recipient, with no cc/bcc. */
export interface BatchItem {
  to: string
  subject: string
  text_body?: string
  html_body?: string
}

export interface SendResponse {
  success: true
  messageId: string
  outboxId: number
  from?: string
  message: string
}

export interface EnqueueResponse {
  success: true
  outboxId: number
  from?: string
  queuedAt: string
  message: string
}

export interface BatchStartedResponse {
  success: true
  batch_id: number
  total_count: number
  status_url: string
  message: string
}

export interface BatchStatus {
  id: number
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  total_count: number
  sent_count: number
  failed_count: number
  progress: number
  created_at: string
  updated_at: string
}

export interface BatchStatusResponse {
  success: true
  batch: BatchStatus
}

export interface DeletedResponse {
  success: true
  message: string
}
