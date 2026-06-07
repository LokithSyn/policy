'use client';

import { useEffect, useState } from 'react';
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

interface Claim {
  claimNumber: string;
  policyNumber: string;
  memberName: string;
  hospitalName: string;
  claimAmount: number;
  approvedAmount: number;
  status: string;
  claimDate: string;
}

export default function Claims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/claims?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setClaims(data.data.claims);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      case 'Pending':
        return 'warning';
      case 'Under Review':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-0">
          <div className="grid gap-4 pt-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Rejected', label: 'Rejected' },
                  { value: 'Under Review', label: 'Under Review' },
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button variant="primary">Submit Claim</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-skeleton rounded" />
              ))}
            </div>
          ) : claims.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Claim Number</TableHeader>
                  <TableHeader>Policy Number</TableHeader>
                  <TableHeader>Member Name</TableHeader>
                  <TableHeader>Hospital</TableHeader>
                  <TableHeader>Claim Amount</TableHeader>
                  <TableHeader>Approved Amount</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.claimNumber}>
                    <TableCell className="font-mono text-sm">
                      {claim.claimNumber}
                    </TableCell>
                    <TableCell>{claim.policyNumber}</TableCell>
                    <TableCell>{claim.memberName}</TableCell>
                    <TableCell>{claim.hospitalName}</TableCell>
                    <TableCell>
                      ₹{claim.claimAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      ₹{claim.approvedAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(claim.status) as any}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          Verify
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-slate-500">
              No claims found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
