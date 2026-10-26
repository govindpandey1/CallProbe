import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Play, Activity, ShieldAlert, CheckCircle2, Clock, BarChart3, RefreshCw, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Dashboard({ onNavigateToRun, onStartNewRun }) {
  const [runs, setRuns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [suites, setSuites] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const [runsData, agentsData, suitesData] = await Promise.all([
        api.getRuns(),
        api.getAgents(),
        api.getSuites(),
      ]);
      setRuns(runsData);
      setAgents(agentsData);
      setSuites(suitesData);

      if (runsData.length > 0) {
        const topRun = runsData[0];
        setSelectedRun(topRun);
        const clusterData = await api.getFailureClusters(topRun.id);
        setClusters(clusterData);
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling for live runs
    return () => clearInterval(interval);
  }, []);

  const handleSelectRun = async (run) => {
    setSelectedRun(run);
    try {
      const clusterData = await api.getFailureClusters(run.id);
      setClusters(clusterData);
    } catch (e) {
      console.error(e);
    }
  };

  const chartData = [
    { name: 'Pass Rate', value: selectedRun?.pass_rate || 0, fill: '#10b981' },
    { name: 'Resolution', value: selectedRun?.resolution_rate || 0, fill: '#6366f1' },
    { name: 'Compliance Fails', value: selectedRun?.compliance_fail_rate || 0, fill: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-indigo-400" />
        Loading CallProbe telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Run selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-xl border border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">CallProbe Telemetry Dashboard</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Hinglish-First QA
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Evaluating multi-turn voice conversations, latency SLAs, compliance risks & hallucinations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onStartNewRun}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Play className="w-4 h-4" />
            Launch Simulation Run
          </button>
          <button
            onClick={loadData}
            title="Refresh runs"
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-xl p-12 text-center">
          <Activity className="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-semibold text-white">No Simulation Runs Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-4">
            Initialize the flawed ApnaBank demo agent or generate scenarios to start your first Hinglish QA run.
          </p>
          <button
            onClick={onStartNewRun}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium"
          >
            Start First Run
          </button>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Pass Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mt-2">
                {selectedRun?.pass_rate ?? 0}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {selectedRun?.completed_scenarios} of {selectedRun?.total_scenarios} scenarios completed
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Goal Resolution</span>
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-bold text-white mt-2">
                {selectedRun?.resolution_rate ?? 0}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Resolved caller's Hinglish intent
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Compliance Failures</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-bold text-rose-400 mt-2">
                {selectedRun?.compliance_fail_rate ?? 0}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                OTP / PIN / Policy leaks detected
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Latency SLA</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white mt-2">
                {selectedRun?.p95_latency_ms ?? 0}<span className="text-sm font-normal text-slate-400">ms</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                p50: {selectedRun?.p50_latency_ms ?? 0}ms | p95 threshold: 1,500ms
              </div>
            </div>
          </div>

          {/* Charts & Failure Modes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Bar Chart */}
            <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Run Score Distribution (%)
                </h3>
                <span className="text-xs text-slate-400">Run ID: {selectedRun?.id.slice(0, 8)}</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Failure Clustering (Top 5 Modes) */}
            <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Top Failure Modes (LLM Clustered)
                </h3>
                <span className="text-xs text-rose-400 font-medium">
                  {clusters?.total_failures || 0} Total Failures
                </span>
              </div>

              {clusters?.top_clusters?.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Clean run! No policy or resolution failures detected.
                </div>
              ) : (
                <div className="space-y-3">
                  {clusters?.top_clusters?.map((c, i) => (
                    <div key={i} className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-200">{c.tag}</span>
                        <span className="text-rose-400 font-semibold">{c.count} cases ({c.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, c.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Runs History Table */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">Recent Simulation Runs</h3>
              <span className="text-xs text-slate-400">Click a run to inspect</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-3">Run ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Pass Rate</th>
                    <th className="p-3">Resolution</th>
                    <th className="p-3">Compliance Fails</th>
                    <th className="p-3">p95 Latency</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {runs.map((r) => {
                    const isSelected = selectedRun?.id === r.id;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => handleSelectRun(r)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-700/40'
                        }`}
                      >
                        <td className="p-3 font-mono text-slate-300">{r.id.slice(0, 8)}...</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                            r.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : r.status === 'running'
                              ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-200">{r.pass_rate}%</td>
                        <td className="p-3 text-slate-300">{r.resolution_rate}%</td>
                        <td className="p-3 text-rose-400 font-medium">{r.compliance_fail_rate}%</td>
                        <td className="p-3 text-slate-300">{r.p95_latency_ms} ms</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToRun(r.id);
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-indigo-300 rounded text-[11px] font-medium"
                          >
                            Explore Failures →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
