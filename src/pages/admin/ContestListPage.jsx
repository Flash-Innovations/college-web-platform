import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Trophy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Code2,
  BookOpen,
  Building,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileCode2,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Briefcase,
  Users,
  Timer,
  XCircle,
  ExternalLink,
  Trash2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { practiceService } from "../../services/practiceService";
import { placementService } from "../../services/placementService";
import { institutionService } from "../../services/institutionService";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";

export function ContestListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/branch") ? "/branch" : "/dept";
  const { addToast } = useNotifications();

  // Role permissions
  const isBranchAdmin = user?.role === "branch_admin" || Boolean(user?.branchName);
  const isTpo = (user?.role === "tpo" || user?.role === "placement") ||
    Boolean(user?.departmentName?.toLowerCase().includes("tpo") || user?.departmentName?.toLowerCase().includes("placement"));
  const canCreate = !isTpo;

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalContests, setTotalContests] = useState(0);

  // Data & Loading States
  const [contests, setContests] = useState([]);
  const [drivesList, setDrivesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newContest, setNewContest] = useState({
    title: "",
    description: "",
    instructions: "1. Maintain integrity and do not switch browser tabs.\n2. Submissions will be graded instantly against all hidden test cases.\n3. Standard competitive penalty: 10 minutes per wrong submission.",
    startAt: "",
    endAt: "",
    durationMinutes: 90,
    sipsDriveId: ""
  });

  // Delete Modal State
  const [deleteModalContest, setDeleteModalContest] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteContest = async () => {
    if (!deleteModalContest) return;
    setDeleteLoading(true);
    try {
      await practiceService.deleteContest(deleteModalContest.id);
      addToast("Contest deleted successfully", "success");
      setDeleteModalContest(null);
      fetchContests();
    } catch (err) {
      addToast(err?.message || "Failed to delete contest", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

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

  const fetchContests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await practiceService.getAdminContests({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: search.trim() || undefined,
        limit,
        offset: (page - 1) * limit
      });

      const contestData = res?.data?.contests || res?.contests || [];
      const totalCount = res?.data?.total ?? res?.total ?? contestData.length;
      setContests(Array.isArray(contestData) ? contestData : []);
      setTotalContests(totalCount);
    } catch (err) {
      setError(err?.message || "Failed to load contests.");
      setContests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, limit]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  const handleCreateContest = async (e) => {
    e.preventDefault();
    if (!newContest.title.trim()) {
      addToast({ type: "error", message: "Contest title is required." });
      return;
    }
    if (!newContest.startAt || !newContest.endAt) {
      addToast({ type: "error", message: "Please select both start and end dates/times." });
      return;
    }

    const startMs = new Date(newContest.startAt).getTime();
    const endMs = new Date(newContest.endAt).getTime();
    if (endMs <= startMs) {
      addToast({ type: "error", message: "Contest End Time must be strictly after Start Time." });
      return;
    }

    const duration = parseInt(newContest.durationMinutes, 10) || 60;
    const windowMinutes = Math.floor((endMs - startMs) / (60 * 1000));
    if (duration > windowMinutes) {
      addToast({ type: "error", message: `Attempt duration (${duration} mins) cannot exceed the calendar window (${windowMinutes} mins).` });
      return;
    }

    setCreateLoading(true);
    try {
      const resolvedBranches = isBranchAdmin
        ? [...new Set([user?.branchId, user?.branchCode, user?.branchName, user?.branch].filter(Boolean))]
        : selectedBranchIds;

      const payload = {
        title: newContest.title.trim(),
        description: newContest.description?.trim() || null,
        instructions: newContest.instructions?.trim() || null,
        startAt: new Date(newContest.startAt).toISOString(),
        endAt: new Date(newContest.endAt).toISOString(),
        durationMinutes: duration,
        branchIds: resolvedBranches,
        sipsDriveId: newContest.sipsDriveId?.trim() || null
      };

      const res = await practiceService.createContest(payload);
      const created = res?.data || res;
      addToast({
        type: "success",
        title: "Contest Created",
        message: "Your contest draft has been initialized. Launching the Question Studio."
      });

      setCreateModalOpen(false);
      setNewContest({
        title: "",
        description: "",
        instructions: "1. Maintain integrity and do not switch browser tabs.\n2. Submissions will be graded instantly against all hidden test cases.\n3. Standard competitive penalty: 10 minutes per wrong submission.",
        startAt: "",
        endAt: "",
        durationMinutes: 90,
        sipsDriveId: ""
      });

      if (created?.id) {
        navigate(`${basePath}/contests/${created.id}`);
      } else {
        fetchContests();
      }
    } catch (err) {
      addToast({
        type: "error",
        title: "Creation Failed",
        message: err?.message || "Failed to create contest."
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusBadge = (status, startAt, endAt) => {
    const now = Date.now();
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();

    if (status === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Draft
        </span>
      );
    }

    if (status === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-500" />
          Cancelled
        </span>
      );
    }

    if (now >= startMs && now < endMs) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          LIVE NOW
        </span>
      );
    }

    if (now < startMs) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Clock className="w-3 h-3 text-indigo-500" />
          Scheduled
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <CheckCircle2 className="w-3 h-3 text-slate-500" />
        Ended
      </span>
    );
  };

  // Stats calculation
  const totalPages = Math.ceil(totalContests / limit) || 1;
  const now = Date.now();
  const liveCount = contests.filter(c => c.status !== "DRAFT" && c.status !== "CANCELLED" && now >= new Date(c.startAt).getTime() && now < new Date(c.endAt).getTime()).length;
  const scheduledCount = contests.filter(c => c.status !== "DRAFT" && c.status !== "CANCELLED" && now < new Date(c.startAt).getTime()).length;
  const draftCount = contests.filter(c => c.status === "DRAFT").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Contests & Hackathons
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Host competitive coding rounds, live timed hackathons, and departmental skill tournaments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContests}
            disabled={loading}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Contest</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total Contests</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{totalContests}</span>
            <Trophy className="w-5 h-5 text-slate-300" />
          </div>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 block mb-1">Live Right Now</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-600">{liveCount}</span>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-indigo-200 bg-indigo-50/20 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-indigo-800 block mb-1">Upcoming</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-indigo-600">{scheduledCount}</span>
            <Clock className="w-5 h-5 text-indigo-300" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">In Draft</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-700">{draftCount}</span>
            <Layers className="w-5 h-5 text-slate-300" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contests by title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {["ALL", "LIVE", "UPCOMING", "DRAFT", "ENDED"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {tab === "LIVE" ? "Live" : tab === "UPCOMING" ? "Scheduled" : tab === "DRAFT" ? "Drafts" : tab === "ENDED" ? "Ended" : "All Contests"}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading contests studio...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900">Failed to load contests</h3>
          <p className="text-xs text-red-700 mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchContests} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : contests.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Contests Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {search || statusFilter !== "ALL"
              ? "No contests match your current search query or status filter."
              : "Schedule your first departmental coding contest, hackathon or speedrun tournament."}
          </p>
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Schedule New Contest</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.map((c) => {
            const startStr = new Date(c.startAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            const endStr = new Date(c.endAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            const totalQ = c.totalQuestions || c._count?.questions || 0;
            const attemptsCount = c.attemptCount || c._count?.attempts || 0;

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    {getStatusBadge(c.status, c.startAt, c.endAt)}
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 flex items-center gap-1">
                      <Timer className="w-3 h-3 text-slate-400" />
                      {c.durationMinutes}m test
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1 mb-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {c.description || "Competitive programming contest with timed windows and automated test cases."}
                  </p>

                  {/* Window Details Box */}
                  <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Starts
                      </span>
                      <span className="font-semibold text-slate-800">{startStr}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Ends
                      </span>
                      <span className="font-semibold text-slate-800">{endStr}</span>
                    </div>
                  </div>

                  {/* Badges / Scope */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      <FileCode2 className="w-3 h-3 text-slate-500" />
                      {totalQ} {totalQ === 1 ? "Problem" : "Problems"}
                    </span>

                    {c.totalMarks > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                        <Award className="w-3 h-3 text-amber-500" />
                        {c.totalMarks} Marks
                      </span>
                    )}

                    {Array.isArray(c.branchIds) && c.branchIds.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                        <Building className="w-3 h-3 text-indigo-500" />
                        {(() => {
                          const readable = c.branchIds.find(b => b && b.length !== 24) || c.branchIds[0];
                          return c.branchIds.length === 1 || (c.branchIds.length <= 4 && isBranchAdmin)
                            ? `Branch: ${readable}`
                            : `${c.branchIds.length} Branches`;
                        })()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        <Building className="w-3 h-3 text-slate-400" /> All Branches
                      </span>
                    )}

                    {c.sipsDriveId && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-md">
                        <Briefcase className="w-3 h-3 text-violet-500" /> Placement Drive
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <Users className="w-3 h-3" /> {attemptsCount} {attemptsCount === 1 ? "student" : "students"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {canCreate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModalContest(c);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 p-2"
                        title="Delete Contest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {c.status !== "DRAFT" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`${basePath}/contests/${c.id}/leaderboard`)}
                        className="text-xs flex items-center gap-1"
                      >
                        <Trophy className="w-3 h-3 text-amber-600" />
                        <span>Leaderboard</span>
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`${basePath}/contests/${c.id}`)}
                      className="text-xs bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <span>{c.status === "DRAFT" ? "Builder Studio" : "Manage"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 text-xs">
          <span className="text-slate-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalContests)} of {totalContests} contests
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>
            <span className="font-semibold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Schedule Contest Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule Contest / Hackathon"
      >
        <form onSubmit={handleCreateContest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contest Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Annual Speed Coding Championship 2026"
              value={newContest.title}
              onChange={(e) => setNewContest({ ...newContest, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief overview of the contest challenge..."
              value={newContest.description}
              onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Time Window Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-amber-50/50 border border-amber-200/70 rounded-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" /> Start Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={newContest.startAt}
                onChange={(e) => setNewContest({ ...newContest, startAt: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> End Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={newContest.endAt}
                onChange={(e) => setNewContest({ ...newContest, endAt: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-amber-200/50">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Per-Student Attempt Duration (Minutes)
                </label>
                <p className="text-[11px] text-slate-500">
                  Timer allocated once student clicks "Start Contest" inside the window.
                </p>
              </div>
              <input
                type="number"
                min="1"
                max="1440"
                required
                value={newContest.durationMinutes}
                onChange={(e) => setNewContest({ ...newContest, durationMinutes: e.target.value })}
                className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
              />
            </div>
          </div>

          {/* Branch Eligibility Scoping */}
          {isBranchAdmin ? (
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-center justify-between">
              <div>
                <span className="font-bold block text-slate-800">Eligible Branch:</span>
                <span className="text-slate-600">{user?.branchName || "My Branch"} {user?.branchCode ? `(${user.branchCode})` : ""}</span>
              </div>
              <Badge variant="primary" size="sm">Branch Bound</Badge>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Target Eligible Branches <span className="text-slate-400 font-normal">({selectedBranchIds.length === 0 ? "All Branches in Department" : `${selectedBranchIds.length} Selected`})</span>
                </label>
                {branchesList.length > 0 && (
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedBranchIds(branchesList.map(b => b.code || b.name || b._id))}
                      className="text-amber-700 hover:underline font-medium cursor-pointer"
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
                            ? "bg-amber-50 border-amber-300 text-amber-900 font-medium"
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
                          className="w-3.5 h-3.5 text-amber-600 rounded-sm"
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

          {/* Optional Drive Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Associate with Placement Drive <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <select
              value={newContest.sipsDriveId}
              onChange={(e) => setNewContest({ ...newContest, sipsDriveId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="">No Drive Attachment (Open Department Contest)</option>
              {drivesList.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.companyName || d.title} {d.jobRole ? `- ${d.jobRole}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contest Rules & Penalty Instructions
            </label>
            <textarea
              rows={3}
              value={newContest.instructions}
              onChange={(e) => setNewContest({ ...newContest, instructions: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
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
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
            >
              {createLoading ? "Creating Draft..." : "Continue to Question Studio"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteModalContest)}
        onClose={() => !deleteLoading && setDeleteModalContest(null)}
        title="Delete Contest"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Are you sure you want to permanently delete this contest?</p>
              <p className="mt-1 text-rose-600 leading-relaxed">
                This will delete <strong className="text-rose-950 font-bold">"{deleteModalContest?.title}"</strong>, including all pinned questions, submissions, and student attempts. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleteLoading}
              onClick={() => setDeleteModalContest(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={deleteLoading}
              onClick={handleDeleteContest}
              className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleteLoading ? "Deleting..." : "Permanently Delete"}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default ContestListPage;

