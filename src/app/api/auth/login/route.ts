import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/auth/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the login request to the backend
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Login failed' },
        { status: response.status }
      );
    }
    
    // Set the authentication cookies
    await setAuthCookies({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });
    
    // Return the user data (without tokens for security)
    return NextResponse.json({
      user: data.user,
      tokenType: data.tokenType,
      expiresIn: data.expiresIn,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}