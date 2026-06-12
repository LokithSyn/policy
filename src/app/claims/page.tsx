'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
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
  claimId?: string;
  policyNumber: string;
  memberName: string;
  hospitalName: string;
  claimAmount: number;
  approvedAmount: number;
  status: string;
  workflowStatus?: string;
  incidentDate?: string;
  claimType?: string;
  isFraudulent?: boolean;
  fraudFlags?: string[];
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'SETTLED', label: 'Settled' },
];

const WORKFLOW_OPTIONS = [
  { value: '', label: 'All Workflow Statuses' },
  { value: 'FNOL_RECEIVED', label: 'FNOL Received' },
  { value: 'VALIDATED', label: 'Validated' },
  { value: 'CLAIM_REGISTERED', label: 'Claim Registered' },
  { value: 'DOCUMENTS_PENDING', label: 'Documents Pending' },
  { value: 'DOCUMENTS_RECEIVED', label: 'Documents Received' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SETTLED', label: 'Settled' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'OWN_DAMAGE', label: 'Own Damage' },
  { value: 'THIRD_PARTY', label: 'Third Party' },
  { value: 'THEFT', label: 'Theft' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'FIRE', label: 'Fire' },
  { value: 'PROPERTY_DAMAGE', label: 'Property Damage' },
  { value: 'NATURAL_DISASTER', label: 'Natural Disaster' },
];

function workflowColor(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'APPROVED': case 'SETTLED': return 'success';
    case 'REJECTED': return 'error';
    case 'DOCUMENTS_PENDING': case 'UNDER_REVIEW': case 'DOCUMENTS_RECEIVED': return 'warning';
    case 'FNOL_RECEIVED': case 'VALIDATED': case 'CLAIM_REGISTERED': return 'info';
    default: return 'default';
  }
}

function claimStatusColor(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'APPROVED': case 'SETTLED': return 'success';
    case 'REJECTED': return 'error';
    case 'PENDING': return 'warning';
    case 'UNDER_REVIEW': return 'info';
    default: return 'default';
  }
}

export default function Claims() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, workflowFilter, typeFilter, page]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (workflowFilter) params.append('workflowStatus', workflowFilter);
      if (typeFilter) params.append('claimType', typeFilter);
      if (search) params.append('search', search);
      params.append('page', String(page));
      params.append('limit', '10');

      const res = await fetch(`/api/claims?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setClaims(data.data.claims);
        setTotalPages(data.data.pagination.pages ?? 1);
        setTotal(data.data.pagination.total ?? 0);
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchClaims();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Queue</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Claim Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                options={STATUS_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Workflow Status
              </label>
              <Select
                value={workflowFilter}
                onChange={(e) => { setWorkflowFilter(e.target.value); setPage(1); }}
                options={WORKFLOW_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Claim Type
              </label>
              <Select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                options={TYPE_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Search
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Claim / Policy number"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="primary" size="sm" onClick={handleSearch}>
                  Go
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between pt-4 pb-2">
            <span className="text-sm text-slate-500">
              {total} claim{total !== 1 ? 's' : ''} found
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : claims.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Claim Number</TableHeader>
                  <TableHeader>Policy Number</TableHeader>
                  <TableHeader>Member</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Claim Amount</TableHeader>
                  <TableHeader>Approved</TableHeader>
                  <TableHeader>Claim Status</TableHeader>
                  <TableHeader>Workflow</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.claimNumber}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1">
                        {claim.claimNumber}
                        {claim.isFraudulent && (
                          <span title="Fraud flagged" className="text-red-500">⚠</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{claim.policyNumber}</TableCell>
                    <TableCell>{claim.memberName}</TableCell>
                    <TableCell>
                      <span className="text-xs">{(claim.claimType ?? '').replace(/_/g, ' ')}</span>
                    </TableCell>
                    <TableCell>₹{claim.claimAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>₹{claim.approvedAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge variant={claimStatusColor(claim.status)}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {claim.workflowStatus ? (
                        <Badge variant={workflowColor(claim.workflowStatus)}>
                          {claim.workflowStatus.replace(/_/g, ' ')}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/claims/${claim.claimId ?? claim.claimNumber}`)}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-slate-500">No claims found</div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
