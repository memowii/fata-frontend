/**
 * Example Component: Authentication with TanStack Query
 * Demonstrates the usage of authentication hooks with proper error handling and loading states
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useLogin, 
  useRegister, 
  useCurrentUser,
  useLogout,
  useUpdateProfile 
} from '@/hooks/queries';
import { getUserFriendlyMessage } from '@/lib/query';
import type { LoginDto, RegisterDto } from '@/lib/types/auth.types';

/**
 * Login Example Component
 */
export function LoginExample() {
  const [credentials, setCredentials] = useState<LoginDto>({
    email: '',
    password: '',
  });

  const loginMutation = useLogin({
    onSuccess: (data) => {
      console.log('Login successful:', data);
      // Router push is handled in the hook
    },
    onError: (error) => {
      console.error('Login failed:', getUserFriendlyMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(credentials);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={credentials.email}
        onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
        disabled={loginMutation.isPending}
        className="w-full px-4 py-2 border rounded"
      />
      
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
        disabled={loginMutation.isPending}
        className="w-full px-4 py-2 border rounded"
      />

      {loginMutation.error && (
        <div className="text-red-500 text-sm">
          {getUserFriendlyMessage(loginMutation.error)}
        </div>
      )}

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loginMutation.isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

/**
 * User Profile Example Component
 */
export function UserProfileExample() {
  const { data: user, isLoading, error, refetch } = useCurrentUser();
  const logoutMutation = useLogout();
  const updateProfileMutation = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        <p>Error loading user data</p>
        <button 
          onClick={() => refetch()}
          className="text-blue-500 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(
      { name },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Welcome, {user.name}!</h2>
        <p className="text-gray-600">{user.email}</p>
        <p className="text-sm text-gray-500">
          Email verified: {user.emailVerified ? 'Yes' : 'No'}
        </p>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 border rounded"
            disabled={updateProfileMutation.isPending}
          />
          <div className="space-x-2">
            <button
              onClick={handleUpdateProfile}
              disabled={updateProfileMutation.isPending}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setName(user.name);
              }}
              disabled={updateProfileMutation.isPending}
              className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Edit Profile
        </button>
      )}

      <button
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
      >
        {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}

/**
 * Registration Example Component
 */
export function RegisterExample() {
  const [formData, setFormData] = useState<RegisterDto>({
    email: '',
    password: '',
    name: '',
  });

  const registerMutation = useRegister({
    onSuccess: (data) => {
      console.log('Registration successful:', data);
      // Navigation is handled in the hook
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        disabled={registerMutation.isPending}
        className="w-full px-4 py-2 border rounded"
      />
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        disabled={registerMutation.isPending}
        className="w-full px-4 py-2 border rounded"
      />
      
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        disabled={registerMutation.isPending}
        className="w-full px-4 py-2 border rounded"
      />

      {registerMutation.error && (
        <div className="text-red-500 text-sm">
          {getUserFriendlyMessage(registerMutation.error)}
        </div>
      )}

      {registerMutation.isSuccess && (
        <div className="text-green-500 text-sm">
          Registration successful! Redirecting...
        </div>
      )}

      <button
        type="submit"
        disabled={registerMutation.isPending}
        className="w-full px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
      >
        {registerMutation.isPending ? 'Creating account...' : 'Register'}
      </button>
    </form>
  );
}

/**
 * Combined Auth Example
 */
export function AuthExample() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="mb-4">
        <button
          onClick={() => setMode('login')}
          className={`px-4 py-2 ${mode === 'login' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Login
        </button>
        <button
          onClick={() => setMode('register')}
          className={`px-4 py-2 ml-2 ${mode === 'register' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Register
        </button>
      </div>

      {mode === 'login' ? <LoginExample /> : <RegisterExample />}
    </div>
  );
}