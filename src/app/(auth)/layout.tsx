import { requireGuest } from '@/lib/auth/server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is not authenticated
  await requireGuest();
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh" />
      
      {/* Floating orbs for visual interest */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="fixed inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Main content container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Logo or brand */}
        <div className="mb-8 animate-fade-down">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl" />
              <div className="relative w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                <svg 
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-center text-gradient">
            From Article to Audio
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Transform your reading experience
          </p>
        </div>
        
        {/* Auth form container with glass effect */}
        <div className="w-full max-w-md animate-fade-up">
          <div className="glass rounded-2xl p-1 shadow-2xl">
            <div className="bg-card/95 backdrop-blur-xl rounded-xl">
              {children}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="#" className="underline hover:text-foreground transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}