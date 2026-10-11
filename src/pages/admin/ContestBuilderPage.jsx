import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  Code2,
  BookOpen,
  Layers,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  FileCode2,
  Check,
  ChevronRight,
  Sparkles,
  Briefcase,
  Calendar,
  Timer,
  Award,
  Users,
  Eye,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  X,
  Building
} from "lucide-react";
import { practiceService } from "../../services/practiceService";
import { placementService } from "../../services/placementService";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { DetailSkeleton } from "../../components/common/LoadingSkeleton";
import { useNotifications } from "../../context/NotificationContext";

export function ContestBuilderPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/branch") ? "/branch" : "/dept";
  const { addToast } = useNotifications();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Section Tab (Contests support CODING, APTITUDE, TECHNICAL)
  const [activeSection, setActiveSection] = useState("CODING");

  // Add Question Modal States (identical to Assessment Builder Question Bank)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankTypeFilter, setBankTypeFilter] = useState("ALL");
  const [bankCategoryFilter, setBankCategoryFilter] = useState("ALL");
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState("ALL");
  const [bankSourceTypeFilter, setBankSourceTypeFilter] = useState("ALL");
  const [bankPage, setBankPage] = useState(1);
  const [bankLimit] = useState(15);
  const [bankPagination, setBankPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  // Multi-Select Batch Add
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState([]);
  const [batchAdding, setBatchAdding] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Single Question Add Modal / Configuration
  const [selectedBankQuestion, setSelectedBankQuestion] = useState(null);
  const [addPayload, setAddPayload] = useState({
    section: "CODING",
    marks: 10.0,
    negativeMarks: 0.0
  });
  const [addingLoading, setAddingLoading] = useState(false);

  // Publish Modal State
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  // Fetch Contest Details
  const fetchContest = useCallback(async () => {
    if (!contestId || contestId === "undefined") {
      setError("No valid contest ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await practiceService.getContestById(contestId);
      const data = res?.data?.id ? res.data : res;
      setContest(data);
    } catch (err) {
      setError(err?.message || "Failed to retrieve contest details.");
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    fetchContest();
  }, [fetchContest]);

  // Sync default add section with activeSection
  useEffect(() => {
    setAddPayload(prev => ({
      ...prev,
      section: activeSection,
      marks: activeSection === "CODING" ? 10.0 : 2.0
    }));
  }, [activeSection]);

  // Fetch Question Bank questions for modal
  const fetchBankQuestions = useCallback(async () => {
    setBankLoading(true);
    try {
      const targetType = bankTypeFilter !== "ALL" ? bankTypeFilter : activeSection;
      const res = await practiceService.getAdminQuestions({
        status: "ACTIVE",
        type: targetType !== "ALL" ? targetType : undefined,
        category: bankCategoryFilter !== "ALL" ? bankCategoryFilter : undefined,
        difficulty: bankDifficultyFilter !== "ALL" ? bankDifficultyFilter : undefined,
        sourceType: bankSourceTypeFilter !== "ALL" ? bankSourceTypeFilter : undefined,
        search: bankSearch.trim() || undefined,
        page: bankPage,
        limit: bankLimit
      });

      const items = res?.data || (Array.isArray(res) ? res : []);
      const pinnedVersionIds = new Set(contest?.questions?.map((q) => q.questionVersionId) || []);
      const filtered = items.filter((q) => !pinnedVersionIds.has(q.id) && !pinnedVersionIds.has(q.activeVersionId));

      const paginationMeta = res?.pagination || {
        total: filtered.length,
        page: bankPage,
        limit: bankLimit,
        totalPages: Math.ceil(filtered.length / bankLimit) || 1
      };

      setBankQuestions(filtered);
      setBankPagination(paginationMeta);
    } catch (err) {
      setBankQuestions([]);
      addToast({
        type: "error",
        title: "Question Bank Error",
        message: err?.message || "Failed to load questions from repository."
      });
    } finally {
      setBankLoading(false);
    }
  }, [bankTypeFilter, activeSection, bankCategoryFilter, bankDifficultyFilter, bankSourceTypeFilter, bankSearch, bankPage, bankLimit, contest, addToast]);

  useEffect(() => {
    if (addModalOpen) {
      fetchBankQuestions();
    }
  }, [addModalOpen, fetchBankQuestions]);

  // Single Question Add handler
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedBankQuestion) return;

    const latestVersion = selectedBankQuestion.versions?.[0];
    const versionId = latestVersion?.id || selectedBankQuestion.versionId;

    if (!versionId) {
      addToast({ type: "error", message: "Question version reference not found." });
      return;
    }

    setAddingLoading(true);
    try {
      await practiceService.addContestQuestion(contestId, {
        questionVersionId: versionId,
        section: addPayload.section,
        marks: parseFloat(addPayload.marks) || 1.0,
        negativeMarks: parseFloat(addPayload.negativeMarks) || 0.0
      });

      addToast({
        type: "success",
        title: "Question Added",
        message: `Successfully pinned problem to ${addPayload.section} section.`
      });

      setSelectedBankQuestion(null);
      setAddModalOpen(false);
      fetchContest();
    } catch (err) {
      addToast({
        type: "error",
        title: "Cannot Add Question",
        message: err?.message || "Failed to add question to contest."
      });
    } finally {
      setAddingLoading(false);
    }
  };

  // Batch Add handler for multi-selected questions
  const handleBatchAddQuestions = async () => {
    if (selectedBankQuestionIds.length === 0) return;

    setBatchAdding(true);
    setBatchProgress({ current: 0, total: selectedBankQuestionIds.length });

    let addedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < selectedBankQuestionIds.length; i++) {
      const qId = selectedBankQuestionIds[i];
      const q = bankQuestions.find(item => item.id === qId);
      const versionId = q?.versions?.[0]?.id || q?.versionId;

      if (versionId) {
        try {
          await practiceService.addContestQuestion(contestId, {
            questionVersionId: versionId,
            section: activeSection,
            marks: activeSection === "CODING" ? 10.0 : 2.0,
            negativeMarks: 0.0
          });
          addedCount++;
        } catch (_) {
          failedCount++;
        }
      }
      setBatchProgress({ current: i + 1, total: selectedBankQuestionIds.length });
    }

    setBatchAdding(false);
    setSelectedBankQuestionIds([]);
    setAddModalOpen(false);

    if (addedCount > 0) {
      addToast({
        type: "success",
        title: "Batch Addition Completed",
        message: `Added ${addedCount} questions to ${activeSection} section.${failedCount > 0 ? ` (${failedCount} skipped or already added)` : ""}`
      });
      fetchContest();
    } else {
      addToast({
        type: "error",
        title: "Batch Add Failed",
        message: "None of the selected questions could be added. They may already be in the contest or of mismatched type."
      });
    }
  };

  // Remove Question
  const handleRemoveQuestion = async (contestQuestionId) => {
    if (contest.status !== "DRAFT") {
      addToast({ type: "error", message: "Cannot modify questions in locked contest." });
      return;
    }

    try {
      await practiceService.removeContestQuestion(contestId, contestQuestionId);
      addToast({ type: "info", message: "Question removed from contest." });
      fetchContest();
    } catch (err) {
      addToast({
        type: "error",
        title: "Removal Failed",
        message: err?.message || "Failed to remove question."
      });
    }
  };

  // Reorder Questions in Section
  const handleMoveQuestion = async (index, direction) => {
    if (contest.status !== "DRAFT") return;
    const sectionQuestions = (contest.questions || []).filter(q => q.section === activeSection);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sectionQuestions.length) return;

    const reordered = [...sectionQuestions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const questionOrders = reordered.map((item, idx) => ({
      contestQuestionId: item.id,
      order: idx + 1
    }));

    try {
      await practiceService.reorderContestQuestions(contestId, { questionOrders });
      fetchContest();
    } catch (err) {
      addToast({ type: "error", message: "Failed to reorder questions." });
    }
  };

  // Publish Contest Handler
  const handlePublishContest = async () => {
    if (!contest) return;
    if ((contest.questions || []).length === 0) {
      addToast({
        type: "error",
        title: "Empty Contest",
        message: "You must add at least one question before publishing the contest."
      });
      return;
    }

    setPublishLoading(true);
    try {
      await practiceService.publishContest(contestId);
      addToast({
        type: "success",
        title: "Contest Published!",
        message: "The contest is now officially scheduled. Students can view the countdown and will be permitted to start during the active window."
      });
      setPublishModalOpen(false);
      fetchContest();
    } catch (err) {
      addToast({
        type: "error",
        title: "Publication Failed",
        message: err?.message || "Failed to publish contest."
      });
    } finally {
      setPublishLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="p-3 bg-red-100 text-red-600 rounded-full w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Contest Not Found</h2>
        <p className="text-sm text-slate-600">{error || "Unable to locate contest data."}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/contests`)}>
          Back to Contests
        </Button>
      </div>
    );
  }

  const isLocked = contest.status !== "DRAFT";
  const questionsList = contest.questions || [];
  const sectionQuestions = questionsList.filter(q => q.section === activeSection);
  const nowMs = Date.now();
  const startMs = new Date(contest.startAt).getTime();
  const endMs = new Date(contest.endAt).getTime();
  const isLive = !isLocked ? false : (nowMs >= startMs && nowMs < endMs);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Navigation & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={() => navigate(`${basePath}/contests`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Contests</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {contest.title}
            </h1>

            {isLocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-600" />
                {isLive ? "LIVE NOW" : contest.status}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Unlock className="w-3 h-3 text-amber-600" />
                DRAFT (Assembly Mode)
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {contest.description || "Timed competition platform. Questions and scoring rules are permanently pinned upon publication."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {contest.status !== "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`${basePath}/contests/${contest.id}/leaderboard`)}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 border-amber-300 bg-amber-50/50 hover:bg-amber-100/50"
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Live Leaderboard</span>
            </Button>
          )}

          {!isLocked ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPublishModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Publish & Lock Contest</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Configuration Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Window Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Starts At</span>
              <span className="text-xs font-bold text-slate-900">
                {new Date(contest.startAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Ends At</span>
              <span className="text-xs font-bold text-slate-900">
                {new Date(contest.endAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Test Duration</span>
              <span className="text-xs font-bold text-slate-900">
                {contest.durationMinutes} Minutes (Per Attempt)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Total Marks</span>
              <span className="text-xs font-bold text-slate-900">
                {contest.totalMarks || 0} Marks ({questionsList.length} Problems)
              </span>
            </div>
          </div>
        </div>

        {Array.isArray(contest.branchIds) && contest.branchIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center gap-2 text-xs text-amber-900 font-medium">
            <Building className="w-3.5 h-3.5 text-amber-700" />
            <span>Target Eligible Branches:</span>
            <div className="flex flex-wrap gap-1">
              {contest.branchIds.map(b => (
                <span key={b} className="bg-white/80 border border-amber-300 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Studio Area: Left Question List & Right Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Sections & Question List (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Section Navigation Tabs & Add Question Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "CODING", label: "Coding Section", icon: Code2 },
                { id: "APTITUDE", label: "Aptitude Section", icon: BookOpen },
                { id: "TECHNICAL", label: "Technical MCQs", icon: Layers }
              ].map(({ id, label, icon: Icon }) => {
                const count = questionsList.filter(q => q.section === id).length;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeSection === id
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeSection === id ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {!isLocked && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add from Question Bank</span>
              </Button>
            )}
          </div>

          {/* Questions in Section */}
          {sectionQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Code2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">
                No Questions in {activeSection} Section
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Add challenges from the institution question bank or curated repository.
              </p>
              {!isLocked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddModalOpen(true)}
                  className="text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Browse Question Bank
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sectionQuestions.map((cq, index) => {
                const qv = cq.questionVersion;
                const pq = qv?.question;
                const title = qv?.title || qv?.statement || `Problem #${cq.order}`;
                const diff = pq?.difficulty || "MEDIUM";

                return (
                  <div
                    key={cq.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs shrink-0">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            diff === "EASY"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : diff === "HARD"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {diff}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          {qv?.statement || "Algorithmic programming task with test case suite."}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Award className="w-3 h-3 text-amber-600" />
                            {cq.marks} Marks
                          </span>
                          {parseFloat(cq.negativeMarks) > 0 && (
                            <span className="text-rose-600 font-semibold">
                              -{cq.negativeMarks} Neg
                            </span>
                          )}
                          <span className="text-slate-400">
                            Category: {pq?.category || "Core"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isLocked && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveQuestion(index, -1)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === sectionQuestions.length - 1}
                          onClick={() => handleMoveQuestion(index, 1)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(cq.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer ml-1"
                          title="Remove from contest"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Contest Blueprint & Rules (1 col) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Contest Blueprint</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-slate-800">{contest.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Duration</span>
                <span className="font-bold text-slate-800">{contest.durationMinutes} Mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Questions</span>
                <span className="font-bold text-slate-800">{questionsList.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Marks</span>
                <span className="font-bold text-slate-800">{contest.totalMarks}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 block mb-2">Section Breakdown</span>
              <div className="space-y-1.5 text-xs">
                {["CODING", "APTITUDE", "TECHNICAL"].map(sec => {
                  const secItems = questionsList.filter(q => q.section === sec);
                  const marks = secItems.reduce((acc, q) => acc + parseFloat(q.marks || 0), 0);
                  return (
                    <div key={sec} className="flex items-center justify-between text-slate-600">
                      <span>{sec === "CODING" ? "Coding" : sec === "APTITUDE" ? "Aptitude" : "Technical"}:</span>
                      <span className="font-semibold">{secItems.length} ({marks} marks)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
            <span className="font-bold text-slate-900 block">Competition Guidelines</span>
            <p className="whitespace-pre-line text-slate-600 font-mono text-[11px] leading-relaxed">
              {contest.instructions || "Standard competitive penalty rules apply."}
            </p>
          </div>
        </div>
      </div>

      {/* Question Bank Modal (Browse, Filter, Multi-select or Single Add) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setSelectedBankQuestion(null);
          setSelectedBankQuestionIds([]);
        }}
        title={`Add Questions to ${activeSection} Section`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search question titles, tags, topics..."
                value={bankSearch}
                onChange={(e) => {
                  setBankSearch(e.target.value);
                  setBankPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <select
                value={bankDifficultyFilter}
                onChange={(e) => {
                  setBankDifficultyFilter(e.target.value);
                  setBankPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <select
                value={bankSourceTypeFilter}
                onChange={(e) => {
                  setBankSourceTypeFilter(e.target.value);
                  setBankPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value="ALL">All Sources</option>
                <option value="COLLEGE_CREATED">College Created</option>
                <option value="CURATED">Curated Platform</option>
              </select>
            </div>
          </div>

          {/* Multi-Select Action Bar if items selected */}
          {selectedBankQuestionIds.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">
                {selectedBankQuestionIds.length} question(s) selected for batch addition
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBankQuestionIds([])}
                  className="text-xs"
                >
                  Clear Selection
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={batchAdding}
                  onClick={handleBatchAddQuestions}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  {batchAdding
                    ? `Adding (${batchProgress.current}/${batchProgress.total})...`
                    : `Batch Add to ${activeSection}`}
                </Button>
              </div>
            </div>
          )}

          {/* Question List */}
          {bankLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Querying Question Bank...</p>
            </div>
          ) : bankQuestions.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">No matching questions found</p>
              <p className="text-[11px] text-slate-500">Try relaxing your search terms or filter constraints.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {bankQuestions.map((q) => {
                const latestVersion = q.versions?.[0];
                const title = latestVersion?.title || latestVersion?.statement || "Untitled Challenge";
                const isSelected = selectedBankQuestionIds.includes(q.id);
                const isAlreadyInContest = questionsList.some(
                  cq => cq.questionVersionId === latestVersion?.id
                );

                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${
                      isAlreadyInContest
                        ? "bg-slate-50/70 border-slate-200 opacity-60"
                        : isSelected
                        ? "bg-amber-50/70 border-amber-300"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        disabled={isAlreadyInContest}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedBankQuestionIds(prev =>
                            prev.includes(q.id) ? prev.filter(x => x !== q.id) : [...prev, q.id]
                          );
                        }}
                        className="w-4 h-4 text-amber-600 rounded-sm cursor-pointer disabled:opacity-30"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-900 truncate">{title}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.2 bg-slate-100 text-slate-600 rounded-md">
                            {q.type}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            q.difficulty === "EASY"
                              ? "bg-emerald-50 text-emerald-700"
                              : q.difficulty === "HARD"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          Category: {q.category} {q.subject?.name ? `• ${q.subject.name}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAlreadyInContest ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Added
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBankQuestion(q);
                          }}
                          className="text-xs"
                        >
                          Configure & Add
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Pagination */}
          {bankPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Page {bankPage} of {bankPagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bankPage === 1}
                  onClick={() => setBankPage(p => Math.max(1, p - 1))}
                  className="text-xs"
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bankPage === bankPagination.totalPages}
                  onClick={() => setBankPage(p => Math.min(bankPagination.totalPages, p + 1))}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Single Question Configure Modal */}
      {selectedBankQuestion && (
        <Modal
          isOpen={Boolean(selectedBankQuestion)}
          onClose={() => setSelectedBankQuestion(null)}
          title="Configure Question Marks"
        >
          <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block text-sm mb-1">
                {selectedBankQuestion.versions?.[0]?.title || selectedBankQuestion.versions?.[0]?.statement || "Selected Problem"}
              </span>
              <span className="text-slate-500 text-xs">
                Difficulty: {selectedBankQuestion.difficulty} • Type: {selectedBankQuestion.type}
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contest Section</label>
              <select
                value={addPayload.section}
                onChange={(e) => setAddPayload({ ...addPayload, section: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="CODING">Coding Section</option>
                <option value="APTITUDE">Aptitude Section</option>
                <option value="TECHNICAL">Technical Section</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Award Marks</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={addPayload.marks}
                  onChange={(e) => setAddPayload({ ...addPayload, marks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Negative Penalty</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={addPayload.negativeMarks}
                  onChange={(e) => setAddPayload({ ...addPayload, negativeMarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedBankQuestion(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={addingLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {addingLoading ? "Adding..." : "Add Problem to Contest"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Publish Confirmation Modal */}
      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish & Lock Contest"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Important Publishing Notice</span>
              <span>
                Publishing this contest will transition its state to <strong>PUBLISHED</strong>. All {questionsList.length} questions and scoring criteria will be permanently locked against modification to ensure competitive integrity.
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-500">Scheduled Start:</span>
              <span className="text-slate-800">{new Date(contest.startAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-500">Scheduled End:</span>
              <span className="text-slate-800">{new Date(contest.endAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-500">Attempt Duration:</span>
              <span className="text-slate-800">{contest.durationMinutes} Minutes</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPublishModalOpen(false)}
              disabled={publishLoading}
            >
              Back to Editing
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={publishLoading}
              onClick={handlePublishContest}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {publishLoading ? "Publishing..." : "Confirm & Publish Contest"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default ContestBuilderPage;
