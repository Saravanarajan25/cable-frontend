import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Decode JWT to get user info
const decodeToken = (token: string): User | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return { id: payload.id, username: payload.username };
  } catch (error) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = apiClient.getToken();
    if (token) {
      try {
        const decoded = decodeToken(token);

        // Check if token is expired
        if (decoded && typeof decoded === 'object' && 'exp' in decoded) {
          const exp = (decoded as any).exp;
          const now = Math.floor(Date.now() / 1000);

          if (exp && exp < now) {
            console.warn('[Auth] Token expired, clearing...');
            apiClient.removeToken();
            setUser(null);
          } else {
            setUser(decoded);
          }
        } else {
          setUser(decoded);
        }
      } catch (error) {
        console.error('[Auth] Invalid token detected, clearing...');
        apiClient.removeToken();
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/login', { username, password });
      const { token } = response;

      apiClient.setToken(token);
      const decoded = decodeToken(token);
      setUser(decoded);

      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.message || 'Login failed') };
    }
  };

  const signOut = async () => {
    apiClient.removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

