import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let isMounted = true;

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
          if (isMounted) {
            navigate("/dashboard", { replace: true });
          }
          return;
        }

        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (isMounted) {
            navigate("/dashboard", { replace: true });
          }
          return;
        }

        throw new Error("Missing auth response from provider");
      } catch (authError: any) {
        toast.error(authError?.message || "Failed to finish sign-in");
        navigate("/sign-in", { replace: true });
      }
    };

    void exchangeCode();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  return null;
};

export default AuthCallback;
