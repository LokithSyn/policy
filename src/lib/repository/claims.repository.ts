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
