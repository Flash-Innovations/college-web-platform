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
  Layers
} from "lucide-react";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

export function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  // Detect if current session belongs to an autonomous Program / Department placement cell
  const isDeptOrProgram = Boolean(
    user?.departmentName ||
    user?.departmentId ||
    user?.backendRole === "DEPARTMENT_ADMIN" ||
    (user?.role === "placement" && user?.name && !user.name.toLowerCase().includes("universal") && !user.name.toLowerCase().includes("central tpo"))
  );

  const deptOrProgramName =
    user?.departmentName ||
    (user?.name ? user.name.replace(/\s*Dept\s*$/i, "") : null) ||
    user?.collegeName ||
    "Program";

  const universityAdminLinks = [
    { to: "/institution/dashboard", label: "College Overview", icon: LayoutDashboard },
    { to: "/institution/departments", label: "Programs & Branches", icon: Building2, badge: "Units" },
    { to: "/institution/assessments", label: "Assessments", icon: Layers },
    { to: "/institution/questions", label: "Question Bank", icon: BookOpen },
    { to: "/institution/profile", label: "College Profile", icon: Settings }
  ];

  const placementLinks = [
    {
      to: "/placement/dashboard",
      label: isDeptOrProgram ? "Program Overview" : "T&P Overview",
      icon: LayoutDashboard
    },
    {
      to: "/placement/students",
      label: isDeptOrProgram ? "Student Directory" : "Universal Student Directory",
      icon: Users
    },
    {
      to: "/placement/jobs",
      label: "Job Drives & Openings",
      icon: Briefcase,
      badge: "Drives"
    },
    {
      to: "/placement/assessments",
      label: "Assessments",
      icon: Layers
    },
    {
      to: "/placement/questions",
      label: "Question Bank",
      icon: BookOpen
    },
    {
      to: "/placement/analytics",
      label: "Placement Analytics",
      icon: BarChart3
    },
    {
      to: "/placement/reports",
      label: "NBA / NIRF Reports",
      icon: FileSpreadsheet,
      badge: "Export"
    },
    {
      to: "/placement/profile",
      label: isDeptOrProgram ? "Program Profile" : "T&P Cell Profile",
      icon: Building2
    }
  ];

  const departmentAdminLinks = [
    { to: "/admin/dashboard", label: "Dept Overview", icon: LayoutDashboard },
    { to: "/admin/departments", label: "Branch Management", icon: Building2, badge: "Branches" },
    { to: "/admin/students", label: "Department Students", icon: Users },
    { to: "/admin/assessments", label: "Assessments", icon: Layers },
    { to: "/admin/questions", label: "Question Bank", icon: BookOpen },
    { to: "/admin/profile", label: "Department Profile", icon: Settings }
  ];

  const branchAdminLinks = [
    { to: "/admin/students", label: "Branch Students (CRUD)", icon: Users },
    { to: "/admin/assessments", label: "Branch Assessments", icon: Layers },
    { to: "/admin/questions", label: "Subjects & Questions", icon: BookOpen },
    { to: "/admin/profile", label: "Branch Profile", icon: Settings }
  ];

  const links =
    role === "university_admin"
      ? universityAdminLinks
      : role === "placement"
      ? placementLinks
      : role === "branch_admin"
      ? branchAdminLinks
      : departmentAdminLinks;

  // Header Title
  const portalHeading =
    role === "university_admin"
      ? (user?.institutionName ? `${user.institutionName}` : "University Admin Portal")
      : isDeptOrProgram
      ? `${deptOrProgramName}`
      : role === "placement"
      ? "Training & Placement Cell"
      : role === "branch_admin"
      ? `${user?.branchName || "Branch"} Portal`
      : "Department Portal";

  // Subtitle / Subtext for user card at bottom
  const roleSubtitle =
    role === "university_admin"
      ? "University Administrator"
      : isDeptOrProgram
      ? (user?.departmentCode ? `${user.departmentCode} Placement Cell` : "Program Placement Unit")
      : role === "placement"
      ? "Training & Placement Officer"
      : role === "branch_admin"
      ? "Branch Coordinator"
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
              name={deptOrProgramName || user?.name || "Program"}
              isCollege={true}
              size="sm"
              className="border border-slate-200 shrink-0"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate" title={deptOrProgramName || user?.name}>
                  {deptOrProgramName || user?.name || "Department Admin"}
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
