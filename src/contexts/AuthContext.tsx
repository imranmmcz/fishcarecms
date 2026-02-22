import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
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

type UserRole = 'admin' | 'farmer' | 'customer' | 'user';

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

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

      return data as UserProfile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user role:", error);
        return { isAdmin: false, role: null as UserRole | null };
      }

      const roles = data?.map(r => r.role as UserRole) || [];
      const hasAdmin = roles.includes('admin');
      // Priority: admin > farmer > customer > user
      const primaryRole = hasAdmin ? 'admin' : roles.includes('farmer') ? 'farmer' : roles.includes('customer') ? 'customer' : roles[0] || null;

      return { isAdmin: hasAdmin, role: primaryRole };
    } catch (error) {
      console.error("Error fetching user role:", error);
      return { isAdmin: false, role: null as UserRole | null };
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Defer profile and admin check with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(async () => {
            const [profileData, roleData] = await Promise.all([
              fetchProfile(session.user.id),
              fetchUserRole(session.user.id),
            ]);
            setProfile(profileData);
            setIsAdmin(roleData.isAdmin);
            setUserRole(roleData.role);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        const [profileData, roleData] = await Promise.all([
          fetchProfile(session.user.id),
          fetchUserRole(session.user.id),
        ]);
        setProfile(profileData);
        setIsAdmin(roleData.isAdmin);
        setUserRole(roleData.role);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, addressData?: AddressData, roleType?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
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
    setIsAdmin(false);
    setUserRole(null);
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;

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
        .eq("user_id", user.id);

      if (error) throw error;

      // Refresh profile
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const switchToFarmer = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      // Update the role from customer to farmer
      const { error } = await supabase
        .from("user_roles")
        .update({ role: 'farmer' as any })
        .eq("user_id", user.id)
        .eq("role", 'customer' as any);

      if (error) throw error;

      setUserRole('farmer');
      return true;
    } catch (error) {
      console.error("Error switching role:", error);
      return false;
    }
  };

  const refreshUser = async () => {
    if (user) {
      const [profileData, roleData] = await Promise.all([
        fetchProfile(user.id),
        fetchUserRole(user.id),
      ]);
      setProfile(profileData);
      setIsAdmin(roleData.isAdmin);
      setUserRole(roleData.role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAdmin,
        isFarmer: userRole === 'farmer',
        isCustomer: userRole === 'customer',
        userRole,
        isAuthenticated: !!user,
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
