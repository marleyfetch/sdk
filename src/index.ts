export { MarleyFetch } from './client.js'
export { MarleyFetchError, createTransport, type Transport } from './core.js'
export { EmailBuilder } from './email.js'
export { BatchBuilder } from './batch.js'
export type {
  MarleyFetchConfig,
  SendRequest,
  SendResponse,
  EnqueueResponse,
  BatchRequest,
  BatchItem,
  BatchStartedResponse,
  BatchStatus,
  BatchStatusResponse,
  DeletedResponse,
} from './types.js'
