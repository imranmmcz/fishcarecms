/**
 * AuthContext - Supabase/Lovable Cloud Version
 */

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

// Compatibility User type
interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  mobile?: string | null;
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
  village?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = userRole === 'admin';
  const isFarmer = userRole === 'farmer';
  const isCustomer = userRole === 'customer';
  const isAuthenticated = !!supabaseUser;

  // Build compatibility User object - memoized to prevent infinite re-renders
  const user: User | null = useMemo(() => supabaseUser ? {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    full_name: profile?.full_name || supabaseUser.user_metadata?.full_name || null,
    role: userRole || 'user',
    mobile: profile?.mobile,
    division: profile?.division,
    district: profile?.district,
    upazila: profile?.upazila,
    village: profile?.village,
    avatar_url: profile?.avatar_url,
    created_at: supabaseUser.created_at,
  } : null, [supabaseUser, profile, userRole]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        mobile: data.mobile,
        division: data.division,
        district: data.district,
        upazila: data.upazila,
        village: data.village,
        avatar_url: data.avatar_url,
      } as UserProfile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }
      return (data?.role as UserRole) || 'user';
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  const loadUserData = async (userId: string) => {
    const [profileData, role] = await Promise.all([
      fetchProfile(userId),
      fetchUserRole(userId),
    ]);
    setProfile(profileData);
    setUserRole(role);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        setIsLoading(false);

        if (session?.user) {
          setTimeout(() => loadUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        await loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, addressData?: AddressData, roleType?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          mobile: addressData?.mobile,
          division: addressData?.division,
          district: addressData?.district,
          upazila: addressData?.upazila,
          village: addressData?.village,
          role_type: roleType || 'farmer',
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUserRole(null);
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!supabaseUser) return false;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          mobile: data.mobile,
          division: data.division,
          district: data.district,
          upazila: data.upazila,
          village: data.village,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", supabaseUser.id);

      if (error) throw error;

      const updatedProfile = await fetchProfile(supabaseUser.id);
      setProfile(updatedProfile);
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  const updatePassword = async (_currentPassword: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  const refreshUser = async () => {
    if (!supabaseUser) return;
    await loadUserData(supabaseUser.id);
  };

  const switchToFarmer = async (): Promise<boolean> => {
    // Role switching not directly supported with Supabase RLS
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
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
