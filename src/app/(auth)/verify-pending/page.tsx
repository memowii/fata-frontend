'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function VerifyPendingPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!email || countdown > 0) return;
    
    try {
      setResendStatus('sending');
      
      // Call your resend verification email API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/resend-verification?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setResendStatus('sent');
        setCountdown(60); // Prevent spam by adding 60 second cooldown
      } else {
        setResendStatus('error');
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setResendStatus('error');
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <Card className="w-full max-w-md mx-auto glass-morphism">
        <CardHeader className="text-center pb-4">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Verify Your Email
          </h2>
        </CardHeader>

        <CardBody className="space-y-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-foreground font-medium">
                Thank you for registering!
              </p>
              <p className="text-muted-foreground">
                We&apos;ve sent a verification email to:
              </p>
              {email && (
                <p className="font-mono text-sm bg-muted/50 px-3 py-2 rounded-lg text-foreground">
                  {email}
                </p>
              )}
            </div>

            <Alert variant="info">
              <div className="text-sm">
                <p className="font-semibold mb-1">Please check your email</p>
                <p>Click the verification link in the email to activate your account. The link will expire in 24 hours.</p>
              </div>
            </Alert>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Didn&apos;t receive the email?
              </p>
              
              {resendStatus === 'sent' && (
                <Alert variant="success" className="mb-3">
                  Verification email has been resent successfully!
                </Alert>
              )}
              
              {resendStatus === 'error' && (
                <Alert variant="destructive" className="mb-3">
                  Failed to resend email. Please try again.
                </Alert>
              )}

              <Button
                onClick={handleResendEmail}
                variant="outline"
                disabled={!email || resendStatus === 'sending' || countdown > 0}
                className="w-full"
              >
                {resendStatus === 'sending' ? (
                  <>
                    <span className="mr-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </span>
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend available in ${countdown}s`
                ) : (
                  'Resend Verification Email'
                )}
              </Button>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Also check your spam folder
              </p>
              
              <div className="flex flex-col gap-2">
                <Link href="/login">
                  <Button variant="primary" className="w-full">
                    Go to Login
                  </Button>
                </Link>
                
                <Link href="/register">
                  <Button variant="ghost" className="w-full">
                    Register with Different Email
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Having trouble? Contact support at{' '}
          <a
            href="mailto:support@kualisoft.com"
            className="text-primary hover:underline"
          >
            support@kualisoft.com
          </a>
        </p>
      </div>
    </div>
  );
}