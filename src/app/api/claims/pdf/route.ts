import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import ClaimsHistory from '@/models/Claim';
import FnolIntake from '@/models/FnolIntake';
import { generateClaimSummaryPdf } from '@/lib/pdf/claim-summary';
import { errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const claimId = searchParams.get('claimId');
    const claimNumber = searchParams.get('claimNumber');

    if (!claimId && !claimNumber) {
      return NextResponse.json(
        errorResponse('Either claimId or claimNumber is required'),
        { status: 400 }
      );
    }

    const query = claimId ? { claimId } : { claimNumber };
    const claim = await ClaimsHistory.findOne(query);

    if (!claim) {
      return NextResponse.json(
        errorResponse('Claim not found'),
        { status: 404 }
      );
    }

    const intake = await FnolIntake.findOne({ claimId: claim.claimId });

    if (!intake) {
      return NextResponse.json(
        errorResponse('FNOL intake data not found for this claim'),
        { status: 404 }
      );
    }

    const pdfBuffer = await generateClaimSummaryPdf({
      intake: intake.toObject(),
      claim: claim.toObject(),
      fraudFlags: claim.fraudFlags || [],
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="claim-${claim.claimNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating claim PDF:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
