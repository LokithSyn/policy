'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ExtractedField {
  name: string;
  value: string | number | boolean;
  selected: boolean;
}

interface ValidationConfig {
  fieldName: string;
  validationType: string;
  validationSource: string;
  operator: string;
  priority: number;
  required: boolean;
}

interface ValidationResult {
  fieldName: string;
  validationType: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIPPED';
  message: string;
  sourceValue?: any;
  databaseValue?: any;
  externalValue?: any;
}

export default function ValidatorPage() {
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Metadata
  const [claimTypes, setClaimTypes] = useState<string[]>([]);
  const [coverageTypes, setCoverageTypes] = useState<string[]>([]);

  // Section 1: Claim Information
  const [claimInfo, setClaimInfo] = useState({
    claimType: 'Commercial General Liability',
    coverageType: 'Bodily Injury',
    policyNumber: '',
    sourceSystem: 'IntelliDoc',
    documentType: 'FNOL',
    externalSystem: 'Insurance Company A',
  });

  // Section 2: Available Fields
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([
    { name: 'Policy Number', value: 'GL-554109-2026-ABC', selected: true },
    { name: 'Policy Holder', value: 'ABC Restaurant Pvt Ltd', selected: true },
    { name: 'Incident Date', value: '15-Jun-2026', selected: true },
    { name: 'Incident Location', value: 'Chennai', selected: true },
    { name: 'Claimant Name', value: 'John Doe', selected: true },
    { name: 'Sum Insured', value: 5000000, selected: true },
    { name: 'Premium Amount', value: 500000, selected: false },
    { name: 'Estimated Loss', value: 200000, selected: true },
    { name: 'Hospital Name', value: 'Apollo Hospital', selected: true },
    { name: 'Diagnosis', value: 'Fractured Femur', selected: true },
    { name: 'Police Report Number', value: 'FIR-2026-9876', selected: true },
    { name: 'Witness Name', value: 'Michael Thomas', selected: true },
    { name: 'CCTV Available', value: true, selected: true },
    { name: 'Coverage Type', value: 'Bodily Injury', selected: true },
    { name: 'Incident Description', value: 'Slip and fall incident', selected: true },
  ]);

  // Section 3: Validation Configuration
  const validationConfigs: ValidationConfig[] = [
    {
      fieldName: 'Policy Number',
      validationType: 'Exact Match',
      validationSource: 'Application Database',
      operator: 'Equals',
      priority: 1,
      required: true,
    },
    {
      fieldName: 'Incident Date',
      validationType: 'Date Validation',
      validationSource: 'Database',
      operator: 'Between',
      priority: 2,
      required: true,
    },
    {
      fieldName: 'Coverage Type',
      validationType: 'Coverage Validation',
      validationSource: 'Coverage Service',
      operator: 'Equals',
      priority: 3,
      required: true,
    },
    {
      fieldName: 'Sum Insured',
      validationType: 'Financial Validation',
      validationSource: 'Database',
      operator: 'Less Than',
      priority: 4,
      required: true,
    },
  ];

  // Section 4: Validation Results
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validationPassed, setValidationPassed] = useState<boolean | null>(null);

  // Section 5: Integration Configuration
  const [integrationConfig, setIntegrationConfig] = useState({
    externalApiUrl: 'https://insurance-api.example.com/claims',
    apiKey: '****',
    timeout: 30000,
    retryAttempts: 3,
    notifyOnFailure: true,
  });

  // Load metadata
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const res = await fetch('/api/claims/validator');
        const data = await res.json();

        if (data.success) {
          setClaimTypes(data.data.claimTypes);
          setCoverageTypes(data.data.coverageTypes);
        }
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    };

    loadMetadata();
  }, []);

  const handleFieldToggle = (fieldName: string) => {
    setExtractedFields((prev) =>
      prev.map((field) =>
        field.name === fieldName ? { ...field, selected: !field.selected } : field
      )
    );
  };

  const handleClaimInfoChange = (field: string, value: string) => {
    setClaimInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRunValidation = async () => {
    setError('');
    setSuccess('');
    setValidating(true);

    try {
      // Prepare validation data
      const selectedFields = extractedFields.filter((f) => f.selected);
      const validationData = {
        policyNumber: claimInfo.policyNumber,
        claimType: claimInfo.claimType,
        coverageType: claimInfo.coverageType,
        incidentDate: selectedFields.find((f) => f.name === 'Incident Date')?.value || '',
        claimantName: selectedFields.find((f) => f.name === 'Claimant Name')?.value || '',
        sumInsured: selectedFields.find((f) => f.name === 'Sum Insured')?.value || 0,
        estimatedLoss: selectedFields.find((f) => f.name === 'Estimated Loss')?.value || 0,
        documents: selectedFields.filter((f) => f.name.includes('Report') || f.name.includes('Document')).map((f) => f.name),
      };

      const res = await fetch('/api/claims/validator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validationData),
      });

      const data = await res.json();

      if (data.success) {
        setValidationResults(data.data.results);
        setValidationPassed(data.data.validationPassed);

        if (data.data.validationPassed) {
          setSuccess('✅ All validations passed! Claim can be created.');
        } else {
          setError(`❌ Validation failed for ${data.data.failedFields?.length || 0} field(s)`);
        }
      } else {
        setError(data.message || 'Validation failed');
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setValidating(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'success';
      case 'FAIL':
        return 'error';
      case 'WARNING':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Dynamic Claims Validator</h1>
        <p className="text-slate-600 mt-2">Pre-claim validation engine - Validate extracted data before creating claim records</p>
      </div>

      {/* Messages */}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">{success}</div>}

      {/* Section 1: Claim Information */}
      <Card>
        <CardHeader>
          <CardTitle>Section 1: Claim Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Claim Type</label>
              <Select
                value={claimInfo.claimType}
                onChange={(e) => handleClaimInfoChange('claimType', e.target.value)}
                options={claimTypes.map((t) => ({ value: t, label: t }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Coverage Type</label>
              <Select
                value={claimInfo.coverageType}
                onChange={(e) => handleClaimInfoChange('coverageType', e.target.value)}
                options={coverageTypes.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Policy Number</label>
              <Input
                type="text"
                value={claimInfo.policyNumber}
                onChange={(e) => handleClaimInfoChange('policyNumber', e.target.value)}
                placeholder="GL-554109-2026-ABC"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Source System</label>
              <Input type="text" value={claimInfo.sourceSystem} disabled className="bg-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Document Type</label>
              <Input type="text" value={claimInfo.documentType} disabled className="bg-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">External System</label>
              <Input type="text" value={claimInfo.externalSystem} disabled className="bg-slate-100" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Available Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Section 2: Available Fields (Multi-Select)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {extractedFields.map((field) => (
              <label key={field.name} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={field.selected}
                  onChange={() => handleFieldToggle(field.name)}
                  className="h-4 w-4 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{field.name}</div>
                  <div className="text-xs text-slate-600">{String(field.value)}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Validation Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Section 3: Validation Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-semibold">Field Name</th>
                  <th className="p-3 text-left font-semibold">Validation Type</th>
                  <th className="p-3 text-left font-semibold">Source</th>
                  <th className="p-3 text-left font-semibold">Operator</th>
                  <th className="p-3 text-left font-semibold">Priority</th>
                  <th className="p-3 text-left font-semibold">Required</th>
                </tr>
              </thead>
              <tbody>
                {validationConfigs.map((config, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3">{config.fieldName}</td>
                    <td className="p-3">{config.validationType}</td>
                    <td className="p-3">{config.validationSource}</td>
                    <td className="p-3">{config.operator}</td>
                    <td className="p-3">{config.priority}</td>
                    <td className="p-3">{config.required ? '✓' : '○'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Validation Results */}
      {validationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Section 4: Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold">Field</th>
                    <th className="p-3 text-left font-semibold">Validation Type</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                    <th className="p-3 text-left font-semibold">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResults.map((result, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-3 font-medium">{result.fieldName}</td>
                      <td className="p-3">{result.validationType}</td>
                      <td className="p-3">
                        <Badge variant={getStatusBadgeColor(result.status) as any}>
                          {result.status}
                        </Badge>
                      </td>
                      <td className="p-3">{result.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Integration Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Section 5: Integration Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">External API URL</label>
              <Input type="text" value={integrationConfig.externalApiUrl} disabled className="bg-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">API Key</label>
              <Input type="password" value={integrationConfig.apiKey} disabled className="bg-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Timeout (ms)</label>
              <Input type="number" value={integrationConfig.timeout} disabled className="bg-slate-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Retry Attempts</label>
              <Input type="number" value={integrationConfig.retryAttempts} disabled className="bg-slate-100" />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={integrationConfig.notifyOnFailure} disabled className="h-4 w-4" />
                <span className="text-sm font-medium">Notify External System on Validation Failure</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 border-t pt-6">
        <Button variant="primary" onClick={handleRunValidation} disabled={validating || !claimInfo.policyNumber}>
          {validating ? 'Validating...' : '▶ Run Validation'}
        </Button>
        {validationPassed === true && (
          <Button variant="primary">✓ Create Claim Record</Button>
        )}
        {validationPassed === false && (
          <Button variant="ghost" disabled>
            ✗ Fix Issues Before Creating Claim
          </Button>
        )}
      </div>
    </div>
  );
}
