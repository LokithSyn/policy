import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { errorResponse } from '@/lib/api-response';

// Returns true if a key looks like a policy number field name
function isPolicyKey(key: string): boolean {
  const k = key.toLowerCase().replace(/[\s_-]/g, '');
  return k === 'policynumber' || k === 'policyno' || k === 'polno' || k === 'policy';
}

// Recursively walks any JSON structure and returns the first policy number value found
function deepExtractPolicyNumber(node: any, depth = 0): string | null {
  if (depth > 10 || node === null || node === undefined) return null;

  // { name: "policy_number", value: "..." } — IntelliDoc field object
  if (
    typeof node === 'object' &&
    !Array.isArray(node) &&
    typeof node.name === 'string' &&
    isPolicyKey(node.name) &&
    node.value
  ) {
    return String(node.value).trim();
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = deepExtractPolicyNumber(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof node === 'object') {
    // Direct key match: { policy_number: "...", policyNumber: "...", etc. }
    for (const key of Object.keys(node)) {
      if (isPolicyKey(key) && node[key] && typeof node[key] === 'string') {
        return node[key].trim();
      }
    }
    // Recurse into all child values
    for (const key of Object.keys(node)) {
      const found = deepExtractPolicyNumber(node[key], depth + 1);
      if (found) return found;
    }
  }

  return null;
}

function extractPolicyNumber(data: any): string | null {
  return deepExtractPolicyNumber(data);
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
