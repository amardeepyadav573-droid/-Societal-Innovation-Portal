import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RoleRoute({
  allowedRoles = [],
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="route-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const userRole = String(
    user.role || ""
  ).toUpperCase();

  const roles = allowedRoles.map(
    (role) =>
      String(role).toUpperCase()
  );

  if (roles.includes(userRole)) {
    return <Outlet />;
  }

  const dashboardRoutes = {
    CITIZEN: "/citizen",

    UNIVERSITY: "/university",

    FACULTY: "/university",

    STUDENT: "/university",

    INDUSTRY: "/industry",

    MENTOR: "/industry",

    GOVERNMENT: "/government",

    ADMIN: "/government",
  };

  return (
    <Navigate
      to={
        dashboardRoutes[userRole] ||
        "/login"
      }
      replace
    />
  );
}