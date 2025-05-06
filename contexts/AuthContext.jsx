import { createContext, useContext, useEffect, useState } from 'react';
import { useClerk, useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { useHydration } from '../lib/useHydration';

const AuthContext = createContext({
  isAdmin: false,
  isAgent: false,
  isLoading: true,
});

export function AuthProvider({ children }) {
  const { userId } = useClerkAuth();
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isHydrated = useHydration();

  useEffect(() => {
    if (!isHydrated || !isLoaded || !user) {
      return;
    }

    const checkUserRoles = async () => {
      try {
        const publicMetadata = user.publicMetadata;
        setIsAdmin(publicMetadata?.role === 'admin');
        setIsAgent(publicMetadata?.role === 'agent');
      } catch (error) {
        console.error('Error checking user roles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRoles();
  }, [user, isLoaded, isHydrated]);

  // During SSR or before hydration, return a minimal context
  if (!isHydrated || !isLoaded) {
    return (
      <AuthContext.Provider value={{ isAdmin: false, isAgent: false, isLoading: true }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ isAdmin, isAgent, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
