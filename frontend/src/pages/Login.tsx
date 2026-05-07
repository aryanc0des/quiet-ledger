import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useApp } from "@/store/AppContext";

export function LoginPage() {
  const { login, state } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!state.authLoading && state.user) {
      navigate("/", { replace: true });
    }
  }, [state.authLoading, state.user, navigate]);

  const handleSuccess = async (response: { credential?: string }) => {
    if (!response.credential) return;
    setError(null);
    setLoading(true);
    try {
      await login(response.credential);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment dark:bg-[#1C1C1A] px-6">
      {/* Background grain texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative flex flex-col items-center gap-10 animate-fade-in">
        {/* Wordmark */}
        <div className="text-center">
          <h1 className="font-serif text-5xl text-ink dark:text-zinc-100 leading-tight">
            Quiet<span className="italic text-sage-700 dark:text-sage-300">Ledger</span>
          </h1>
          <p className="mt-3 font-sans text-sm text-ink-muted dark:text-zinc-500 tracking-wide">
            a private space for your thoughts
          </p>
        </div>

        {/* Divider line */}
        <div className="w-16 h-px bg-border dark:bg-border-dark" />

        {/* Qualities */}
        <div className="flex flex-col items-center gap-2 text-center">
          {["encrypted on your device", "never read by the server", "only yours"].map(
            (line, i) => (
              <p
                key={i}
                className="font-sans text-xs text-ink-muted dark:text-zinc-500 tracking-wide"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {line}
              </p>
            )
          )}
        </div>

        {/* Google sign-in */}
        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <p className="text-sm text-ink-muted dark:text-zinc-500 font-sans animate-pulse">
              signing in…
            </p>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError("Google sign in failed")}
              shape="pill"
              theme="outline"
              size="large"
              text="signin_with"
            />
          )}
          {error && (
            <p className="text-xs text-rose-pastel animate-fade-in">{error}</p>
          )}
        </div>

        <p className="font-sans text-[10px] text-ink-muted/50 dark:text-zinc-600 text-center max-w-xs">
          Your journal content is encrypted in your browser before it is sent anywhere.
          No one else can read it.
        </p>
      </div>
    </div>
  );
}
