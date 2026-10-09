import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  Layers,
  Code2,
  Briefcase,
  Calculator,
  Compass,
  Cpu,
  Database,
  Binary,
  Network,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  FolderPlus,
  X,
  Tag,
  Globe,
  Share2,
  ArrowRight,
  School,
  Building2,
  GitBranch,
  Check,
  Filter
} from "lucide-react";
import { practiceService } from "../../services/practiceService";
import { institutionService } from "../../services/institutionService";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

const ICON_MAP = {
  Calculator,
  Compass,
  BookOpen,
  PieChart: TrendingUp,
  Binary,
  Database,
  Cpu,
  Network,
  Layers,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Award,
  TrendingUp,
  Code2
};

const COLOR_MAP = {
  indigo: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  sky: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  rose: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  violet: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
  teal: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800",
  blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
};

export function SubjectsPage() {
  const { addToast } = useNotifications();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const isInstitution = role === "institution" || role === "super_admin" || role === "admin";
  const isDepartment = role === "department";
  const isBranch = role === "branch";

  // Main Page View Mode: "CURRICULUM" (College active curriculum) | "GLOBAL_CATALOG" (Browse & Adopt SIPS standard library)
  const [viewMode, setViewMode] = useState("CURRICULUM");

  // State
  const [subjects, setSubjects] = useState([]);
  const [globalCatalog, setGlobalCatalog] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | TECHNICAL | NON_TECHNICAL | APTITUDE
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  // Expanded topics map { [subjectId]: boolean }
  const [expandedSubjects, setExpandedSubjects] = useState({});

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adoptModalOpen, setAdoptModalOpen] = useState(false);
  const [deptAssignModalOpen, setDeptAssignModalOpen] = useState(false);
  const [branchAssignModalOpen, setBranchAssignModalOpen] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedGlobalSubject, setSelectedGlobalSubject] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "TECHNICAL",
    description: "",
    icon: "BookOpen",
    color: "indigo",
    departmentIds: [],
    branchIds: [],
    isApplicableToAll: false,
    topics: []
  });

  const [topicInput, setTopicInput] = useState("");

  // Load college departments and branches for dynamic dropdowns
  const loadHierarchyData = useCallback(async () => {
    try {
      if (isInstitution || isDepartment) {
        const deptsRes = await institutionService.getDepartments();
        const depts = deptsRes?.departments || (Array.isArray(deptsRes) ? deptsRes : []);
        setDepartmentsList(depts);
      }

      if (isDepartment) {
        const branchesRes = await institutionService.getDepartmentBranches();
        const branches = branchesRes?.branches || (Array.isArray(branchesRes) ? branchesRes : []);
        setBranchesList(branches);
      }
    } catch (err) {
      console.warn("Could not load university hierarchy for dropdowns:", err);
    }
  }, [isInstitution, isDepartment]);

  // Fetch subjects
  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await practiceService.getSubjects({
        type: activeTab,
        departmentId: departmentFilter !== "ALL" ? departmentFilter : undefined,
        search: search.trim() || undefined
      });
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      setError(err.message || "Failed to load curriculum subjects.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, departmentFilter, search]);

  // Fetch global catalog
  const fetchGlobalCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const data = await practiceService.getGlobalCatalog({
        type: activeTab !== "ALL" ? activeTab : undefined,
        search: search.trim() || undefined
      });
      setGlobalCatalog(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load global catalog:", err);
    } finally {
      setCatalogLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    loadHierarchyData();
  }, [loadHierarchyData]);

  useEffect(() => {
    if (viewMode === "CURRICULUM") {
      fetchSubjects();
    } else {
      fetchGlobalCatalog();
    }
  }, [fetchSubjects, fetchGlobalCatalog, viewMode]);

  const toggleExpand = (subjectId) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  // Add a topic to current form
  const handleAddTopic = () => {
    if (!topicInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      topics: [...prev.topics, topicInput.trim()]
    }));
    setTopicInput("");
  };

  // Remove a topic from form
  const handleRemoveTopic = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Toggle department selection in form
  const handleToggleDepartment = (deptCodeOrId) => {
    setFormData((prev) => {
      const exists = prev.departmentIds.includes(deptCodeOrId);
      return {
        ...prev,
        departmentIds: exists
          ? prev.departmentIds.filter((d) => d !== deptCodeOrId)
          : [...prev.departmentIds, deptCodeOrId]
      };
    });
  };

  // Toggle branch selection in form
  const handleToggleBranch = (branchCodeOrId) => {
    setFormData((prev) => {
      const exists = prev.branchIds.includes(branchCodeOrId);
      return {
        ...prev,
        branchIds: exists
          ? prev.branchIds.filter((b) => b !== branchCodeOrId)
          : [...prev.branchIds, branchCodeOrId]
      };
    });
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      name: "",
      code: "",
      type: activeTab === "ALL" ? "TECHNICAL" : activeTab,
      description: "",
      icon: "BookOpen",
      color: "indigo",
      departmentIds: isDepartment && user?.departmentId ? [user.departmentId] : [],
      branchIds: isBranch && user?.branchId ? [user.branchId] : [],
      isApplicableToAll: false,
      topics: []
    });
    setTopicInput("");
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name || "",
      code: subject.code || "",
      type: subject.type || "TECHNICAL",
      description: subject.description || "",
      icon: subject.icon || "BookOpen",
      color: subject.color || "indigo",
      departmentIds: Array.isArray(subject.departmentIds) ? subject.departmentIds : [],
      branchIds: Array.isArray(subject.branchIds) ? subject.branchIds : [],
      isApplicableToAll: Boolean(subject.isApplicableToAll),
      topics: Array.isArray(subject.topics) ? subject.topics.map((t) => (typeof t === "string" ? t : t.name)) : []
    });
    setTopicInput("");
    setEditModalOpen(true);
  };

  // Open Adopt Modal
  const openAdoptModal = (globalSub) => {
    setSelectedGlobalSubject(globalSub);
    setFormData({
      departmentIds: [],
      branchIds: [],
      isApplicableToAll: Boolean(globalSub.isApplicableToAll)
    });
    setAdoptModalOpen(true);
  };

  // Open Department Assignment Modal
  const openDeptAssignModal = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      departmentIds: Array.isArray(subject.departmentIds) ? [...subject.departmentIds] : [],
      isApplicableToAll: Boolean(subject.isApplicableToAll)
    });
    setDeptAssignModalOpen(true);
  };

  // Open Branch Assignment Modal
  const openBranchAssignModal = async (subject) => {
    setSelectedSubject(subject);
    setFormData({
      branchIds: Array.isArray(subject.branchIds) ? [...subject.branchIds] : []
    });

    // Load branches for the user's department if not loaded
    if (branchesList.length === 0) {
      try {
        const branchesRes = await institutionService.getDepartmentBranches();
        const branches = branchesRes?.branches || (Array.isArray(branchesRes) ? branchesRes : []);
        setBranchesList(branches);
      } catch (e) {}
    }

    setBranchAssignModalOpen(true);
  };

  // Submit Create Subject
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast("Subject name is required", "error");
      return;
    }

    setModalLoading(true);
    try {
      await practiceService.createSubject({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || undefined,
        type: formData.type,
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        color: formData.color,
        departmentIds: formData.departmentIds,
        branchIds: formData.branchIds,
        isApplicableToAll: formData.isApplicableToAll,
        topics: formData.topics
      });

      addToast(`Subject '${formData.name}' created successfully`, "success");
      setCreateModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error("Failed to create subject:", err);
      addToast(err.message || "Failed to create subject", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Edit Subject
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast("Subject name is required", "error");
      return;
    }

    setModalLoading(true);
    try {
      await practiceService.updateSubject(selectedSubject.id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || undefined,
        type: formData.type,
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        color: formData.color,
        departmentIds: formData.departmentIds,
        branchIds: formData.branchIds,
        isApplicableToAll: formData.isApplicableToAll,
        topics: formData.topics
      });

      addToast(`Subject '${formData.name}' updated successfully`, "success");
      setEditModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error("Failed to update subject:", err);
      addToast(err.message || "Failed to update subject", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Adopt Global Subject
  const handleAdoptSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGlobalSubject) return;

    setModalLoading(true);
    try {
      await practiceService.adoptGlobalSubject({
        globalSubjectId: selectedGlobalSubject.id,
        departmentIds: formData.departmentIds,
        branchIds: formData.branchIds,
        isApplicableToAll: formData.isApplicableToAll
      });

      addToast(`Adopted '${selectedGlobalSubject.name}' into university curriculum`, "success");
      setAdoptModalOpen(false);
      setViewMode("CURRICULUM");
      fetchSubjects();
    } catch (err) {
      console.error("Failed to adopt global subject:", err);
      addToast(err.message || "Failed to adopt subject", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Department Assignment
  const handleDeptAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return;

    setModalLoading(true);
    try {
      await practiceService.assignDepartmentSubjects(selectedSubject.id, {
        departmentIds: formData.departmentIds,
        isApplicableToAll: formData.isApplicableToAll
      });

      addToast(`Department allocation updated for '${selectedSubject.name}'`, "success");
      setDeptAssignModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error("Failed to assign departments:", err);
      addToast(err.message || "Failed to assign departments", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Branch Assignment
  const handleBranchAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return;

    setModalLoading(true);
    try {
      await practiceService.assignBranchSubjects(selectedSubject.id, {
        branchIds: formData.branchIds
      });

      addToast(`Branch access granted for '${selectedSubject.name}'`, "success");
      setBranchAssignModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error("Failed to assign branches:", err);
      addToast(err.message || "Failed to assign branches", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Delete Subject
  const handleDeleteSubmit = async () => {
    if (!selectedSubject) return;

    setModalLoading(true);
    try {
      await practiceService.deleteSubject(selectedSubject.id);
      addToast(`Subject '${selectedSubject.name}' deleted successfully`, "success");
      setDeleteModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error("Failed to delete subject:", err);
      addToast(err.message || "Failed to delete subject", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const getSubjectIcon = (iconName) => {
    return ICON_MAP[iconName] || BookOpen;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800">
              <School className="w-3.5 h-3.5" />
              {isInstitution ? "University Master Curriculum" : isDepartment ? "Department Curriculum Portal" : "Branch Curriculum & Questions"}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Prisma Multi-Tenant Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Curriculum, Subjects & Syllabus Modules
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            {isInstitution
              ? "Govern university-wide academic curriculum, adopt standard global question repositories, and allocate subjects across engineering and management departments."
              : isDepartment
              ? "Manage subjects assigned to your academic department and allocate access to specific degree programs and branches."
              : "Curate question banks, add custom questions, and assemble assessments for subjects assigned to your branch."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("CURRICULUM")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "CURRICULUM"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Active Curriculum
            </button>
            <button
              onClick={() => setViewMode("GLOBAL_CATALOG")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "GLOBAL_CATALOG"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Global SIPS Catalog
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={loading || catalogLoading}
            onClick={viewMode === "CURRICULUM" ? fetchSubjects : fetchGlobalCatalog}
          >
            Refresh
          </Button>

          {isInstitution && viewMode === "CURRICULUM" && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openCreateModal}
              className="shadow-sm"
            >
              Create Custom Subject
            </Button>
          )}
        </div>
      </div>

      {/* Global Catalog Banner (When in Global Catalog mode) */}
      {viewMode === "GLOBAL_CATALOG" && (
        <Card className="p-5 border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/60 dark:from-indigo-950/20 dark:via-slate-900 dark:to-sky-950/20 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  SIPS Master Global Question & Subject Repository
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pre-vetted, industry-standard subjects and 2,000+ evaluated questions across Aptitude, Computer Science Core, and Business Management. Pick and adopt any standard subject to immediately activate it for your college departments.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Stream Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "ALL", label: "All Streams", icon: Layers },
            { id: "APTITUDE", label: "Aptitude & General", icon: Calculator },
            { id: "TECHNICAL", label: "Engineering & Tech", icon: Binary },
            { id: "NON_TECHNICAL", label: "Management & Commerce", icon: Briefcase }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Department Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {viewMode === "CURRICULUM" && departmentsList.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map((d) => (
                <option key={d._id || d.id || d.code} value={d.code || d.name}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={viewMode === "CURRICULUM" ? "Search subjects or codes..." : "Search global repository..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "CURRICULUM" ? (
        /* ACTIVE CURRICULUM VIEW */
        loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading university curriculum subjects...</p>
          </div>
        ) : error ? (
          <Card className="p-6 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Failed to Load Subjects</h3>
            <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchSubjects}>
              Try Again
            </Button>
          </Card>
        ) : subjects.length === 0 ? (
          <Card className="p-12 text-center space-y-4 border-dashed border-2 border-slate-200 dark:border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">No Curriculum Subjects Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {search ? "No subjects match your search filter." : "You haven't added or adopted any subjects yet. Create a custom subject or pick from the Global Catalog."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" icon={Globe} onClick={() => setViewMode("GLOBAL_CATALOG")}>
                Browse Global Catalog
              </Button>
              {isInstitution && (
                <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
                  Create Custom Subject
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((sub) => {
              const IconComponent = getSubjectIcon(sub.icon);
              const colorClasses = COLOR_MAP[sub.color] || COLOR_MAP.indigo;
              const isExpanded = !!expandedSubjects[sub.id];
              const topics = Array.isArray(sub.topics) ? sub.topics : [];
              const deptTags = Array.isArray(sub.departmentIds) ? sub.departmentIds : [];
              const branchTags = Array.isArray(sub.branchIds) ? sub.branchIds : [];

              return (
                <Card
                  key={sub.id}
                  className="p-5 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${colorClasses}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          {sub.code && (
                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                              {sub.code}
                            </span>
                          )}
                          <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {sub.name}
                          </h3>
                        </div>
                      </div>

                      {/* Top Right Actions */}
                      <div className="flex items-center gap-1">
                        {isInstitution && (
                          <>
                            <button
                              onClick={() => openEditModal(sub)}
                              title="Edit Subject"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSubject(sub);
                                setDeleteModalOpen(true);
                              }}
                              title="Delete Subject"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {sub.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {sub.description}
                      </p>
                    )}

                    {/* Allocation Badges */}
                    <div className="space-y-1.5 pt-1">
                      {sub.isApplicableToAll ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3 h-3" /> Universal (All Students)
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {/* Department tags */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Depts:</span>
                            {deptTags.length > 0 ? (
                              deptTags.map((dept, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700"
                                >
                                  {dept}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                            )}
                          </div>

                          {/* Branch tags */}
                          {branchTags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Branches:</span>
                              {branchTags.map((br, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-800"
                                >
                                  {br}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Topics Accordion */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                      <button
                        onClick={() => toggleExpand(sub.id)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors py-1"
                      >
                        <span>Syllabus Modules ({topics.length} Topics)</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {isExpanded && (
                        <div className="pt-2 space-y-1 animate-in fade-in duration-200">
                          {topics.length > 0 ? (
                            topics.map((t, idx) => (
                              <div
                                key={idx}
                                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <span>{typeof t === "string" ? t : t.name}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-400 italic py-1">No topics defined yet.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                      <span className="font-bold text-slate-900 dark:text-white">{sub.questionCount || 0}</span>
                      <span>questions linked</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isInstitution && !sub.isApplicableToAll && (
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Building2}
                          onClick={() => openDeptAssignModal(sub)}
                          className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        >
                          Depts
                        </Button>
                      )}

                      {isDepartment && !sub.isApplicableToAll && (
                        <Button
                          variant="outline"
                          size="xs"
                          icon={GitBranch}
                          onClick={() => openBranchAssignModal(sub)}
                          className="text-indigo-600 dark:text-indigo-400 border-indigo-200"
                        >
                          Grant Branches
                        </Button>
                      )}

                      {isBranch && (
                        <Button
                          variant="primary"
                          size="xs"
                          icon={ArrowRight}
                          onClick={() => navigate(`/admin/questions?subjectId=${sub.id}`)}
                        >
                          Questions
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* GLOBAL SIPS CATALOG VIEW */
        catalogLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading SIPS global repository...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {globalCatalog.map((sub) => {
              const IconComponent = getSubjectIcon(sub.icon);
              const colorClasses = COLOR_MAP[sub.color] || COLOR_MAP.indigo;
              const topics = Array.isArray(sub.topics) ? sub.topics : [];
              const isAlreadyAdopted = subjects.some((s) => s.code === sub.code);

              return (
                <Card
                  key={sub.id}
                  className="p-5 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${colorClasses}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                            {sub.code}
                          </span>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {sub.name}
                          </h3>
                        </div>
                      </div>

                      <Badge variant="primary" size="xs">
                        Global Standard
                      </Badge>
                    </div>

                    {sub.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {sub.description}
                      </p>
                    )}

                    {/* Topics preview */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {topics.slice(0, 4).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                        >
                          {typeof t === "string" ? t : t.name}
                        </span>
                      ))}
                      {topics.length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/50 text-slate-400">
                          +{topics.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <span className="font-bold text-slate-900 dark:text-white">{sub.questionCount || 0}</span>
                      <span>questions ready</span>
                    </div>

                    {isInstitution && (
                      <Button
                        variant={isAlreadyAdopted ? "outline" : "primary"}
                        size="xs"
                        icon={isAlreadyAdopted ? Check : Plus}
                        disabled={isAlreadyAdopted}
                        onClick={() => openAdoptModal(sub)}
                      >
                        {isAlreadyAdopted ? "Adopted" : "Adopt into College"}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* CREATE CUSTOM SUBJECT MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Custom Academic Subject"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cloud & DevOps Architecture"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Course / Subject Code
              </label>
              <input
                type="text"
                placeholder="e.g. CS-CLOUD-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Academic Stream *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="TECHNICAL">Technical & Engineering</option>
                <option value="NON_TECHNICAL">Management & Commerce</option>
                <option value="APTITUDE">Aptitude & General Skills</option>
                <option value="GENERAL">General Elective</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Theme Color
              </label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="indigo">Indigo Blue</option>
                <option value="emerald">Emerald Green</option>
                <option value="sky">Sky Cyan</option>
                <option value="purple">Royal Purple</option>
                <option value="amber">Warm Amber</option>
                <option value="rose">Rose Red</option>
                <option value="violet">Violet</option>
                <option value="teal">Teal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Overview of subject syllabus and learning objectives..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Applicable to all toggle */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Applicable to All Students</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Enable for universal subjects like Quantitative Aptitude & Soft Skills</div>
            </div>
            <input
              type="checkbox"
              checked={formData.isApplicableToAll}
              onChange={(e) => setFormData({ ...formData, isApplicableToAll: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
            />
          </div>

          {/* Department Selection Dropdown / Checkboxes (if not applicable to all) */}
          {!formData.isApplicableToAll && departmentsList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Assign to College Departments
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                {departmentsList.map((d) => {
                  const val = d.code || d.name;
                  const isChecked = formData.departmentIds.includes(val);
                  return (
                    <label
                      key={d._id || d.id || d.name}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                        isChecked
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 text-indigo-900 font-bold"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDepartment(val)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded-sm"
                      />
                      <span className="truncate">{d.name} {d.code ? `(${d.code})` : ""}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Topic Builder */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Syllabus Modules / Topics ({formData.topics.length})
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add module or topic (e.g. Docker & Kubernetes)..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={handleAddTopic}>
                Add
              </Button>
            </div>

            {formData.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                {formData.topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={modalLoading}>
              Create Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT SUBJECT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Subject: ${selectedSubject?.name || ""}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Course / Subject Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Academic Stream *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="TECHNICAL">Technical & Engineering</option>
                <option value="NON_TECHNICAL">Management & Commerce</option>
                <option value="APTITUDE">Aptitude & General Skills</option>
                <option value="GENERAL">General Elective</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Theme Color
              </label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="indigo">Indigo Blue</option>
                <option value="emerald">Emerald Green</option>
                <option value="sky">Sky Cyan</option>
                <option value="purple">Royal Purple</option>
                <option value="amber">Warm Amber</option>
                <option value="rose">Rose Red</option>
                <option value="violet">Violet</option>
                <option value="teal">Teal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          {/* Applicable to all toggle */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Applicable to All Students</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Universal subject for all departments & branches</div>
            </div>
            <input
              type="checkbox"
              checked={formData.isApplicableToAll}
              onChange={(e) => setFormData({ ...formData, isApplicableToAll: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-md border-slate-300"
            />
          </div>

          {/* Department Selection */}
          {!formData.isApplicableToAll && departmentsList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Assign to College Departments
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                {departmentsList.map((d) => {
                  const val = d.code || d.name;
                  const isChecked = formData.departmentIds.includes(val);
                  return (
                    <label
                      key={d._id || d.id || d.name}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                        isChecked
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 text-indigo-900 font-bold"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDepartment(val)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded-sm"
                      />
                      <span className="truncate">{d.name} {d.code ? `(${d.code})` : ""}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Topic Builder */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Syllabus Modules / Topics ({formData.topics.length})
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add module or topic..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={handleAddTopic}>
                Add
              </Button>
            </div>

            {formData.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                {formData.topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={modalLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADOPT GLOBAL SUBJECT MODAL */}
      <Modal
        isOpen={adoptModalOpen}
        onClose={() => setAdoptModalOpen(false)}
        title={`Adopt Subject: ${selectedGlobalSubject?.name || ""}`}
      >
        <form onSubmit={handleAdoptSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You are adopting <strong className="text-slate-900 dark:text-white">{selectedGlobalSubject?.name}</strong> ({selectedGlobalSubject?.questionCount || 0} pre-loaded questions) into your college curriculum.
          </p>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Applicable to All Students</div>
              <div className="text-[11px] text-slate-500">Universal subject across all academic departments</div>
            </div>
            <input
              type="checkbox"
              checked={formData.isApplicableToAll}
              onChange={(e) => setFormData({ ...formData, isApplicableToAll: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-md border-slate-300"
            />
          </div>

          {!formData.isApplicableToAll && departmentsList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Assign to Specific Departments
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                {departmentsList.map((d) => {
                  const val = d.code || d.name;
                  const isChecked = formData.departmentIds.includes(val);
                  return (
                    <label
                      key={d._id || d.id || d.name}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                        isChecked
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 text-indigo-900 font-bold"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDepartment(val)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded-sm"
                      />
                      <span className="truncate">{d.name} {d.code ? `(${d.code})` : ""}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setAdoptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={modalLoading}>
              Confirm Adoption
            </Button>
          </div>
        </form>
      </Modal>

      {/* DEPARTMENT ASSIGNMENT MODAL */}
      <Modal
        isOpen={deptAssignModalOpen}
        onClose={() => setDeptAssignModalOpen(false)}
        title={`Department Allocation: ${selectedSubject?.name || ""}`}
      >
        <form onSubmit={handleDeptAssignSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Applicable to All Students</div>
              <div className="text-[11px] text-slate-500">Universal subject for all students</div>
            </div>
            <input
              type="checkbox"
              checked={formData.isApplicableToAll}
              onChange={(e) => setFormData({ ...formData, isApplicableToAll: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-md border-slate-300"
            />
          </div>

          {!formData.isApplicableToAll && departmentsList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Select Departments
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                {departmentsList.map((d) => {
                  const val = d.code || d.name;
                  const isChecked = formData.departmentIds.includes(val);
                  return (
                    <label
                      key={d._id || d.id || d.name}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                        isChecked
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 text-indigo-900 font-bold"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDepartment(val)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded-sm"
                      />
                      <span className="truncate">{d.name} {d.code ? `(${d.code})` : ""}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setDeptAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={modalLoading}>
              Save Allocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* BRANCH ASSIGNMENT MODAL (DEPARTMENT LEVEL) */}
      <Modal
        isOpen={branchAssignModalOpen}
        onClose={() => setBranchAssignModalOpen(false)}
        title={`Grant Branch Access: ${selectedSubject?.name || ""}`}
      >
        <form onSubmit={handleBranchAssignSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Select the specific degree branches within your department that should have access to <strong className="text-slate-900 dark:text-white">{selectedSubject?.name}</strong>:
          </p>

          {branchesList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
              {branchesList.map((br) => {
                const val = br.code || br.name || br._id;
                const isChecked = formData.branchIds.includes(val);
                return (
                  <label
                    key={br._id || br.id || br.name}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                      isChecked
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 text-indigo-900 font-bold"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleBranch(val)}
                      className="w-3.5 h-3.5 text-indigo-600 rounded-sm"
                    />
                    <span className="truncate">{br.name} {br.code ? `(${br.code})` : ""}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              No branches found under your department. You can create branches in the Department Profile settings.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setBranchAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={modalLoading}>
              Save Branch Access
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Academic Subject"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <p className="font-bold">Are you sure you want to delete this subject?</p>
              <p>Subject: <strong className="text-slate-900 dark:text-white">{selectedSubject?.name}</strong></p>
              <p>This will remove topic definitions and dissociate linked questions from this subject.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" icon={Trash2} loading={modalLoading} onClick={handleDeleteSubmit}>
              Delete Subject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
