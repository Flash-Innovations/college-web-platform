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

// Lazy-loaded Legal & Public Pages
const PrivacyPolicyPage = lazyNamed(() => import("../pages/legal/PrivacyPolicyPage"), "PrivacyPolicyPage");
const TermsOfServicePage = lazyNamed(() => import("../pages/legal/TermsOfServicePage"), "TermsOfServicePage");
const DataSecurityPage = lazyNamed(() => import("../pages/legal/DataSecurityPage"), "DataSecurityPage");
const PublicStudentProfilePage = lazyNamed(() => import("../pages/public/PublicStudentProfilePage"), "PublicStudentProfilePage");

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
const SubjectsPage = lazyNamed(() => import("../pages/admin/SubjectsPage"), "SubjectsPage");
const AssessmentListPage = lazyNamed(() => import("../pages/admin/AssessmentListPage"), "AssessmentListPage");
const AssessmentBuilderPage = lazyNamed(() => import("../pages/admin/AssessmentBuilderPage"), "AssessmentBuilderPage");
const AssessmentResultsPage = lazyNamed(() => import("../pages/admin/AssessmentResultsPage"), "AssessmentResultsPage");

import { PageSkeleton } from "../components/common/LoadingSkeleton";

function RouteLoadingFallback() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageSkeleton />
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
    if (role === "university_admin" || role === "super_admin") return <Navigate to="/college/dashboard" replace />;
    if (role === "tpo" || role === "placement") return <Navigate to="/tpo/dashboard" replace />;
    if (role === "branch_admin") return <Navigate to="/branch/dashboard" replace />;
    if (role === "department_admin" || role === "admin") return <Navigate to="/dept/dashboard" replace />;
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

        {/* Public Student Career Profile */}
        <Route path="/u/:username" element={<PublicStudentProfilePage />} />

        {/* ========================================================================= */}
        {/* 1. UNIVERSITY / COLLEGE MASTER ADMIN WORKSPACE (/college & /institution)  */}
        {/* ========================================================================= */}
        <Route element={<ProtectedRoute allowedRoles={["university_admin", "super_admin", "admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/college/dashboard" element={<InstitutionDashboard />} />
            <Route path="/college/departments" element={<DepartmentsPage />} />
            <Route path="/college/hierarchy" element={<DepartmentsPage />} />
            <Route path="/college/profile" element={<UniversityProfilePage />} />
            <Route path="/college/reports" element={<PlacementReportsPage />} />
            <Route path="/college/analytics" element={<PlacementAnalyticsPage />} />
            <Route path="/college/jobs" element={<JobDescriptionsPage />} />
            <Route path="/college/job-descriptions" element={<JobDescriptionsPage />} />
            <Route path="/college/subjects" element={<SubjectsPage />} />
            <Route path="/college/questions" element={<QuestionListPage />} />
            <Route path="/college/questions/:questionId" element={<QuestionDetailsPage />} />

            {/* Backward-compatibility aliases for /institution */}
            <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
            <Route path="/institution/departments" element={<DepartmentsPage />} />
            <Route path="/institution/hierarchy" element={<DepartmentsPage />} />
            <Route path="/institution/profile" element={<UniversityProfilePage />} />
            <Route path="/institution/reports" element={<PlacementReportsPage />} />
            <Route path="/institution/analytics" element={<PlacementAnalyticsPage />} />
            <Route path="/institution/jobs" element={<JobDescriptionsPage />} />
            <Route path="/institution/job-descriptions" element={<JobDescriptionsPage />} />
            <Route path="/institution/subjects" element={<SubjectsPage />} />
            <Route path="/institution/questions" element={<QuestionListPage />} />
            <Route path="/institution/questions/:questionId" element={<QuestionDetailsPage />} />
            <Route path="/university_admin/dashboard" element={<InstitutionDashboard />} />
          </Route>
        </Route>

        {/* ========================================================================= */}
        {/* 2. TRAINING & PLACEMENT CELL (TPO) WORKSPACE (/tpo & /placement)           */}
        {/* ========================================================================= */}
        <Route element={<ProtectedRoute allowedRoles={["tpo", "placement", "super_admin", "admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/tpo/dashboard" element={<PlacementDashboard />} />
            <Route path="/tpo/students" element={<StudentManagementPage />} />
            <Route path="/tpo/jobs" element={<JobDescriptionsPage />} />
            <Route path="/tpo/job-descriptions" element={<JobDescriptionsPage />} />
            <Route path="/tpo/analytics" element={<PlacementAnalyticsPage />} />
            <Route path="/tpo/reports" element={<PlacementReportsPage />} />
            <Route path="/tpo/profile" element={<DepartmentProfilePage />} />

            {/* Backward-compatibility aliases for /placement */}
            <Route path="/placement/dashboard" element={<PlacementDashboard />} />
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
        {/* 3. ACADEMIC DEPARTMENT WORKSPACE (/dept & /admin)                         */}
        {/* ========================================================================= */}
        <Route element={<ProtectedRoute allowedRoles={["department_admin", "admin", "super_admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dept/dashboard" element={<AdminDashboard />} />
            <Route path="/dept/branches" element={<BranchesPage />} />
            <Route path="/dept/departments" element={<BranchesPage />} />
            <Route path="/dept/students" element={<StudentManagementPage />} />
            <Route path="/dept/assessments" element={<AssessmentListPage />} />
            <Route path="/dept/assessments/:assessmentId" element={<AssessmentBuilderPage />} />
            <Route path="/dept/assessments/:assessmentId/results" element={<AssessmentResultsPage />} />
            <Route path="/dept/subjects" element={<SubjectsPage />} />
            <Route path="/dept/questions" element={<QuestionListPage />} />
            <Route path="/dept/questions/:questionId" element={<QuestionDetailsPage />} />
            <Route path="/dept/jobs" element={<JobDescriptionsPage />} />
            <Route path="/dept/job-descriptions" element={<JobDescriptionsPage />} />
            <Route path="/dept/users" element={<AdminUserManagementPage />} />
            <Route path="/dept/analytics" element={<PlacementAnalyticsPage />} />
            <Route path="/dept/reports" element={<PlacementReportsPage />} />
            <Route path="/dept/settings" element={<AdminSettingsPage />} />
            <Route path="/dept/profile" element={<DepartmentProfilePage />} />

            {/* Backward-compatibility aliases for /admin */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/branches" element={<BranchesPage />} />
            <Route path="/admin/departments" element={<BranchesPage />} />
            <Route path="/admin/students" element={<StudentManagementPage />} />
            <Route path="/admin/assessments" element={<AssessmentListPage />} />
            <Route path="/admin/assessments/:assessmentId" element={<AssessmentBuilderPage />} />
            <Route path="/admin/assessments/:assessmentId/results" element={<AssessmentResultsPage />} />
            <Route path="/admin/subjects" element={<SubjectsPage />} />
            <Route path="/admin/questions" element={<QuestionListPage />} />
            <Route path="/admin/questions/:questionId" element={<QuestionDetailsPage />} />
            <Route path="/admin/users" element={<AdminUserManagementPage />} />
            <Route path="/admin/analytics" element={<PlacementAnalyticsPage />} />
            <Route path="/admin/jobs" element={<JobDescriptionsPage />} />
            <Route path="/admin/job-descriptions" element={<JobDescriptionsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/profile" element={<DepartmentProfilePage />} />
            <Route path="/admin/college-profile" element={<CollegeProfilePage />} />
          </Route>
        </Route>

        {/* ========================================================================= */}
        {/* 4. BRANCH COORDINATOR WORKSPACE (/branch)                                 */}
        {/* ========================================================================= */}
        <Route element={<ProtectedRoute allowedRoles={["branch_admin", "super_admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/branch/dashboard" element={<AdminDashboard />} />
            <Route path="/branch/students" element={<StudentManagementPage />} />
            <Route path="/branch/jobs" element={<JobDescriptionsPage />} />
            <Route path="/branch/job-descriptions" element={<JobDescriptionsPage />} />
            <Route path="/branch/subjects" element={<SubjectsPage />} />
            <Route path="/branch/assessments" element={<AssessmentListPage />} />
            <Route path="/branch/assessments/:assessmentId" element={<AssessmentBuilderPage />} />
            <Route path="/branch/assessments/:assessmentId/results" element={<AssessmentResultsPage />} />
            <Route path="/branch/questions" element={<QuestionListPage />} />
            <Route path="/branch/questions/:questionId" element={<QuestionDetailsPage />} />
            <Route path="/branch/reports" element={<PlacementReportsPage />} />
            <Route path="/branch/profile" element={<DepartmentProfilePage />} />
          </Route>
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
