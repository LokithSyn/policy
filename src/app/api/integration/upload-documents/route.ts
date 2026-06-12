import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import { findByClaimId } from '@/lib/repository/claims.repository';
import { getRequiredDocuments } from '@/lib/document-rules';
import ClaimDocument from '@/models/ClaimDocument';
import ClaimTimeline from '@/models/ClaimTimeline';
import AuditLog from '@/models/AuditLog';
import { successResponse, errorResponse } from '@/lib/api-response';

const uploadSchema = z.object({
  claimId: z.string().min(1),
  documents: z
    .array(
      z.object({
        documentType: z.string().min(1),
        fileName: z.string().min(1),
        storagePath: z.string().min(1),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .min(1),
  uploadedBy: z.string().optional(),
});

function generateId(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `${prefix}-${year}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const input = uploadSchema.parse(body);

    const claim = await findByClaimId(input.claimId);
    if (!claim) {
      return NextResponse.json(errorResponse(`Claim ${input.claimId} not found`), { status: 404 });
    }

    const uploadedBy = input.uploadedBy ?? 'INTELLIDOC_INTEGRATION';
    const created: string[] = [];

    for (const doc of input.documents) {
      const documentId = generateId('DOC');
      await ClaimDocument.create({
        documentId,
        claimId: input.claimId,
        documentType: doc.documentType,
        fileName: doc.fileName,
        storagePath: doc.storagePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        status: 'RECEIVED',
        uploadedBy,
        uploadedAt: new Date(),
      });
      created.push(documentId);
    }

    // Timeline event
    const timelineId = generateId('TML');
    await ClaimTimeline.create({
      timelineId,
      claimId: input.claimId,
      eventType: 'DOCUMENTS_UPLOADED',
      description: `${input.documents.length} document(s) uploaded by ${uploadedBy}`,
      performedBy: uploadedBy,
      performedAt: new Date(),
      metadata: { documentIds: created, documentTypes: input.documents.map((d) => d.documentType) },
    });

    await AuditLog.create({
      userId: uploadedBy,
      action: 'DOCUMENTS_UPLOADED',
      entity: 'ClaimDocument',
      entityId: input.claimId,
      newValue: { count: created.length, documentIds: created },
      timestamp: new Date(),
    });

    // Re-check document completeness
    const docCheck = await getRequiredDocuments(input.claimId, claim.claimType);

    return NextResponse.json(
      successResponse(
        {
          claimId: input.claimId,
          documentsUploaded: created.length,
          documentIds: created,
          documentStatus: docCheck,
        },
        'Documents uploaded successfully'
      ),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }
    console.error('Upload documents error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
