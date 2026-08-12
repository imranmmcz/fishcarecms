/**
 * AuthContext — hybrid auth.
 * Provider is chosen at runtime (Admin → Database Config):
 *   "supabase" (default) → Supabase/Lovable Cloud auth
 *   "mysql"              → custom JWT auth against the Hostinger backend
 */

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isMysqlAuth } from "@/lib/authProvider";
import { mysqlAuth, type MysqlUser } from "@/lib/mysqlAuth";

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

type UserRole = 'admin' | 'farmer' | 'customer' | 'user' | 'manager' | 'cashier' | 'delivery_staff' | 'blogger';

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
  roleLoading: boolean;
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
  const mysqlMode = isMysqlAuth();
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mysqlUser, setMysqlUser] = useState<MysqlUser | null>(null);
  // Tracks whether the user's role row has been fetched yet.
  // Starts true so route guards wait until we know the role.
  const [roleLoading, setRoleLoading] = useState(true);

  const isAdmin = userRole === 'admin';
  const isFarmer = userRole === 'farmer';
  const isCustomer = userRole === 'customer';
  const isAuthenticated = mysqlMode ? !!mysqlUser : !!supabaseUser;

  // Build compatibility User object - memoized to prevent infinite re-renders
  const user: User | null = useMemo(() => {
    if (mysqlMode) {
      return mysqlUser
        ? {
            id: String(mysqlUser.id),
            email: mysqlUser.email || '',
            full_name: mysqlUser.full_name ?? null,
            role: mysqlUser.role || 'user',
            mobile: mysqlUser.mobile ?? null,
            division: mysqlUser.division ?? null,
            district: mysqlUser.district ?? null,
            upazila: mysqlUser.upazila ?? null,
            village: mysqlUser.village ?? null,
            avatar_url: mysqlUser.avatar_url ?? null,
            created_at: mysqlUser.created_at ?? null,
          }
        : null;
    }
    return supabaseUser ? {
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
  } : null;
  }, [mysqlMode, mysqlUser, supabaseUser, profile, userRole]);

  /** Map a MySQL user row onto the shared profile/role state. */
  const applyMysqlUser = (u: MysqlUser | null) => {
    setMysqlUser(u);
    setUserRole((u?.role as UserRole) || null);
    setProfile(
      u
        ? {
            id: String(u.id),
            user_id: String(u.id),
            email: u.email ?? null,
            full_name: u.full_name ?? null,
            mobile: u.mobile ?? null,
            division: u.division ?? null,
            district: u.district ?? null,
            upazila: u.upazila ?? null,
            village: u.village ?? null,
            avatar_url: u.avatar_url ?? null,
          }
        : null
    );
    setRoleLoading(false);
  };

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
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      const roles = (data ?? []).map((r: { role: string }) => r.role as UserRole);
      if (roles.length === 0) return 'user';

      // Priority order: admin > moderator > partner > farmer > customer > user
      const priority: UserRole[] = ['admin', 'moderator', 'partner', 'farmer', 'customer', 'user'] as UserRole[];
      for (const p of priority) {
        if (roles.includes(p)) return p;
      }
      return roles[0];
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  const loadUserData = async (userId: string) => {
    setRoleLoading(true);
    const [profileData, role] = await Promise.all([
      fetchProfile(userId),
      fetchUserRole(userId),
    ]);
    setProfile(profileData);
    setUserRole(role);
    setRoleLoading(false);
  };

  useEffect(() => {
    if (mysqlMode) {
      let active = true;
      mysqlAuth
        .me()
        .then((u) => {
          if (!active) return;
          applyMysqlUser(u);
        })
        .catch(() => active && applyMysqlUser(null))
        .finally(() => active && setIsLoading(false));
      return () => {
        active = false;
      };
    }

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
          setRoleLoading(false);
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
      } else {
        setRoleLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [mysqlMode]);

  const signIn = async (email: string, password: string) => {
    if (mysqlMode) {
      try {
        const u = await mysqlAuth.signIn(email, password);
        applyMysqlUser(u);
        return { error: null };
      } catch (e) {
        return { error: e as Error };
      }
    }

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error && data?.user) {
      // Check if user is blocked
      const { data: blockData } = await supabase.rpc("is_user_blocked", { check_user_id: data.user.id });
      if (blockData === true) {
        await supabase.auth.signOut();
        return { error: new Error("আপনার অ্যাকাউন্ট ব্লক করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।") };
      }

      // Log login activity
      try {
        await supabase.from("user_activity_logs").insert({
          user_id: data.user.id,
          activity_type: "login",
          description: "ইউজার লগইন করেছেন",
        } as any);
      } catch {}
    }
    
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, addressData?: AddressData, roleType?: string) => {
    if (mysqlMode) {
      try {
        if (addressData?.mobile) {
          const available = await mysqlAuth.isMobileAvailable(addressData.mobile);
          if (!available) {
            return { error: new Error("এই মোবাইল নম্বর দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে। অন্য নম্বর ব্যবহার করুন।") };
          }
        }
        const u = await mysqlAuth.signUp({
          email,
          password,
          full_name: fullName,
          mobile: addressData?.mobile,
          division: addressData?.division,
          district: addressData?.district,
          upazila: addressData?.upazila,
          village: addressData?.village,
          role_type: roleType || 'farmer',
        });
        applyMysqlUser(u);
        return { error: null };
      } catch (e) {
        return { error: e as Error };
      }
    }

    // Check duplicate mobile
    if (addressData?.mobile) {
      const { data: mobileAvailable } = await supabase.rpc("is_mobile_available", { mobile_number: addressData.mobile });
      if (mobileAvailable === false) {
        return { error: new Error("এই মোবাইল নম্বর দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে। অন্য নম্বর ব্যবহার করুন।") };
      }
    }

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
    if (mysqlMode) {
      await mysqlAuth.signOut();
      applyMysqlUser(null);
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
    setUserRole(null);
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (mysqlMode) {
      if (!mysqlUser) return false;
      try {
        const u = await mysqlAuth.updateProfile({
          full_name: data.full_name,
          mobile: data.mobile,
          division: data.division,
          district: data.district,
          upazila: data.upazila,
          village: data.village,
          avatar_url: data.avatar_url,
        });
        applyMysqlUser(u);
        return true;
      } catch (error) {
        console.error("Error updating profile:", error);
        return false;
      }
    }
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
    if (mysqlMode) {
      try {
        await mysqlAuth.updatePassword(_currentPassword, newPassword);
        return { error: null };
      } catch (e) {
        return { error: e as Error };
      }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  const refreshUser = async () => {
    if (mysqlMode) {
      const u = await mysqlAuth.me();
      applyMysqlUser(u);
      return;
    }
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
        roleLoading,
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
