import { Routes, Route } from "react-router-dom";

// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyOtp from "../pages/auth/VerifyOtp";

// Public
import Home from "../pages/public/Home";
import About from "../pages/public/About";
import ExploreProblems from "../pages/public/ExploreProblems";
import ProblemDetails from "../pages/public/ProblemDetails";

// Citizen
import CitizenDashboard from "../pages/citizen/CitizenDashboard";
import CitizenProfile from "../pages/citizen/CitizenProfile";
import SubmitProblem from "../pages/citizen/SubmitProblem";
import MyProblems from "../pages/citizen/MyProblems";

// University
import UniversityDashboard from "../pages/university/UniversityDashboard";
import UniversityProfile from "../pages/university/UniversityProfile";
import AssignedProblems from "../pages/university/AssignedProblems";
import UniversityCollaborations from "../pages/university/Collaborations";
import UniversityDetails from "../pages/university/UniversityDetails";
import Teams from "../pages/university/Teams";
import Proposals from "../pages/university/Proposals";

// Industry
import IndustryDashboard from "../pages/industry/IndustryDashboard";
import IndustryProfile from "../pages/industry/IndustryProfile";
import Opportunities from "../pages/industry/Opportunities";
import Collaborations from "../pages/industry/Collaborations";
import IndustryDetails from "../pages/industry/IndustryDetails";

// Government
import GovernmentDashboard from "../pages/government/GovernmentDashboard";
import Challenges from "../pages/government/Challenges";
import Analytics from "../pages/government/Analytics";
import UniversityValidation from "../pages/government/UniversityValidation";

// Projects
import Projects from "../pages/projects/Projects";
import ProjectDetails from "../pages/projects/ProjectDetails";

// Common protected pages
import Notifications from "../pages/Notifications";
import Settings from "../pages/Settings";
import Support from "../pages/Support";
import NotFound from "../pages/NotFound";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* =====================================================
          PUBLIC ROUTES
      ===================================================== */}

      <Route path="/" element={<Home />} />

      <Route path="/about" element={<About />} />

      <Route
        path="/explore"
        element={<ExploreProblems />}
      />

      <Route
        path="/problems/:id"
        element={<ProblemDetails />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/verify-otp"
        element={<VerifyOtp />}
      />

      {/* =====================================================
          ALL PROTECTED ROUTES
      ===================================================== */}

      <Route element={<ProtectedRoute />}>

        {/* ===================================================
            CITIZEN
        =================================================== */}

        <Route
          element={
            <RoleRoute allowedRoles={["CITIZEN"]} />
          }
        >
          <Route
            path="/citizen"
            element={<CitizenDashboard />}
          />

          <Route
            path="/citizen/profile"
            element={<CitizenProfile />}
          />

          <Route
            path="/citizen/submit"
            element={<SubmitProblem />}
          />

          <Route
            path="/citizen/problems"
            element={<MyProblems />}
          />
        </Route>

        {/* ===================================================
            UNIVERSITY
        =================================================== */}

        <Route
          element={
            <RoleRoute
              allowedRoles={[
                "UNIVERSITY",
                "FACULTY",
                "STUDENT",
              ]}
            />
          }
        >
          <Route
            path="/university"
            element={<UniversityDashboard />}
          />

          <Route
            path="/university/profile"
            element={<UniversityProfile />}
          />

          <Route
            path="/university/problems"
            element={<AssignedProblems />}
          />

          <Route
            path="/university/teams"
            element={<Teams />}
          />

          <Route
            path="/university/proposals"
            element={<Proposals />}
          />

          <Route
            path="/university/collaborations"
            element={<UniversityCollaborations />}
          />

          <Route
            path="/industry/partners/:id"
            element={<IndustryDetails />}
          />
        </Route>

        {/* ===================================================
            INDUSTRY
        =================================================== */}

        <Route
          element={
            <RoleRoute
              allowedRoles={[
                "INDUSTRY",
                "MENTOR",
              ]}
            />
          }
        >
          <Route
            path="/industry"
            element={<IndustryDashboard />}
          />

          <Route
            path="/industry/profile"
            element={<IndustryProfile />}
          />

          <Route
            path="/industry/opportunities"
            element={<Opportunities />}
          />

          <Route
            path="/industry/collaborations"
            element={<Collaborations />}
          />

          <Route
            path="/university/partners/:id"
            element={<UniversityDetails />}
          />
        </Route>

        {/* ===================================================
            GOVERNMENT
        =================================================== */}

        <Route
          element={
            <RoleRoute
              allowedRoles={[
                "GOVERNMENT",
                "ADMIN",
              ]}
            />
          }
        >
          <Route
            path="/government"
            element={<GovernmentDashboard />}
          />

          <Route
            path="/government/challenges"
            element={<Challenges />}
          />

          <Route
            path="/government/analytics"
            element={<Analytics />}
          />

          <Route
            path="/government/universities"
            element={<UniversityValidation />}
          />

          <Route
            path="/government/universities/:id"
            element={<UniversityDetails />}
          />
        </Route>

        {/* ===================================================
            PROJECTS
        =================================================== */}

        <Route
          path="/projects"
          element={<Projects />}
        />

        <Route
          path="/projects/:id"
          element={<ProjectDetails />}
        />

        {/* ===================================================
            COMMON PROTECTED PAGES
        =================================================== */}

        <Route
          path="/notifications"
          element={<Notifications />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="/support"
          element={<Support />}
        />
      </Route>

      {/* =====================================================
          UNKNOWN ROUTE
      ===================================================== */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}