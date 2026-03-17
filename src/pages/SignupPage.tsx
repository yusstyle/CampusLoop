import { useState } from "react";
import { Link } from "react-router-dom";

export default function SignupPage() {
  const [name, setName] = useState<string>("");
  const [school, setSchool] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!name || !school || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      // TODO: replace with -> await signUp(email, password, name, school);
      console.log("Signup:", name, school, email);
    } catch (err) {
      setError("Signup failed. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0D0D1A",
    border: "1px solid #1E1E3F", borderRadius: 12,
    padding: "12px 16px", color: "#E8E8FF", fontSize: 14,
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: "#6B6B99",
    display: "block", marginBottom: 6,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0D1A",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px",
    }}>

      <div style={{
        position: "fixed", bottom: -100, left: "50%", transform: "translateX(-50%)",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,101,132,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, margin: "0 auto 12px",
            background: "linear-gradient(135deg, #6C63FF, #FF6584)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, boxShadow: "0 8px 32px rgba(108,99,255,0.3)",
          }}>🔄</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#E8E8FF", letterSpacing: -0.5 }}>
            CampusLoop
          </h1>
        </div>

        <div style={{
          background: "#13132A", border: "1px solid #1E1E3F",
          borderRadius: 24, padding: "32px 28px",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#E8E8FF", marginBottom: 6 }}>
            Create your account 🚀
          </h2>
          <p style={{ fontSize: 13, color: "#6B6B99", marginBottom: 28 }}>
            Join your campus community today
          </p>

          {error && (
            <div style={{
              background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "#FCA5A5",
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSignup}>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>FULL NAME</label>
              <input type="text" placeholder="Your full name"
                value={name} onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6C63FF")}
                onBlur={(e) => (e.target.style.borderColor = "#1E1E3F")}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>SCHOOL NAME</label>
              <input type="text" placeholder="e.g. University of Lagos"
                value={school} onChange={(e) => setSchool(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6C63FF")}
                onBlur={(e) => (e.target.style.borderColor = "#1E1E3F")}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <input type="email" placeholder="you@school.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6C63FF")}
                onBlur={(e) => (e.target.style.borderColor = "#1E1E3F")}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, padding: "12px 48px 12px 16px" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6C63FF")}
                  onBlur={(e) => (e.target.style.borderColor = "#1E1E3F")}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", fontSize: 16, color: "#6B6B99",
                  }}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>CONFIRM PASSWORD</label>
              <input type="password" placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6C63FF")}
                onBlur={(e) => (e.target.style.borderColor = "#1E1E3F")}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "14px",
              background: loading
                ? "#2D2D4F"
                : "linear-gradient(135deg, #6C63FF, #FF6584)",
              border: "none", borderRadius: 12,
              color: loading ? "#6B6B99" : "#fff",
              fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: 12,
            }}>
              {loading ? "Creating account..." : "Create Account"}
            </button>

          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#6B6B99" }}>
          Already have an account?{" "}
          <Link to="/login"
            style={{ color: "#6C63FF", fontWeight: 700, textDecoration: "none" }}>
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
}