'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton, CardSkeleton } from '@/components/ui/Skeleton';

interface DashboardData {
  policies: {
    total: number;
    active: number;
    expired: number;
    cancelled: number;
  };
  claims: {
    total: number;
    open: number;
    pending: number;
    approved: number;
    rejected: number;
    settled: number;
    underReview: number;
    fnolReceived: number;
    documentsPending: number;
    documentsReceived: number;
    fraudulent: number;
  };
  kpis: {
    avgProcessingDays: number;
    fraudRate: number;
    approvalRate: number;
  };
  recentActivity: Array<{
    claimId: string;
    claimNumber: string;
    claimType: string;
    workflowStatus: string;
    claimStatus: string;
    claimAmount: number;
    isFraudulent: boolean;
    createdAt: string;
  }>;
  fraudAlerts: Array<{
    claimId: string;
    claimNumber: string;
    fraudFlags: string[];
    policyId: string;
    createdAt: string;
  }>;
  documentsPendingQueue: Array<{
    claimId: string;
    claimNumber: string;
    claimType: string;
    policyId: string;
    createdAt: string;
  }>;
}

const WORKFLOW_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  FNOL_RECEIVED: 'info',
  VALIDATED: 'info',
  CLAIM_REGISTERED: 'info',
  DOCUMENTS_PENDING: 'warning',
  DOCUMENTS_RECEIVED: 'warning',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  SETTLED: 'success',
};

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch {
        setError('Network error loading dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {/* KPI Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          ))
        ) : data ? (
          <>
            <StatCard
              title="Open Claims"
              value={data.claims.open}
              icon="📂"
              trend={{ direction: 'up', value: 0 }}
            />
            <StatCard
              title="Approved Claims"
              value={data.claims.approved}
              icon="✅"
              trend={{ direction: 'up', value: 0 }}
            />
            <StatCard
              title="Rejected Claims"
              value={data.claims.rejected}
              icon="❌"
              trend={{ direction: 'down', value: 0 }}
            />
            <StatCard
              title="Avg Processing"
              value={`${data.kpis.avgProcessingDays}d`}
              icon="⏱"
            />
          </>
        ) : null}
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          ))
        ) : data ? (
          <>
            <StatCard
              title="Active Policies"
              value={data.policies.active}
              icon="📋"
              trend={{ direction: 'up', value: 0 }}
            />
            <StatCard
              title="Approval Rate"
              value={`${data.kpis.approvalRate}%`}
              icon="📈"
            />
            <StatCard
              title="Fraud Alerts"
              value={data.claims.fraudulent}
              icon="🚨"
              trend={{ direction: 'up', value: 0 }}
            />
          </>
        ) : null}
      </div>

      {/* Claims Queue + Fraud Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Claims Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Claims Queue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <TableSkeleton />
            ) : error ? (
              <p className="py-8 text-center text-sm text-red-500">{error}</p>
            ) : data?.recentActivity.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentActivity.map((claim) => (
                  <div key={claim.claimId} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-medium text-slate-900 dark:text-white">
                        {claim.claimNumber}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {claim.claimType.replace('_', ' ')} ·{' '}
                        {formatCurrency(claim.claimAmount)}
                        {claim.isFraudulent && (
                          <span className="ml-1 text-red-500">· ⚠ Fraud</span>
                        )}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-1">
                      <Badge variant={WORKFLOW_COLORS[claim.workflowStatus] ?? 'default'}>
                        {claim.workflowStatus.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-slate-400">{timeAgo(claim.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">No recent claims</p>
            )}
          </CardContent>
        </Card>

        {/* Fraud Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Fraud Alerts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <CardSkeleton />
            ) : data?.fraudAlerts.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.fraudAlerts.map((alert) => (
                  <div key={alert.claimId} className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                        {alert.claimNumber}
                      </p>
                      <span className="text-xs text-slate-400">{timeAgo(alert.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {alert.fraudFlags.map((flag) => (
                        <Badge key={flag} variant="error">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">No fraud alerts</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Documents + Workflow Status Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Documents</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <CardSkeleton />
            ) : data?.documentsPendingQueue.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.documentsPendingQueue.map((claim) => (
                  <div key={claim.claimId} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                        {claim.claimNumber}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {claim.claimType.replace('_', ' ')} · Policy: {claim.policyId}
                      </p>
                    </div>
                    <Badge variant="warning">DOCS PENDING</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">No pending document claims</p>
            )}
          </CardContent>
        </Card>

        {/* Workflow Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <CardSkeleton />
            ) : data ? (
              <div className="space-y-3 pt-2">
                {[
                  { label: 'FNOL Received', value: data.claims.fnolReceived, color: 'bg-blue-500' },
                  { label: 'Documents Pending', value: data.claims.documentsPending, color: 'bg-yellow-500' },
                  { label: 'Documents Received', value: data.claims.documentsReceived, color: 'bg-orange-500' },
                  { label: 'Under Review', value: data.claims.underReview, color: 'bg-purple-500' },
                  { label: 'Approved', value: data.claims.approved, color: 'bg-green-500' },
                  { label: 'Rejected', value: data.claims.rejected, color: 'bg-red-500' },
                  { label: 'Settled', value: data.claims.settled, color: 'bg-teal-500' },
                ].map((item) => {
                  const max = data.claims.total || 1;
                  const pct = Math.round((item.value / max) * 100);
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-1.5 rounded-full ${item.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
