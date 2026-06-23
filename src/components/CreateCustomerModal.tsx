'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customerType: 'Individual',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gender: 'Male',
    dateOfBirth: '',
    aadhaarMasked: '',
    panMasked: '',
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
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerType: formData.customerType,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          mobile: formData.mobile,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
          aadhaarMasked: formData.aadhaarMasked,
          panMasked: formData.panMasked,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create customer');
      }

      setFormData({
        customerType: 'Individual',
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gender: 'Male',
        dateOfBirth: '',
        aadhaarMasked: '',
        panMasked: '',
      });

      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Customer" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
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
              required
            />
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
              placeholder="John"
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
              placeholder="Doe"
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
              placeholder="john@example.com"
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
              placeholder="9876543210"
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
              placeholder="600001"
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
              placeholder="123 Main Street"
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

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
