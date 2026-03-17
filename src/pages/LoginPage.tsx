import { useState } from "react";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      // TODO: replace with -> await loginEmail(email, password);
      console.log("Login:", email, password);
    } catch (err) {
      setError("Invalid email or password. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      // TODO: replace with -> await googleLogin();
      console.log("Google login clicked");
    } catch (err) {
      setError("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0D0D1A",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
    }}>

      {/* Background glow */}
      <div style={{
        position: "fixed", top: -100, left: "50%", transform: "translateX(-50%)",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #6C63FF, #FF6584)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30,
            boxShadow: "0 8px 32px rgba(108,99,255,0.4)",
          }}>🔄</div>
          <h1 style={{
            fontSize: 28, fontWeight: 900, color: "#E8E8FF",
            letterSpacing: -0.5, marginBottom: 6,
          }}>CampusLoop</h1>
          <p style={{ fontSize: 14, color: "#6B6B99" }}>
            Your entire school life, in one app
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#13132A",
          border: "1px solid #1E1E3F",
          borderRadius: 24,
          padding: "32px 28px",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#E8E8FF", marginBottom: 6 }}>
            Welcome back 👋
          </h2>
          <p style={{ fontSize: 13, color: "#6B6B99", marginBottom: 28 }}>
            Log in to your CampusLoop account
          </p>

          {/* Error message */}
          {error && (
            <div style={{
              background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "#FCA5A5",
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontSize: 12, fontWeight: 700, color: "#6B6B99",
                display: "block", marginBottom: 6,
              }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                placeholder="you@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%", background: "#0D0D1A",
                  border: "1px solid #1E1E3F", borderRadius: 12,
                  padding: "12px 16px", color: "#E8E8FF", fontSize: 14,
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6C63FF")}
                onBlur={(e) => (e.target.style.borderColor = "#1E1E3F")}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                fontSize: 12, fontWeight: 700, color: "#6B6B99",
                display: "block", marginBottom: 6,
              }}>
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%", background: "#0D0D1A",
                    border: "1px solid #1E1E3F", borderRadius: 12,
                    padding: "12px 48px 12px 16px", color: "#E8E8FF", fontSize: 14,
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#6C63FF")}
                  onBlur={(e) => (e.target.style.borderColor = "#1E1E3F")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", fontSize: 16, color: "#6B6B99",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px",
                background: loading
                  ? "#2D2D4F"
                  : "linear-gradient(135deg, #6C63FF, #FF6584)",
                border: "none", borderRadius: 12,
                color: loading ? "#6B6B99" : "#fff",
                fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
                marginBottom: 12,
              }}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>

          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#1E1E3F" }} />
            <span style={{ fontSize: 12, color: "#6B6B99" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "#1E1E3F" }} />
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: "100%", padding: "13px",
              background: "#0D0D1A", border: "1px solid #1E1E3F",
              borderRadius: 12, color: "#E8E8FF",
              fontSize: 14, fontWeight: 600,
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 10,
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6C63FF")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E1E3F")}
          >
            <span style={{ fontSize: 18 }}>🔵</span>
            Continue with Google
          </button>

        </div>

        {/* Sign up link */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#6B6B99" }}>
          Don't have an account?{" "}
          <Link
            to="/signup"
            style={{ color: "#6C63FF", fontWeight: 700, textDecoration: "none" }}
          >
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}