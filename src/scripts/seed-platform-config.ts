/**
 * Seeds the core platform configuration:
 * - Workflow Definition (CLAIM_WORKFLOW)
 * - Validation Rules (FNOL category)
 * - Fraud Rules
 * - Document Rules
 *
 * Run: npx ts-node src/scripts/seed-platform-config.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────────────────────
// Inline schemas (avoid Next.js module resolution issues in ts-node context)
// ──────────────────────────────────────────────────────────────────────────────

const WorkflowDefinitionSchema = new mongoose.Schema({
  workflowCode: { type: String, required: true, unique: true },
  workflowName: String,
  entityType: String,
  initialStatus: String,
  terminalStatuses: [String],
  transitions: [mongoose.Schema.Types.Mixed],
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const ValidationRuleSchema = new mongoose.Schema({
  ruleCode: { type: String, required: true, unique: true },
  ruleName: String,
  description: String,
  field: String,
  operator: String,
  value: String,
  errorMessage: String,
  severity: { type: String, default: 'ERROR' },
  category: String,
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 100 },
}, { timestamps: true });

const FraudRuleSchema = new mongoose.Schema({
  ruleCode: { type: String, required: true, unique: true },
  ruleName: String,
  description: String,
  ruleType: String,
  field: String,
  operator: String,
  thresholdValue: Number,
  windowDays: Number,
  flagMessage: String,
  severity: { type: String, default: 'MEDIUM' },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 100 },
}, { timestamps: true });

const ClaimDocumentRuleSchema = new mongoose.Schema({
  ruleId: { type: String, required: true, unique: true },
  claimType: String,
  policyType: String,
  requiredDocuments: [mongoose.Schema.Types.Mixed],
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const WorkflowDefinition =
  mongoose.models.WorkflowDefinition ||
  mongoose.model('WorkflowDefinition', WorkflowDefinitionSchema, 'workflowDefinitions');

const ValidationRule =
  mongoose.models.ValidationRule ||
  mongoose.model('ValidationRule', ValidationRuleSchema, 'validationRules');

const FraudRule =
  mongoose.models.FraudRule ||
  mongoose.model('FraudRule', FraudRuleSchema, 'fraudRules');

const ClaimDocumentRule =
  mongoose.models.ClaimDocumentRule ||
  mongoose.model('ClaimDocumentRule', ClaimDocumentRuleSchema, 'claimDocumentRules');

// ──────────────────────────────────────────────────────────────────────────────
// Seed data
// ──────────────────────────────────────────────────────────────────────────────

const WORKFLOW: object = {
  workflowCode: 'CLAIM_WORKFLOW',
  workflowName: 'Standard Claim Workflow',
  entityType: 'ClaimsHistory',
  initialStatus: 'FNOL_RECEIVED',
  terminalStatuses: ['APPROVED', 'REJECTED', 'SETTLED'],
  isActive: true,
  version: 1,
  transitions: [
    { fromStatus: 'FNOL_RECEIVED',      toStatus: 'VALIDATED',          allowedRoles: ['SYSTEM', 'Administrator'], requiresComment: false, autoTrigger: true },
    { fromStatus: 'VALIDATED',          toStatus: 'CLAIM_REGISTERED',   allowedRoles: ['SYSTEM', 'Administrator'], requiresComment: false, autoTrigger: true },
    { fromStatus: 'CLAIM_REGISTERED',   toStatus: 'DOCUMENTS_PENDING',  allowedRoles: ['SYSTEM', 'Administrator', 'Claims Processor'], requiresComment: false, autoTrigger: false },
    { fromStatus: 'DOCUMENTS_PENDING',  toStatus: 'DOCUMENTS_RECEIVED', allowedRoles: ['SYSTEM', 'Administrator', 'Claims Processor'], requiresComment: false, autoTrigger: true },
    { fromStatus: 'DOCUMENTS_RECEIVED', toStatus: 'UNDER_REVIEW',       allowedRoles: ['Administrator', 'Claims Processor'], requiresComment: false, autoTrigger: false },
    { fromStatus: 'UNDER_REVIEW',       toStatus: 'APPROVED',           allowedRoles: ['Administrator'], requiresComment: true, autoTrigger: false },
    { fromStatus: 'UNDER_REVIEW',       toStatus: 'REJECTED',           allowedRoles: ['Administrator'], requiresComment: true, autoTrigger: false },
    { fromStatus: 'APPROVED',           toStatus: 'SETTLED',            allowedRoles: ['Administrator'], requiresComment: false, autoTrigger: false },
    { fromStatus: 'CLAIM_REGISTERED',   toStatus: 'UNDER_REVIEW',       allowedRoles: ['Administrator'], requiresComment: false, autoTrigger: false },
    { fromStatus: 'FNOL_RECEIVED',      toStatus: 'REJECTED',           allowedRoles: ['Administrator'], requiresComment: true, autoTrigger: false },
  ],
};

const VALIDATION_RULES: object[] = [
  {
    ruleCode: 'FNOL_POLICY_ACTIVE',
    ruleName: 'Policy Must Be Active',
    description: 'Policy status must be ACTIVE at time of FNOL receipt',
    field: 'policyStatus',
    operator: 'EQUALS',
    value: 'ACTIVE',
    errorMessage: 'Policy must be in ACTIVE status to file a claim',
    severity: 'ERROR',
    category: 'FNOL',
    isActive: true,
    priority: 10,
  },
  {
    ruleCode: 'FNOL_POLICY_NOT_EXPIRED',
    ruleName: 'Policy Must Not Be Expired',
    description: 'Policy expiry date must be in the future',
    field: 'policyExpired',
    operator: 'EQUALS',
    value: 'false',
    errorMessage: 'Policy has expired and is not eligible for claims',
    severity: 'ERROR',
    category: 'FNOL',
    isActive: true,
    priority: 20,
  },
  {
    ruleCode: 'FNOL_COVERAGE_AVAILABLE',
    ruleName: 'Active Coverage Required',
    description: 'At least one active coverage must exist on the policy',
    field: 'coverageCount',
    operator: 'GREATER_THAN',
    value: '0',
    errorMessage: 'No active coverage found for this policy',
    severity: 'ERROR',
    category: 'FNOL',
    isActive: true,
    priority: 30,
  },
  {
    ruleCode: 'FNOL_CUSTOMER_EXISTS',
    ruleName: 'Customer Must Exist',
    description: 'Customer record must be found in the system',
    field: 'customerStatus',
    operator: 'NOT_EQUALS',
    value: 'NOT_FOUND',
    errorMessage: 'Customer record not found',
    severity: 'ERROR',
    category: 'FNOL',
    isActive: true,
    priority: 5,
  },
];

const FRAUD_RULES: object[] = [
  {
    ruleCode: 'FRAUD_VELOCITY_30D',
    ruleName: 'Multiple Claims in 30 Days',
    description: 'Flag if 3 or more claims filed on the same policy within 30 days',
    ruleType: 'VELOCITY',
    thresholdValue: 3,
    windowDays: 30,
    flagMessage: 'Policy has {count} claims in the last 30 days',
    severity: 'HIGH',
    isActive: true,
    priority: 10,
  },
  {
    ruleCode: 'FRAUD_VELOCITY_12M',
    ruleName: 'High Claims Volume 12 Months',
    description: 'Flag if 5 or more claims filed in the past 12 months',
    ruleType: 'VELOCITY',
    thresholdValue: 5,
    windowDays: 365,
    flagMessage: 'Policy has {count} claims in the last 12 months — high volume',
    severity: 'MEDIUM',
    isActive: true,
    priority: 20,
  },
  {
    ruleCode: 'FRAUD_DUPLICATE_VEHICLE_30D',
    ruleName: 'Same Vehicle Multiple Claims 30 Days',
    description: 'Flag if same vehicle registration number appears in another claim within 30 days',
    ruleType: 'DUPLICATE',
    field: 'vehicleNumber',
    windowDays: 30,
    flagMessage: 'Vehicle has another claim within the last 30 days',
    severity: 'HIGH',
    isActive: true,
    priority: 15,
  },
  {
    ruleCode: 'FRAUD_DUPLICATE_INCIDENT',
    ruleName: 'Duplicate Incident Detection',
    description: 'Flag if the same policy has a claim on the same incident date',
    ruleType: 'DUPLICATE',
    field: 'policyId',
    windowDays: 1,
    flagMessage: 'A claim already exists for this policy on the same date',
    severity: 'CRITICAL',
    isActive: true,
    priority: 5,
  },
];

const DOCUMENT_RULES: object[] = [
  {
    ruleId: 'DOC_RULE_OWN_DAMAGE',
    claimType: 'OWN_DAMAGE',
    isActive: true,
    version: 1,
    requiredDocuments: [
      { documentCode: 'DRIVING_LICENSE', documentName: 'Driving License', isMandatory: true, description: 'Valid driving license of the driver at the time of incident' },
      { documentCode: 'RC_BOOK', documentName: 'RC Book', isMandatory: true, description: 'Registration Certificate of the vehicle' },
      { documentCode: 'REPAIR_ESTIMATE', documentName: 'Repair Estimate', isMandatory: true, description: 'Garage repair estimate with itemized costs' },
      { documentCode: 'DAMAGE_PHOTOS', documentName: 'Damage Photographs', isMandatory: true, description: 'Clear photographs of the vehicle damage' },
      { documentCode: 'FIR_COPY', documentName: 'FIR Copy', isMandatory: false, description: 'Police FIR if applicable' },
      { documentCode: 'CLAIM_FORM', documentName: 'Signed Claim Form', isMandatory: true, description: 'Company claim form signed by the insured' },
    ],
  },
  {
    ruleId: 'DOC_RULE_THIRD_PARTY',
    claimType: 'THIRD_PARTY',
    isActive: true,
    version: 1,
    requiredDocuments: [
      { documentCode: 'DRIVING_LICENSE', documentName: 'Driving License', isMandatory: true },
      { documentCode: 'RC_BOOK', documentName: 'RC Book', isMandatory: true },
      { documentCode: 'FIR_COPY', documentName: 'FIR Copy', isMandatory: true, description: 'Mandatory for third-party claims' },
      { documentCode: 'COURT_NOTICE', documentName: 'Court Notice / Legal Notice', isMandatory: false },
      { documentCode: 'CLAIM_FORM', documentName: 'Signed Claim Form', isMandatory: true },
    ],
  },
  {
    ruleId: 'DOC_RULE_THEFT',
    claimType: 'THEFT',
    isActive: true,
    version: 1,
    requiredDocuments: [
      { documentCode: 'FIR_COPY', documentName: 'FIR Copy', isMandatory: true, description: 'Police FIR for vehicle theft' },
      { documentCode: 'RC_BOOK', documentName: 'RC Book', isMandatory: true },
      { documentCode: 'KEYS', documentName: 'Original Vehicle Keys', isMandatory: true },
      { documentCode: 'FORM_35', documentName: 'Form 35 (NOC from Financier)', isMandatory: false },
      { documentCode: 'CLAIM_FORM', documentName: 'Signed Claim Form', isMandatory: true },
    ],
  },
  {
    ruleId: 'DOC_RULE_MEDICAL',
    claimType: 'MEDICAL',
    isActive: true,
    version: 1,
    requiredDocuments: [
      { documentCode: 'DISCHARGE_SUMMARY', documentName: 'Hospital Discharge Summary', isMandatory: true },
      { documentCode: 'HOSPITAL_BILLS', documentName: 'Original Hospital Bills', isMandatory: true },
      { documentCode: 'PRESCRIPTIONS', documentName: 'Doctor Prescriptions', isMandatory: true },
      { documentCode: 'LAB_REPORTS', documentName: 'Lab / Diagnostic Reports', isMandatory: false },
      { documentCode: 'ID_PROOF', documentName: 'Patient ID Proof', isMandatory: true },
      { documentCode: 'CLAIM_FORM', documentName: 'Signed Claim Form', isMandatory: true },
    ],
  },
  {
    ruleId: 'DOC_RULE_FIRE',
    claimType: 'FIRE',
    isActive: true,
    version: 1,
    requiredDocuments: [
      { documentCode: 'FIRE_BRIGADE_REPORT', documentName: 'Fire Brigade Report', isMandatory: true },
      { documentCode: 'DAMAGE_PHOTOS', documentName: 'Damage Photographs', isMandatory: true },
      { documentCode: 'SURVEY_REPORT', documentName: 'Surveyor Report', isMandatory: true },
      { documentCode: 'FIR_COPY', documentName: 'FIR Copy', isMandatory: false },
      { documentCode: 'CLAIM_FORM', documentName: 'Signed Claim Form', isMandatory: true },
    ],
  },
  {
    ruleId: 'DOC_RULE_PROPERTY_DAMAGE',
    claimType: 'PROPERTY_DAMAGE',
    isActive: true,
    version: 1,
    requiredDocuments: [
      { documentCode: 'SURVEY_REPORT', documentName: 'Surveyor Report', isMandatory: true },
      { documentCode: 'DAMAGE_PHOTOS', documentName: 'Damage Photographs', isMandatory: true },
      { documentCode: 'REPAIR_ESTIMATE', documentName: 'Repair / Reinstatement Estimate', isMandatory: true },
      { documentCode: 'OWNERSHIP_PROOF', documentName: 'Proof of Ownership', isMandatory: true },
      { documentCode: 'CLAIM_FORM', documentName: 'Signed Claim Form', isMandatory: true },
    ],
  },
  {
    ruleId: 'DOC_RULE_NATURAL_DISASTER',
    claimType: 'NATURAL_DISASTER',
    isActive: true,
    version: 1,
    requiredDocuments: [
      { documentCode: 'GOVERNMENT_NOTICE', documentName: 'Government Disaster Declaration', isMandatory: false },
      { documentCode: 'DAMAGE_PHOTOS', documentName: 'Damage Photographs', isMandatory: true },
      { documentCode: 'SURVEY_REPORT', documentName: 'Surveyor Report', isMandatory: true },
      { documentCode: 'REPAIR_ESTIMATE', documentName: 'Repair Estimate', isMandatory: true },
      { documentCode: 'CLAIM_FORM', documentName: 'Signed Claim Form', isMandatory: true },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Main seed function
// ──────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected.\n');

  // Workflow
  const wfExists = await WorkflowDefinition.findOne({ workflowCode: 'CLAIM_WORKFLOW' });
  if (!wfExists) {
    await WorkflowDefinition.create(WORKFLOW);
    console.log('✓ Workflow definition created: CLAIM_WORKFLOW');
  } else {
    console.log('  Workflow definition already exists: CLAIM_WORKFLOW');
  }

  // Validation rules
  for (const rule of VALIDATION_RULES) {
    const code = (rule as { ruleCode: string }).ruleCode;
    const exists = await ValidationRule.findOne({ ruleCode: code });
    if (!exists) {
      await ValidationRule.create(rule);
      console.log(`✓ Validation rule created: ${code}`);
    } else {
      console.log(`  Validation rule exists: ${code}`);
    }
  }

  // Fraud rules
  for (const rule of FRAUD_RULES) {
    const code = (rule as { ruleCode: string }).ruleCode;
    const exists = await FraudRule.findOne({ ruleCode: code });
    if (!exists) {
      await FraudRule.create(rule);
      console.log(`✓ Fraud rule created: ${code}`);
    } else {
      console.log(`  Fraud rule exists: ${code}`);
    }
  }

  // Document rules
  for (const rule of DOCUMENT_RULES) {
    const id = (rule as { ruleId: string }).ruleId;
    const exists = await ClaimDocumentRule.findOne({ ruleId: id });
    if (!exists) {
      await ClaimDocumentRule.create(rule);
      console.log(`✓ Document rule created: ${id}`);
    } else {
      console.log(`  Document rule exists: ${id}`);
    }
  }

  console.log('\nSeed complete.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
