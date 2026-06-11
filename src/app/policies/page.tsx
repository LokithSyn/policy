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

interface Policy {
  policyNumber: string;
  memberName: string;
  memberId: string;
  policyType: string;
  sumInsured: number;
  status: string;
  startDate: string;
  endDate: string;
}

export default function Policies() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  useEffect(() => {
    setCurrentPage(1);
    fetchPolicies(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const fetchPolicies = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/policies?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setPolicies(data.data.policies);
        setPagination(data.data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchPolicies(newPage);
    }
  };

  const handleViewPolicy = (policyNumber: string) => {
    router.push(`/policies/detail/${policyNumber}`);
  };

  const handleEditPolicy = (policyNumber: string) => {
    router.push(`/policies/edit/${policyNumber}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Expired':
        return 'error';
      case 'Suspended':
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
                placeholder="Search by policy number, name, or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Expired', label: 'Expired' },
                  { value: 'Suspended', label: 'Suspended' },
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button variant="primary">Create Policy</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-skeleton rounded" />
              ))}
            </div>
          ) : policies.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Policy Number</TableHeader>
                  <TableHeader>Member Name</TableHeader>
                  <TableHeader>Member ID</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Sum Insured</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.policyNumber}>
                    <TableCell className="font-mono text-sm">
                      {policy.policyNumber}
                    </TableCell>
                    <TableCell>{policy.memberName}</TableCell>
                    <TableCell>{policy.memberId}</TableCell>
                    <TableCell>{policy.policyType}</TableCell>
                    <TableCell>
                      ₹{policy.sumInsured.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(policy.status) as any}>
                        {policy.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPolicy(policy.policyNumber)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPolicy(policy.policyNumber)}
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
              No policies found
            </div>
          )}

          {/* Pagination */}
          {policies.length > 0 && (
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
    </div>
  );
}
