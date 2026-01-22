/**
 * MySQL Backend AuthContext
 * Hostinger-এ ডেপ্লয় করার সময় এই Context ব্যবহার করুন
 * 
 * ব্যবহার করতে App.tsx এ:
 * import { AuthProvider } from "@/contexts/AuthContextMySQL";
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient, User } from "@/lib/api-client";

interface AddressData {
  mobile?: string;
  division?: string;
  district?: string;
  upazila?: string;
  village?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, addressData?: AddressData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ error: Error | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.getCurrentUser();
        if (response.data?.user) {
          setUser(response.data.user);
        } else {
          // Token invalid, remove it
          apiClient.removeToken();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiClient.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.signIn(email, password);
      
      if (response.error) {
        return { error: new Error(response.error) };
      }

      if (response.data?.user) {
        setUser(response.data.user);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, addressData?: AddressData) => {
    try {
      const response = await apiClient.signUp(email, password, fullName, addressData);
      
      if (response.error) {
        return { error: new Error(response.error) };
      }

      if (response.data?.user) {
        setUser(response.data.user);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const response = await apiClient.updateUser(String(user.id), data);
      
      if (response.error) {
        return { error: new Error(response.error) };
      }

      if (response.data?.user) {
        setUser(response.data.user);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await apiClient.updatePassword(currentPassword, newPassword);
      
      if (response.error) {
        return { error: new Error(response.error) };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getCurrentUser();
      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        updateProfile,
        updatePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
