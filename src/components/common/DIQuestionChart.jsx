import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, Table as TableIcon } from "lucide-react";

const CHART_COLORS = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#ef4444"  // red
];

/**
 * Checks if a question qualifies as a Data Interpretation question
 */
export function isDIQuestion(question) {
  if (!question) return false;
  if (question.chartConfig || question.chartData) return true;

  const domain = (question.domain || question.category || "").toUpperCase();
  const topic = (question.topic || question.subcategory || "").toUpperCase();
  const tags = Array.isArray(question.tags) ? question.tags.map(t => String(t).toUpperCase()) : [];

  if (domain.includes("DATA_INTERPRETATION") || domain.includes("DI")) return true;
  if (topic.includes("PIE_CHART") || topic.includes("BAR_GRAPH") || topic.includes("LINE_GRAPH") || topic.includes("TABLE_CHART")) return true;
  if (tags.some(t => t.includes("DATA-INTERPRETATION") || t.includes("PIE-CHART") || t.includes("BAR-GRAPH"))) return true;

  // Also check if statement mentions standard DI phrases
  const statement = (question.statement || "").toLowerCase();
  if (statement.includes("pie chart") || statement.includes("bar graph") || statement.includes("following table represents")) return true;

  return false;
}

/**
 * High-fidelity Data Interpretation Chart renderer
 */
export function DIQuestionChart({ question, className = "" }) {
  if (!question) return null;

  // If question provides explicit chartConfig
  let config = question.chartConfig;

  // If no explicit config, derive one from topic or statement
  if (!config) {
    const topic = (question.topic || question.subcategory || "").toUpperCase();
    const statement = (question.statement || "").toLowerCase();
    const extId = question.externalId || "";

    if (topic.includes("PIE_CHART") || statement.includes("pie chart") || extId === "APT-DI-001") {
      config = {
        type: "PIE",
        title: "Annual Corporate Budget Distribution ($1,800,000 Total)",
        subtitle: "Central Angle & Expenditure Allocation",
        data: [
          { name: "Research & Development (54°)", value: 270000, angle: "54°", pct: "15%" },
          { name: "Marketing & Sales (90°)", value: 450000, angle: "90°", pct: "25%" },
          { name: "Operations & HR (126°)", value: 630000, angle: "126°", pct: "35%" },
          { name: "Product & Infrastructure (90°)", value: 450000, angle: "90°", pct: "25%" }
        ]
      };
    } else if (topic.includes("BAR_GRAPH") || statement.includes("bar graph")) {
      config = {
        type: "BAR",
        title: "Quarterly Campus Placement Offers by Branch",
        subtitle: "Total Hires Across Core & Software Divisions",
        data: [
          { name: "CSE", Core: 45, Software: 180 },
          { name: "ISE", Core: 30, Software: 140 },
          { name: "ECE", Core: 75, Software: 95 },
          { name: "EEE", Core: 60, Software: 45 },
          { name: "MECH", Core: 85, Software: 25 }
        ]
      };
    } else if (topic.includes("LINE_GRAPH") || statement.includes("line graph")) {
      config = {
        type: "LINE",
        title: "Annual Placement Conversion Rate (2021 - 2025)",
        subtitle: "Historical Trend (%)",
        data: [
          { name: "2021", rate: 72 },
          { name: "2022", rate: 81 },
          { name: "2023", rate: 78 },
          { name: "2024", rate: 86 },
          { name: "2025", rate: 93 }
        ]
      };
    } else if (topic.includes("TABLE_CHART") || statement.includes("table")) {
      config = {
        type: "TABLE",
        title: "Recruiting Partners Distribution Matrix",
        headers: ["Company Tier", "No. of Drives", "Average CTC", "Offers Released"],
        rows: [
          ["Super Dream (>= 15 LPA)", "18", "21.4 LPA", "142"],
          ["Core Dream (10 - 15 LPA)", "32", "12.8 LPA", "310"],
          ["Mass Recruitment (5 - 10 LPA)", "45", "6.7 LPA", "680"],
          ["Foundation (< 5 LPA)", "20", "4.2 LPA", "215"]
        ]
      };
    }
  }

  if (!config) return null;

  return (
    <div className={`my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/60 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            {config.type === "PIE" && <PieIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            {config.type === "BAR" && <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            {config.type === "LINE" && <LineIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
            {config.type === "TABLE" && <TableIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {config.title || "Data Interpretation Visual Chart"}
            </span>
          </div>
          {config.subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {config.subtitle}
            </p>
          )}
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
          DI Exhibit
        </span>
      </div>

      {/* PIE CHART */}
      {config.type === "PIE" && Array.isArray(config.data) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          <div className="w-64 h-64 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={config.data}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={35}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, pct }) => `${pct || ""}`}
                  labelLine={false}
                >
                  {config.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name, entry) => [
                    typeof val === "number" ? `$${val.toLocaleString()}` : val,
                    entry?.payload?.name || name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            {config.data.map((item, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {typeof item.value === "number" ? `$${item.value.toLocaleString()}` : item.value}
                </span>
                {item.angle && (
                  <span className="text-[10px] text-slate-400 font-mono">({item.angle})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BAR CHART */}
      {config.type === "BAR" && Array.isArray(config.data) && (
        <div className="w-full h-64 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={config.data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Core" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Software" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* LINE CHART */}
      {config.type === "LINE" && Array.isArray(config.data) && (
        <div className="w-full h-64 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={config.data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(val) => [`${val}%`, "Conversion Rate"]} />
              <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DATA TABLE */}
      {config.type === "TABLE" && Array.isArray(config.rows) && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                {config.headers?.map((h, i) => (
                  <th key={i} className="p-2.5 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {config.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
