import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PublicLayout from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    const exchangeCode = async () => {
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      if (error) {
        toast.error(errorDescription || "Authentication failed");
        navigate("/sign-in", { replace: true });
        return;
      }

      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data, error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setError) throw setError;
          if (!data.session) {
            throw new Error("Missing session after authentication");
          }
          window.location.hash = "";
          setMessage("Redirecting to dashboard...");
          navigate("/dashboard", { replace: true });
          return;
        }

        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          setMessage("Redirecting to dashboard...");
          navigate("/dashboard", { replace: true });
          return;
        }

        throw new Error("Missing auth response from provider");
      } catch (authError: any) {
        toast.error(authError?.message || "Failed to finish sign-in");
        navigate("/sign-in", { replace: true });
      }
    };

    void exchangeCode();
  }, [navigate, searchParams]);

  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-primary via-primary-dark to-secondary py-16">
        <div className="container mx-auto px-4">
          <Card className="mx-auto w-full max-w-md border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle>Sign in with Google</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              {message}
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};

export default AuthCallback;
