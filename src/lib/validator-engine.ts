import Policy from '@/models/Policy';
import Coverage from '@/models/Coverage';
import { connectDB } from '@/lib/db/mongodb';

export interface ValidationField {
  name: string;
  value: string | number | boolean | null;
  sourceValue?: string | number | boolean;
  databaseValue?: string | number | boolean;
  externalValue?: string | number | boolean;
}

export interface ValidationResult {
  fieldName: string;
  validationType: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIPPED';
  message: string;
  sourceValue?: any;
  databaseValue?: any;
  externalValue?: any;
}

export interface ClaimValidationData {
  policyNumber: string;
  claimType: string;
  coverageType: string;
  incidentDate: string;
  claimantName: string;
  sumInsured: number;
  estimatedLoss: number;
  documents: string[];
  externalSystemId?: string;
  [key: string]: any;
}

export class ValidatorEngine {
  async validatePolicy(policyNumber: string): Promise<ValidationResult> {
    try {
      await connectDB();
      const policy = await Policy.findOne({ policyNumber });

      if (!policy) {
        return {
          fieldName: 'Policy Number',
          validationType: 'Policy Validation',
          status: 'FAIL',
          message: 'Policy not found in database',
        };
      }

      if (policy.policyStatus !== 'ACTIVE') {
        return {
          fieldName: 'Policy Status',
          validationType: 'Policy Validation',
          status: 'FAIL',
          message: `Policy is ${policy.policyStatus}, not ACTIVE`,
        };
      }

      const expiryDate = new Date(policy.expiryDate);
      if (expiryDate < new Date()) {
        return {
          fieldName: 'Policy Expiry',
          validationType: 'Policy Validation',
          status: 'FAIL',
          message: 'Policy has expired',
        };
      }

      return {
        fieldName: 'Policy Number',
        validationType: 'Policy Validation',
        status: 'PASS',
        message: 'Policy is valid and active',
        databaseValue: policy.policyNumber,
      };
    } catch (error) {
      return {
        fieldName: 'Policy Number',
        validationType: 'Policy Validation',
        status: 'FAIL',
        message: `Policy validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async validateCoverage(policyNumber: string, coverageType: string): Promise<ValidationResult> {
    try {
      await connectDB();
      const policy = await Policy.findOne({ policyNumber });

      if (!policy) {
        return {
          fieldName: 'Coverage Type',
          validationType: 'Coverage Validation',
          status: 'FAIL',
          message: 'Policy not found',
        };
      }

      const coverage = await Coverage.findOne({
        policyId: policy.policyId,
        coverageName: { $regex: coverageType, $options: 'i' },
      });

      if (!coverage) {
        return {
          fieldName: 'Coverage Type',
          validationType: 'Coverage Validation',
          status: 'FAIL',
          message: `Coverage "${coverageType}" not found for this policy`,
        };
      }

      if (coverage.status !== 'ACTIVE') {
        return {
          fieldName: 'Coverage Type',
          validationType: 'Coverage Validation',
          status: 'FAIL',
          message: `Coverage "${coverageType}" is ${coverage.status}`,
        };
      }

      return {
        fieldName: 'Coverage Type',
        validationType: 'Coverage Validation',
        status: 'PASS',
        message: `Coverage "${coverageType}" is active`,
        databaseValue: coverage.coverageName,
      };
    } catch (error) {
      return {
        fieldName: 'Coverage Type',
        validationType: 'Coverage Validation',
        status: 'FAIL',
        message: `Coverage validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async validateIncident(policyNumber: string, incidentDate: string): Promise<ValidationResult> {
    try {
      await connectDB();
      const policy = await Policy.findOne({ policyNumber });

      if (!policy) {
        return {
          fieldName: 'Incident Date',
          validationType: 'Incident Validation',
          status: 'FAIL',
          message: 'Policy not found',
        };
      }

      const incident = new Date(incidentDate);
      const policyStart = new Date(policy.effectiveDate);
      const policyEnd = new Date(policy.expiryDate);

      if (isNaN(incident.getTime())) {
        return {
          fieldName: 'Incident Date',
          validationType: 'Incident Validation',
          status: 'FAIL',
          message: 'Invalid incident date format',
        };
      }

      if (incident < policyStart) {
        return {
          fieldName: 'Incident Date',
          validationType: 'Incident Validation',
          status: 'FAIL',
          message: 'Incident date is before policy effective date',
        };
      }

      if (incident > policyEnd) {
        return {
          fieldName: 'Incident Date',
          validationType: 'Incident Validation',
          status: 'FAIL',
          message: 'Incident date is after policy expiry date',
        };
      }

      return {
        fieldName: 'Incident Date',
        validationType: 'Incident Validation',
        status: 'PASS',
        message: 'Incident date is within policy period',
        databaseValue: incidentDate,
      };
    } catch (error) {
      return {
        fieldName: 'Incident Date',
        validationType: 'Incident Validation',
        status: 'FAIL',
        message: `Incident validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async validateFinancial(policyNumber: string, claimAmount: number): Promise<ValidationResult> {
    try {
      await connectDB();
      const policy = await Policy.findOne({ policyNumber });

      if (!policy) {
        return {
          fieldName: 'Sum Insured',
          validationType: 'Financial Validation',
          status: 'FAIL',
          message: 'Policy not found',
        };
      }

      if (claimAmount > policy.sumInsured) {
        return {
          fieldName: 'Sum Insured',
          validationType: 'Financial Validation',
          status: 'FAIL',
          message: `Claim amount (${claimAmount}) exceeds sum insured (${policy.sumInsured})`,
        };
      }

      return {
        fieldName: 'Sum Insured',
        validationType: 'Financial Validation',
        status: 'PASS',
        message: 'Claim amount is within coverage limit',
        databaseValue: policy.sumInsured,
      };
    } catch (error) {
      return {
        fieldName: 'Sum Insured',
        validationType: 'Financial Validation',
        status: 'FAIL',
        message: `Financial validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async validateRequiredFields(data: ClaimValidationData, requiredFields: string[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const field of requiredFields) {
      if (!data[field] || data[field] === '' || data[field] === null) {
        results.push({
          fieldName: field,
          validationType: 'Required Validation',
          status: 'FAIL',
          message: `Required field "${field}" is missing`,
        });
      } else {
        results.push({
          fieldName: field,
          validationType: 'Required Validation',
          status: 'PASS',
          message: `Required field "${field}" is present`,
        });
      }
    }

    return results;
  }

  validateDocuments(documents: string[]): ValidationResult {
    if (!documents || documents.length === 0) {
      return {
        fieldName: 'Documents',
        validationType: 'Document Validation',
        status: 'WARNING',
        message: 'No supporting documents provided',
      };
    }

    return {
      fieldName: 'Documents',
      validationType: 'Document Validation',
      status: 'PASS',
      message: `${documents.length} supporting document(s) provided`,
    };
  }

  async runFullValidation(data: ClaimValidationData): Promise<{
    passed: boolean;
    results: ValidationResult[];
    failedFields: string[];
  }> {
    const results: ValidationResult[] = [];

    // Step 1: Policy Validation
    results.push(await this.validatePolicy(data.policyNumber));

    // Step 2: Coverage Validation
    results.push(await this.validateCoverage(data.policyNumber, data.coverageType));

    // Step 3: Incident Validation
    results.push(await this.validateIncident(data.policyNumber, data.incidentDate));

    // Step 4: Required Fields Validation
    const requiredFields = ['policyNumber', 'claimType', 'coverageType', 'incidentDate', 'claimantName'];
    results.push(...await this.validateRequiredFields(data, requiredFields));

    // Step 5: Document Validation
    results.push(this.validateDocuments(data.documents));

    // Step 6: Financial Validation
    results.push(await this.validateFinancial(data.policyNumber, data.estimatedLoss));

    const failedResults = results.filter(r => r.status === 'FAIL');
    const passed = failedResults.length === 0;

    return {
      passed,
      results,
      failedFields: failedResults.map(r => r.fieldName),
    };
  }
}

export const validatorEngine = new ValidatorEngine();
