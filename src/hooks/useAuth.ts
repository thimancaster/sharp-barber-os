import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  organization_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  commission_rate: number | null;
  working_hours: Record<string, { start: string; end: string } | null> | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setAuthState({ user: null, profile: null, isAdmin: false, isLoading: false });
          return;
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        // Check if admin
        const { data: isAdminResult } = await supabase.rpc("is_admin");

        setAuthState({
          user,
          profile: profile as Profile | null,
          isAdmin: isAdminResult ?? false,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setAuthState({ user: null, profile: null, isAdmin: false, isLoading: false });
      }
    };

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserData();
    });

    return () => subscription.unsubscribe();
  }, []);

  return authState;
}
