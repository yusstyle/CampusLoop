
import { NavLink, useLocation } from "react-router-dom";

type NavItem = {
  path: string;
  icon: string;
  label: string;
};

const navItems: NavItem[] = [
  { path: "/feed",      icon: "🎉", label: "Feed"     },
  { path: "/chat",      icon: "💬", label: "Chat"     },
  { path: "/channels",  icon: "📢", label: "Channels" },
  { path: "/materials", icon: "📚", label: "Study"    },
  { path: "/profile",   icon: "👤", label: "Profile"  },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      height: 64,
      background: "rgba(13, 13, 26, 0.97)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid #1E1E3F",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      padding: "0 8px",
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            style={{ textDecoration: "none", flex: 1 }}
          >
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 3,
              padding: "6px 0",
              transition: "all 0.2s",
            }}>
              <div style={{
                width: isActive ? 42 : 36,
                height: isActive ? 42 : 36,
                borderRadius: isActive ? 14 : 12,
                background: isActive
                  ? "linear-gradient(135deg, #6C63FF, #FF6584)"
                  : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isActive ? 20 : 18,
                transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: isActive ? "0 4px 15px rgba(108, 99, 255, 0.4)" : "none",
              }}>
                {item.icon}
              </div>
              <span style={{
                fontSize: 9, fontWeight: isActive ? 700 : 500,
                color: isActive ? "#6C63FF" : "#6B6B99",
                transition: "color 0.2s",
              }}>
                {item.label}
              </span>
            </div>
          </NavLink>
        );
      })}
    </nav>
  );
}

