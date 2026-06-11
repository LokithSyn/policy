'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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

export default function PolicyDetail() {
  const router = useRouter();
  const params = useParams();
  const policyNumber = params.policyNumber as string;

  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, [policyNumber]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/policies/${policyNumber}`);
      const data = await res.json();

      if (data.success) {
        setPolicy(data.data);
      }
    } catch (error) {
      console.error('Error fetching policy:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold">{policy.policyNumber}</h1>
          <p className="text-slate-600">Policy Details</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/policies/edit/${policyNumber}`)}
            variant="primary"
          >
            Edit Policy
          </Button>
          <Button onClick={() => router.back()} variant="ghost">
            Back
          </Button>
        </div>
      </div>

      {/* Details Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Customer Name</label>
              <p className="text-lg font-semibold">{policy.customerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Customer ID</label>
              <p className="text-lg font-mono">{policy.customerId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Policy Status */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Status</label>
              <div className="mt-2">
                <Badge
                  variant={
                    policy.policyStatus === 'ACTIVE'
                      ? 'success'
                      : policy.policyStatus === 'EXPIRED'
                        ? 'error'
                        : 'warning'
                  }
                >
                  {policy.policyStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Details */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Policy Type</label>
              <p className="text-lg">{policy.policyType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Insurer</label>
              <p className="text-lg">{policy.insurerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Product Code</label>
              <p className="text-lg font-mono">{policy.productCode}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Sum Insured</label>
              <p className="text-lg font-semibold">₹{policy.sumInsured.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Premium Amount</label>
              <p className="text-lg font-semibold">₹{policy.premiumAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Policy Duration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600">Effective Date</label>
                <p className="text-lg">
                  {new Date(policy.effectiveDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Expiry Date</label>
                <p className="text-lg">
                  {new Date(policy.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
