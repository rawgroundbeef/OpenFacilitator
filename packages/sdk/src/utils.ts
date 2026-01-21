import type {
  PaymentPayload,
  PaymentPayloadV1,
  PaymentPayloadV2,
  PaymentRequirements,
  PaymentRequirementsV1,
  PaymentRequirementsV2,
} from './types.js';

/**
 * Normalize facilitator URL (remove trailing slash)
 */
export function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Build full endpoint URL
 */
export function buildUrl(baseUrl: string, path: string): string {
  return `${normalizeUrl(baseUrl)}${path}`;
}

/**
 * Type guard for checking if value is a valid payment payload
 */
export function isPaymentPayload(value: unknown): value is PaymentPayload {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    (obj.x402Version === 1 || obj.x402Version === 2) &&
    typeof obj.scheme === 'string' &&
    typeof obj.network === 'string' &&
    obj.payload !== undefined
  );
}

// ============ Type Guards for Versioned Types ============

/**
 * Type guard for PaymentPayloadV1 (x402 version 1).
 * Narrows PaymentPayload to v1 format with flat structure.
 */
export function isPaymentPayloadV1(value: unknown): value is PaymentPayloadV1 {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.x402Version === 1 &&
    typeof obj.scheme === 'string' &&
    typeof obj.network === 'string' &&
    obj.payload !== undefined &&
    typeof obj.payload === 'object'
  );
}

/**
 * Type guard for PaymentPayloadV2 (x402 version 2).
 * Narrows PaymentPayload to v2 format with CAIP-2 network identifiers.
 */
export function isPaymentPayloadV2(value: unknown): value is PaymentPayloadV2 {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.x402Version === 2 &&
    typeof obj.scheme === 'string' &&
    typeof obj.network === 'string' &&
    obj.payload !== undefined &&
    typeof obj.payload === 'object'
  );
}

/**
 * Type guard for PaymentRequirementsV1.
 * V1 requirements have maxAmountRequired field.
 */
export function isPaymentRequirementsV1(
  value: unknown
): value is PaymentRequirementsV1 {
  if (!value || typeof value !== 'object') return false;
  return 'maxAmountRequired' in value;
}

/**
 * Type guard for PaymentRequirementsV2.
 * V2 requirements have amount but NOT maxAmountRequired.
 */
export function isPaymentRequirementsV2(
  value: unknown
): value is PaymentRequirementsV2 {
  if (!value || typeof value !== 'object') return false;
  return 'amount' in value && !('maxAmountRequired' in value);
}

// ============ Extraction Utilities ============

/**
 * Extract scheme and network from PaymentPayload (version-agnostic).
 * Both v1 and v2 have these fields at the top level.
 */
export function getSchemeNetwork(payload: PaymentPayload): {
  scheme: string;
  network: string;
} {
  return {
    scheme: payload.scheme,
    network: payload.network,
  };
}

/**
 * Get x402 version from PaymentPayload.
 * Returns literal type 1 | 2 for exhaustiveness checking in switch statements.
 */
export function getVersion(payload: PaymentPayload): 1 | 2 {
  return payload.x402Version;
}

// ============ Exhaustiveness Checking ============

/**
 * Exhaustiveness check for discriminated unions.
 * TypeScript will error at compile time if not all union members are handled.
 *
 * @example
 * function handlePayload(payload: PaymentPayload) {
 *   switch (payload.x402Version) {
 *     case 1: return handleV1(payload);
 *     case 2: return handleV2(payload);
 *     default: return assertNever(payload);
 *   }
 * }
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(
    message ?? `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
}
