import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, LogOut, Loader2 } from "lucide-react";
import { ProductAnalyzer } from "@/components/ProductAnalyzer";
import { AnalysisList } from "@/components/AnalysisList";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const ensureUserProfile = async (supabaseUser: User) => {
    // Ensure user profile exists
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      if (!profile) {
        // Profile doesn't exist, create it
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name ||
                  supabaseUser.user_metadata?.full_name ||
                  (supabaseUser.user_metadata?.given_name && supabaseUser.user_metadata?.family_name
                    ? `${supabaseUser.user_metadata?.given_name} ${supabaseUser.user_metadata?.family_name}`
                    : undefined) ||
                  'User'
          });

        if (error) {
          console.error('Failed to create user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error checking/creating user profile:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (!session) {
          setUser(null);
          setLoading(false);
          navigate("/auth");
          return;
        }

        setUser(session.user);
        setLoading(false);

        void ensureUserProfile(session.user);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error('Error retrieving session:', error);
        setUser(null);
        setLoading(false);
        navigate("/auth");
      }
    };

    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) {
        return;
      }

      if (!session) {
        setUser(null);
        setLoading(false);
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setLoading(false);

      void ensureUserProfile(session.user);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      let { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        console.error("Global sign out failed, attempting local sign out", error);
        ({ error } = await supabase.auth.signOut({ scope: "local" }));
      }
      if (error) {
        throw error;
      }
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast.error("Failed to sign out");
    } finally {
      setUser(null);
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white dark:bg-neutral-950 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Product Summary</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-14 pb-10">
        <div className="grid gap-10 xl:grid-cols-[1.1fr_1fr]">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-x-10 -top-20 -bottom-10 -z-10">
              <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_20%,rgba(168,85,247,0.25),transparent_60%),radial-gradient(40%_40%_at_80%_0%,rgba(59,130,246,0.25),transparent_60%)]" />
              <div className="absolute inset-0 opacity-40 [background:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />
            </div>
            <div className="relative">
              <ProductAnalyzer 
                className="w-full rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] ring-1 ring-black/5 dark:ring-white/10"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div>
              <h2 className="text-3xl font-bold mb-2">Your Analyses</h2>
              <p className="text-muted-foreground">
                AI-powered product research reports
              </p>
            </div>
            <div className="mt-6 flex-1">
              <AnalysisList userId={user.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;