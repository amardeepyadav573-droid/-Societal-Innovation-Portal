import {
  Bell,
  Menu,
  Moon,
  Sun,
  UserRound
} from "lucide-react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { useNotifications } from "../../context/NotificationContext";
import { useContext } from "react";

import { ThemeContext } from "../../context/ThemeContext";
import { resolveMediaUrl } from "../../utils/media";
import "./Navbar.css";
import sipLogo from "../../assets/sip-logo.png";

export default function Navbar({ onMenu, sidebarOpen }) {
  const { user } = useAuth();
  const { unread } = useNotifications();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="mobile-menu"
          onClick={onMenu}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu size={22} strokeWidth={2.2} />
        </button>

        <Link to="/" className="brand">
          <div className="brand-mark"><img src={sipLogo} alt="Societal Innovation Portal" /></div>

          <div className="brand-text">
            <strong>Societal Innovation</strong>
             <span>Government of Jharkhand</span>
          </div>
        </Link>
      </div>

      <div className="navbar-actions">
        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
        </button>

        {user && (
          <button
            type="button"
            className="notification-button"
            onClick={() => navigate("/notifications")}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="notification-count">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
        )}

        {user ? (
          <button
            type="button"
            className="profile-mini"
            onClick={() =>
              navigate(
                user.role === "UNIVERSITY"
                  ? "/university"
                  : user.role === "INDUSTRY"
                    ? "/industry"
                    : ["GOVERNMENT", "ADMIN"].includes(user.role)
                      ? "/government"
                      : "/citizen"
              )
            }
          >
            <div className="avatar">
              {user.avatar ? <img src={resolveMediaUrl(user.avatar)} alt="" /> : user.name?.charAt(0)?.toUpperCase() || <UserRound size={17} />}
            </div>

            <div>
              <strong>{user.name || "User"}</strong>
              <span>{user.role || "Citizen"}</span>
            </div>
          </button>
        ) : (
          <Link to="/login" className="btn btn-primary btn-small">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
