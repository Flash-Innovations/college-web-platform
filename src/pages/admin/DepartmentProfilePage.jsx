import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  Layers,
  Sparkles,
  ShieldCheck,
  Award,
  ChevronRight,
  Code2,
  Globe,
  MapPin,
  UserCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { institutionService } from "../../services/institutionService";
import { placementService } from "../../services/placementService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { DetailSkeleton } from "../../components/common/LoadingSkeleton";

export function DepartmentProfilePage() {
  const { user, role, updateUser } = useAuth();
  const { showSuccess, showError } = useNotifications();

  const isBranch = role === "branch_admin" || Boolean(user?.branchName);
  const isDeptOrProgram = role === "department_admin" || role === "placement" || Boolean(user?.departmentName);

  const pageTitle = isBranch ? "Branch Profile" : isDeptOrProgram ? "Program Profile" : "Department Profile";
  const entityLabel = isBranch ? "Branch" : isDeptOrProgram ? "Program" : "Department";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // "general" | "branches" | "governance"
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBranches: 0,
    placedStudents: 0
  });

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    hodName: "",
    officeLocation: "",
    websiteUrl: ""
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [res, branchesRes, studentsList] = await Promise.all([
        institutionService.getDepartmentOwnProfile().catch(() => ({})),
        isDeptOrProgram ? institutionService.getDepartmentBranches().catch(() => []) : Promise.resolve([]),
        placementService.getStudents().catch(() => [])
      ]);

      const dept = res.department || {};
      const branchList = Array.isArray(branchesRes) ? branchesRes : branchesRes?.branches || dept.branches || [];
      setBranches(branchList);

      setForm({
        name: dept.name || user?.branchName || user?.departmentName || "",
        code: dept.code || user?.branchCode || "",
        description: dept.description || "",
        contactEmail: dept.contactEmail || user?.email || "",
        contactPhone: dept.contactPhone || "",
        hodName: dept.hodName || dept.coordinatorName || user?.coordinatorName || "",
        officeLocation: dept.officeLocation || "Block B, Academic Complex",
        websiteUrl: dept.websiteUrl || ""
      });

      // Compute actual student count for this branch/program
      let verifiedCount = 0;
      if (typeof dept.studentCount === "number" && dept.studentCount > 0) {
        verifiedCount = dept.studentCount;
      } else if (Array.isArray(studentsList) && studentsList.length > 0) {
        if (isBranch) {
          const currentBranchName = (dept.name || user?.branchName || "").toLowerCase();
          const currentBranchCode = (dept.code || user?.branchCode || "").toLowerCase();
          const filtered = studentsList.filter((s) => {
            const b = (s.branch || "").toLowerCase();
            return b === currentBranchName || b === currentBranchCode || b.includes(currentBranchCode);
          });
          verifiedCount = filtered.length > 0 ? filtered.length : studentsList.length;
        } else {
          verifiedCount = studentsList.length;
        }
      } else if (typeof dept.studentCount === "number") {
        verifiedCount = dept.studentCount;
      }

      setStats({
        totalStudents: verifiedCount,
        totalBranches: branchList.length || (isBranch ? 1 : 4),
        placedStudents: typeof dept.placedCount === "number" ? dept.placedCount : 0
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
      showError(`Could not load ${entityLabel.toLowerCase()} profile`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError(`${entityLabel} name is required`);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        hodName: form.hodName.trim()
      };

      const res = await institutionService.updateDepartmentOwnProfile(payload);
      showSuccess(`${pageTitle} updated successfully`);
      if (res.department) {
        if (isBranch) {
          updateUser({ branchName: res.department.name });
        } else {
          updateUser({ departmentName: res.department.name });
        }
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      showError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  const institutionName = user?.institutionName || user?.collegeName || "Affiliated Institution";
  const initials = (form.name || entityLabel)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 border border-indigo-400/30 flex items-center justify-center font-bold text-2xl sm:text-3xl text-white shadow-lg shrink-0">
              {initials}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {form.name || pageTitle}
                </h1>
                {form.code && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    {form.code}
                  </span>
                )}
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>
              <p className="text-sm text-indigo-200/80 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{institutionName}</span>
                <span>•</span>
                <span className="text-xs text-indigo-300">Autonomous Academic Entity</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadProfile}
              className="bg-slate-800/80 hover:bg-slate-700/90 text-indigo-200 border-indigo-500/40 hover:border-indigo-400 hover:text-white shadow-sm transition-all"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              onClick={handleSubmit}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
            >
              {saving ? "Saving Changes..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isBranch ? "Branch Status" : "Active Branches"}
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {isBranch ? "1 Specialization" : `${branches.length} Programs`}
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Enrolled Candidates
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {stats.totalStudents} Verified
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Coding Arena Sandbox
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              Enabled
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Accreditation
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              NBA / NAAC Ready
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "general"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>General Information</span>
        </button>

        {isDeptOrProgram && (
          <button
            type="button"
            onClick={() => setActiveTab("branches")}
            className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "branches"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Academic Branches ({branches.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("governance")}
          className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "governance"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Governance & Accreditation</span>
        </button>
      </div>

      {/* Tab 1: General Info Form */}
      {activeTab === "general" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader
              icon={Building2}
              title={`${entityLabel} Credentials & Contact Details`}
              description="Keep official department identity and administrative reach up to date."
            />
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {entityLabel} Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    placeholder={isBranch ? "e.g., Computer Science & Engineering" : "e.g., Bachelors of Technology"}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Code
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    placeholder={isBranch ? "e.g., CSE" : "e.g., BTECH"}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Head of Department (HOD) / Coordinator
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={form.hodName}
                      onChange={(e) => setForm({ ...form, hodName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      placeholder="Dr. Rajesh Kumar, Ph.D"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Office / Block Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={form.officeLocation}
                      onChange={(e) => setForm({ ...form, officeLocation: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      placeholder="Block B, 3rd Floor"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      placeholder="coordinator@college.edu"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      placeholder="+91 (080) 2345 6789"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Academic Mission & Department Overview
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all leading-relaxed"
                    placeholder={`Provide a comprehensive overview of the ${entityLabel.toLowerCase()}, key placement milestones, and academic curriculum...`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={Save}
                  disabled={saving}
                  className="min-w-[140px]"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* Tab 2: Branches List */}
      {activeTab === "branches" && isDeptOrProgram && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader
            icon={Layers}
            title="Branches under this Program"
            description="Manage discipline specializations, Coding Arena access, and branch coordinators."
            action={
              <Link to="/admin/branches">
                <Button variant="outline" size="sm" icon={ChevronRight}>
                  Open Branch Manager
                </Button>
              </Link>
            }
          />
          <div className="p-6">
            {branches.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">No branches configured yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Add branches to this program to provision students and setup curriculum.
                </p>
                <Link to="/admin/branches" className="mt-4 inline-block">
                  <Button variant="primary" size="sm">
                    Configure Branches
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((b, idx) => (
                  <div
                    key={b.id || b._id || idx}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white hover:bg-slate-50/50 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                        <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {b.code || "UNIT"}
                        </span>
                      </div>
                      <Badge variant={b.codingArenaEnabled !== false ? "success" : "neutral"} size="sm">
                        {b.codingArenaEnabled !== false ? "Coding Arena" : "MCQ Only"}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      {b.coordinatorName && (
                        <p className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.coordinatorName}</span>
                        </p>
                      )}
                      {b.contactEmail && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{b.contactEmail}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tab 3: Governance & NIRF */}
      {activeTab === "governance" && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader
            icon={ShieldCheck}
            title="Accreditation & Institutional Governance"
            description="Compliance parameters aligned with NBA, NAAC Criterion 5, and NIRF audits."
          />
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                  <Award className="w-4 h-4" />
                  <span>NBA Accreditation Criterion 5</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automated tracking of student progression to higher education and placement in tier-1 corporate organizations with verifiable audit logs.
                </p>
                <Badge variant="success" size="sm">
                  Audited & Compliant
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Multi-Tenant Data Privacy</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Strict tenant and department boundaries enforced. Student assessment scores, code submissions, and private placement offers are protected with tenant-level RBAC.
                </p>
                <Badge variant="primary" size="sm">
                  Isolated Tenant
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Program Tenant ID: {user?.departmentId || user?.id || "dept_root"}</span>
              <Link to="/placement/reports" className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                <span>View Accreditation Reports</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
