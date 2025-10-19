import PublicLayout from "@/components/layout/PublicLayout";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail } from "lucide-react";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.8v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.6 2.7-4 2.7-6.9 0-.6-.1-1.2-.2-1.8H12z"
    />
    <path
      fill="#34A853"
      d="M5.7 13.8l-.9.7-2.5 2c1.8 3.5 5.5 5.8 9.7 5.8 2.9 0 5.3-1 7-2.7l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.3-3.9z"
    />
    <path
      fill="#4A90E2"
      d="M3.2 7.5 5.7 9.4c.7-2.2 2.8-3.9 5.3-3.9 1.4 0 2.6.5 3.5 1.3l2.6-2.6C15.3 2.4 13 .9 11 0 6.8 0 3.1 2.3 1.3 5.8z"
    />
    <path fill="#FBBC05" d="M21.6 2.6 19 4.4C18.2 3.6 17 3 15.6 3c-2.5 0-4.6 1.7-5.3 3.9l-2.5-1.9-2.5-1.9C3.1 2.3 6.8 0 11 0c2 0 4.3.8 6.1 2.6" />
  </svg>
);

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      toast.success("Account created! Please sign in.");
      navigate("/sign-in");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const signUpWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'consent'
          }
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Missing redirect URL");
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to continue with Google");
      setGoogleLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="relative min-h-screen overflow-hidden bg-white">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-[#431139] via-[#fd8628] to-transparent"></div>
        <div className="pointer-events-none absolute -left-[220px] bottom-[-160px] h-[420px] w-[420px] rounded-full bg-[#fdc58f]"></div>
        <div className="pointer-events-none absolute left-12 bottom-24 hidden h-36 w-36 rotate-[18deg] rounded-[48px] border-[6px] border-[#5a134e] lg:block"></div>
        <div className="pointer-events-none absolute -right-24 top-32 hidden h-40 w-40 rotate-[12deg] rounded-[36px] bg-[#fd8628] lg:block"></div>
        <div className="pointer-events-none absolute right-32 bottom-10 hidden h-56 w-56 -translate-y-4 rounded-full bg-[#431139]/85 lg:block"></div>
        <div className="container relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] flex-col justify-center px-6 py-20 lg:px-10">
          <div className="grid gap-14 place-items-center lg:grid-cols-2 lg:items-center">
            <div className="mx-auto max-w-sm space-y-8 text-center lg:mx-0 lg:text-left">
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Create your account</h1>
                <p className="text-base text-muted-foreground">Launch your first AI-powered analysis in minutes.</p>
              </div>

              <div className="space-y-4 max-w-sm mx-auto lg:mx-0">
                <Button
                  type="button"
                  variant="outline"
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-[#431139] bg-[#431139] px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#431139]/90"
                  onClick={signUpWithGoogle}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    "Redirecting..."
                  ) : (
                    <>
                      <GoogleIcon />
                      Continue with Google
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-[#fd8628] px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#fd8628]/90"
                  onClick={() => setShowEmailForm(true)}
                >
                  <Mail className="h-5 w-5" />
                  Continue with email
                </Button>
              </div>

              {showEmailForm && (
                <div className="space-y-6 rounded-3xl border border-[#f5b77a]/50 bg-white/90 p-6 shadow-sm max-w-sm mx-auto lg:mx-0">
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Loading..." : "Create account"}
                    </Button>
                  </form>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Already a member?{" "}
                <Link to="/sign-in" className="font-semibold text-[#431139] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="relative mx-auto flex w-full max-w-lg items-center justify-center">
              <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-[#fd8628]/20 blur-3xl"></div>
              <div className="absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-[#431139]/10 blur-3xl"></div>
              <div className="relative overflow-hidden rounded-[36px] border border-[#f5d0b5] bg-gradient-to-br from-white via-[#fff6ef] to-white p-6 shadow-xl">
                <div className="flex items-center justify-between rounded-2xl bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fd8628]/15 text-[#fd8628] font-semibold">
                      S
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Onboarding Session</p>
                      <p className="text-xs text-muted-foreground">Kickstart your workspace</p>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#431139] text-xs font-semibold text-white">
                      A
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#fd8628]/80 text-xs font-semibold text-white">
                      B
                    </span>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[28px] border border-white/60 bg-white/70 shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80"
                    alt="Team collaboration"
                    className="h-64 w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
