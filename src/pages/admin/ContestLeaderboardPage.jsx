import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Clock,
  RefreshCw,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Code2,
  Building,
  Filter
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { practiceService } from "../../services/practiceService";
import { adminService } from "../../services/adminService";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { DetailSkeleton } from "../../components/common/LoadingSkeleton";

export function ContestLeaderboardPage() {
  const { contestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/branch") ? "/branch" : "/dept";

  const userBranch = user?.branchName || user?.branchCode || user?.branch || user?.branchId || "";
  const isBranchRole = user?.role === "branch_admin" || basePath === "/branch" || Boolean(userBranch);

  const [leaderboard, setLeaderboard] = useState(null);
  const [contest, setContest] = useState(null);
  const [studentsMap, setStudentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");

  // Load student users map for resolving names, roll numbers, and branches
  useEffect(() => {
    let isMounted = true;
    adminService.getUsers()
      .then((users) => {
        if (!isMounted || !Array.isArray(users)) return;
        const map = {};
        users.forEach((u) => {
          const id = u.id || u._id;
          if (id) map[id] = u;
        });
        setStudentsMap(map);
      })
      .catch((err) => {
        console.warn("Could not preload students map for contest leaderboard:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchData = useCallback(async ({ isRefresh = false } = {}) => {
    if (!contestId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [contestRes, lbRes] = await Promise.all([
        practiceService.getContestById(contestId),
        practiceService.getAdminContestLeaderboard(contestId, { page, limit })
      ]);

      const cData = contestRes?.data?.id ? contestRes.data : contestRes;
      const lbData = lbRes?.data || lbRes;
      setContest(cData);
      setLeaderboard(lbData);
    } catch (err) {
      setError(err?.message || "Failed to load contest leaderboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contestId, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isDeptCreatedForBranch = isBranchRole && Boolean(contest?.createdBy && contest.createdBy !== user?.id);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="p-3 bg-red-100 text-red-600 rounded-full w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Leaderboard Error</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <Button variant="outline" size="sm" onClick={() => fetchData()}>
          Retry
        </Button>
      </div>
    );
  }

  const entries = leaderboard?.entries || [];

  // Collect distinct branches available in this contest & participants
  const availableBranches = (() => {
    const set = new Set();
    if (userBranch) set.add(userBranch);
    if (Array.isArray(contest?.branchIds)) {
      contest.branchIds.forEach((b) => {
        if (b && typeof b === "string" && b.length !== 24) set.add(b);
      });
    }
    entries.forEach((e) => {
      const u = studentsMap[e.studentId];
      const br = u?.branch || u?.branchName || u?.department;
      if (br && typeof br === "string") set.add(br);
    });
    return Array.from(set).sort();
  })();

  const filteredEntries = entries.filter((e) => {
    const studentInfo = studentsMap[e.studentId] || {};
    const studentName = studentInfo.name || e.studentName || "";
    const rollNo = studentInfo.rollNo || "";
    const branch = studentInfo.branch || studentInfo.branchName || studentInfo.department || "";

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = studentName.toLowerCase().includes(q);
      const matchId = (e.studentId || "").toLowerCase().includes(q);
      const matchRoll = rollNo.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchRoll) return false;
    }

    // Branch filter
    if (branchFilter !== "ALL") {
      if (branchFilter === "MY_BRANCH") {
        if (userBranch && branch.toLowerCase() !== userBranch.toLowerCase()) return false;
      } else if (branch.toLowerCase() !== branchFilter.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  const totalEntries = leaderboard?.totalEntries || entries.length;
  const totalPages = leaderboard?.pagination?.totalPages || Math.ceil(totalEntries / limit) || 1;

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
          🥇 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-xs">
          🥈 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/30 text-amber-900 font-black text-xs shadow-xs">
          🥉 3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={() => navigate(`${basePath}/contests/${contestId}`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isDeptCreatedForBranch ? "Back to Contest Details" : "Back to Contest Studio"}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Live Contest Leaderboard
                </h1>
                {isDeptCreatedForBranch && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md">
                    <Shield className="w-3 h-3 text-purple-600" /> Dept Contest • Read-Only
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {contest?.title} • Standard Competitive Penalty Ranking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData({ isRefresh: true })}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Standings</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`${basePath}/contests/${contestId}`)}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white"
          >
            <span>{isDeptCreatedForBranch ? "View Contest Details" : "Manage Contest"}</span>
          </Button>
        </div>
      </div>

      {/* Stats summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Ranked Participants</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{filteredEntries.length}</span>
            {filteredEntries.length !== totalEntries && (
              <span className="text-xs text-slate-400 font-medium">of {totalEntries} total</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Contest Status</span>
          <span className="text-lg font-bold text-emerald-600 uppercase tracking-wider block mt-1">
            {contest?.status || "LIVE"}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total Marks Available</span>
          <span className="text-2xl font-extrabold text-slate-900">{contest?.totalMarks || 0}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Duration</span>
          <span className="text-2xl font-extrabold text-slate-900">{contest?.durationMinutes || 0}m</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, roll no, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Branch Filter Quick Toggle and Selector */}
        <div className="flex items-center gap-2">
          {userBranch && (
            <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setBranchFilter("ALL")}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  branchFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All Branches
              </button>
              <button
                type="button"
                onClick={() => setBranchFilter(userBranch)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  branchFilter.toLowerCase() === userBranch.toLowerCase()
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Building className="w-3 h-3" />
                <span>My Branch: {userBranch}</span>
              </button>
            </div>
          )}

          <div className="relative shrink-0">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Filter Branch: All ({entries.length})</option>
              {availableBranches.map((b) => (
                <option key={b} value={b}>
                  {b === userBranch ? `★ My Branch (${b})` : `Branch: ${b}`}
                </option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Submissions Recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {branchFilter !== "ALL" || search.trim()
                ? "No student results match your current branch or search criteria."
                : "Participants will appear on this leaderboard in real time once they submit their official contest attempt."}
            </p>
            {(branchFilter !== "ALL" || search.trim()) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBranchFilter("ALL");
                  setSearch("");
                }}
                className="mt-3 text-xs"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Coding</th>
                  <th className="py-3 px-4 text-right">Aptitude</th>
                  <th className="py-3 px-4 text-right">Technical</th>
                  <th className="py-3 px-4 text-right">Total Score</th>
                  <th className="py-3 px-4 text-right">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((row, index) => {
                  const rank = row.rank || (page - 1) * limit + index + 1;
                  const studentInfo = studentsMap[row.studentId] || {};
                  const studentName = studentInfo.name || row.studentName || row.studentId || "Student Participant";
                  const rollNo = studentInfo.rollNo || "";
                  const branch = studentInfo.branch || studentInfo.branchName || studentInfo.department || "";

                  return (
                    <tr
                      key={row.attemptId || row.id || index}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center">
                        {getRankBadge(rank)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block text-xs">
                          {studentName}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {rollNo && (
                            <span className="text-[10px] font-mono text-slate-700 font-semibold bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                              {rollNo}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {row.studentId}
                          </span>
                          {branch && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">
                              <Building className="w-2.5 h-2.5 text-indigo-500" />
                              {branch}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {row.codingScore !== null ? Number(row.codingScore).toFixed(1) : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {row.aptitudeScore !== null ? Number(row.aptitudeScore).toFixed(1) : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {row.technicalScore !== null ? Number(row.technicalScore).toFixed(1) : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-amber-700 text-sm bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          {Number(row.totalScore || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 text-[11px]">
                        {row.submittedAt
                          ? new Date(row.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 text-xs">
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ContestLeaderboardPage;
