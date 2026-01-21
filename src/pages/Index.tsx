import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate("/auth");
          return;
        }

        // Check if user has a profile (completed onboarding)
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .single();

        if (error || !profile) {
          // User is authenticated but has no profile - needs onboarding
          navigate("/onboarding");
        } else {
          // User has profile - go to dashboard
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          navigate("/auth");
          setLoading(false);
        } else if (event === "SIGNED_IN" && session) {
          checkUserStatus();
        }
      }
    );

    // Check initial status
    checkUserStatus();

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return null;
}
