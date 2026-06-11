import Policy from '@/models/Policy';
import Customer from '@/models/Customer';

export async function findByPolicyNumber(policyNumber: string) {
  return Policy.findOne({ policyNumber }).populate('customer agent');
}

export async function findByPolicyId(policyId: string) {
  return Policy.findOne({ policyId }).populate('customer agent');
}

export async function findByCustomerId(customerId: string) {
  const customer = await Customer.findOne({ customerId });
  if (!customer) return null;
  return Policy.find({ customerId }).populate('agent');
}

export async function findActivePoliciesByCustomerId(customerId: string) {
  return Policy.find({ customerId, policyStatus: 'ACTIVE' }).populate('agent');
}
