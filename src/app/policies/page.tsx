'use client';

import { useEffect, useState } from 'react';
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
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/policies?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setPolicies(data.data.policies);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
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
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
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
        </CardContent>
      </Card>
    </div>
  );
}
