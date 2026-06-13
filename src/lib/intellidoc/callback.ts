/**
 * IntelliDoc Callback Service
 *
 * After IntelliPolicy processes an FNOL intake (validate → create claim → generate PDF),
 * this service POSTs the result back to IntelliDoc's mapped endpoint.
 *
 * Configured via env:
 *   INTELLIDOC_API_URL     – base URL of IntelliDoc (e.g. http://localhost:4000/api)
 *   INTELLIDOC_API_KEY     – API key sent in X-API-Key header
 *   INTELLIDOC_API_SECRET  – API secret sent in X-API-Secret header
 *
 * Default callback endpoint: {INTELLIDOC_API_URL}/fnol/processed-results
 * Can be overridden per-request via the `callbackUrl` field in the intake body.
 */

export type CallbackStatus =
  | 'CLAIM_CREATED'
  | 'VALIDATION_FAILED'
  | 'NORMALIZATION_FAILED'
  | 'CLAIM_REGISTRATION_FAILED';

export interface ValidationStepSummary {
  step: number;
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
}

export interface CallbackPayload {
  /** documentId echoed back so IntelliDoc can correlate the response to its request */
  documentId: string;
  /** IntelliPolicy's internal intake reference */
  intakeId: string;
  /** Overall processing status */
  status: CallbackStatus;
  processedAt: string;

  // ── Success fields (status = CLAIM_CREATED) ────────────────────────────────
  claimNumber?: string;
  claimId?: string;
  claimStatus?: string;
  policyNumber?: string;
  policyId?: string;
  isFraudulent?: boolean;
  fraudFlags?: string[];
  fraudSeverity?: string;

  /** Claim summary PDF encoded as base64 — IntelliDoc stores / forwards this */
  pdfBase64?: string;
  pdfFileName?: string;
  pdfMimeType?: 'application/pdf';

  /** URL to pull the PDF on-demand (alternative to base64) */
  pdfUrl?: string;

  // ── Failure fields ─────────────────────────────────────────────────────────
  errors?: Array<{ field: string; message: string; code?: string }>;

  // ── Always present ─────────────────────────────────────────────────────────
  validationSteps?: ValidationStepSummary[];
  warnings?: Array<{ field: string; message: string }>;
}

export interface CallbackResult {
  sent: boolean;
  callbackUrl: string;
  statusCode?: number;
  responseBody?: unknown;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

const CALLBACK_TIMEOUT_MS = 15_000;

/**
 * Resolves the callback URL:
 *   1. Explicit callbackUrl passed in the request (highest priority)
 *   2. INTELLIDOC_API_URL env var + /fnol/processed-results
 *   3. Not configured → skip callback
 */
function resolveCallbackUrl(override?: string): string | null {
  if (override?.trim()) return override.trim();
  const base = process.env.INTELLIDOC_API_URL?.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/fnol/processed-results`;
}

/**
 * POSTs the claim processing result back to IntelliDoc.
 * Always resolves (never throws) — a callback failure must not break the intake flow.
 */
export async function sendClaimCallback(
  payload: CallbackPayload,
  callbackUrl?: string
): Promise<CallbackResult> {
  const url = resolveCallbackUrl(callbackUrl);

  if (!url) {
    return {
      sent: false,
      callbackUrl: '',
      skipped: true,
      skipReason: 'INTELLIDOC_API_URL is not configured — set it in .env to enable callbacks',
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Source': 'INTELLIPOLICY',
    'X-Intake-Id': payload.intakeId,
  };

  const apiKey = process.env.INTELLIDOC_API_KEY?.trim();
  const apiSecret = process.env.INTELLIDOC_API_SECRET?.trim();
  if (apiKey)    headers['X-API-Key']    = apiKey;
  if (apiSecret) headers['X-API-Secret'] = apiSecret;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CALLBACK_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    let responseBody: unknown;
    try { responseBody = await response.json(); } catch { responseBody = null; }

    return {
      sent: response.ok,
      callbackUrl: url,
      statusCode: response.status,
      responseBody,
      error: response.ok ? undefined : `IntelliDoc returned HTTP ${response.status}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.toLowerCase().includes('abort');
    return {
      sent: false,
      callbackUrl: url,
      error: isTimeout
        ? `Callback timed out after ${CALLBACK_TIMEOUT_MS / 1000}s`
        : `Callback failed: ${message}`,
    };
  }
}
