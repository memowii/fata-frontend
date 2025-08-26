import { requireAuth } from '@/lib/auth/server';
import { AuthProvider } from '@/contexts/AuthContext';
import ClientLayout from './ClientLayout';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  return (
    <AuthProvider initialUser={user}>
      <ClientLayout>{children}</ClientLayout>
    </AuthProvider>
  );
}