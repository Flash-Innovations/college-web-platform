import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Target,
  GraduationCap,
  Mic,
  Award,
  CheckSquare,
  Users,
  Sparkles,
  User,
  Building2,
  Briefcase,
  BarChart3,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  Code2,
  Layers,
  Trophy
} from "lucide-react";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

export function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  // Central T&P (TPO) check:
  // Can be COLLEGE_ADMIN or a dedicated T&P Department account (name contains "Placement" / "TPO", code "TPO", or username "*_tpo")
  const isTpo = Boolean(
    user?.departmentCode === "TPO" ||
    user?.username?.endsWith("_tpo") ||
    user?.backendRole === "COLLEGE_ADMIN" ||
    user?.name?.toLowerCase().includes("placement") ||
    user?.name?.toLowerCase().includes("tpo") ||
    user?.departmentName?.toLowerCase().includes("placement") ||
    user?.departmentName?.toLowerCase().includes("tpo") ||
    (role === "placement" && !user?.backendRole?.includes("DEPARTMENT"))
  );

  // Detect if current session belongs to an autonomous Program / Department placement cell (NOT Central TPO)
  const isDeptOrProgram = !isTpo && Boolean(
    user?.backendRole === "DEPARTMENT_ADMIN" ||
    role === "department_admin"
  );

  const deptOrProgramName =
    user?.departmentName ||
    (user?.name ? user.name.replace(/\s*Dept\s*$/i, "") : null) ||
    user?.collegeName ||
    "Program";

  const isBranchAdmin = role === "branch_admin" || Boolean(user?.branchName);

  const displayUserName = isBranchAdmin
    ? user?.branchName || user?.name || "Branch Coordinator"
    : deptOrProgramName || user?.name || "Department Admin";

  const universityAdminLinks = [
    { to: "/college/dashboard", label: "College Overview", icon: LayoutDashboard },
    { to: "/college/departments", label: "Programs & Branches", icon: Building2, badge: "Units" },
    { to: "/college/jobs", label: "Job Drives & Openings", icon: Briefcase, badge: "Drives" },
    { to: "/college/subjects", label: "Curriculum & Subjects", icon: GraduationCap },
    { to: "/college/questions", label: "Question Bank", icon: BookOpen },
    { to: "/college/analytics", label: "Institutional Analytics", icon: BarChart3 },
    { to: "/college/reports", label: "Accreditation & NIRF Reports", icon: FileSpreadsheet, badge: "Export" },
    { to: "/college/profile", label: "College Profile", icon: Settings }
  ];

  const tpoLinks = [
    {
      to: "/tpo/dashboard",
      label: "T&P Overview",
      icon: LayoutDashboard
    },
    {
      to: "/tpo/students",
      label: "Universal Student Directory",
      icon: Users
    },
    {
      to: "/tpo/jobs",
      label: "Job Drives & Openings",
      icon: Briefcase,
      badge: "Drives"
    },
    {
      to: "/tpo/analytics",
      label: "Placement Analytics",
      icon: BarChart3
    },
    {
      to: "/tpo/reports",
      label: "NBA / NIRF Reports",
      icon: FileSpreadsheet,
      badge: "Export"
    },
    {
      to: "/tpo/profile",
      label: "T&P Cell Profile",
      icon: Building2
    }
  ];

  const departmentAdminLinks = [
    { to: "/dept/dashboard", label: "Program Overview", icon: LayoutDashboard },
    { to: "/dept/branches", label: "Branch Management", icon: Building2, badge: "Branches" },
    { to: "/dept/students", label: "Program Students", icon: Users },
    { to: "/dept/jobs", label: "Job Drives & Openings", icon: Briefcase, badge: "Drives" },
    { to: "/dept/subjects", label: "Curriculum & Subjects", icon: GraduationCap },
    { to: "/dept/assessments", label: "Assessments", icon: Layers },
    { to: "/dept/contests", label: "Contests & Hackathons", icon: Trophy, badge: "Live" },
    { to: "/dept/questions", label: "Question Bank", icon: BookOpen },
    { to: "/dept/reports", label: "Accreditation & Reports", icon: FileSpreadsheet, badge: "Export" },
    { to: "/dept/profile", label: "Program Profile", icon: Settings }
  ];

  const branchAdminLinks = [
    { to: "/branch/dashboard", label: "Branch Overview", icon: LayoutDashboard },
    { to: "/branch/branches", label: "Branch Management", icon: Building2, badge: "Branches" },
    { to: "/branch/students", label: "Branch Students (CRUD)", icon: Users, badge: "Manage" },
    { to: "/branch/jobs", label: "Job Drives & Openings", icon: Briefcase, badge: "Drives" },
    { to: "/branch/subjects", label: "Curriculum & Subjects", icon: GraduationCap },
    { to: "/branch/assessments", label: "Assessments", icon: Layers },
    { to: "/branch/contests", label: "Contests & Hackathons", icon: Trophy, badge: "Live" },
    { to: "/branch/questions", label: "Question Bank", icon: BookOpen },
    { to: "/branch/reports", label: "Accreditation & Reports", icon: FileSpreadsheet, badge: "Export" },
    { to: "/branch/profile", label: "Branch Profile", icon: Settings }
  ];

  const links =
    role === "university_admin" || role === "super_admin"
      ? universityAdminLinks
      : role === "tpo" || role === "placement" || isTpo
      ? tpoLinks
      : role === "branch_admin"
      ? branchAdminLinks
      : departmentAdminLinks;

  // Header Title
  const portalHeading =
    role === "university_admin"
      ? (user?.institutionName ? `${user.institutionName}` : "University Admin Portal")
      : isBranchAdmin
      ? `${user?.branchName || "Branch"} Portal`
      : isTpo
      ? "Training & Placement Cell"
      : isDeptOrProgram
      ? `${deptOrProgramName}`
      : "Department Portal";

  // Subtitle / Subtext for user card at bottom
  const roleSubtitle =
    role === "university_admin"
      ? "University Administrator"
      : isBranchAdmin
      ? (user?.branchCode ? `${user.branchCode} Coordinator` : "Branch Coordinator")
      : isTpo
      ? "Training & Placement Officer"
      : isDeptOrProgram
      ? (user?.departmentCode ? `${user.departmentCode} Placement Cell` : "Program Placement Unit")
      : role === "placement"
      ? "Training & Placement Officer"
      : "Department Admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out select-none",
          isCollapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-100">
          <div
            onClick={() => navigate(`/${role}/dashboard`)}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          >
            {isCollapsed ? (
              <img
                src="/branding/sips-mark.png"
                alt="SIPS"
                className="w-9 h-9 object-contain shrink-0 mx-auto"
              />
            ) : (
              <img
                src="/branding/sips-logo-compact.png"
                alt="SIPS - Skill Intelligence"
                className="h-8 w-auto max-w-[170px] object-contain shrink-0"
              />
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {!isCollapsed && (
            <div
              className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate"
              title={portalHeading}
            >
              {portalHeading}
            </div>
          )}

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-colors",
                        isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{link.label}</span>
                    )}
                    {!isCollapsed && link.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                          isActive
                            ? "bg-indigo-200/60 text-indigo-800"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {link.badge}
                      </span>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {link.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl transition-all",
              !isCollapsed && "hover:bg-white"
            )}
          >
            <Avatar
              src={user?.profileImageUrl || user?.logoUrl || user?.avatar}
              name={displayUserName}
              isCollege={true}
              size="sm"
              className="border border-slate-200 shrink-0"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate" title={displayUserName}>
                  {displayUserName}
                </p>
                <p className="text-[11px] text-slate-400 capitalize truncate" title={roleSubtitle}>
                  {roleSubtitle}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
