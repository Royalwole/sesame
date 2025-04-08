import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/router';

export default function useAuth(options = {}) {
  const { requireAuth = false, redirectTo = '/auth/sign-in', roleRequired = null } = options;
  
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [error, setError] = useState(null);
  
  // Check authentication and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      // Wait for Clerk to initialize
      if (!isUserLoaded) return;
      
      // If authentication is required but user is not signed in, redirect
      if (requireAuth && !isSignedIn) {
        router.push(`${redirectTo}?redirect=${encodeURIComponent(router.asPath)}`);
        return;
      }
      
      if (isSignedIn && user) {
        try {
          // Get the role from user metadata
          const role = user.publicMetadata.role || 'general';
          setUserRole(role);
          
          // Check if role requirement is met
          if (roleRequired && role !== roleRequired && role !== 'admin') {
            // User doesn't have required role, redirect to appropriate page
            if (role === 'agent') {
              router.push('/dashboard/agent');
            } else if (role === 'admin') {
              router.push('/dashboard/admin');
            } else {
              router.push('/dashboard/user');
            }
            return;
          }
          
          // Fetch user data from our database
          const response = await fetch('/api/users/profile');
          
          if (!response.ok) {
            throw new Error('Failed to fetch user profile');
          }
          
          const userData = await response.json();
          setDbUser(userData);
        } catch (err) {
          console.error('Auth error:', err);
          setError(err.message || 'Authentication error');
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [isUserLoaded, isSignedIn, user, requireAuth, redirectTo, roleRequired, router]);
  
  // Logout function
  const logout = async () => {
    await signOut();
    router.push('/');
  };
  
  return {
    user,
    dbUser,
    isLoading,
    isSignedIn,
    userRole,
    error,
    logout
  };
}
