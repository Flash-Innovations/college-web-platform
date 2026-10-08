import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "../components/layout/DashboardLayout";

// Helper for dynamic named imports with React.lazy
const lazyNamed = (importFn, name) =>
  lazy(() => importFn().then((module) => ({ default: module[name] })));

// Eagerly loaded public entry pages
import { LoginPage } from "../pages/auth/LoginPage";
import { LandingPage } from "../pages/LandingPage";
import { NotFoundPage } from "../pages/NotFoundPage";

// Lazy-loaded Legal Pages
const PrivacyPolicyPage = lazyNamed(() => import("../pages/legal/PrivacyPolicyPage"), "PrivacyPolicyPage");
const TermsOfServicePage = lazyNamed(() => import("../pages/legal/TermsOfServicePage"), "TermsOfServicePage");
const DataSecurityPage = lazyNamed(() => import("../pages/legal/DataSecurityPage"), "DataSecurityPage");

// Lazy-loaded University / Institution Admin Pages
const InstitutionDashboard = lazyNamed(() => import("../pages/institution/InstitutionDashboard"), "InstitutionDashboard");
const DepartmentsPage = lazyNamed(() => import("../pages/institution/DepartmentsPage"), "DepartmentsPage");
const UniversityProfilePage = lazyNamed(() => import("../pages/institution/UniversityProfilePage"), "UniversityProfilePage");

// Lazy-loaded Placement Cell / TPO Pages
const PlacementDashboard = lazyNamed(() => import("../pages/placement/PlacementDashboard"), "PlacementDashboard");
const StudentManagementPage = lazyNamed(() => import("../pages/placement/StudentManagementPage"), "StudentManagementPage");
const JobDescriptionsPage = lazyNamed(() => import("../pages/placement/JobDescriptionsPage"), "JobDescriptionsPage");
const PlacementAnalyticsPage = lazyNamed(() => import("../pages/placement/PlacementAnalyticsPage"), "PlacementAnalyticsPage");
const PlacementReportsPage = lazyNamed(() => import("../pages/placement/PlacementReportsPage"), "PlacementReportsPage");

// Lazy-loaded Department / Assessment Pages
const AdminDashboard = lazyNamed(() => import("../pages/admin/AdminDashboard"), "AdminDashboard");
const BranchesPage = lazyNamed(() => import("../pages/admin/BranchesPage"), "BranchesPage");
const AdminUserManagementPage = lazyNamed(() => import("../pages/admin/AdminUserManagementPage"), "AdminUserManagementPage");
const AdminSettingsPage = lazyNamed(() => import("../pages/admin/AdminSettingsPage"), "AdminSettingsPage");
const CollegeProfilePage = lazyNamed(() => import("../pages/admin/CollegeProfilePage"), "CollegeProfilePage");
const DepartmentProfilePage = lazyNamed(() => import("../pages/admin/DepartmentProfilePage"), "DepartmentProfilePage");
const QuestionListPage = lazyNamed(() => import("../pages/admin/QuestionListPage"), "QuestionListPage");
const QuestionDetailsPage = lazyNamed(() => import("../pages/admin/QuestionDetailsPage"), "QuestionDetailsPage");
const AssessmentListPage = lazyNamed(() => import("../pages/admin/AssessmentListPage"), "AssessmentListPage");
const AssessmentBuilderPage = lazyNamed(() => import("../pages/admin/AssessmentBuilderPage"), "AssessmentBuilderPage");
const AssessmentResultsPage = lazyNamed(() => import("../pages/admin/AssessmentResultsPage"), "AssessmentResultsPage");

function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />
      <span className="text-xs font-mono font-semibold text-slate-500">Loading workspace module...</span>
    </div>
  );
}

/**
 * Root Router Component for Institutional, TPO, Academic Department, and Branch Coordinators
 */
export function AppRoutes() {
  const { role, isAuthenticated } = useAuth();

  // Root redirect helper based on authenticated role
  const getHomeRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (role === "university_admin") return <Navigate to="/institution/dashboard" replace />;
    if (role === "placement") return <Navigate to="/placement/dashboard" replace />;
    if (role === "admin" || role === "department_admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "branch_admin") return <Navigate to="/placement/students" replace />;
    return <Navigate to="/login" replace />;
  };

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Gateway & Login */}
        <Route path="/" element={getHomeRedirect()} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboard" element={<LoginPage initialRegisterMode={true} />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/deck" element={<LandingPage />} />

        {/* Legal & Compliance */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/security" element={<DataSecurityPage />} />

        {/* ========================================================================= */}
        {/* UNIVERSITY / MASTER COLLEGE ADMIN WORKSPACE                               */}
        {/* ========================================================================= */}
        <Route element={<ProtectedRoute allowedRoles={["university_admin", "admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
            <Route path="/institution/departments" element={<DepartmentsPage />} />
            <Route path="/institution/hierarchy" element={<DepartmentsPage />} />
            <Route path="/institution/profile" element={<UniversityProfilePage />} />
            <Route path="/institution/assessments" element={<AssessmentListPage />} />
            <Route path="/institution/assessments/:assessmentId" element={<AssessmentBuilderPage />} />
            <Route path="/institution/assessments/:assessmentId/results" element={<AssessmentResultsPage />} />
            <Route path="/institution/questions" element={<QuestionListPage />} />
            <Route path="/institution/questions/:questionId" element={<QuestionDetailsPage />} />
            <Route path="/university_admin/dashboard" element={<InstitutionDashboard />} />
          </Route>
        </Route>

        {/* ========================================================================= */}
        {/* TRAINING & PLACEMENT CELL (TPO) WORKSPACE                                 */}
        {/* ========================================================================= */}
        <Route element={<ProtectedRoute allowedRoles={["placement", "university_admin", "branch_admin", "department_admin", "admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/placement/dashboard" element={<PlacementDashboard />} />
            <Route path="/placement/branches" element={<BranchesPage />} />
            <Route path="/placement/students" element={<StudentManagementPage />} />
            <Route path="/placement/jobs" element={<JobDescriptionsPage />} />
            <Route path="/placement/job-descriptions" element={<JobDescriptionsPage />} />
            <Route path="/placement/analytics" element={<PlacementAnalyticsPage />} />
            <Route path="/placement/reports" element={<PlacementReportsPage />} />
            <Route path="/placement/profile" element={<DepartmentProfilePage />} />
            <Route path="/placement/college-profile" element={<DepartmentProfilePage />} />
          </Route>
        </Route>

        {/* ========================================================================= */}
        {/* ACADEMIC DEPARTMENT & BRANCH WORKSPACE                                    */}
        {/* ========================================================================= */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "department_admin", "branch_admin", "placement", "university_admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/branches" element={<BranchesPage />} />
            <Route path="/admin/departments" element={<BranchesPage />} />
            <Route path="/admin/students" element={<StudentManagementPage />} />
            <Route path="/admin/assessments" element={<AssessmentListPage />} />
            <Route path="/admin/assessments/:assessmentId" element={<AssessmentBuilderPage />} />
            <Route path="/admin/assessments/:assessmentId/results" element={<AssessmentResultsPage />} />
            <Route path="/admin/questions" element={<QuestionListPage />} />
            <Route path="/admin/questions/:questionId" element={<QuestionDetailsPage />} />
            <Route path="/admin/users" element={<AdminUserManagementPage />} />
            <Route path="/admin/analytics" element={<PlacementAnalyticsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/profile" element={<DepartmentProfilePage />} />
            <Route path="/admin/college-profile" element={<CollegeProfilePage />} />
          </Route>
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
