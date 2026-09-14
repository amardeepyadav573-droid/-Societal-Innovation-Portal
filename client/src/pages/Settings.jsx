import {
  Building2,
  ChevronRight,
  IdCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import useAuth from "../hooks/useAuth";
import "./Settings.css";

const dashboardFor = (role) =>
  ({
    CITIZEN: "/citizen",
    UNIVERSITY: "/university",
    FACULTY: "/university",
    STUDENT: "/university",
    INDUSTRY: "/industry",
    MENTOR: "/industry",
    GOVERNMENT: "/government",
    ADMIN: "/government",
  })[role] || "/";
export default function Settings() {
  const { user } = useAuth();
  const role = String(user?.role || "CITIZEN").toUpperCase();
  const profile =
    role === "CITIZEN"
      ? "/citizen/profile"
      : ["UNIVERSITY", "FACULTY", "STUDENT"].includes(role)
        ? "/university/profile"
        : ["INDUSTRY", "MENTOR"].includes(role)
          ? "/industry/profile"
          : dashboardFor(role);
  return (
    <DashboardLayout>
      <div className="page-container settings-page">
        <div className="page-header">
          <div>
            <span className="section-kicker">ACCOUNT SETTINGS</span>
            <h1>Account & profile</h1>
            <p>
              Manage your verified identity and organization information from
              one place.
            </p>
          </div>
        </div>
        <section className="settings-account">
          <div className="settings-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <UserRound size={28} />
            )}
          </div>
          <div>
            <h2>{user?.name || "Portal member"}</h2>
            <p>{user?.email}</p>
            <span className="role-chip">
              <ShieldCheck size={14} /> {role}
            </span>
          </div>
        </section>
        <div className="settings-grid">
          <Link to={profile} className="settings-action">
            <div className="settings-action-icon">
              <IdCard size={21} />
            </div>
            <div>
              <strong>Open my profile</strong>
              <span>Edit personal, academic or organization details.</span>
            </div>
            <ChevronRight size={18} />
          </Link>
          <Link to={dashboardFor(role)} className="settings-action">
            <div className="settings-action-icon">
              <Building2 size={21} />
            </div>
            <div>
              <strong>Back to dashboard</strong>
              <span>Return to your role-specific workspace.</span>
            </div>
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
