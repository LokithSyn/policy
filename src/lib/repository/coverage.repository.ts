import Coverage from '@/models/Coverage';

export async function findByPolicyId(policyId: string) {
  return Coverage.find({ policyId }).populate('policy');
}

export async function findActiveCoveragesByPolicyId(policyId: string) {
  return Coverage.find({ policyId, status: 'ACTIVE' }).populate('policy');
}

export async function countActiveCoveragesByPolicyId(policyId: string) {
  return Coverage.countDocuments({ policyId, status: 'ACTIVE' });
}
