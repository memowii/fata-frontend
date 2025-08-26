'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/lib/auth/client';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await verifyEmail({ token });
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Failed to verify email. The link may be expired or invalid.'
        );
      }
    };
    
    verify();
  }, [token, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-4">
      <Card className="w-full max-w-md glass-morphism">
        <CardHeader className="text-center pb-4">
          {status === 'loading' && (
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <svg
                className="w-8 h-8 text-primary animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
          
          {status === 'success' && (
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </CardHeader>

        <CardBody className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <h2 className="text-2xl font-bold text-foreground">
                Verifying Email
              </h2>
              <p className="text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <h2 className="text-2xl font-bold text-foreground">
                Email Verified!
              </h2>
              <p className="text-muted-foreground">
                {message}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to login...
              </p>
              <Link href="/login">
                <Button variant="primary" fullWidth>
                  Go to Login
                </Button>
              </Link>
            </>
          )}
          
          {status === 'error' && (
            <>
              <h2 className="text-2xl font-bold text-foreground">
                Verification Failed
              </h2>
              <p className="text-muted-foreground">
                {message}
              </p>
              <div className="space-y-2">
                <Link href="/register">
                  <Button variant="primary" fullWidth>
                    Create New Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" fullWidth>
                    Back to Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}