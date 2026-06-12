import ClaimDocumentRule, { IRequiredDocument } from '@/models/ClaimDocumentRule';
import ClaimDocument from '@/models/ClaimDocument';

export interface DocumentRequirement extends IRequiredDocument {
  uploaded: boolean;
  status?: string;
}

export interface DocumentCheckResult {
  claimId: string;
  claimType: string;
  requiredDocuments: DocumentRequirement[];
  totalRequired: number;
  totalMandatory: number;
  totalUploaded: number;
  allMandatoryUploaded: boolean;
  missingMandatory: string[];
}

export async function getRequiredDocuments(
  claimId: string,
  claimType: string,
  policyType?: string
): Promise<DocumentCheckResult> {
  // Find rule by claimType + optional policyType (specific rule takes priority)
  let rule = policyType
    ? await ClaimDocumentRule.findOne({ claimType, policyType, isActive: true })
    : null;

  if (!rule) {
    rule = await ClaimDocumentRule.findOne({ claimType, isActive: true });
  }

  const requiredDocs: IRequiredDocument[] = rule?.requiredDocuments ?? [];

  const uploadedDocs = await ClaimDocument.find({
    claimId,
    status: { $in: ['RECEIVED', 'VERIFIED'] },
  });

  const uploadedTypes = new Set(uploadedDocs.map((d) => d.documentType));

  const requirements: DocumentRequirement[] = requiredDocs.map((req) => {
    const uploaded = uploadedTypes.has(req.documentCode);
    const doc = uploadedDocs.find((d) => d.documentType === req.documentCode);
    return {
      ...req,
      uploaded,
      status: doc?.status,
    };
  });

  const mandatory = requirements.filter((r) => r.isMandatory);
  const missingMandatory = mandatory
    .filter((r) => !r.uploaded)
    .map((r) => r.documentCode);

  return {
    claimId,
    claimType,
    requiredDocuments: requirements,
    totalRequired: requirements.length,
    totalMandatory: mandatory.length,
    totalUploaded: requirements.filter((r) => r.uploaded).length,
    allMandatoryUploaded: missingMandatory.length === 0,
    missingMandatory,
  };
}
