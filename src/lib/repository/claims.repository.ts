import ClaimsHistory from '@/models/Claim';

export async function findByPolicyId(policyId: string) {
  return ClaimsHistory.find({ policyId }).populate('policy').sort({ incidentDate: -1 });
}

export async function countRecentClaims(policyId: string, months: number = 12) {
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - months);

  return ClaimsHistory.countDocuments({
    policyId,
    incidentDate: { $gte: fromDate },
  });
}

export async function findByClaimNumber(claimNumber: string) {
  return ClaimsHistory.findOne({ claimNumber }).populate('policy');
}

export async function findByClaimId(claimId: string) {
  return ClaimsHistory.findOne({ claimId }).populate('policy');
}

export async function findByFnolId(fnolId: string) {
  return ClaimsHistory.findOne({ fnolId });
}

export async function countByWorkflowStatus(workflowStatus: string) {
  return ClaimsHistory.countDocuments({ workflowStatus });
}

export async function countByClaimStatus(claimStatus: string) {
  return ClaimsHistory.countDocuments({ claimStatus });
}

export async function getFraudulentClaims(limit = 20) {
  return ClaimsHistory.find({ isFraudulent: true })
    .sort({ createdAt: -1 })
    .limit(limit);
}

export async function getClaimsWithDocumentsPending(limit = 50) {
  return ClaimsHistory.find({ workflowStatus: 'DOCUMENTS_PENDING' })
    .sort({ createdAt: -1 })
    .limit(limit);
}

export async function getAverageProcessingTime(): Promise<number> {
  const result = await ClaimsHistory.aggregate([
    {
      $match: {
        claimStatus: { $in: ['APPROVED', 'REJECTED', 'SETTLED'] },
        createdAt: { $exists: true },
        updatedAt: { $exists: true },
      },
    },
    {
      $project: {
        processingDays: {
          $divide: [
            { $subtract: ['$updatedAt', '$createdAt'] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgDays: { $avg: '$processingDays' },
      },
    },
  ]);

  return result[0]?.avgDays ?? 0;
}
