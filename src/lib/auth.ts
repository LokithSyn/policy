export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function verifyAuth(token: string): Promise<TokenPayload | null> {
  try {
    // JWT verification will be handled by Auth0 middleware
    // For now, this is a placeholder
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (without verification for now)
    const decoded = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return decoded as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
