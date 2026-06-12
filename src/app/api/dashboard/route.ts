import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Policy from '@/models/Policy';
import ClaimsHistory from '@/models/Claim';
import {
  countByWorkflowStatus,
  countByClaimStatus,
  getFraudulentClaims,
  getAverageProcessingTime,
  getClaimsWithDocumentsPending,
} from '@/lib/repository/claims.repository';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    await connectDB();

    const [
      totalPolicies,
      activePolicies,
      expiredPolicies,
      cancelledPolicies,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      settledClaims,
      underReviewClaims,
      fnolReceivedClaims,
      documentsPerndingClaims,
      documentsReceivedClaims,
      fraudulentClaims,
      docsPendingClaims,
      avgProcessingTime,
      recentClaims,
    ] = await Promise.all([
      Policy.countDocuments(),
      Policy.countDocuments({ policyStatus: 'ACTIVE' }),
      Policy.countDocuments({ policyStatus: 'EXPIRED' }),
      Policy.countDocuments({ policyStatus: 'CANCELLED' }),
      countByClaimStatus('PENDING'),
      countByClaimStatus('APPROVED'),
      countByClaimStatus('REJECTED'),
      countByClaimStatus('SETTLED'),
      countByWorkflowStatus('UNDER_REVIEW'),
      countByWorkflowStatus('FNOL_RECEIVED'),
      countByWorkflowStatus('DOCUMENTS_PENDING'),
      countByWorkflowStatus('DOCUMENTS_RECEIVED'),
      ClaimsHistory.countDocuments({ isFraudulent: true }),
      getClaimsWithDocumentsPending(5),
      getAverageProcessingTime(),
      ClaimsHistory.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('claimId claimNumber claimType workflowStatus claimStatus createdAt claimAmount isFraudulent'),
    ]);

    const totalClaims = await ClaimsHistory.countDocuments();
    const openClaims = pendingClaims + underReviewClaims + fnolReceivedClaims +
      documentsPerndingClaims + documentsReceivedClaims;

    const fraudAlerts = await getFraudulentClaims(5);

    return NextResponse.json(
      successResponse({
        policies: {
          total: totalPolicies,
          active: activePolicies,
          expired: expiredPolicies,
          cancelled: cancelledPolicies,
        },
        claims: {
          total: totalClaims,
          open: openClaims,
          pending: pendingClaims,
          approved: approvedClaims,
          rejected: rejectedClaims,
          settled: settledClaims,
          underReview: underReviewClaims,
          fnolReceived: fnolReceivedClaims,
          documentsPending: documentsPerndingClaims,
          documentsReceived: documentsReceivedClaims,
          fraudulent: fraudulentClaims,
        },
        kpis: {
          avgProcessingDays: Math.round(avgProcessingTime * 10) / 10,
          fraudRate:
            totalClaims > 0
              ? Math.round((fraudulentClaims / totalClaims) * 1000) / 10
              : 0,
          approvalRate:
            totalClaims > 0
              ? Math.round((approvedClaims / totalClaims) * 1000) / 10
              : 0,
        },
        recentActivity: recentClaims.map((c) => ({
          claimId: c.claimId,
          claimNumber: c.claimNumber,
          claimType: c.claimType,
          workflowStatus: c.workflowStatus,
          claimStatus: c.claimStatus,
          claimAmount: c.claimAmount,
          isFraudulent: c.isFraudulent,
          createdAt: c.createdAt,
        })),
        fraudAlerts: fraudAlerts.map((c) => ({
          claimId: c.claimId,
          claimNumber: c.claimNumber,
          fraudFlags: c.fraudFlags,
          policyId: c.policyId,
          createdAt: c.createdAt,
        })),
        documentsPendingQueue: docsPendingClaims.map((c) => ({
          claimId: c.claimId,
          claimNumber: c.claimNumber,
          claimType: c.claimType,
          policyId: c.policyId,
          createdAt: c.createdAt,
        })),
      })
    );
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
