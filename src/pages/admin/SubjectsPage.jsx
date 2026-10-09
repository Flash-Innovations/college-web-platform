import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
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
  Tag
} from "lucide-react";
import { practiceService } from "../../services/practiceService";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";

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

  // State
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "TECHNICAL",
    description: "",
    icon: "BookOpen",
    color: "indigo",
    departmentIds: "",
    topics: [""]
  });

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await practiceService.getSubjects({
        type: activeTab,
        departmentId: departmentFilter,
        search
      });
      const data = Array.isArray(res) ? res : (res?.data || []);
      setSubjects(data);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      setError(err.message || "Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, departmentFilter, search]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const toggleExpand = (id) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      code: "",
      type: activeTab === "ALL" ? "TECHNICAL" : activeTab,
      description: "",
      icon: "BookOpen",
      color: "indigo",
      departmentIds: "",
      topics: [""]
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name || "",
      code: subject.code || "",
      type: subject.type || "TECHNICAL",
      description: subject.description || "",
      icon: subject.icon || "BookOpen",
      color: subject.color || "indigo",
      departmentIds: Array.isArray(subject.departmentIds) ? subject.departmentIds.join(", ") : "",
      topics: Array.isArray(subject.topics) && subject.topics.length > 0 
        ? subject.topics.map(t => typeof t === "string" ? t : t.name) 
        : [""]
    });
    setEditModalOpen(true);
  };

  const handleOpenDelete = (subject) => {
    setSelectedSubject(subject);
    setDeleteModalOpen(true);
  };

  const handleAddTopicField = () => {
    setFormData((prev) => ({
      ...prev,
      topics: [...prev.topics, ""]
    }));
  };

  const handleRemoveTopicField = (index) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const handleTopicChange = (index, value) => {
    setFormData((prev) => {
      const next = [...prev.topics];
      next[index] = value;
      return { ...prev, topics: next };
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setModalLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || undefined,
        type: formData.type,
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        color: formData.color,
        departmentIds: formData.departmentIds
          ? formData.departmentIds.split(",").map((d) => d.trim().toUpperCase()).filter(Boolean)
          : [],
        topics: formData.topics.map((t) => t.trim()).filter(Boolean)
      };

      await practiceService.createSubject(payload);
      if (addToast) {
        addToast({
          type: "success",
          title: "Subject Created",
          message: `Subject '${formData.name}' created successfully.`
        });
      }
      setCreateModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error("Create subject error:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: "Failed to create subject",
          message: err.message || "Please check your inputs."
        });
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject || !formData.name.trim()) return;

    setModalLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || undefined,
        type: formData.type,
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        color: formData.color,
        departmentIds: formData.departmentIds
          ? formData.departmentIds.split(",").map((d) => d.trim().toUpperCase()).filter(Boolean)
          : [],
        topics: formData.topics.map((t) => t.trim()).filter(Boolean)
      };

      await practiceService.updateSubject(selectedSubject.id, payload);
      if (addToast) {
        addToast({
          type: "success",
          title: "Subject Updated",
          message: `Subject '${formData.name}' updated successfully.`
        });
      }
      setEditModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error("Update subject error:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: "Failed to update subject",
          message: err.message || "Please check your inputs."
        });
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSubject) return;
    setModalLoading(true);
    try {
      await practiceService.deleteSubject(selectedSubject.id);
      if (addToast) {
        addToast({
          type: "success",
          title: "Subject Deleted",
          message: `Subject '${selectedSubject.name}' deleted.`
        });
      }
      setDeleteModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error("Delete subject error:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: "Failed to delete subject",
          message: err.message || "Cannot delete subject with active dependencies."
        });
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Stats calculation
  const totalCount = subjects.length;
  const techCount = subjects.filter((s) => s.type === "TECHNICAL").length;
  const nonTechCount = subjects.filter((s) => s.type === "NON_TECHNICAL").length;
  const aptitudeCount = subjects.filter((s) => s.type === "APTITUDE").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Curriculum & Subjects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage dynamic course subjects, syllabus modules, and program mappings across Technical, Management, and General curricula.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchSubjects} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Plus className="w-4 h-4" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-card border-border/60">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{totalCount}</div>
            <div className="text-xs text-muted-foreground font-medium">Total Active Subjects</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-card border-border/60">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{techCount}</div>
            <div className="text-xs text-muted-foreground font-medium">Engineering & Computing</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-card border-border/60">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{nonTechCount}</div>
            <div className="text-xs text-muted-foreground font-medium">Management & Commerce</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-card border-border/60">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{aptitudeCount}</div>
            <div className="text-xs text-muted-foreground font-medium">Aptitude & Reasoning</div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/50 overflow-x-auto">
          {[
            { id: "ALL", label: "All Subjects" },
            { id: "TECHNICAL", label: "Technical / Engineering" },
            { id: "NON_TECHNICAL", label: "Management & Commerce" },
            { id: "APTITUDE", label: "Aptitude & General" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm border border-border/40 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subjects or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-background border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading curriculum subjects...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      ) : subjects.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No subjects found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
            No subjects matched your selected filter. Click below to add a new subject to your curriculum.
          </p>
          <Button size="sm" onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Subject
          </Button>
        </Card>
      ) : (
        /* Subjects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {subjects.map((sub) => {
            const IconComponent = ICON_MAP[sub.icon] || BookOpen;
            const colorClass = COLOR_MAP[sub.color] || COLOR_MAP.indigo;
            const isExpanded = !!expandedSubjects[sub.id];

            return (
              <Card
                key={sub.id}
                className="overflow-hidden border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between"
              >
                <div className="p-5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl border ${colorClass}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        {sub.code && (
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                            {sub.code}
                          </span>
                        )}
                        <h3 className="text-base font-bold text-foreground leading-snug">{sub.name}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(sub)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {sub.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                      {sub.description}
                    </p>
                  )}

                  {/* Program Target Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    {sub.type === "APTITUDE" ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                        Universal Aptitude
                      </span>
                    ) : Array.isArray(sub.departmentIds) && sub.departmentIds.length > 0 ? (
                      sub.departmentIds.map((dept) => (
                        <span
                          key={dept}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20"
                        >
                          {dept}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold border border-border">
                        All Programs
                      </span>
                    )}

                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                      {sub.type === "TECHNICAL" ? "Tech" : sub.type === "NON_TECHNICAL" ? "Management/Commerce" : "General"}
                    </span>
                  </div>

                  {/* Expandable Topic Syllabus List */}
                  {Array.isArray(sub.topics) && sub.topics.length > 0 && (
                    <div className="border-t border-border/50 pt-3 mt-3">
                      <button
                        onClick={() => toggleExpand(sub.id)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        <span>Syllabus Modules ({sub.topics.length} Topics)</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isExpanded && (
                        <ul className="mt-2.5 space-y-1.5 pl-2 border-l-2 border-primary/30 text-xs text-muted-foreground">
                          {sub.topics.map((top, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                              <span>{typeof top === "string" ? top : top.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Badges */}
                <div className="px-5 py-3 bg-muted/40 dark:bg-muted/20 border-t border-border/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="font-semibold text-foreground">{sub.questionCount || 0}</span> questions linked
                  </div>
                  <Badge variant={sub.isGlobal ? "secondary" : "outline"} className="text-[10px]">
                    {sub.isGlobal ? "Global Standard" : "College Custom"}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE SUBJECT MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Subject to Curriculum"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Subject Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Financial Accounting, Computer Networks, VLSI Design"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Subject Code</label>
              <input
                type="text"
                placeholder="e.g. ACC-101, CS-301"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Category Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="TECHNICAL">Technical / Engineering</option>
                <option value="NON_TECHNICAL">Management & Commerce</option>
                <option value="APTITUDE">Aptitude & Reasoning</option>
                <option value="GENERAL">General Studies</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Applicable Programs / Departments (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. BBA, MBA, BCOM or CSE, IT, ECE (leave blank for all)"
              value={formData.departmentIds}
              onChange={(e) => setFormData({ ...formData, departmentIds: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Description / Scope</label>
            <textarea
              rows={2}
              placeholder="Brief summary of concepts covered in this subject..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Topics Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">Syllabus Topics & Units</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddTopicField} className="text-xs h-7 gap-1">
                <Plus className="w-3 h-3" />
                Add Topic
              </Button>
            </div>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {formData.topics.map((topic, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground w-5 text-right">{index + 1}.</span>
                  <input
                    type="text"
                    placeholder={`e.g. Topic ${index + 1} Name`}
                    value={topic}
                    onChange={(e) => handleTopicChange(index, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-background border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {formData.topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTopicField(index)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={modalLoading} className="gap-2">
              {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Save Subject
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
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Subject Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Subject Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Category Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="TECHNICAL">Technical / Engineering</option>
                <option value="NON_TECHNICAL">Management & Commerce</option>
                <option value="APTITUDE">Aptitude & Reasoning</option>
                <option value="GENERAL">General Studies</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Applicable Programs / Departments (Comma-separated)
            </label>
            <input
              type="text"
              value={formData.departmentIds}
              onChange={(e) => setFormData({ ...formData, departmentIds: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Topics */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">Syllabus Topics</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddTopicField} className="text-xs h-7 gap-1">
                <Plus className="w-3 h-3" />
                Add Topic
              </Button>
            </div>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {formData.topics.map((topic, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground w-5 text-right">{index + 1}.</span>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => handleTopicChange(index, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-background border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {formData.topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTopicField(index)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={modalLoading} className="gap-2">
              {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Update Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Subject"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete subject <strong className="text-foreground">{selectedSubject?.name}</strong>?
            This will remove the syllabus mapping for this subject.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={modalLoading}
              className="gap-2"
            >
              {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Delete Subject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
