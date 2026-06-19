import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { errorResponse } from '@/lib/api-response';

function extractPolicyNumber(data: any): string | null {
  // Try to extract from top-level policyNumber
  if (data.policyNumber && typeof data.policyNumber === 'string') {
    return data.policyNumber.trim();
  }

  // Try to extract from nested extracted_data.segments
  if (data.extracted_data?.segments && Array.isArray(data.extracted_data.segments)) {
    for (const segment of data.extracted_data.segments) {
      if (segment.fields && Array.isArray(segment.fields)) {
        const policyField = segment.fields.find(
          (f: any) => f.name === 'policy_number' && f.value
        );
        if (policyField?.value) {
          return policyField.value.trim();
        }
      }
    }
  }

  // Try to extract from external_segments
  if (data.extracted_data?.external_segments && Array.isArray(data.extracted_data.external_segments)) {
    for (const segment of data.extracted_data.external_segments) {
      if (segment.fields && Array.isArray(segment.fields)) {
        const policyField = segment.fields.find(
          (f: any) => f.name === 'policy_number' && f.value
        );
        if (policyField?.value) {
          return policyField.value.trim();
        }
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract policy number from nested structure
    const policyNumber = extractPolicyNumber(body);

    if (!policyNumber) {
      return NextResponse.json(
        errorResponse(
          'Policy number not found in extracted data. Ensure policy_number field exists in segments.'
        ),
        { status: 400 }
      );
    }

    console.log(`Extracted policy number: ${policyNumber}`);

    // Search for matching file in public folder
    const publicDir = path.join(process.cwd(), 'public', 'policy-files');

    try {
      const files = await readdir(publicDir);
      console.log(`Files in policy-files folder:`, files);

      // Find file that matches the policy number
      const matchingFile = files.find(file => file.includes(policyNumber));

      if (!matchingFile) {
        return NextResponse.json(
          errorResponse(
            `No file found matching policy number "${policyNumber}" in public/policy-files folder. ` +
            `Available files: ${files.join(', ')}`
          ),
          { status: 404 }
        );
      }

      console.log(`Found matching file: ${matchingFile}`);

      // Read and return the file
      const filePath = path.join(publicDir, matchingFile);
      const fileContent = await readFile(filePath);
      const fileExtension = path.extname(matchingFile);

      // Determine content type based on file extension
      const contentTypeMap: { [key: string]: string } = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
      };

      const contentType = contentTypeMap[fileExtension.toLowerCase()] || 'application/octet-stream';

      return new Response(fileContent, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${matchingFile}"`,
        },
      });
    } catch (fileError) {
      console.error('Error accessing public folder:', fileError);
      return NextResponse.json(
        errorResponse('Error accessing policy files: ' + String(fileError)),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing IDP data:', error);
    return NextResponse.json(
      errorResponse('Internal server error: ' + String(error)),
      { status: 500 }
    );
  }
}
