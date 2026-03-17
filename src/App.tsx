import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import FeedPage from "./pages/FeedPage";
import ChatPage from "./pages/ChatPage";
import ChannelsPage from "./pages/ChannelsPage";
import MaterialsPage from "./pages/MaterialsPage";
import ProfilePage from "./pages/ProfilePage";

// Components
import Navbar from "./components/Navbar";

// ── Temporary: remove this once Firebase is connected ────────
// We'll replace this with real Firebase auth later
const mockUser = null; // change to {} to simulate being logged in

export default function App() {
  const [user, setUser] = useState<object | null | undefined>(undefined);

  useEffect(() => {
    // TODO: Replace this block with Firebase onAuthStateChanged
    // import { onAuthStateChanged } from "firebase/auth";
    // import { auth } from "./firebase/config";
    // const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    //   setUser(firebaseUser || null);
    // });
    // return () => unsubscribe();

    // For now — simulate auth check is done
    setTimeout(() => setUser(mockUser), 500);
  }, []);

  // Still checking auth — show loading screen
  if (user === undefined) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0D0D1A",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "linear-gradient(135deg, #6C63FF, #FF6584)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>🔄</div>
        <div style={{
          width: 36, height: 36, border: "3px solid #1E1E3F",
          borderTopColor: "#6C63FF", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public routes ── */}
        <Route
          path="/login"
          element={user ? <Navigate to="/feed" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/feed" replace /> : <SignupPage />}
        />

        {/* ── Protected routes ── */}
        <Route path="/feed" element={
          user ? <PageLayout><FeedPage /></PageLayout> : <Navigate to="/login" replace />
        } />
        <Route path="/chat" element={
          user ? <PageLayout><ChatPage /></PageLayout> : <Navigate to="/login" replace />
        } />
        <Route path="/channels" element={
          user ? <PageLayout><ChannelsPage /></PageLayout> : <Navigate to="/login" replace />
        } />
        <Route path="/materials" element={
          user ? <PageLayout><MaterialsPage /></PageLayout> : <Navigate to="/login" replace />
        } />
        <Route path="/profile" element={
          user ? <PageLayout><ProfilePage /></PageLayout> : <Navigate to="/login" replace />
        } />

        {/* ── Default ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

// Wraps every protected page with the bottom Navbar
function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0D0D1A", paddingBottom: 70 }}>
      {children}
      <Navbar />
    </div>
  );
}
