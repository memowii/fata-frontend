'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/lib/auth/client';

interface VerifyEmailPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const verify = async () => {
      try {
        const resolvedParams = await params;
        const response = await verifyEmail({ token: resolvedParams.token });
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
  }, [params, router]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full animate-pulse">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin"
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
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your email address...
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
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
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Redirecting to login...
            </p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Go to Login
            </Link>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
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
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Link
                href="/register"
                className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Create New Account
              </Link>
              <Link
                href="/login"
                className="block text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}