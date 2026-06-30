import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir, stat } from 'fs/promises';
import path from 'path';
import { errorResponse } from '@/lib/api-response';

export const runtime = 'nodejs';

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/documents/property-damage-evidence
//   Serves PDF files from public/PROPERTY DAMAGE EVIDENCE/.
//   ?filename  — specific file; defaults to first PDF found
//   ?download  — "true" forces attachment download
//
// POST /api/documents/property-damage-evidence
//   Accepts an IntelliDoc field-extraction payload and verifies whether the
//   extracted claim_number matches the claim number embedded in the stored
//   filename.
//
//   Body (array or single field object):
//     [{ name, value, confidence, sourceText, bbox }, ...]
//     or { name, value, confidence, sourceText, bbox }
//     or { fields: [...] }
//
//   Response:
//     { extractedClaimNumber, fileClaimNumber, storedFileName,
//       confidence, match, normalizedExtracted, normalizedFile }
// ─────────────────────────────────────────────────────────────────────────────

const FOLDER = 'PROPERTY DAMAGE EVIDENCE';

function extractClaimFromFilename(fileName: string): string {
  const withoutExt = fileName.replace(/\.pdf$/i, '');
  const dashIdx = withoutExt.indexOf('-');
  if (dashIdx === -1) return withoutExt;
  const prefix = withoutExt.slice(0, dashIdx).trimEnd();
  return withoutExt.slice(prefix.length).replace(/^[\s-]+/, '');
}

function normalise(claimNumber: string): string {
  return claimNumber.toUpperCase().replace(/[\s-]/g, '');
}

export async function GET(request: NextRequest) {
  const folderPath = path.join(process.cwd(), 'public', FOLDER);

  // Resolve the target filename
  let fileName = request.nextUrl.searchParams.get('filename') ?? '';

  if (!fileName) {
    // Pick the first PDF in the folder when no filename is specified
    let entries: string[];
    try {
      entries = await readdir(folderPath);
    } catch {
      return NextResponse.json(
        errorResponse(`Folder '${FOLDER}' not found on server`),
        { status: 404 }
      );
    }
    const firstPdf = entries.find((f) => f.toLowerCase().endsWith('.pdf'));
    if (!firstPdf) {
      return NextResponse.json(
        errorResponse(`No PDF files found in '${FOLDER}' folder`),
        { status: 404 }
      );
    }
    fileName = firstPdf;
  }

  // Prevent path traversal
  const filePath = path.join(folderPath, path.basename(fileName));

  try {
    await stat(filePath);
  } catch {
    return NextResponse.json(
      errorResponse(`File '${fileName}' not found in '${FOLDER}' folder`),
      { status: 404 }
    );
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch (err) {
    console.error('Error reading property damage evidence document:', err);
    return NextResponse.json(errorResponse('Failed to read document'), { status: 500 });
  }

  const download = request.nextUrl.searchParams.get('download') === 'true';
  const disposition = download
    ? `attachment; filename="${fileName}"`
    : `inline; filename="${fileName}"`;

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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/documents/property-damage-evidence
// ─────────────────────────────────────────────────────────────────────────────

interface IntelliDocField {
  name: string;
  value: string;
  confidence?: number;
  sourceText?: string;
  bbox?: string;
}

export async function POST(request: NextRequest) {
  // ── 1. Parse the IntelliDoc payload ────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(errorResponse('Invalid JSON body'), { status: 400 });
  }

  let fields: IntelliDocField[] = [];
  if (Array.isArray(body)) {
    fields = body as IntelliDocField[];
  } else if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    if (Array.isArray(obj.fields)) {
      fields = obj.fields as IntelliDocField[];
    } else if (typeof obj.name === 'string') {
      fields = [obj as unknown as IntelliDocField];
    }
  }

  const claimField = fields.find(
    (f) => f.name?.toLowerCase().replace(/[\s_-]/g, '') === 'claimnumber'
  );

  if (!claimField) {
    return NextResponse.json(
      errorResponse('claim_number field not found in payload'),
      { status: 422 }
    );
  }

  const extractedClaimNumber = String(claimField.value ?? '').trim();
  if (!extractedClaimNumber) {
    return NextResponse.json(
      errorResponse('claim_number value is empty in payload'),
      { status: 422 }
    );
  }

  // ── 2. Resolve the stored filename ─────────────────────────────────────────
  const folderPath = path.join(process.cwd(), 'public', FOLDER);

  let entries: string[];
  try {
    entries = await readdir(folderPath);
  } catch {
    return NextResponse.json(
      errorResponse(`Folder '${FOLDER}' not found on server`),
      { status: 404 }
    );
  }

  const storedFileName = entries.find((f) => f.toLowerCase().endsWith('.pdf'));
  if (!storedFileName) {
    return NextResponse.json(
      errorResponse(`No PDF files found in '${FOLDER}' folder`),
      { status: 404 }
    );
  }

  // ── 3. Extract & compare claim numbers ─────────────────────────────────────
  const fileClaimNumber = extractClaimFromFilename(storedFileName);
  const normalizedExtracted = normalise(extractedClaimNumber);
  const normalizedFile = normalise(fileClaimNumber);
  const match = normalizedExtracted === normalizedFile;

  // ── 4. If matched, stream the PDF file directly ───────────────────────────
  if (match) {
    const filePath = path.join(folderPath, path.basename(storedFileName));
    let buffer: Buffer;
    try {
      buffer = await readFile(filePath);
    } catch (err) {
      console.error('Error reading property damage evidence document:', err);
      return NextResponse.json(errorResponse('Failed to read document'), { status: 500 });
    }

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(buffer.length),
        'Content-Disposition': `inline; filename="${storedFileName}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // ── 5. No match — return verification details ──────────────────────────────
  return NextResponse.json(
    {
      match: false,
      extractedClaimNumber,
      fileClaimNumber,
      storedFileName,
      confidence: claimField.confidence ?? null,
      sourceText: claimField.sourceText ?? null,
      normalizedExtracted,
      normalizedFile,
      message: `Claim number '${extractedClaimNumber}' does not match file claim number '${fileClaimNumber}'`,
    },
    { status: 404 }
  );
}
