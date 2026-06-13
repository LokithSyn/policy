import { ALIAS_INDEX, FIELD_MAPPINGS, FieldMappingEntry } from './field-mapping.config';
import { parseFlexibleDate } from './date-parser';
import { IFnolExtractedData } from '@/models/FnolIntake';

// ── Claim type normalisation ──────────────────────────────────────────────────

const CLAIM_TYPE_MAP: Record<string, string> = {
  // OWN_DAMAGE
  'own damage': 'OWN_DAMAGE', 'own_damage': 'OWN_DAMAGE', 'owndamage': 'OWN_DAMAGE',
  'od': 'OWN_DAMAGE', 'o.d': 'OWN_DAMAGE', 'o.d.': 'OWN_DAMAGE',
  'own': 'OWN_DAMAGE', 'self damage': 'OWN_DAMAGE',

  // THIRD_PARTY
  'third party': 'THIRD_PARTY', 'third_party': 'THIRD_PARTY', 'thirdparty': 'THIRD_PARTY',
  'tp': 'THIRD_PARTY', 't.p': 'THIRD_PARTY', 't.p.': 'THIRD_PARTY',
  'third party liability': 'THIRD_PARTY', 'tpl': 'THIRD_PARTY',
  'liability': 'THIRD_PARTY',

  // THEFT
  'theft': 'THEFT', 'stolen': 'THEFT', 'vehicle theft': 'THEFT',
  'theft/robbery': 'THEFT',

  // MEDICAL
  'medical': 'MEDICAL', 'health': 'MEDICAL', 'medical claim': 'MEDICAL',
  'personal accident': 'MEDICAL', 'pa': 'MEDICAL', 'accident': 'MEDICAL',

  // FIRE
  'fire': 'FIRE', 'fire damage': 'FIRE', 'fire & allied perils': 'FIRE',

  // PROPERTY_DAMAGE
  'property damage': 'PROPERTY_DAMAGE', 'property_damage': 'PROPERTY_DAMAGE',
  'propertydamage': 'PROPERTY_DAMAGE', 'property': 'PROPERTY_DAMAGE',
  'structural damage': 'PROPERTY_DAMAGE',

  // NATURAL_DISASTER
  'natural disaster': 'NATURAL_DISASTER', 'natural_disaster': 'NATURAL_DISASTER',
  'naturaldisaster': 'NATURAL_DISASTER', 'act of god': 'NATURAL_DISASTER',
  'flood': 'NATURAL_DISASTER', 'earthquake': 'NATURAL_DISASTER',
  'cyclone': 'NATURAL_DISASTER', 'storm': 'NATURAL_DISASTER',
  'inundation': 'NATURAL_DISASTER',
};

const VALID_CLAIM_TYPES = new Set([
  'OWN_DAMAGE', 'THIRD_PARTY', 'THEFT', 'MEDICAL',
  'FIRE', 'PROPERTY_DAMAGE', 'NATURAL_DISASTER',
]);

function normalizeClaimType(raw: unknown): string | undefined {
  if (!raw) return undefined;
  const s = String(raw).trim();
  if (VALID_CLAIM_TYPES.has(s)) return s;                     // already canonical
  return CLAIM_TYPE_MAP[s.toLowerCase()] ?? undefined;       // fuzzy match
}

// ── Amount normalisation ──────────────────────────────────────────────────────

function normalizeAmount(raw: unknown): number | undefined {
  if (raw == null || raw === '') return undefined;
  if (typeof raw === 'number') return isNaN(raw) ? undefined : Math.abs(raw);
  const cleaned = String(raw)
    .replace(/[₹$£€,\s]/g, '')   // strip currency symbols and separators
    .replace(/INR|USD|GBP/gi, '') // strip textual currency codes
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : Math.abs(n);
}

// ── Vehicle number normalisation ──────────────────────────────────────────────

function normalizeVehicleNumber(raw: unknown): string | undefined {
  if (!raw) return undefined;
  return String(raw).toUpperCase().replace(/[\s\-_.]/g, '').trim() || undefined;
}

// ── Generic string normalisation ──────────────────────────────────────────────

function normalizeString(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  const s = String(raw).trim();
  return s || undefined;
}

// ── Field coercion dispatcher ─────────────────────────────────────────────────

interface CoercionResult {
  value: unknown;
  error?: string;
}

function coerce(entry: FieldMappingEntry, raw: unknown): CoercionResult {
  switch (entry.type) {
    case 'string':
      return { value: normalizeString(raw) };

    case 'number': {
      const n = normalizeAmount(raw);
      if (n === undefined && raw != null && raw !== '') {
        return { value: undefined, error: `Cannot parse '${raw}' as a number` };
      }
      return { value: n };
    }

    case 'date': {
      const { date, error } = parseFlexibleDate(raw);
      if (!date) return { value: undefined, error: error ?? `Cannot parse '${raw}' as a date` };
      return { value: date };
    }

    case 'claimType': {
      const ct = normalizeClaimType(raw);
      if (!ct && raw != null && raw !== '') {
        return { value: undefined, error: `Unknown claim type: '${raw}'` };
      }
      return { value: ct };
    }

    case 'vehicleNumber':
      return { value: normalizeVehicleNumber(raw) };

    default:
      return { value: normalizeString(raw) };
  }
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface FieldMappingReport {
  sourceField: string;
  targetField: string;
  rawValue: unknown;
  normalizedValue: unknown;
  status: 'MAPPED' | 'UNMAPPED' | 'COERCION_ERROR';
  error?: string;
}

export interface NormalizationResult {
  success: boolean;
  normalizedData: Partial<IFnolExtractedData>;
  rawPayload: Record<string, unknown>;
  mappingReport: FieldMappingReport[];
  unmappedSourceFields: string[];
  errors: string[];
}

// ── Main normaliser ───────────────────────────────────────────────────────────

/**
 * Transforms an arbitrary IntelliDoc payload into a standard FNOL DTO.
 *
 * Algorithm:
 *   1. For each key in the raw payload, look it up in the alias index (case-insensitive).
 *   2. Coerce the value to the target type.
 *   3. Collect unmapped fields and coercion errors for the audit report.
 */
export function normalizeIntelliDocPayload(
  rawPayload: Record<string, unknown>
): NormalizationResult {
  const normalizedData: Partial<IFnolExtractedData> = {};
  const mappingReport: FieldMappingReport[] = [];
  const unmappedSourceFields: string[] = [];
  const errors: string[] = [];

  // Track which target fields have been populated (first-match wins)
  const populated = new Set<string>();

  for (const [sourceKey, rawValue] of Object.entries(rawPayload)) {
    const entry = ALIAS_INDEX.get(sourceKey.toLowerCase().trim());

    if (!entry) {
      unmappedSourceFields.push(sourceKey);
      mappingReport.push({
        sourceField: sourceKey,
        targetField: '',
        rawValue,
        normalizedValue: undefined,
        status: 'UNMAPPED',
      });
      continue;
    }

    // First-match wins — don't overwrite an already-populated field
    if (populated.has(entry.target)) continue;

    const { value, error } = coerce(entry, rawValue);

    if (error) {
      errors.push(`[${entry.target}] ${error}`);
      mappingReport.push({
        sourceField: sourceKey,
        targetField: entry.target,
        rawValue,
        normalizedValue: undefined,
        status: 'COERCION_ERROR',
        error,
      });
      continue;
    }

    if (value !== undefined) {
      (normalizedData as Record<string, unknown>)[entry.target] = value;
      populated.add(entry.target);
    }

    mappingReport.push({
      sourceField: sourceKey,
      targetField: entry.target,
      rawValue,
      normalizedValue: value,
      status: 'MAPPED',
    });
  }

  // Report required fields that were not found in the raw payload
  for (const entry of FIELD_MAPPINGS.filter(e => e.required)) {
    if (!populated.has(entry.target)) {
      errors.push(`Required field '${entry.target}' not found in payload (tried aliases: ${entry.aliases.slice(0, 5).join(', ')}...)`);
    }
  }

  return {
    success: errors.length === 0,
    normalizedData,
    rawPayload,
    mappingReport,
    unmappedSourceFields,
    errors,
  };
}
