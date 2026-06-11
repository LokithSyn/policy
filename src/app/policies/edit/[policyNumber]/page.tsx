'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface PolicyDetail {
  policyId: string;
  policyNumber: string;
  customerId: string;
  customerName: string;
  policyType: string;
  sumInsured: number;
  premiumAmount: number;
  policyStatus: string;
  effectiveDate: string;
  expiryDate: string;
  insurerName: string;
  productCode: string;
}

export default function EditPolicy() {
  const router = useRouter();
  const params = useParams();
  const policyNumber = params.policyNumber as string;

  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    policyStatus: '',
    sumInsured: '',
    premiumAmount: '',
    expiryDate: '',
  });

  useEffect(() => {
    fetchPolicy();
  }, [policyNumber]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/policies/${policyNumber}`);
      const data = await res.json();

      if (data.success) {
        const policy = data.data;
        setPolicy(policy);
        setFormData({
          policyStatus: policy.policyStatus,
          sumInsured: policy.sumInsured.toString(),
          premiumAmount: policy.premiumAmount.toString(),
          expiryDate: policy.expiryDate.split('T')[0],
        });
      }
    } catch (error) {
      console.error('Error fetching policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const res = await fetch('/api/policies/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyNumber,
          policyStatus: formData.policyStatus,
          sumInsured: parseFloat(formData.sumInsured),
          premiumAmount: parseFloat(formData.premiumAmount),
          expiryDate: new Date(formData.expiryDate).toISOString(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Policy updated successfully!');
        router.push(`/policies/detail/${policyNumber}`);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      alert('Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!policy) {
    return (
      <div className="p-6">
        <div className="text-red-600">Policy not found</div>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Policy</h1>
          <p className="text-slate-600">{policyNumber}</p>
        </div>
        <Button onClick={() => router.back()} variant="ghost">
          Back
        </Button>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Read-only fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Customer Name</label>
                <Input
                  type="text"
                  value={policy.customerName}
                  disabled
                  className="bg-slate-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Policy Type</label>
                <Input
                  type="text"
                  value={policy.policyType}
                  disabled
                  className="bg-slate-100"
                />
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold">Edit Fields</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Policy Status</label>
                  <Select
                    value={formData.policyStatus}
                    onChange={handleInputChange}
                    name="policyStatus"
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'EXPIRED', label: 'Expired' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                      { value: 'SUSPENDED', label: 'Suspended' },
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Sum Insured</label>
                  <Input
                    type="number"
                    name="sumInsured"
                    value={formData.sumInsured}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Premium Amount</label>
                  <Input
                    type="number"
                    name="premiumAmount"
                    value={formData.premiumAmount}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Expiry Date</label>
                  <Input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 border-t pt-6">
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
