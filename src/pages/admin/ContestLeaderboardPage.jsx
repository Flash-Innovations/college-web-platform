import React, { useState, useEffect, useCallback } from "react";
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
  Code2
} from "lucide-react";
import { practiceService } from "../../services/practiceService";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { DetailSkeleton } from "../../components/common/LoadingSkeleton";

export function ContestLeaderboardPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/branch") ? "/branch" : "/dept";

  const [leaderboard, setLeaderboard] = useState(null);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");

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
  const filteredEntries = search.trim()
    ? entries.filter(e =>
        (e.studentId || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.studentName || "").toLowerCase().includes(search.toLowerCase())
      )
    : entries;

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
            <span>Back to Contest Studio</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Live Contest Leaderboard
              </h1>
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
            <span>Manage Contest</span>
          </Button>
        </div>
      </div>

      {/* Stats summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Ranked Participants</span>
          <span className="text-2xl font-extrabold text-slate-900">{totalEntries}</span>
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
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student identifier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Submissions Recorded Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Participants will appear on this leaderboard in real time once they submit or finalize their official contest attempt.
            </p>
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
                  return (
                    <tr
                      key={row.attemptId || row.id || index}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center">
                        {getRankBadge(rank)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {row.studentName || row.studentId || "Student Participant"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {row.studentId}
                        </span>
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
