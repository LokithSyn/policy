import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { errorResponse } from '@/lib/api-response';

export const runtime = 'nodejs';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/documents/sample-claims-record
//
// Sends the bundled sample Claims Record PDF (public/ClaimsRecord_Sample_USA_GL.pdf).
//
// Query params:
//   download — optional — "true" forces a file download (Content-Disposition:
//              attachment); otherwise the PDF is rendered inline in the browser.
//
// Response: application/pdf binary stream
// ─────────────────────────────────────────────────────────────────────────────

const FILE_NAME = 'ClaimsRecord_Sample_USA_GL.pdf';

export async function GET(request: NextRequest) {
  const filePath = path.join(process.cwd(), 'public', FILE_NAME);

  try {
    // Confirm the file exists before reading
    await stat(filePath);
  } catch {
    return NextResponse.json(
      errorResponse(`Sample document '${FILE_NAME}' not found on server`),
      { status: 404 }
    );
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch (err) {
    console.error('Error reading sample document:', err);
    return NextResponse.json(errorResponse('Failed to read document'), { status: 500 });
  }

  const download = request.nextUrl.searchParams.get('download') === 'true';
  const disposition = download
    ? `attachment; filename="${FILE_NAME}"`
    : `inline; filename="${FILE_NAME}"`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(buffer.length),
      'Content-Disposition': disposition,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
