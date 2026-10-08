import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  ArrowRight,
  Plus,
  KeyRound,
  CheckCircle2,
  Code2,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Mail,
  User
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { institutionService } from "../../services/institutionService";
import { placementService } from "../../services/placementService";
import { Card, CardHeader } from "../../components/common/Card";
import { StatCard } from "../../components/common/StatCard";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [branches, setBranches] = useState([]);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeDeptId = user?.departmentId || user?.id;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [branchRes, batchMetrics] = await Promise.all([
          institutionService.getDepartmentBranches(activeDeptId).catch(() => ({ branches: [] })),
          placementService.getBatchMetrics().catch(() => null)
        ]);

        setBranches(branchRes.branches || []);
        setDepartmentInfo({
          name: branchRes.departmentName || user?.departmentName || user?.name || "Academic Program",
          code: branchRes.departmentCode || user?.departmentCode || ""
        });
        setMetrics(batchMetrics);
      } catch (e) {
        console.error("Failed to load department dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeDeptId]);

  if (loading) return <DashboardSkeleton />;

  const programName = departmentInfo?.name || user?.departmentName || user?.name || "Program";
  const activeBranchesCount = branches.filter((b) => b.status !== "INACTIVE").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Academic Program Portal
            </span>
            {departmentInfo?.code && (
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {departmentInfo.code}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {programName} Administration
          </h1>
          <p className="text-sm text-slate-500">
            Oversee child academic branches, coordinator credentials, cohort assessments, and candidate placement readiness.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={Layers}
            onClick={() => navigate("/admin/assessments")}
          >
            Assessments
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate("/admin/branches?action=new")}
          >
            Add Child Branch
          </Button>
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Child Branches"
          value={branches.length}
          subtitle={`${activeBranchesCount} active branches`}
          icon={Building2}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Program Students"
          value={metrics?.totalStudents ?? "—"}
          subtitle="Enrolled by branches"
          icon={Users}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Placement Ready"
          value={metrics ? `${metrics.placementReadyPct}%` : "—"}
          subtitle={metrics ? `${metrics.placementReady} candidates` : "Evaluating"}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Avg Employability"
          value={metrics ? `${metrics.avgEmployabilityIndex}/100` : "—"}
          subtitle="Cohort average"
          icon={TrendingUp}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Coding Arenas"
          value={branches.filter((b) => b.codingArenaEnabled !== false).length}
          subtitle="Active branches"
          icon={Code2}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Branch Autonomy"
          value="100%"
          subtitle="Independent logins"
          icon={ShieldCheck}
          iconBg="bg-teal-50 text-teal-600"
        />
      </div>

      {/* Child Branches Overview Card */}
      <Card>
        <CardHeader
          title={`Configured Child Branches (${branches.length})`}
          subtitle="Autonomous branch coordinator units under this program"
          action={
            <Link
              to="/admin/branches"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Manage All Branches ({branches.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />

        {branches.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No branches added yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create academic branches (e.g. CSE, IT, Mechanical) under this program to provision coordinator credentials for student enrollment.
            </p>
            <Button
              size="sm"
              icon={Plus}
              onClick={() => navigate("/admin/branches?action=new")}
            >
              Create First Branch Now
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Branch Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Coordinator</th>
                  <th className="py-3 px-4">Sign-in Username</th>
                  <th className="py-3 px-4">Coding Arena</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.slice(0, 6).map((br) => {
                  const bId = br._id || br.id;
                  return (
                    <tr key={bId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-xs">
                            {(br.code || br.name || "B").substring(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{br.name}</p>
                            {br.contactEmail && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 font-normal">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {br.contactEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {br.code || "—"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        {br.coordinatorName ? (
                          <span className="font-medium text-slate-800 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {br.coordinatorName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not Assigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {br.username ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-bold text-indigo-700 text-xs border border-slate-200/70">
                            <KeyRound className="w-3 h-3 text-indigo-500" />
                            {br.username}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No credentials</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={br.codingArenaEnabled !== false ? "success" : "neutral"}
                          className="text-[10px]"
                        >
                          {br.codingArenaEnabled !== false ? "Enabled" : "Disabled"}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={br.status === "ACTIVE" ? "success" : "neutral"}
                          className="text-[10px]"
                        >
                          {br.status || "ACTIVE"}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to="/admin/branches"
                          className="font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Program Academic Capabilities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate("/admin/branches")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Branch Management</h3>
          <p className="text-xs text-slate-500 mt-1">
            Provision and reset branch coordinator credentials, activate coding arena access, and manage branch sections.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 mt-3 group-hover:gap-1.5 transition-all">
            Open Branches <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => navigate("/admin/students")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Program Student Directory</h3>
          <p className="text-xs text-slate-500 mt-1">
            Inspect all students uploaded by your child branches, track interview scores, and verify skill readiness.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 mt-3 group-hover:gap-1.5 transition-all">
            View Students <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => navigate("/admin/assessments")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Assessments & Question Bank</h3>
          <p className="text-xs text-slate-500 mt-1">
            Author program-level test assessments, browse coding challenges, and schedule diagnostic evaluations.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 mt-3 group-hover:gap-1.5 transition-all">
            Build Tests <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
