import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { findByClaimId, findByClaimNumber } from '@/lib/repository/claims.repository';
import ClaimTimeline from '@/models/ClaimTimeline';
import ClaimDocument from '@/models/ClaimDocument';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const claimId = searchParams.get('claimId');
    const claimNumber = searchParams.get('claimNumber');

    if (!claimId && !claimNumber) {
      return NextResponse.json(
        errorResponse('Provide claimId or claimNumber as query parameter'),
        { status: 400 }
      );
    }

    const claim = claimId
      ? await findByClaimId(claimId)
      : await findByClaimNumber(claimNumber!);

    if (!claim) {
      return NextResponse.json(
        errorResponse('Claim not found'),
        { status: 404 }
      );
    }

    const [timeline, documents] = await Promise.all([
      ClaimTimeline.find({ claimId: claim.claimId }).sort({ performedAt: -1 }).limit(20),
      ClaimDocument.find({ claimId: claim.claimId }),
    ]);

    return NextResponse.json(
      successResponse({
        claimId: claim.claimId,
        claimNumber: claim.claimNumber,
        fnolId: claim.fnolId,
        policyId: claim.policyId,
        claimStatus: claim.claimStatus,
        workflowStatus: claim.workflowStatus,
        claimType: claim.claimType,
        incidentDate: claim.incidentDate,
        claimAmount: claim.claimAmount,
        approvedAmount: claim.approvedAmount,
        isFraudulent: claim.isFraudulent,
        fraudFlags: claim.fraudFlags,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        timeline: timeline.map((t) => ({
          eventType: t.eventType,
          fromStatus: t.fromStatus,
          toStatus: t.toStatus,
          description: t.description,
          performedBy: t.performedBy,
          performedAt: t.performedAt,
        })),
        documents: documents.map((d) => ({
          documentId: d.documentId,
          documentType: d.documentType,
          fileName: d.fileName,
          status: d.status,
          uploadedAt: d.uploadedAt,
        })),
      })
    );
  } catch (error) {
    console.error('Claim status error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
