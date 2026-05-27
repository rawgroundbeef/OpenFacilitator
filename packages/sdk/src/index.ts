// Main client
export { OpenFacilitator, createDefaultFacilitator } from './client.js';

// Types
export type {
  FacilitatorConfig,
  PaymentPayload,
  PaymentPayloadV1,
  PaymentPayloadV2,
  PaymentAuthorization,
  PaymentRequirements,
  PaymentRequirementsV1,
  PaymentRequirementsV2,
  VerifyResponse,
  SettleResponse,
  SupportedResponse,
  PaymentKind,
  NetworkType,
  NetworkInfo,
} from './types.js';

// Errors
export {
  FacilitatorError,
  NetworkError,
  VerificationError,
  SettlementError,
  ConfigurationError,
} from './errors.js';

// Network utilities
export {
  NETWORKS,
  getNetwork,
  getNetworkType,
  toV1NetworkId,
  toV2NetworkId,
  isValidNetwork,
  getMainnets,
  getTestnets,
} from './networks.js';

// Utils
export {
  isPaymentPayload,
  isPaymentPayloadV1,
  isPaymentPayloadV2,
  isPaymentRequirementsV1,
  isPaymentRequirementsV2,
  getSchemeNetwork,
  getVersion,
  getVersionSafe,
  assertNever,
} from './utils.js';

// Middleware
export {
  createPaymentContext,
  // Express middleware
  createPaymentMiddleware,
  // Hono middleware
  honoPaymentMiddleware,
  // Types
  type PaymentContext,
  type PaymentRequest,
  type PaymentMiddlewareConfig,
  type HonoPaymentConfig,
} from './middleware.js';
