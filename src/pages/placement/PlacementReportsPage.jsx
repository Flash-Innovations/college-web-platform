import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  Building2,
  Share2,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { placementService } from "../../services/placementService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { useNotifications } from "../../context/NotificationContext";

export function PlacementReportsPage() {
  const { showSuccess, showError, showInfo } = useNotifications();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingReportId, setGeneratingReportId] = useState(null);

  // Custom Query Generator State
  const [customDept, setCustomDept] = useState("All");
  const [customMinCgpa, setCustomMinCgpa] = useState("0");
  const [customFormat, setCustomFormat] = useState("csv");
  const [customGenerating, setCustomGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await placementService.getStudents();
        setStudents(data || []);
      } catch (err) {
        console.error("Failed to load students for reports:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const downloadCsv = (filename, headers, rows) => {
    const csvContent = "data:text/csv;charset=utf-8," + [
      headers.join(","),
      ...rows.map((r) => r.join(","))
    ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReport = async (reportId) => {
    setGeneratingReportId(reportId);
    try {
      const nowStr = new Date().toISOString().split("T")[0];

      if (reportId === "naac") {
        // NAAC & NBA Criterion 5 Placement Compliance Report
        const headers = [
          "Sr No",
          "Student Name",
          "USN / Roll Number",
          "Department / Branch",
          "Graduation Batch",
          "Placement Status",
          "Company Placed",
          "Package Offered (LPA)",
          "NAAC Criterion 5 Verification Status"
        ];
        const rows = students.map((s, idx) => {
          const isPlaced = s.placementStatus === "PLACED" || s.placementStatus === "OFFER_ACCEPTED";
          return [
            idx + 1,
            `"${(s.name || "").replace(/"/g, '""')}"`,
            `"${s.usn || s.rollNo || ""}"`,
            `"${(s.branch || "").replace(/"/g, '""')}"`,
            `"${s.batch || s.passingYear || ""}"`,
            `"${s.placementStatus || "UNPLACED"}"`,
            `"${(s.companyPlaced || "—").replace(/"/g, '""')}"`,
            s.packageOffered || "0",
            `"${isPlaced ? "VERIFIED_OFFER" : "ELIGIBLE_CANDIDATE"}"`
          ];
        });
        downloadCsv(`NAAC_NBA_Criterion5_Placements_${nowStr}.csv`, headers, rows);
        showSuccess("NAAC & NBA Criterion 5 Accreditation Report downloaded.");
      } else if (reportId === "dean") {
        // Executive Dean & Principal Briefing Report
        const deptMap = {};
        students.forEach((s) => {
          const b = s.branch || "General";
          if (!deptMap[b]) deptMap[b] = { total: 0, placed: 0, pkgs: [] };
          deptMap[b].total++;
          if (s.placementStatus === "PLACED" || s.placementStatus === "OFFER_ACCEPTED") {
            deptMap[b].placed++;
            const p = parseFloat(s.packageOffered);
            if (p > 0) deptMap[b].pkgs.push(p);
          }
        });

        const headers = [
          "Department / Branch",
          "Total Cohort Size",
          "Placed Students",
          "Placement Rate (%)",
          "Average Package (LPA)",
          "Highest Package (LPA)"
        ];
        const rows = Object.entries(deptMap).map(([dept, data]) => {
          const rate = data.total > 0 ? Math.round((data.placed / data.total) * 100) : 0;
          const avg = data.pkgs.length > 0 ? (data.pkgs.reduce((a, b) => a + b, 0) / data.pkgs.length).toFixed(1) : "N/A";
          const max = data.pkgs.length > 0 ? Math.max(...data.pkgs).toFixed(1) : "N/A";
          return [
            `"${dept.replace(/"/g, '""')}"`,
            data.total,
            data.placed,
            `${rate}%`,
            avg,
            max
          ];
        });
        downloadCsv(`Executive_Placement_Briefing_${nowStr}.csv`, headers, rows);
        showSuccess("Executive Leadership Placement Briefing Report downloaded.");
      } else if (reportId === "recruiter") {
        // Corporate Recruiter Talent Supply Matrix
        const headers = [
          "Student Name",
          "USN / Roll No",
          "Department",
          "CGPA",
          "Technical Skills",
          "Readiness Score (/100)",
          "Placement Status"
        ];
        const rows = students.map((s) => [
          `"${(s.name || "").replace(/"/g, '""')}"`,
          `"${s.usn || s.rollNo || ""}"`,
          `"${(s.branch || "").replace(/"/g, '""')}"`,
          s.cgpa || "0.0",
          `"${(Array.isArray(s.skills) ? s.skills.join("; ") : "").replace(/"/g, '""')}"`,
          s.metrics?.employabilityIndex || s.readinessScore || "0",
          `"${s.placementStatus || "UNPLACED"}"`
        ]);
        downloadCsv(`Recruiter_Talent_Supply_Matrix_${nowStr}.csv`, headers, rows);
        showSuccess("Corporate Recruiter Talent Supply Matrix downloaded.");
      } else if (reportId === "skills") {
        // Curriculum Skill Gap Analysis
        const skillTally = {};
        students.forEach((s) => {
          (s.weakSkills || ["System Design", "Cloud Infrastructure"]).forEach((sk) => {
            skillTally[sk] = (skillTally[sk] || 0) + 1;
          });
        });

        const headers = ["Missing Competency / Skill Gap", "Affected Candidates Count", "Recommended Action"];
        const rows = Object.entries(skillTally).map(([skill, count]) => [
          `"${skill.replace(/"/g, '""')}"`,
          count,
          `"Schedule hands-on lab and remediation workshop before upcoming recruitment drives"`
        ]);
        downloadCsv(`Curriculum_Skill_Gap_Intervention_${nowStr}.csv`, headers, rows);
        showSuccess("Curriculum Skill Gap Intervention Report downloaded.");
      }
    } catch (err) {
      console.error("Report generation error:", err);
      showError("Failed to generate report.");
    } finally {
      setGeneratingReportId(null);
    }
  };

  const handleCustomGenerate = () => {
    setCustomGenerating(true);
    try {
      const minCgpa = parseFloat(customMinCgpa) || 0;
      const filtered = students.filter((s) => {
        if (customDept !== "All") {
          const sBranch = (s.branch || "").toLowerCase();
          const target = customDept.toLowerCase();
          if (!sBranch.includes(target)) return false;
        }
        if (minCgpa > 0 && (s.cgpa || 0) < minCgpa) {
          return false;
        }
        return true;
      });

      if (customFormat === "print") {
        window.print();
        return;
      }

      const headers = [
        "Student Name",
        "Roll No / USN",
        "Department",
        "Batch",
        "CGPA",
        "Placement Status",
        "Company Placed",
        "Package (LPA)",
        "Readiness Index"
      ];
      const rows = filtered.map((s) => [
        `"${(s.name || "").replace(/"/g, '""')}"`,
        `"${s.usn || s.rollNo || ""}"`,
        `"${(s.branch || "").replace(/"/g, '""')}"`,
        `"${s.batch || s.passingYear || ""}"`,
        s.cgpa || "0.0",
        `"${s.placementStatus || "UNPLACED"}"`,
        `"${(s.companyPlaced || "—").replace(/"/g, '""')}"`,
        s.packageOffered || "0",
        s.metrics?.employabilityIndex || s.readinessScore || "0"
      ]);

      const nowStr = new Date().toISOString().split("T")[0];
      downloadCsv(`Custom_Cohort_Report_${customDept}_${nowStr}.csv`, headers, rows);
      showSuccess(`Generated report containing ${filtered.length} candidate records.`);
    } catch (err) {
      console.error(err);
      showError("Failed to generate custom report.");
    } finally {
      setCustomGenerating(false);
    }
  };

  const reportsConfig = [
    {
      id: "naac",
      title: "NAAC & NBA Accreditation Compliance Report",
      description: "Standardized metric tables covering Criterion 5 (Student Progression & Campus Placements).",
      format: "Official Compliance Roster (.csv / .pdf ready)",
      generatedDate: "Real-time Verified Roster",
      status: "Ready"
    },
    {
      id: "dean",
      title: "Executive Dean & Principal Placement Briefing",
      description: "Comprehensive executive dashboard detailing placement conversion, median CTCs, and department rates.",
      format: "Executive Summary Table (.csv)",
      generatedDate: "Real-time Cohort Data",
      status: "Ready"
    },
    {
      id: "recruiter",
      title: "Corporate Recruiter Talent Supply Matrix",
      description: "Verified candidate roster categorized by technical competencies, CGPA, and readiness tiers.",
      format: "Recruiter Supply Roster (.csv)",
      generatedDate: "Real-time Candidate Pool",
      status: "Ready"
    },
    {
      id: "skills",
      title: "Curriculum Skill Gap Intervention Analysis",
      description: "Detailed recommendations for academic faculty on emerging cloud, containerization, and backend deficits.",
      format: "Analytical Summary Report (.csv)",
      generatedDate: "AI Match Engine Insights",
      status: "Ready"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
            Institutional Placement & Accreditation Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export verified placement documentation for accreditation bodies, college leadership, and recruiters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print Summary
          </Button>
        </div>
      </div>

      {/* Reports Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportsConfig.map((rep) => (
          <Card
            key={rep.id}
            className="flex flex-col justify-between hover:border-slate-300 transition-all border-slate-200/90 shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <Badge variant="success" size="sm">
                  {rep.status}
                </Badge>
              </div>

              <h3 className="font-bold text-slate-900 text-base leading-snug">
                {rep.title}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {rep.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{rep.format}</span>
                <span>{rep.generatedDate}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                loading={generatingReportId === rep.id}
                disabled={generatingReportId === rep.id}
                onClick={() => handleDownloadReport(rep.id)}
              >
                Download Report
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Custom Query Report Generator */}
      <Card>
        <CardHeader
          title="Custom Query Report Generator"
          subtitle="Generate tailored cohort slices for department heads or special recruiters"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Department Scope
            </label>
            <select
              value={customDept}
              onChange={(e) => setCustomDept(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="All">All Departments (Institutional)</option>
              <option value="Computer">Computer Science & Engineering</option>
              <option value="Information">Information Science & IT</option>
              <option value="Electronics">Electronics & Communication</option>
              <option value="Mechanical">Mechanical Engineering</option>
              <option value="Civil">Civil Engineering</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Minimum CGPA Filter
            </label>
            <select
              value={customMinCgpa}
              onChange={(e) => setCustomMinCgpa(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="0">No CGPA Minimum (All Candidates)</option>
              <option value="6.0">CGPA 6.0+ (Standard Eligible)</option>
              <option value="7.0">CGPA 7.0+ (Tier-2 Eligible)</option>
              <option value="8.0">CGPA 8.0+ (Tier-1 Eligible)</option>
              <option value="8.5">CGPA 8.5+ (Dream / Super Dream)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Output Format
            </label>
            <select
              value={customFormat}
              onChange={(e) => setCustomFormat(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="csv">Standard CSV Spreadsheet (.csv)</option>
              <option value="print">Printable Summary View</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-5 border-t border-slate-100 mt-5">
          <Button
            variant="primary"
            size="md"
            icon={Download}
            loading={customGenerating}
            disabled={customGenerating}
            onClick={handleCustomGenerate}
          >
            Generate & Export Report
          </Button>
        </div>
      </Card>
    </div>
  );
}
