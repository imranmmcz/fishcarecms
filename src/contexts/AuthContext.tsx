/**
 * AuthContext - MySQL Backend API Version
 * VITE_API_URL পরিবর্তন করলেই ব্যাকএন্ড পরিবর্তন হবে
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

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  mobile: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  village: string | null;
  avatar_url: string | null;
}

type UserRole = 'admin' | 'farmer' | 'customer' | 'user' | 'manager' | 'cashier' | 'delivery_staff';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: unknown | null;
  isLoading: boolean;
  isAdmin: boolean;
  isFarmer: boolean;
  isCustomer: boolean;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, addressData?: AddressData, roleType?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  switchToFarmer: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const userToProfile = (user: User | null): UserProfile | null => {
  if (!user) return null;
  return {
    id: String(user.id),
    user_id: String(user.id),
    email: user.email,
    full_name: user.full_name,
    mobile: user.mobile,
    division: user.division,
    district: user.district,
    upazila: user.upazila,
    village: user.village,
    avatar_url: user.avatar_url,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const userRole: UserRole | null = user?.role ? (user.role as UserRole) : null;
  const isFarmer = userRole === 'farmer';
  const isCustomer = userRole === 'customer';
  const isAuthenticated = !!user;
  const profile = userToProfile(user);

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

  const signUp = async (email: string, password: string, fullName: string, addressData?: AddressData, roleType?: string) => {
    try {
      const signUpData: Record<string, unknown> = { ...addressData };
      if (roleType) signUpData.role_type = roleType;
      const response = await apiClient.signUp(email, password, fullName, signUpData as any);
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

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const response = await apiClient.updateUser(String(user.id), data as unknown as Partial<User>);
      if (response.error) return false;
      if (response.data?.user) {
        setUser(response.data.user);
      }
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
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

  const switchToFarmer = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const response = await apiClient.updateUserRole(String(user.id), 'user');
      if (response.error) return false;
      // Refresh user data
      await refreshUser();
      return true;
    } catch (error) {
      console.error("Error switching role:", error);
      return false;
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
        profile,
        session: user ? { user } : null,
        isLoading,
        isAdmin,
        isFarmer,
        isCustomer,
        userRole,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        updateProfile,
        updatePassword,
        refreshUser,
        switchToFarmer,
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
