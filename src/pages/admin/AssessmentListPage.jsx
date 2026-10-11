import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Archive,
  Clock,
  Code2,
  BookOpen,
  Globe2,
  Building,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileCode2,
  Award,
  Briefcase,
  BarChart3,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { practiceService } from "../../services/practiceService";
import { placementService } from "../../services/placementService";
import { institutionService } from "../../services/institutionService";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";

export function AssessmentListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isBranchAdmin = user?.role === "branch_admin" || Boolean(user?.branchName) || Boolean(user?.branchId) || user?.backendRole === "BRANCH_ADMIN" || location.pathname.startsWith("/branch");
  const basePath = location.pathname.startsWith("/placement") ? "/placement" : location.pathname.startsWith("/institution") ? "/institution" : location.pathname.startsWith("/tpo") ? "/tpo" : (location.pathname.startsWith("/branch") || isBranchAdmin) ? "/branch" : "/dept";
  const { addToast } = useNotifications();

  // Role permissions
  const isTpo = (user?.role === "tpo" || user?.role === "placement") ||
    Boolean(user?.departmentName?.toLowerCase().includes("tpo") || user?.departmentName?.toLowerCase().includes("placement") || user?.name?.toLowerCase().includes("tpo") || user?.name?.toLowerCase().includes("placement"));
  const canCreate = !isTpo;

  // Filter States
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  // Data & Loading States
  const [assessments, setAssessments] = useState([]);
  const [drivesList, setDrivesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    description: "",
    type: "MOCK_ASSESSMENT",
    durationMinutes: 60,
    sipsDriveId: ""
  });

  useEffect(() => {
    placementService.getJobs()
      .then((jobs) => setDrivesList(Array.isArray(jobs) ? jobs : []))
      .catch(() => setDrivesList([]));

    if (!isTpo) {
      if (isBranchAdmin) {
        const brVal = user?.branchId || user?.branchCode || user?.branchName;
        if (brVal) setSelectedBranchIds([brVal]);
      } else {
        institutionService.getDepartmentBranches()
          .then((res) => {
            const list = res?.branches || (Array.isArray(res) ? res : []);
            setBranchesList(list);
          })
          .catch(() => setBranchesList([]));
      }
    }
  }, [isTpo, isBranchAdmin, user]);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await practiceService.getAssessments({
        page,
        limit,
        search,
        type: typeFilter,
        status: statusFilter,
        scope: scopeFilter
      });

      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setAssessments(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      } else {
        setPagination((prev) => ({
          ...prev,
          total: items.length,
          totalPages: Math.max(1, Math.ceil(items.length / limit))
        }));
      }
    } catch (err) {
      console.error("Failed to load assessments:", err);
      setError(err.message || "Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, typeFilter, statusFilter, scopeFilter]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAssessments();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newAssessment.title || !newAssessment.title.trim()) {
      if (addToast) {
        addToast({
          type: "warning",
          title: "Title Required",
          message: "Please enter a title for the assessment blueprint."
        });
      }
      return;
    }

    setCreateLoading(true);
    try {
      const resolvedType =
        newAssessment.type === "PLACEMENT_ASSESSMENT" && !newAssessment.sipsDriveId
          ? "MOCK_ASSESSMENT"
          : newAssessment.type;

      const resolvedBranches = isBranchAdmin
        ? [user?.branchId || user?.branchCode || user?.branchName].filter(Boolean)
        : selectedBranchIds;

      const payload = {
        title: newAssessment.title.trim(),
        description: newAssessment.description?.trim() || "",
        type: resolvedType || "MOCK_ASSESSMENT",
        durationMinutes: parseInt(newAssessment.durationMinutes, 10) || 60,
        collegeId: user?.collegeId || user?.departmentId || null,
        branchIds: resolvedBranches,
        sipsDriveId: newAssessment.sipsDriveId?.trim() || null
      };

      const res = await practiceService.createAssessment(payload);
      const created = res?.data && res.data.id ? res.data : res;
      const targetId = created?.id || created?.data?.id;

      if (addToast) {
        addToast({
          type: "success",
          title: "Assessment Created",
          message: `Draft assessment '${created?.title || payload.title}' created successfully.`
        });
      }
      setCreateModalOpen(false);
      setSelectedBranchIds(isBranchAdmin ? [user?.branchId || user?.branchCode || user?.branchName].filter(Boolean) : []);
      setNewAssessment({
        title: "",
        description: "",
        type: "PLACEMENT_ASSESSMENT",
        durationMinutes: 60,
        sipsDriveId: ""
      });

      if (targetId) {
        navigate(`${basePath}/assessments/${targetId}`);
      } else {
        fetchAssessments();
      }
    } catch (err) {
      console.error("Failed to create assessment:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: "Creation Failed",
          message: err.message || "Failed to create assessment draft."
        });
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePublishAssessment = async (assessmentItem) => {
    if (!assessmentItem.questionCount || assessmentItem.questionCount === 0) {
      if (addToast) {
        addToast({
          type: "warning",
          title: "Questions Required",
          message: "Please open the builder and add at least 1 question before publishing so students can take the assessment."
        });
      }
      navigate(`${basePath}/assessments/${assessmentItem.id}`);
      return;
    }

    try {
      await practiceService.publishAssessment(assessmentItem.id);
      if (addToast) {
        addToast({
          type: "success",
          title: "Assessment Published",
          message: `Assessment '${assessmentItem.title}' is now live and visible to students.`
        });
      }
      fetchAssessments();
    } catch (err) {
      console.error("Failed to publish assessment:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: "Publish Failed",
          message: err.message || "Failed to publish assessment."
        });
      }
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "PLACEMENT_ASSESSMENT":
        return <Badge variant="primary" size="sm">Placement Drive</Badge>;
      case "MOCK_ASSESSMENT":
        return <Badge variant="purple" size="sm">Mock Exam</Badge>;
      case "PRACTICE_SET":
        return <Badge variant="blue" size="sm">Practice Set</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge variant="success" size="sm">Published (Locked)</Badge>;
      case "DRAFT":
        return <Badge variant="warning" size="sm">Draft</Badge>;
      case "ARCHIVED":
        return <Badge variant="neutral" size="sm">Archived</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessments & Question Sets</h1>
            <Badge variant="primary" size="md">Assembly Studio</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Compose modular, multi-section assessments (Aptitude, Technical, Coding) from canonical QuestionVersions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssessments}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${basePath}/questions`)}
            className="flex items-center gap-2"
            title="Browse canonical question bank catalog"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Question Bank</span>
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assessment</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assessments by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <Button type="submit" variant="primary" size="md" className="shrink-0">
            Search
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Assessment Type</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Types</option>
              <option value="PLACEMENT_ASSESSMENT">Placement Drive Assessment</option>
              <option value="MOCK_ASSESSMENT">Mock Assessment</option>
              <option value="PRACTICE_SET">Practice Question Set</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft (In Assembly)</option>
              <option value="PUBLISHED">Published (Locked)</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Scope</label>
            <select
              value={scopeFilter}
              onChange={(e) => { setScopeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Scopes</option>
              <option value="global">Global Assessments</option>
              <option value="college">College Specific</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assessment Cards Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="flex gap-4 py-3 border-b border-slate-100">
              <div className="h-4 bg-slate-200 rounded flex-2" />
              <div className="h-4 bg-slate-200 rounded flex-1" />
              <div className="h-4 bg-slate-200 rounded flex-1" />
              <div className="h-4 bg-slate-200 rounded flex-1" />
              <div className="h-4 bg-slate-200 rounded flex-1" />
            </div>
            {Array.from({ length: 5 }).map((_, r) => (
              <div key={r} className="flex gap-4 py-3.5 border-b border-slate-50 last:border-0 items-center">
                <div className="h-4 bg-slate-200 rounded flex-2" />
                <div className="h-4 bg-slate-100 rounded flex-1" />
                <div className="h-4 bg-slate-100 rounded flex-1" />
                <div className="h-4 bg-slate-100 rounded flex-1" />
                <div className="h-4 bg-slate-200 rounded flex-1" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-base font-semibold text-slate-900">Failed to load assessments</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchAssessments}>Try Again</Button>
          </div>
        ) : assessments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-800">No assessments found</p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {canCreate
                ? "Create your first modular assessment or adjust your active search filters."
                : "No assessments have been published by academic departments or branch coordinators yet."}
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/questions`)} className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>Browse Question Bank</span>
              </Button>
              {canCreate && (
                <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)} className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Create Assessment</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Assessment Title</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-4 py-3.5">Questions</th>
                  <th className="px-4 py-3.5">Total Marks</th>
                  <th className="px-4 py-3.5">Sections Breakdown</th>
                  <th className="px-4 py-3.5">Scope</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Title */}
                    <td className="px-5 py-4 align-middle max-w-xs">
                      <div
                        onClick={() => navigate(`${basePath}/assessments/${a.id}`)}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                        title={a.title}
                      >
                        {a.title}
                      </div>
                      {a.description && (
                        <div className="text-xs text-slate-400 truncate mt-0.5" title={a.description}>
                          {a.description}
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4 align-middle">
                      {getTypeBadge(a.type)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 align-middle">
                      {getStatusBadge(a.status)}
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{a.durationMinutes} mins</span>
                      </div>
                    </td>

                    {/* Questions Count */}
                    <td className="px-4 py-4 align-middle">
                      <span className="font-semibold text-slate-800 text-xs">
                        {a.questionCount} {a.questionCount === 1 ? "question" : "questions"}
                      </span>
                    </td>

                    {/* Total Marks */}
                    <td className="px-4 py-4 align-middle">
                      <span className="font-bold text-slate-900 text-xs">
                        {a.totalMarks} pts
                      </span>
                    </td>

                    {/* Section Breakdown Pills */}
                    <td className="px-4 py-4 align-middle">
                      <div className="flex flex-wrap gap-1.5">
                        {a.sectionCounts?.APTITUDE > 0 && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold border border-emerald-200">
                            Apt: {a.sectionCounts.APTITUDE}
                          </span>
                        )}
                        {a.sectionCounts?.TECHNICAL > 0 && (
                          <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-semibold border border-sky-200">
                            Tech: {a.sectionCounts.TECHNICAL}
                          </span>
                        )}
                        {a.sectionCounts?.CODING > 0 && (
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold border border-indigo-200">
                            Code: {a.sectionCounts.CODING}
                          </span>
                        )}
                        {a.questionCount === 0 && (
                          <span className="text-[11px] text-slate-400 italic">No questions</span>
                        )}
                      </div>
                    </td>

                    {/* Scope */}
                    <td className="px-4 py-4 align-middle">
                      {a.isGlobal ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Globe2 className="w-3 h-3" /> Global
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            <Building className="w-3 h-3" /> {a.departmentId ? "Department" : "College"}
                          </span>
                          {Array.isArray(a.branchIds) && a.branchIds.length > 0 && (
                            <div className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]" title={a.branchIds.join(", ")}>
                              {a.branchIds.length === 1 ? `Branch: ${a.branchIds[0]}` : `${a.branchIds.length} Branches`}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === "DRAFT" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePublishAssessment(a)}
                            className="text-xs flex items-center gap-1.5 shadow-sm"
                            title="Make assessment live and visible to students"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Publish</span>
                          </Button>
                        )}
                        {a.status === "PUBLISHED" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`${basePath}/assessments/${a.id}/results`)}
                            className="text-xs flex items-center gap-1.5"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Results</span>
                          </Button>
                        )}
                        <Button
                          variant={a.status === "DRAFT" ? "outline" : "outline"}
                          size="sm"
                          onClick={() => navigate(`${basePath}/assessments/${a.id}`)}
                          className="text-xs"
                        >
                          {a.status === "DRAFT" ? "Open Builder" : "Inspect"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && assessments.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-semibold text-slate-800">{Math.min(page * limit, pagination.total)}</span> of{" "}
              <span className="font-semibold text-slate-800">{pagination.total}</span> assessments
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-slate-700 px-2">
                Page {page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Assessment Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Assessment Blueprint"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assessment Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. TCS National Qualifier Screening Assessment"
              value={newAssessment.title}
              onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Provide context, assessment instructions, or drive metadata..."
              value={newAssessment.description}
              onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Type</label>
              <select
                value={newAssessment.type}
                onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="PLACEMENT_ASSESSMENT">Placement Drive</option>
                <option value="MOCK_ASSESSMENT">Mock Exam</option>
                <option value="PRACTICE_SET">Practice Set</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min={5}
                max={360}
                required
                value={newAssessment.durationMinutes}
                onChange={(e) => setNewAssessment({ ...newAssessment, durationMinutes: parseInt(e.target.value, 10) || 60 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Branch Scoping / Selection */}
          {isBranchAdmin ? (
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-center justify-between">
              <div>
                <span className="font-bold block text-slate-800">Target Branch:</span>
                <span className="text-slate-600">{user?.branchName || "My Branch"} {user?.branchCode ? `(${user.branchCode})` : ""}</span>
              </div>
              <Badge variant="primary" size="sm">Branch Bound</Badge>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Eligible Branches <span className="text-slate-400 font-normal">({selectedBranchIds.length === 0 ? "All Branches in Department" : `${selectedBranchIds.length} Selected`})</span>
                </label>
                {branchesList.length > 0 && (
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedBranchIds(branchesList.map(b => b.code || b.name || b._id))}
                      className="text-indigo-600 hover:underline font-medium cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBranchIds([])}
                      className="text-slate-500 hover:underline font-medium cursor-pointer"
                    >
                      All Branches
                    </button>
                  </div>
                )}
              </div>
              {branchesList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {branchesList.map((br) => {
                    const val = br.code || br.name || br._id;
                    const isChecked = selectedBranchIds.includes(val);
                    return (
                      <label
                        key={br._id || br.id || br.name}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                          isChecked
                            ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-medium"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedBranchIds((prev) =>
                              prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
                            );
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 rounded-sm"
                        />
                        <span className="truncate">{br.name} {br.code ? `(${br.code})` : ""}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Applicable to all student branches across this department.
                </p>
              )}
            </div>
          )}

          {newAssessment.type === "PLACEMENT_ASSESSMENT" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Associated Placement Drive <span className="text-slate-400 font-normal">(Optional for draft)</span>
              </label>
              <select
                value={newAssessment.sipsDriveId || ""}
                onChange={(e) => setNewAssessment({ ...newAssessment, sipsDriveId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Placement Drive from SIPS (Optional) --</option>
                {drivesList.map((d) => (
                  <option key={d.id || d._id} value={d.id || d._id}>
                    {d.company} — {d.title || d.role} ({d.status || (d.isActive ? "ACTIVE" : "CLOSED")})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Assessment eligibility will be automatically enforced based on this placement drive.
              </p>
            </div>
          )}

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-indigo-950">Draft-to-Publish Workflow:</span>
              <span className="text-indigo-800/90">
                New blueprints start as drafts so you can assemble and verify questions. Once questions are ready, click <strong>Publish</strong> to instantly make the assessment live and accessible to students.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createLoading}
            >
              {createLoading ? "Creating..." : "Create Draft & Open Builder"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AssessmentListPage;
