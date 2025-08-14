import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background">
      <div className="max-w-md w-full p-8 text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            404
          </h1>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="space-y-3">
          <Link href="/dashboard">
            <Button variant="primary" className="w-full max-w-xs">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full max-w-xs">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}