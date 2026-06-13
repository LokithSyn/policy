import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import FnolIntake from '@/models/FnolIntake';
import ClaimsHistory from '@/models/Claim';
import { generateClaimSummaryPdf } from '@/lib/pdf/claim-summary';

export async function GET(
  _req: NextRequest,
  { params }: { params: { intakeId: string } }
) {
  try {
    await connectDB();

    const intake = await FnolIntake.findOne({ intakeId: params.intakeId });
    if (!intake) {
      return NextResponse.json({ error: 'FNOL intake record not found' }, { status: 404 });
    }

    if (!intake.claimId) {
      return NextResponse.json(
        { error: 'No claim has been created for this FNOL intake (validation may have failed)' },
        { status: 404 }
      );
    }

    const claim = await ClaimsHistory.findOne({ claimId: intake.claimId });
    if (!claim) {
      return NextResponse.json({ error: 'Associated claim not found' }, { status: 404 });
    }

    const pdfBuffer = await generateClaimSummaryPdf({
      intake: intake.toObject(),
      claim:  claim.toObject(),
      fraudFlags: claim.fraudFlags ?? [],
    });

    const fileName = `${claim.claimNumber ?? intake.intakeId}-summary.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length':      String(pdfBuffer.length),
        'Cache-Control':       'no-store',
      },
    });
  } catch (error) {
    console.error('[FNOL Summary PDF] Error:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
