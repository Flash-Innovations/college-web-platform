import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Power,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Mail,
  Phone,
  Info,
  User,
  Eye,
  EyeOff,
  Code2,
  Sparkles
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { institutionService } from "../../services/institutionService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";

export function BranchesPage() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();

  const [branches, setBranches] = useState([]);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    code: "",
    coordinatorName: "",
    username: "",
    password: "",
    contactEmail: "",
    contactPhone: "",
    codingArenaEnabled: true
  });
  const [createErrors, setCreateErrors] = useState({});
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBranchId, setEditBranchId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    coordinatorName: "",
    contactEmail: "",
    contactPhone: "",
    codingArenaEnabled: true,
    status: "ACTIVE",
    newPassword: ""
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const activeDeptId = user?.departmentId || user?.id;

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await institutionService.getDepartmentBranches(activeDeptId);
      setBranches(res.branches || []);
      setDepartmentInfo({
        name: res.departmentName || user?.departmentName || user?.name || "Program",
        code: res.departmentCode || user?.departmentCode || "",
        id: res.departmentId || activeDeptId
      });
    } catch (err) {
      console.error("Failed to load branches:", err);
      showError("Could not load branches list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    if (searchParams.get("action") === "new") {
      setCreateModalOpen(true);
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!createForm.name.trim()) errors.name = "Branch name is required";
    if (!createForm.code.trim()) errors.code = "Branch code is required";
    if (!createForm.username.trim()) {
      errors.username = "Branch sign-in username is required";
    } else if (!/^[a-z0-9_.-]+$/.test(createForm.username.trim().toLowerCase())) {
      errors.username = "Username must contain lowercase letters, numbers, underscore, hyphen or dot";
    }

    if (!createForm.password) {
      errors.password = "Initial password is required for branch login";
    } else if (createForm.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      showWarning("Please correct the errors in the form");
      return;
    }

    setCreateErrors({});
    setCreating(true);

    try {
      const payload = {
        name: createForm.name.trim(),
        code: createForm.code.trim().toUpperCase(),
        coordinatorName: createForm.coordinatorName.trim(),
        username: createForm.username.trim().toLowerCase(),
        password: createForm.password,
        contactEmail: createForm.contactEmail.trim().toLowerCase(),
        contactPhone: createForm.contactPhone.trim(),
        codingArenaEnabled: Boolean(createForm.codingArenaEnabled)
      };

      await institutionService.addBranch(activeDeptId, payload);
      showSuccess(`Branch "${payload.name}" created successfully with sign-in username: ${payload.username}`);
      setCreateModalOpen(false);
      setCreateForm({
        name: "",
        code: "",
        coordinatorName: "",
        username: "",
        password: "",
        contactEmail: "",
        contactPhone: "",
        codingArenaEnabled: true
      });
      loadBranches();
    } catch (err) {
      console.error("Failed to create branch:", err);
      showError(err.message || "Failed to create branch");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (br) => {
    setEditBranchId(br._id || br.id);
    setEditForm({
      name: br.name || "",
      code: br.code || "",
      coordinatorName: br.coordinatorName || "",
      contactEmail: br.contactEmail || "",
      contactPhone: br.contactPhone || "",
      codingArenaEnabled: br.codingArenaEnabled !== false,
      status: br.status || "ACTIVE",
      newPassword: ""
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showError("Branch name is required");
      return;
    }

    setEditing(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        code: editForm.code.trim().toUpperCase(),
        coordinatorName: editForm.coordinatorName.trim(),
        contactEmail: editForm.contactEmail.trim().toLowerCase(),
        contactPhone: editForm.contactPhone.trim(),
        codingArenaEnabled: Boolean(editForm.codingArenaEnabled),
        status: editForm.status
      };

      if (editForm.newPassword && editForm.newPassword.trim()) {
        payload.password = editForm.newPassword.trim();
      }

      await institutionService.updateBranch(activeDeptId, editBranchId, payload);
      showSuccess(`Branch "${payload.name}" updated successfully`);
      setEditModalOpen(false);
      loadBranches();
    } catch (err) {
      console.error("Failed to update branch:", err);
      showError(err.message || "Failed to update branch");
    } finally {
      setEditing(false);
    }
  };

  const handleToggleStatus = async (br) => {
    const branchId = br._id || br.id;
    const newStatus = br.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await institutionService.updateBranch(activeDeptId, branchId, { status: newStatus });
      showSuccess(`Branch "${br.name}" status changed to ${newStatus}`);
      setBranches((prev) =>
        prev.map((b) => ((b._id === branchId || b.id === branchId) ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error("Failed to toggle branch status:", err);
      showError(err.message || "Failed to toggle branch status");
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;
    const branchId = branchToDelete._id || branchToDelete.id;
    setDeleting(true);
    try {
      await institutionService.deleteBranch(activeDeptId, branchId);
      showSuccess(`Branch "${branchToDelete.name}" deleted successfully`);
      setDeleteModalOpen(false);
      setBranchToDelete(null);
      loadBranches();
    } catch (err) {
      console.error("Failed to delete branch:", err);
      showError(err.message || "Failed to delete branch");
    } finally {
      setDeleting(false);
    }
  };

  const filteredBranches = branches.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.code && b.code.toLowerCase().includes(q)) ||
      (b.username && b.username.toLowerCase().includes(q)) ||
      (b.coordinatorName && b.coordinatorName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Branch Management & Coordinators
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage academic branches under <strong>{departmentInfo?.name || "this program"}</strong>. Provision autonomous branch coordinator credentials for student enrollment and coding practice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBranches}
            disabled={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Branch
          </Button>
        </div>
      </div>

      {/* Info Pill */}
      <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Branch Autonomy:</strong> Each branch coordinator logs in with their dedicated username & password to upload and manage student rosters, monitor coding arena practice, and oversee section cohorts.
        </span>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title={`Child Branches (${filteredBranches.length})`}
          subtitle="Authorized branches and their assigned coordinator credentials"
          action={
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by branch name, code, username..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          }
        />

        {filteredBranches.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No branches configured yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your first academic branch (e.g. Computer Science, Information Technology, Mechanical) to configure coordinator credentials and student cohorts.
            </p>
            <Button
              size="sm"
              icon={Plus}
              onClick={() => setCreateModalOpen(true)}
            >
              Add First Branch Now
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
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBranches.map((br) => {
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(br)}
                            title={br.status === "ACTIVE" ? "Deactivate Branch" : "Activate Branch"}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              br.status === "ACTIVE"
                                ? "text-slate-500 border-slate-200 hover:text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(br)}
                            title="Edit Branch"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setBranchToDelete(br);
                              setDeleteModalOpen(true);
                            }}
                            title="Delete Branch"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Branch Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="max-w-lg"
        title="Create Child Branch"
        subtitle={`Provision coordinator login under ${departmentInfo?.name || "this program"}`}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Branch Name * (e.g. Computer Science & Engineering)
            </label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => {
                const val = e.target.value;
                const autoCode = val.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase();
                const autoUsername = departmentInfo?.code ? `${departmentInfo.code.toLowerCase()}_${autoCode.toLowerCase()}` : `br_${autoCode.toLowerCase()}`;
                setCreateForm({
                  ...createForm,
                  name: val,
                  code: createForm.code || autoCode,
                  username: createForm.username || autoUsername
                });
              }}
              placeholder="e.g. Computer Science & Engineering"
              className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 ${
                createErrors.name
                  ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                  : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
              }`}
            />
            {createErrors.name && <p className="text-[11px] text-rose-600 mt-1">{createErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Branch Code * (e.g. CSE)
              </label>
              <input
                type="text"
                required
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. CSE"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Coordinator Name
              </label>
              <input
                type="text"
                value={createForm.coordinatorName}
                onChange={(e) => setCreateForm({ ...createForm, coordinatorName: e.target.value })}
                placeholder="e.g. Dr. Jane Smith"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sign-in Username *
              </label>
              <input
                type="text"
                required
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.toLowerCase() })}
                placeholder="e.g. btech_cse"
                className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-medium focus:outline-none focus:ring-2 ${
                  createErrors.username
                    ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {createErrors.username && <p className="text-[11px] text-rose-600 mt-1">{createErrors.username}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Initial Password *
              </label>
              <div className="relative">
                <input
                  type={showCreatePassword ? "text" : "password"}
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full pl-3 pr-9 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 ${
                    createErrors.password
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showCreatePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {createErrors.password && <p className="text-[11px] text-rose-600 mt-1">{createErrors.password}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={createForm.contactEmail}
                onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                placeholder="cse@university.edu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={createForm.contactPhone}
                onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Coding Practice Arena</p>
              <p className="text-[11px] text-slate-400">Allow students in this branch to participate in competitive coding</p>
            </div>
            <input
              type="checkbox"
              checked={createForm.codingArenaEnabled}
              onChange={(e) => setCreateForm({ ...createForm, codingArenaEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={creating}
              disabled={creating}
            >
              Create Branch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Branch Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="max-w-lg"
        title="Edit Child Branch"
        subtitle="Update branch coordinator details or reset password"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Branch Name *
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Branch Code
              </label>
              <input
                type="text"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Coordinator Name
              </label>
              <input
                type="text"
                value={editForm.coordinatorName}
                onChange={(e) => setEditForm({ ...editForm, coordinatorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={editForm.contactEmail}
                onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={editForm.contactPhone}
                onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reset Password (leave blank to keep current password)
            </label>
            <div className="relative">
              <input
                type={showEditPassword ? "text" : "password"}
                value={editForm.newPassword}
                onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                tabIndex={-1}
              >
                {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Coding Practice Arena</p>
              <p className="text-[11px] text-slate-400">Allow students in this branch to participate in competitive coding</p>
            </div>
            <input
              type="checkbox"
              checked={editForm.codingArenaEnabled}
              onChange={(e) => setEditForm({ ...editForm, codingArenaEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              disabled={editing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={editing}
              disabled={editing}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="max-w-md"
        title="Delete Branch"
        subtitle={branchToDelete?.name}
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to delete the branch <strong>"{branchToDelete?.name}"</strong>?
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
            Branch coordinators and students associated with this branch will lose access if deleted.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={deleting}
              disabled={deleting}
              onClick={handleDelete}
            >
              Delete Branch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
