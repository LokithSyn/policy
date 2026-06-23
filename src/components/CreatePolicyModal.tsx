'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  mobile: string;
}

interface CreatePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePolicyModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePolicyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    policyNumber: '',
    policyType: 'Motor',
    productCode: '',
    insurerName: '',
    premiumAmount: '',
    sumInsured: '',
    agentCode: '',
    branchCode: '',
    issueDate: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });

  const handleCustomerSearch = async (searchTerm: string) => {
    setFormData((prev) => ({
      ...prev,
      customerId: searchTerm,
    }));

    if (searchTerm.length < 3) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    try {
      setCustomerSearchLoading(true);
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (data.success && data.data.customers.length > 0) {
        setCustomerSearchResults(data.data.customers);
        setShowCustomerDropdown(true);
      } else {
        setCustomerSearchResults([]);
        setShowCustomerDropdown(false);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setCustomerSearchResults([]);
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({
      ...prev,
      customerId: customer.customerId,
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'customerId') {
      handleCustomerSearch(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const policyNumber = `POL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          policyNumber,
          policyType: formData.policyType,
          productCode: formData.productCode,
          insurerName: formData.insurerName,
          premiumAmount: parseInt(formData.premiumAmount),
          sumInsured: parseInt(formData.sumInsured),
          issueDate: new Date(formData.issueDate).toISOString(),
          effectiveDate: new Date(formData.effectiveDate).toISOString(),
          expiryDate: new Date(formData.expiryDate).toISOString(),
          agentCode: formData.agentCode,
          branchCode: formData.branchCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create policy');
      }

      setFormData({
        customerId: '',
        policyNumber: '',
        policyType: 'Motor',
        productCode: '',
        insurerName: '',
        premiumAmount: '',
        sumInsured: '',
        agentCode: '',
        branchCode: '',
        issueDate: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Policy" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <label className="mb-2 block text-sm font-medium">Customer</label>
            <div className="relative">
              <Input
                type="text"
                name="customerId"
                value={formData.customerId}
                onChange={handleInputChange}
                placeholder="Type customer ID or name (min 3 chars)"
                required
              />
              {customerSearchLoading && (
                <div className="absolute right-3 top-2.5 text-sm text-slate-500">
                  Searching...
                </div>
              )}
            </div>

            {/* Customer Dropdown */}
            {showCustomerDropdown && customerSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {customerSearchResults.map((customer) => (
                  <div
                    key={customer.customerId}
                    onClick={() => handleSelectCustomer(customer)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-slate-900">{customer.fullName}</div>
                    <div className="text-sm text-slate-600">{customer.customerId}</div>
                    <div className="text-xs text-slate-500 mt-1">{customer.email}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Customer Display */}
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Selected: </span>
                  <span>{selectedCustomer.fullName}</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">{selectedCustomer.customerId}</div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Policy Type</label>
            <Select
              name="policyType"
              value={formData.policyType}
              onChange={handleInputChange}
              options={[
                { value: 'Motor', label: 'Motor' },
                { value: 'Health', label: 'Health' },
                { value: 'Property', label: 'Property' },
                { value: 'Life', label: 'Life' },
                { value: 'Travel', label: 'Travel' },
              ]}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Product Code</label>
            <Input
              type="text"
              name="productCode"
              value={formData.productCode}
              onChange={handleInputChange}
              placeholder="PRD-001"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Insurer Name</label>
            <Input
              type="text"
              name="insurerName"
              value={formData.insurerName}
              onChange={handleInputChange}
              placeholder="Synergech Insurance"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Premium Amount</label>
            <Input
              type="number"
              name="premiumAmount"
              value={formData.premiumAmount}
              onChange={handleInputChange}
              placeholder="50000"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Sum Insured</label>
            <Input
              type="number"
              name="sumInsured"
              value={formData.sumInsured}
              onChange={handleInputChange}
              placeholder="1000000"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Issue Date</label>
            <Input
              type="date"
              name="issueDate"
              value={formData.issueDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Effective Date</label>
            <Input
              type="date"
              name="effectiveDate"
              value={formData.effectiveDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Expiry Date</label>
            <Input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Agent Code</label>
            <Input
              type="text"
              name="agentCode"
              value={formData.agentCode}
              onChange={handleInputChange}
              placeholder="AGT-2026-000001"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Branch Code</label>
            <Input
              type="text"
              name="branchCode"
              value={formData.branchCode}
              onChange={handleInputChange}
              placeholder="BR-001"
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
            {loading ? 'Creating...' : 'Create Policy'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
