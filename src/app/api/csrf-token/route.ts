import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * GET /api/csrf-token
 * 
 * Fetches a CSRF token from the backend API and returns it to the client.
 * This endpoint acts as a proxy to maintain security and handle any
 * backend-specific authentication or session requirements.
 */
export async function GET(request: NextRequest) {
  try {
    // Forward the request to the backend, including any relevant headers
    const response = await fetch(`${API_URL}/csrf-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies and other headers that might be needed for session management
        'Cookie': request.headers.get('cookie') || '',
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`CSRF endpoint returned non-JSON response: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { 
          success: false,
          message: 'Backend CSRF endpoint is not available or not properly configured',
          error: {
            code: 'CSRF_TOKEN_FETCH_ERROR',
            statusCode: response.status,
            details: `Expected JSON response but got: ${contentType}`
          }
        },
        { status: 503 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || 'Failed to fetch CSRF token from backend',
          error: {
            code: 'CSRF_TOKEN_FETCH_ERROR',
            statusCode: response.status,
            details: data.error || 'Backend CSRF endpoint error'
          }
        },
        { status: response.status }
      );
    }

    // Return the CSRF token with appropriate headers
    return NextResponse.json({
      success: true,
      data: {
        csrfToken: data.csrfToken || data.token,
        expiresAt: data.expiresAt,
        // Include any other relevant metadata
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('CSRF token fetch error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error while fetching CSRF token',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500
        }
      },
      { status: 500 }
    );
  }
}