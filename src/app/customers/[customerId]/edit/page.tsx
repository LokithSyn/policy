'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardTitle, CardContent } from '@/components/ui/Card';

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
}

interface PageProps {
  params: {
    customerId: string;
  };
}

export default function EditCustomer({ params }: PageProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<Customer>({
    customerId: '',
    customerType: 'Individual',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    email: '',
    mobile: '',
    aadhaarMasked: '',
    panMasked: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const states = [
    'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Uttar Pradesh',
    'Rajasthan', 'Gujarat', 'Telangana', 'Haryana', 'Punjab',
  ];

  const cities: Record<string, string[]> = {
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Aurangabad'],
    'Delhi': ['New Delhi', 'Delhi', 'Dwarka'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Bikaner'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Telangana': ['Hyderabad', 'Secunderabad', 'Warangal'],
    'Haryana': ['Gurgaon', 'Faridabad', 'Hisar'],
    'Punjab': ['Chandigarh', 'Amritsar', 'Ludhiana'],
  };

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
      // Format date for input
      const dateObj = new Date(data.data.dateOfBirth);
      const formattedDate = dateObj.toISOString().split('T')[0];
      setFormData({
        ...data.data,
        dateOfBirth: formattedDate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/customers/${params.customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerType: formData.customerType,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
          gender: formData.gender,
          email: formData.email,
          mobile: formData.mobile,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          aadhaarMasked: formData.aadhaarMasked,
          panMasked: formData.panMasked,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update customer');
      }

      setSuccessMessage('Customer updated successfully!');
      setTimeout(() => {
        router.push(`/customers/${params.customerId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
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

  if (!customer) {
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
        <h1 className="text-2xl font-bold">Edit Customer</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Customer Type</label>
                <Select
                  name="customerType"
                  value={formData.customerType}
                  onChange={handleInputChange}
                  options={[
                    { value: 'Individual', label: 'Individual' },
                    { value: 'Corporate', label: 'Corporate' },
                  ]}
                  disabled
                />
                <p className="mt-1 text-xs text-slate-500">Cannot be changed</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Gender</label>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">First Name</label>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Last Name</label>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Mobile</label>
                <Input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Date of Birth</label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">State</label>
                <Select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  options={states.map(s => ({ value: s, label: s }))}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">City</label>
                <Select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  options={
                    formData.state && cities[formData.state]
                      ? cities[formData.state].map(c => ({ value: c, label: c }))
                      : []
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Pincode</label>
                <Input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Address</label>
                <Input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Aadhaar (Masked)</label>
                <Input
                  type="text"
                  name="aadhaarMasked"
                  value={formData.aadhaarMasked}
                  onChange={handleInputChange}
                  placeholder="XXXX-XXXX-1234"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">PAN (Masked)</label>
                <Input
                  type="text"
                  name="panMasked"
                  value={formData.panMasked}
                  onChange={handleInputChange}
                  placeholder="XXXXX1234F"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
