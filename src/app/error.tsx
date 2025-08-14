'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Something went wrong!
        </h2>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        <Button
          onClick={reset}
          variant="primary"
          className="w-full max-w-xs mx-auto"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}