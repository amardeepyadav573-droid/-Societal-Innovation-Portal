import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FilePlus2,
  FolderKanban,
  Home,
  IdCard,
  Lightbulb,
  LogOut,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { createPortal } from "react-dom";

import useAuth from "../../hooks/useAuth";
import { resolveMediaUrl } from "../../utils/media";

import "./Sidebar.css";
import sipLogo from "../../assets/sip-logo.png";

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = String(user?.role || "").toUpperCase();

  const citizenLinks = [
    { to: "/citizen", label: "Dashboard", icon: Home },
    { to: "/citizen/profile", label: "Citizen Profile", icon: IdCard },
    { to: "/citizen/submit", label: "Submit Challenge", icon: FilePlus2 },
    { to: "/citizen/problems", label: "My Challenges", icon: ClipboardList },
    { to: "/projects", label: "Projects", icon: FolderKanban },
  ];

  const universityLinks = [
    { to: "/university", label: "Dashboard", icon: Home },
    { to: "/university/profile", label: "University Profile", icon: IdCard },
    { to: "/university/problems", label: "Assigned Challenges", icon: ClipboardList },
    { to: "/university/teams", label: "Research Teams", icon: Users },
    { to: "/university/proposals", label: "Proposals", icon: Lightbulb },
    {
      to: "/university/collaborations",
      label: "Industry Collaborations",
      icon: Users,
    },
    { to: "/projects", label: "Projects", icon: FolderKanban },
  ];

  const industryLinks = [
    { to: "/industry", label: "Dashboard", icon: Home },
    {
      to: "/industry/profile",
      label: "Industry / Startup Profile",
      icon: IdCard,
    },
    {
      to: "/industry/opportunities",
      label: "Opportunities",
      icon: BriefcaseBusiness,
    },
    {
      to: "/industry/collaborations",
      label: "Collaborations",
      icon: Users,
    },
    { to: "/projects", label: "Projects", icon: FolderKanban },
  ];

  const governmentLinks = [
    { to: "/government", label: "Dashboard", icon: Home },
    {
      to: "/government/challenges",
      label: "Challenges",
      icon: ClipboardList,
    },
    {
      to: "/government/universities",
      label: "University Validation",
      icon: Building2,
    },
    {
      to: "/government/analytics",
      label: "Analytics",
      icon: BarChart3,
    },
    { to: "/projects", label: "Projects", icon: FolderKanban },
  ];

  const roleLinks = {
    CITIZEN: citizenLinks,
    UNIVERSITY: universityLinks,
    FACULTY: universityLinks,
    STUDENT: universityLinks,
    INDUSTRY: industryLinks,
    MENTOR: industryLinks,
    GOVERNMENT: governmentLinks,
    ADMIN: governmentLinks,
  };

  const links = roleLinks[role] || citizenLinks;

  const handleNavigation = () => {
    onClose?.();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onClose?.();
      navigate("/login", { replace: true });
    }
  };

  const sidebarContent = (
    <div
      className={`sidebar-layer ${
        open ? "sidebar-layer-open" : ""
      }`}
      aria-hidden={!open}
    >
      {/* Outside click area */}
      <button
        type="button"
        className="sidebar-overlay"
        onClick={onClose}
        aria-label="Close sidebar"
        tabIndex={open ? 0 : -1}
      />

      {/* Actual sidebar */}
      <aside
        className={`sidebar ${
          open ? "sidebar-open" : ""
        }`}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">
              <img
                src={sipLogo}
                alt="Societal Innovation Portal"
              />
            </div>

            <div className="sidebar-brand-text">
              <strong>
                Innovation Portal
              </strong>

              <span>
                Societal Innovation
              </span>
            </div>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={onClose}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.avatar ? (
              <img
                src={resolveMediaUrl(user.avatar)}
                alt={user?.name || "User"}
              />
            ) : (
              String(user?.name || "U")
                .trim()
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div className="sidebar-user-info">
            <strong>
              {user?.name || "User"}
            </strong>

            <span>
              {formatRole(role)}
            </span>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label">
            WORKSPACE
          </span>

          <nav className="sidebar-nav">
            {links.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavigation}
                  className={({ isActive }) =>
                    `sidebar-link ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <Icon size={19} />

                  <span>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <NavLink
            to="/about"
            className="sidebar-link"
            onClick={handleNavigation}
          >
            <Building2 size={19} />
            <span>About Portal</span>
          </NavLink>

          <NavLink
            to="/support"
            className="sidebar-link"
            onClick={handleNavigation}
          >
            <MessageSquare size={19} />
            <span>Support</span>
          </NavLink>

          <NavLink
            to="/settings"
            className="sidebar-link"
            onClick={handleNavigation}
          >
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>

          <button
            type="button"
            className="sidebar-link logout-link"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );

  return createPortal(
    sidebarContent,
    document.body
  );
}

function formatRole(role) {
  const labels = {
    CITIZEN: "Citizen",
    UNIVERSITY: "University",
    FACULTY: "Faculty",
    STUDENT: "Student",
    INDUSTRY: "Industry / Startup",
    MENTOR: "Industry Mentor",
    GOVERNMENT: "Government",
    ADMIN: "Administrator",
  };

  return labels[role] || "Member";
}