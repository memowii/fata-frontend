import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isTokenExpired } from '@/lib/types/token.types';
import { setAuthCookies, clearAuthCookies } from '@/lib/auth/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      );
    }
    
    if (isTokenExpired(refreshToken)) {
      await clearAuthCookies();
      return NextResponse.json(
        { error: 'Refresh token expired' },
        { status: 401 }
      );
    }
    
    // Call backend to refresh tokens
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      await clearAuthCookies();
      return NextResponse.json(
        { error: 'Failed to refresh tokens' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Update cookies with new tokens
    await setAuthCookies({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Tokens refreshed successfully',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}