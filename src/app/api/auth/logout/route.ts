import { NextRequest, NextResponse } from 'next/server';
import { serverLogout } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    await serverLogout();
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}