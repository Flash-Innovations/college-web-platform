import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Briefcase,
  GraduationCap,
  Building2,
  DollarSign,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  FileSpreadsheet,
  PieChart,
  Sparkles
} from "lucide-react";
import { placementService } from "../../services/placementService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { useNotifications } from "../../context/NotificationContext";

export function PlacementAnalyticsPage() {
  const { showError, showSuccess } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("All");

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [studentsData, jobsData] = await Promise.all([
        placementService.getStudents().catch(() => []),
        placementService.getJobs().catch(() => [])
      ]);

      setStudents(studentsData || []);
      setJobs(jobsData || []);

      if (isManualRefresh) {
        showSuccess("Placement analytics metrics updated.");
      }
    } catch (err) {
      console.error("Failed to load placement analytics:", err);
      showError("Could not load placement analytics data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute all unique batches from dataset
  const availableBatches = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      const b = s.batch || s.passingYear;
      if (b && String(b).trim()) set.add(String(b).trim());
    });
    return Array.from(set).sort().reverse();
  }, [students]);

  // Filter students based on selected batch
  const filteredStudents = useMemo(() => {
    if (selectedBatch === "All") return students;
    return students.filter((s) => {
      const b = String(s.batch || s.passingYear || "").trim();
      return b === selectedBatch;
    });
  }, [students, selectedBatch]);

  // Compute aggregated placement metrics
  const metrics = useMemo(() => {
    const total = filteredStudents.length;
    let placed = 0;
    let offerAccepted = 0;
    let inProcess = 0;
    let unplaced = 0;
    let optedOut = 0;

    let readyCount = 0;
    let needsImprovementCount = 0;
    let atRiskCount = 0;

    let totalPackage = 0;
    let placedWithPackageCount = 0;
    let maxPackage = 0;

    // Salary brackets
    let tierSuperDream = 0; // >= 15 LPA
    let tierDream = 0;      // 10 - 14.99 LPA
    let tierCore = 0;       // 5 - 9.99 LPA
    let tierStandard = 0;   // < 5 LPA

    // Department grouping
    const deptMap = {};

    // Recruiter distribution
    const recruiterMap = {};

    filteredStudents.forEach((s) => {
      const status = (s.placementStatus || "UNPLACED").toUpperCase();
      const pkg = parseFloat(s.packageOffered) || 0;
      const readiness = s.metrics?.employabilityIndex !== undefined ? s.metrics.employabilityIndex : (s.readinessScore || 0);

      const isPlacedOrAccepted = status === "PLACED" || status === "OFFER_ACCEPTED";

      if (status === "OFFER_ACCEPTED") {
        offerAccepted++;
        placed++;
      } else if (status === "PLACED") {
        placed++;
      } else if (status === "IN_PROCESS") {
        inProcess++;
      } else if (status === "OPTED_OUT") {
        optedOut++;
      } else {
        unplaced++;
      }

      // Readiness tiers
      if (readiness >= 75) readyCount++;
      else if (readiness >= 50) needsImprovementCount++;
      else atRiskCount++;

      // Package metrics
      if (isPlacedOrAccepted && pkg > 0) {
        totalPackage += pkg;
        placedWithPackageCount++;
        if (pkg > maxPackage) maxPackage = pkg;

        if (pkg >= 15) tierSuperDream++;
        else if (pkg >= 10) tierDream++;
        else if (pkg >= 5) tierCore++;
        else tierStandard++;
      }

      // Department benchmark
      const branchName = (s.branch || "General Engineering").trim();
      if (!deptMap[branchName]) {
        deptMap[branchName] = {
          branch: branchName,
          total: 0,
          placed: 0,
          totalPackage: 0,
          packageCount: 0,
          ready: 0
        };
      }
      deptMap[branchName].total++;
      if (isPlacedOrAccepted) {
        deptMap[branchName].placed++;
        if (pkg > 0) {
          deptMap[branchName].totalPackage += pkg;
          deptMap[branchName].packageCount++;
        }
      }
      if (readiness >= 75) {
        deptMap[branchName].ready++;
      }

      // Recruiter tally
      if (isPlacedOrAccepted && s.companyPlaced && s.companyPlaced.trim()) {
        const comp = s.companyPlaced.trim();
        recruiterMap[comp] = (recruiterMap[comp] || 0) + 1;
      }
    });

    const eligible = Math.max(0, total - optedOut);
    const placementRate = eligible > 0 ? Math.round((placed / eligible) * 100) : 0;
    const avgPackage = placedWithPackageCount > 0 ? (totalPackage / placedWithPackageCount).toFixed(1) : "0.0";

    const departmentsList = Object.values(deptMap)
      .map((d) => ({
        ...d,
        placementRate: d.total > 0 ? Math.round((d.placed / d.total) * 100) : 0,
        avgPackage: d.packageCount > 0 ? (d.totalPackage / d.packageCount).toFixed(1) : "N/A"
      }))
      .sort((a, b) => b.placementRate - a.placementRate);

    const topRecruiters = Object.entries(recruiterMap)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      total,
      eligible,
      placed,
      offerAccepted,
      inProcess,
      unplaced,
      optedOut,
      placementRate,
      avgPackage,
      maxPackage: maxPackage > 0 ? maxPackage.toFixed(1) : "0.0",
      readyCount,
      needsImprovementCount,
      atRiskCount,
      salaryTiers: {
        superDream: tierSuperDream,
        dream: tierDream,
        core: tierCore,
        standard: tierStandard
      },
      departmentsList,
      topRecruiters,
      activeDrivesCount: jobs.filter((j) => j.isActive).length,
      totalDrivesCount: jobs.length
    };
  }, [filteredStudents, jobs]);

  const handlePrintSummary = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (metrics.departmentsList.length === 0) {
      showError("No department data available to export.");
      return;
    }

    const headers = ["Department / Branch", "Total Students", "Placed Students", "Placement Rate (%)", "Average Package (LPA)"];
    const rows = metrics.departmentsList.map((d) => [
      `"${d.branch.replace(/"/g, '""')}"`,
      d.total,
      d.placed,
      `${d.placementRate}%`,
      d.avgPackage
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Placement_Analytics_${selectedBatch}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Analytics breakdown exported successfully.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Institutional Placement & Accreditation Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time cohort placement metrics, salary distributions, department benchmarks, and skill gap intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Batch:
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Batches</option>
              {availableBatches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            disabled={refreshing}
            onClick={() => loadData(true)}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Printer}
            onClick={handlePrintSummary}
          >
            Print Summary
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Placement Rate */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-indigo-100 mb-2 text-xs font-semibold uppercase tracking-wider">
              <span>Placement Rate</span>
              <Award className="w-5 h-5 text-indigo-200" />
            </div>
            <div className="text-3xl font-black tracking-tight flex items-baseline gap-2">
              <span>{metrics.placementRate}%</span>
              <span className="text-xs font-semibold text-indigo-200">
                ({metrics.placed} of {metrics.eligible} eligible)
              </span>
            </div>
            <div className="w-full bg-indigo-900/40 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.placementRate)}%` }}
              />
            </div>
            <p className="text-[11px] text-indigo-200 mt-2 flex items-center justify-between">
              <span>Offer Accepted: {metrics.offerAccepted}</span>
              <span>In Process: {metrics.inProcess}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Compensation CTC */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-bold uppercase tracking-wider">
            <span>Average CTC</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.avgPackage} <span className="text-sm font-bold text-slate-500">LPA</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Highest Offer:</span>
            <strong className="text-emerald-600 font-black">{metrics.maxPackage} LPA</strong>
          </p>
        </div>

        {/* Card 3: Total Candidates */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-bold uppercase tracking-wider">
            <span>Candidate Cohort</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.total} <span className="text-sm font-bold text-slate-500">Students</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Unplaced Pool:</span>
            <strong className="text-amber-600 font-bold">{metrics.unplaced} candidates</strong>
          </p>
        </div>

        {/* Card 4: Recruitment Drives */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-bold uppercase tracking-wider">
            <span>Recruitment Drives</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.activeDrivesCount} <span className="text-sm font-bold text-slate-500">Active</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Total Drives Hosted:</span>
            <strong className="text-slate-800 font-bold">{metrics.totalDrivesCount} corporate drives</strong>
          </p>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placement Status Funnel (1 col) */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Cohort Placement Funnel"
            subtitle="Conversion distribution across registered student profiles"
          />

          <div className="space-y-4 my-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Placed & Accepted
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {metrics.placed} ({metrics.total > 0 ? Math.round((metrics.placed / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${metrics.total > 0 ? (metrics.placed / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Interview / In Process
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {metrics.inProcess} ({metrics.total > 0 ? Math.round((metrics.inProcess / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${metrics.total > 0 ? (metrics.inProcess / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Unplaced Candidates
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {metrics.unplaced} ({metrics.total > 0 ? Math.round((metrics.unplaced / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${metrics.total > 0 ? (metrics.unplaced / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  Opted Out / Higher Studies
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {metrics.optedOut} ({metrics.total > 0 ? Math.round((metrics.optedOut / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-slate-400 h-full rounded-full transition-all"
                  style={{ width: `${metrics.total > 0 ? (metrics.optedOut / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600">
            <strong>Accreditation Compliance:</strong> Students opted out for higher education/entrepreneurship are excluded from the denominator in NAAC/NIRF calculations.
          </div>
        </Card>

        {/* Salary CTC Bracket Breakdown (1 col) */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Compensation Tier Spectrum"
            subtitle="Package distribution among placed candidates"
          />

          <div className="space-y-4 my-2">
            <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-950 mb-1">
                <span>Tier 1: Dream & Super Dream (≥ 15 LPA)</span>
                <span className="font-mono text-indigo-600 font-extrabold">{metrics.salaryTiers.superDream} offers</span>
              </div>
              <p className="text-[11px] text-indigo-700/80">Product giants, global fintech, Tier-1 cloud architectures</p>
            </div>

            <div className="p-3 rounded-xl border border-sky-100 bg-sky-50/50">
              <div className="flex justify-between items-center text-xs font-bold text-sky-950 mb-1">
                <span>Tier 2: Core Engineering (10 - 14.9 LPA)</span>
                <span className="font-mono text-sky-600 font-extrabold">{metrics.salaryTiers.dream} offers</span>
              </div>
              <p className="text-[11px] text-sky-700/80">Mid-tier product firms, high-growth startups, enterprise software</p>
            </div>

            <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-950 mb-1">
                <span>Tier 3: Standard IT & Core (5 - 9.9 LPA)</span>
                <span className="font-mono text-emerald-600 font-extrabold">{metrics.salaryTiers.core} offers</span>
              </div>
              <p className="text-[11px] text-emerald-700/80">Leading IT consulting, systems integrators, MNC services</p>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-1">
                <span>Tier 4: Foundation Pool (&lt; 5 LPA)</span>
                <span className="font-mono text-slate-600 font-extrabold">{metrics.salaryTiers.standard} offers</span>
              </div>
              <p className="text-[11px] text-slate-500">Entry engineering, traineeships, associate programs</p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            Calculated across verified offer records on file.
          </div>
        </Card>

        {/* Readiness Tiers & Intervention Heatmap (1 col) */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Readiness & Skill Intervention"
            subtitle="Employability distribution evaluated by SIPS Match AI"
          />

          <div className="space-y-4 my-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-900">Placement Ready (≥ 75)</h5>
                  <p className="text-[11px] text-emerald-700">Eligible for Dream & High-CTC Drives</p>
                </div>
              </div>
              <span className="text-lg font-black font-mono text-emerald-700">{metrics.readyCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <h5 className="text-xs font-bold text-amber-900">Needs Improvement (50 - 74)</h5>
                  <p className="text-[11px] text-amber-700">Target for mock interviews & resume polish</p>
                </div>
              </div>
              <span className="text-lg font-black font-mono text-amber-700">{metrics.needsImprovementCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <div>
                  <h5 className="text-xs font-bold text-rose-900">At Risk (&lt; 50)</h5>
                  <p className="text-[11px] text-rose-700">Urgent foundational coding interventions</p>
                </div>
              </div>
              <span className="text-lg font-black font-mono text-rose-700">{metrics.atRiskCount}</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center gap-2 text-xs text-indigo-900 font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Remedial curriculum recommendations synced with Branch Coordinators.</span>
          </div>
        </Card>
      </div>

      {/* Department / Branch Benchmark Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Branch-Wise Placement Performance & Accreditations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative cohort progression benchmarked across academic programs.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {metrics.departmentsList.length} Active Engineering Branches
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="pb-3 font-bold">Branch / Department</th>
                <th className="pb-3 font-bold text-center">Cohort Size</th>
                <th className="pb-3 font-bold text-center">Placed</th>
                <th className="pb-3 font-bold">Conversion Rate</th>
                <th className="pb-3 font-bold text-right">Avg Package</th>
                <th className="pb-3 font-bold text-center">Placement Ready</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.departmentsList.length > 0 ? (
                metrics.departmentsList.map((dept, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {dept.branch}
                    </td>
                    <td className="py-3 text-center font-mono font-medium text-slate-700">
                      {dept.total}
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-emerald-600">
                      {dept.placed}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              dept.placementRate >= 75
                                ? "bg-emerald-500"
                                : dept.placementRate >= 50
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${dept.placementRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 font-mono">
                          {dept.placementRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {dept.avgPackage !== "N/A" ? `${dept.avgPackage} LPA` : "—"}
                    </td>
                    <td className="py-3 text-center">
                      <Badge
                        variant={
                          dept.ready > 0 && dept.ready / dept.total >= 0.5
                            ? "success"
                            : "neutral"
                        }
                        size="xs"
                      >
                        {dept.ready} Candidates
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No student records found matching the selected batch filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Recruiters Strip */}
      {metrics.topRecruiters.length > 0 && (
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Leading Hiring Partners for this Cohort
            </h4>
            <span className="text-xs text-slate-500">Corporate Recruiter Distribution</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
            {metrics.topRecruiters.map((rec, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center hover:border-indigo-300 transition-colors"
              >
                <p className="font-bold text-slate-900 text-xs truncate" title={rec.company}>
                  {rec.company}
                </p>
                <p className="text-sm font-extrabold text-indigo-600 mt-1">
                  {rec.count} <span className="text-[10px] text-slate-500 font-medium">Offers</span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
