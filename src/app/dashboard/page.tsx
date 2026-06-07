'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface DashboardStats {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Mock data for now - replace with actual API calls
        const mockStats: DashboardStats = {
          totalPolicies: 1250,
          activePolicies: 980,
          expiredPolicies: 145,
          pendingClaims: 34,
          approvedClaims: 156,
          rejectedClaims: 12,
        };
        setStats(mockStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <div className="h-32 animate-skeleton rounded-lg" />
            <div className="h-32 animate-skeleton rounded-lg" />
            <div className="h-32 animate-skeleton rounded-lg" />
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Total Policies"
              value={stats.totalPolicies}
              icon="📋"
              trend={{ direction: 'up', value: 5 }}
            />
            <StatCard
              title="Active Policies"
              value={stats.activePolicies}
              icon="✅"
              trend={{ direction: 'up', value: 3 }}
            />
            <StatCard
              title="Expired Policies"
              value={stats.expiredPolicies}
              icon="⏰"
              trend={{ direction: 'down', value: 2 }}
            />
            <StatCard
              title="Pending Claims"
              value={stats.pendingClaims}
              icon="⏳"
              trend={{ direction: 'up', value: 8 }}
            />
            <StatCard
              title="Approved Claims"
              value={stats.approvedClaims}
              icon="✅"
              trend={{ direction: 'up', value: 12 }}
            />
            <StatCard
              title="Rejected Claims"
              value={stats.rejectedClaims}
              icon="❌"
              trend={{ direction: 'down', value: 3 }}
            />
          </>
        ) : null}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="space-y-4">
              <ActivityItem
                action="Policy Created"
                entity="POL-2024-001234"
                user="John Doe"
                time="2 minutes ago"
              />
              <ActivityItem
                action="Claim Verified"
                entity="CLM-2024-005678"
                user="Jane Smith"
                time="5 minutes ago"
              />
              <ActivityItem
                action="Policy Updated"
                entity="POL-2024-000987"
                user="Admin User"
                time="1 hour ago"
              />
              <ActivityItem
                action="Claim Submitted"
                entity="CLM-2024-009999"
                user="System"
                time="2 hours ago"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityItem({
  action,
  entity,
  user,
  time,
}: {
  action: string;
  entity: string;
  user: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-3 last:border-b-0 dark:border-slate-700">
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{action}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {entity} by {user}
        </p>
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-500">{time}</p>
    </div>
  );
}
