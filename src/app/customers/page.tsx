'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CreateCustomerModal } from '@/components/CreateCustomerModal';

interface Customer {
  customerId: string;
  fullName: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  customerType: string;
  createdAt: string;
}

export default function Customers() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    fetchCustomers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, customerTypeFilter]);

  const fetchCustomers = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (customerTypeFilter) params.append('customerType', customerTypeFilter);

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCustomers(data.data.customers);
        setPagination(data.data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchCustomers(newPage);
    }
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
  };

  const handleCustomerCreated = () => {
    fetchCustomers(1);
  };

  const handleViewCustomer = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  const handleEditCustomer = (customerId: string) => {
    router.push(`/customers/${customerId}/edit`);
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'Individual':
        return 'success';
      case 'Corporate':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-0">
          <div className="grid gap-4 pt-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Search</label>
              <Input
                placeholder="Search by name, email, mobile, or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Customer Type</label>
              <Select
                value={customerTypeFilter}
                onChange={(e) => setCustomerTypeFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'Individual', label: 'Individual' },
                  { value: 'Corporate', label: 'Corporate' },
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Add New Customer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-skeleton rounded" />
              ))}
            </div>
          ) : customers.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Customer ID</TableHeader>
                  <TableHeader>Full Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Mobile</TableHeader>
                  <TableHeader>City</TableHeader>
                  <TableHeader>State</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Created</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.customerId}>
                    <TableCell className="font-mono text-sm">
                      {customer.customerId}
                    </TableCell>
                    <TableCell>{customer.fullName}</TableCell>
                    <TableCell className="text-sm">{customer.email}</TableCell>
                    <TableCell className="text-sm">{customer.mobile}</TableCell>
                    <TableCell>{customer.city}</TableCell>
                    <TableCell>{customer.state}</TableCell>
                    <TableCell>
                      <Badge variant={getCustomerTypeColor(customer.customerType) as any}>
                        {customer.customerType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCustomer(customer.customerId)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustomer(customer.customerId)}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-slate-500">
              No customers found
            </div>
          )}

          {/* Pagination */}
          {customers.length > 0 && (
            <div className="mt-6 space-y-4 border-t pt-4">
              <div className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages} | Total: {pagination.total} records
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>

                {/* Page numbers - show max 10 pages */}
                <div className="flex flex-wrap justify-center gap-1">
                  {Array.from(
                    { length: Math.min(pagination.pages, 10) },
                    (_, i) => {
                      const startPage = Math.max(1, currentPage - 5);
                      return startPage + i;
                    }
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  ))}
                  {pagination.pages > 10 && currentPage < pagination.pages - 4 && (
                    <span className="px-2 py-1 text-slate-500">...</span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSuccess={handleCustomerCreated}
      />
    </div>
  );
}
