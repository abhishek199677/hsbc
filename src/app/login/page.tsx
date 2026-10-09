"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter, Space_Mono } from "next/font/google";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* Self-hosted fonts (CSP blocks fonts.googleapis.com stylesheets) */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-space-mono",
});

/**
 * Deterministic PRNG so the server and client generate identical blob
 * positions — Math.random() in a client component would cause hydration
 * mismatches on every render of this page.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BLOB_COUNT = 6;

export default function LoginPage() {
  const router = useRouter();
  const { login, organization } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorSetupRequired, setTwoFactorSetupRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* Static values, generated from a fixed seed (hydration-safe) */
  const blobsData = useMemo(() => {
    const rand = mulberry32(0x992);
    return Array.from({ length: BLOB_COUNT }).map(() => ({
      size: rand() * 200 + 150,
      left: rand() * 80 + 10,
      top: rand() * 80 + 10,
      animationDelay: rand() * -20,
      animationDuration: rand() * 15 + 15,
    }));
  }, []);

  /* Keep track of the blob DOM elements for high-performance updates */
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let frame = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      frame = 0;
      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const speed = (index + 1) * 20;
          /* Margin for parallax so we don't overwrite the CSS transform animation */
          blob.style.marginLeft = `${px * speed}px`;
          blob.style.marginTop = `${py * speed}px`;
        }
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      px = e.clientX / window.innerWidth;
      py = e.clientY / window.innerHeight;
      /* Batch updates into one frame instead of forcing layout per event */
      if (!frame) frame = requestAnimationFrame(apply);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, twoFactorToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.twoFactorRequired) setTwoFactorRequired(true);
        if (data.twoFactorSetupRequired) setTwoFactorSetupRequired(true);
        throw new Error(data.error || "Login failed");
      }

      login(data.token, data.user, data.organization);

      if (data.user.role === "employer" || data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`mercury-wrapper ${inter.variable} ${spaceMono.variable}`}
    >
      <style>{`
        .mercury-wrapper {
          --bg: #050505;
          --mercury: #e0e0e0;
          --mercury-dark: #666666;
          --accent: #ffffff;
          --text-dim: rgba(255, 255, 255, 0.5);
          --filter-goo: url('#gooey');

          background-color: var(--bg);
          color: var(--accent);
          font-family: var(--font-inter), system-ui, sans-serif;
          min-height: 100dvh;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          color-scheme: dark;
        }

        .mercury-wrapper *,
        .mercury-wrapper *::before,
        .mercury-wrapper *::after {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }

        .mercury-wrapper input,
        .mercury-wrapper button {
          font-family: inherit;
        }

        /* Background Liquid Physics Simulation */
        .stage {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
          filter: var(--filter-goo);
          opacity: 0.6;
        }

        .blob {
          position: absolute;
          background: linear-gradient(135deg, var(--mercury), #888);
          border-radius: 50%;
          filter: blur(20px);
          animation: float 20s infinite alternate ease-in-out;
          box-shadow: inset -10px -10px 20px rgba(0, 0, 0, 0.5),
                      10px 10px 30px rgba(255, 255, 255, 0.2);
          transition: margin 0.1s ease-out; /* Smooths the JS mousemove */
        }

        @keyframes float {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(10vw, 20vh) scale(1.2); }
          66%  { transform: translate(-5vw, 10vh) scale(0.8); }
          100% { transform: translate(5vw, -10vh) scale(1.1); }
        }

        /* Interface Container */
        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 40px 40px 48px;
        }

        .header {
          margin-bottom: 60px;
          text-align: left;
        }

        .brand-id {
          font-family: var(--font-space-mono), ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
          display: block;
          text-decoration: none;
          transition: color 0.3s;
        }

        .brand-id:hover,
        .brand-id:focus-visible {
          color: var(--accent);
        }

        .header h1 {
          font-weight: 800;
          font-size: 3rem;
          line-height: 0.9;
          letter-spacing: -2px;
          margin-left: -4px;
          margin-top: 0;
        }

        /* Status messages (errors / notices) */
        .auth-error,
        .auth-notice {
          font-family: var(--font-space-mono), ui-monospace, monospace;
          font-size: 12px;
          line-height: 1.6;
          padding: 14px 16px;
          margin-bottom: 30px;
          border: 1px solid;
        }

        .auth-error {
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.08);
        }

        .auth-notice {
          color: #fcd34d;
          border-color: rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.08);
        }

        .auth-notice strong {
          display: block;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .auth-notice p {
          margin: 0;
          color: var(--text-dim);
        }

        .auth-notice button {
          background: none;
          border: none;
          padding: 0;
          color: var(--accent);
          font: inherit;
          text-decoration: underline;
          cursor: pointer;
        }

        /* Form Elements */
        .form-group {
          position: relative;
          margin-bottom: 30px;
          transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
        }

        .form-group:focus-within {
          transform: translateX(10px);
        }

        .form-group label {
          display: block;
          font-family: var(--font-space-mono), ui-monospace, monospace;
          font-size: 11px;
          color: var(--text-dim);
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .form-group input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--accent);
          padding: 12px 0;
          font-size: 18px;
          outline: none;
          transition: border-color 0.4s;
        }

        .form-group input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .form-group input:-webkit-autofill,
        .form-group input:-webkit-autofill:hover,
        .form-group input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--accent);
          -webkit-box-shadow: 0 0 0 1000px var(--bg) inset;
          caret-color: var(--accent);
        }

        .form-group--code input {
          letter-spacing: 0.5em;
          font-size: 16px;
          padding-right: 0.5em;
        }

        .pw-toggle {
          position: absolute;
          right: 0;
          bottom: 10px;
          background: none;
          border: none;
          padding: 4px;
          color: var(--text-dim);
          cursor: pointer;
          line-height: 0;
          transition: color 0.3s;
        }

        .pw-toggle:hover,
        .pw-toggle:focus-visible {
          color: var(--accent);
        }

        .input-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 2px;
          background: var(--mercury);
          transition: width 0.6s cubic-bezier(0.2, 1, 0.3, 1);
          box-shadow: 0 0 15px var(--mercury);
        }

        .form-group input:focus + .input-glow {
          width: 100%;
        }

        /* The Mercury Button */
        .submit-wrap {
          margin-top: 50px;
          position: relative;
          filter: var(--filter-goo);
        }

        .btn-base {
          background: var(--accent);
          color: #000;
          border: none;
          padding: 20px 40px;
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          width: 100%;
          position: relative;
          z-index: 2;
          transition: letter-spacing 0.3s;
        }

        .btn-base:hover:not(:disabled) {
          letter-spacing: 4px;
        }

        .btn-base:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mercury-drop {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: var(--mercury);
          transform: translate(-50%, -50%);
          z-index: 1;
          border-radius: 50px;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .submit-wrap:hover .mercury-drop {
          transform: translate(-50%, -50%) scale(1.05, 1.2);
          filter: brightness(1.2);
        }

        /* Utility */
        .footer-nav {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          font-family: var(--font-space-mono), ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .footer-nav a {
          color: var(--text-dim);
          text-decoration: none;
          transition: color 0.3s;
        }

        .footer-nav a:hover,
        .footer-nav a:focus-visible {
          color: var(--accent);
        }

        /* SVG Filter Definition Hidden Element */
        .svg-filter-hidden {
          position: absolute;
          width: 0;
          height: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .blob {
            animation: none !important;
          }
          .form-group,
          .form-group input,
          .input-glow,
          .btn-base,
          .mercury-drop {
            transition: none !important;
          }
        }

        @media (max-width: 480px) {
          .auth-container {
            padding: 32px 24px 40px;
          }
          .header h1 {
            font-size: 2.4rem;
          }
          .footer-nav {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>

      <svg className="svg-filter-hidden" aria-hidden="true" focusable="false">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="stage" aria-hidden="true">
        {blobsData.map((data, index) => (
          <div
            key={index}
            ref={(el) => {
              blobRefs.current[index] = el;
            }}
            className="blob"
            style={{
              width: `${data.size}px`,
              height: `${data.size}px`,
              left: `${data.left}%`,
              top: `${data.top}%`,
              animationDelay: `${data.animationDelay}s`,
              animationDuration: `${data.animationDuration}s`,
            }}
          />
        ))}
      </div>

      <main className="auth-container">
        <header className="header">
          <Link href="/" className="brand-id">
            {organization?.name ? `${organization.name} · ` : ""}System Node: 0x992
          </Link>
          <h1>
            NEURAL
            <br />
            ACCESS
          </h1>
        </header>

        <form onSubmit={handleSubmit} autoComplete="on" noValidate={false}>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="identity">User Identity</label>
            <input
              id="identity"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <div className="input-glow" />
          </div>

          <div className="form-group">
            <label htmlFor="sequence">Sequence Key</label>
            <input
              id="sequence"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="input-glow" />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {twoFactorRequired && (
            <div className="form-group form-group--code">
              <label htmlFor="otp">Authentication Code</label>
              <input
                id="otp"
                name="one-time-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={twoFactorToken}
                onChange={(e) =>
                  setTwoFactorToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                required
              />
              <div className="input-glow" />
            </div>
          )}

          {twoFactorSetupRequired && (
            <div className="auth-notice" role="status">
              <strong>2FA Setup Required</strong>
              <p>
                Two-factor authentication is required for admin accounts.{" "}
                <button type="button" onClick={() => router.push("/settings")}>
                  Set up 2FA now
                </button>
              </p>
            </div>
          )}

          <div className="submit-wrap">
            <div className="mercury-drop" />
            <button type="submit" className="btn-base" disabled={loading}>
              {loading ? "Authenticating…" : "Initialize Stream"}
            </button>
          </div>
        </form>

        <footer className="footer-nav">
          <Link href="/forgot-password">ENCRYPTED RECOVERY</Link>
          <Link href="/signup">NEW ARCHIVE</Link>
        </footer>
      </main>
    </div>
  );
}
