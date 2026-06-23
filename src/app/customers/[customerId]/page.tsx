'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Customer {
  customerId: string;
  customerType: 'Individual' | 'Corporate';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  mobile: string;
  aadhaarMasked: string;
  panMasked: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: {
    customerId: string;
  };
}

export default function CustomerDetail({ params }: PageProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomer();
  }, [params.customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${params.customerId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch customer');
      }

      setCustomer(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-skeleton rounded" />
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 animate-skeleton rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error || 'Customer not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          ← Back
        </Button>
        <Button
          variant="primary"
          onClick={() => router.push(`/customers/${customer.customerId}/edit`)}
        >
          Edit Customer
        </Button>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {customer.firstName} {customer.lastName}
              </CardTitle>
              <p className="mt-2 text-sm text-slate-600">{customer.customerId}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={customer.customerType === 'Individual' ? 'success' : 'warning'}>
                {customer.customerType}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <div>
              <h3 className="mb-4 font-semibold text-slate-900">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">First Name</label>
                  <p className="mt-1 text-slate-900">{customer.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Last Name</label>
                  <p className="mt-1 text-slate-900">{customer.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Gender</label>
                  <p className="mt-1 text-slate-900">{customer.gender}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Date of Birth</label>
                  <p className="mt-1 text-slate-900">
                    {new Date(customer.dateOfBirth).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="mb-4 font-semibold text-slate-900">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Email</label>
                  <p className="mt-1 break-all text-slate-900">{customer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Mobile</label>
                  <p className="mt-1 text-slate-900">{customer.mobile}</p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="mb-4 font-semibold text-slate-900">Address Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Address</label>
                  <p className="mt-1 text-slate-900">{customer.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">City</label>
                  <p className="mt-1 text-slate-900">{customer.city}</p>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div>
              <h3 className="mb-4 font-semibold text-slate-900">Location Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">State</label>
                  <p className="mt-1 text-slate-900">{customer.state}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Pincode</label>
                  <p className="mt-1 text-slate-900">{customer.pincode}</p>
                </div>
              </div>
            </div>

            {/* ID Information */}
            <div>
              <h3 className="mb-4 font-semibold text-slate-900">Identification</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Aadhaar (Masked)</label>
                  <p className="mt-1 text-slate-900">{customer.aadhaarMasked || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">PAN (Masked)</label>
                  <p className="mt-1 text-slate-900">{customer.panMasked || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h3 className="mb-4 font-semibold text-slate-900">Record Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Created</label>
                  <p className="mt-1 text-slate-900">
                    {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                    {' '}
                    {new Date(customer.createdAt).toLocaleTimeString('en-IN')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Last Updated</label>
                  <p className="mt-1 text-slate-900">
                    {new Date(customer.updatedAt).toLocaleDateString('en-IN')}
                    {' '}
                    {new Date(customer.updatedAt).toLocaleTimeString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
