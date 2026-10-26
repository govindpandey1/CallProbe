import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { GitCompare, Bookmark, ArrowRight, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, ShieldAlert } from 'lucide-react';

export default function RegressionDiff() {
  const [runs, setRuns] = useState([]);
  const [runA, setRunA] = useState("");
  const [runB, setRunB] = useState("");
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suiteSavedMessage, setSuiteSavedMessage] = useState("");

  useEffect(() => {
    api.getRuns().then((data) => {
      setRuns(data);
      if (data.length >= 2) {
        setRunA(data[1].id); // older run
        setRunB(data[0].id); // latest run
      } else if (data.length === 1) {
        setRunA(data[0].id);
        setRunB(data[0].id);
      }
    });
  }, []);

  const handleComputeDiff = async () => {
    if (!runA || !runB) return;
    setLoading(true);
    setSuiteSavedMessage("");
    try {
      const result = await api.getRegressionDiff(runA, runB);
      setDiffData(result);
    } catch (e) {
      console.error("Diff failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (runA && runB) {
      handleComputeDiff();
    }
  }, [runA, runB]);

  const handleSaveRegressionSuite = async () => {
    if (!runA) return;
    try {
      const res = await api.saveAsRegressionSuite(runA);
      setSuiteSavedMessage(res.message);
      setTimeout(() => setSuiteSavedMessage(""), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-400" />
              Agent Regression & Version Diff
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Compare baseline Agent Version A against candidate Version B to detect safety and resolution regressions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveRegressionSuite}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              Save Suite as Regression Suite
            </button>
          </div>
        </div>

        {suiteSavedMessage && (
          <div className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {suiteSavedMessage}
          </div>
        )}

        {/* Version Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700/60">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Run A (Baseline Agent)
            </label>
            <select
              value={runA}
              onChange={(e) => setRunA(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id.slice(0, 8)}... (Pass: {r.pass_rate}%, Fails: {r.compliance_fail_rate}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Run B (Candidate Agent)
            </label>
            <select
              value={runB}
              onChange={(e) => setRunB(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id.slice(0, 8)}... (Pass: {r.pass_rate}%, Fails: {r.compliance_fail_rate}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Calculating per-metric deltas and regressions...
        </div>
      ) : diffData ? (
        <>
          {/* Side-by-Side Metric Deltas Table */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">Per-Metric Delta Comparison</h3>
              <span className="text-xs text-slate-400">Comparing Run A vs Run B</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-3">Evaluation Metric</th>
                    <th className="p-3">Baseline (Run A)</th>
                    <th className="p-3">Candidate (Run B)</th>
                    <th className="p-3">Delta</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {diffData.deltas?.map((d, idx) => {
                    const isImproved = d.status === 'improved';
                    const isRegressed = d.status === 'regressed';
                    return (
                      <tr key={idx} className="hover:bg-slate-700/30">
                        <td className="p-3 font-medium text-slate-200">{d.metric}</td>
                        <td className="p-3 text-slate-300">{d.run_a}</td>
                        <td className="p-3 text-slate-300">{d.run_b}</td>
                        <td className="p-3 font-semibold">
                          <span className={`inline-flex items-center gap-1 ${
                            isImproved ? 'text-emerald-400' : isRegressed ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {d.delta > 0 ? `+${d.delta}` : d.delta}
                            {isImproved && <ArrowUpRight className="w-3.5 h-3.5" />}
                            {isRegressed && <ArrowDownRight className="w-3.5 h-3.5" />}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isImproved
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isRegressed
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regressions Section: Passed on A, Failed on B */}
          <div className="bg-slate-800/90 border border-rose-900/50 rounded-xl overflow-hidden">
            <div className="p-4 bg-rose-950/30 border-b border-rose-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Regressed Scenarios ({diffData.regressions?.length || 0})
                </h3>
              </div>
              <span className="text-xs text-rose-300 font-medium">Passed on A, Failed on B</span>
            </div>

            {diffData.regressions?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                🎉 No regressions detected! All scenarios that passed on Run A remained intact or improved.
              </div>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {diffData.regressions?.map((sc, i) => (
                  <div key={i} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 capitalize">
                          {sc.persona.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 capitalize">({sc.language_mix})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 uppercase">
                        {sc.failing_metric}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{sc.caller_goal}</p>

                    <div className="mt-2 text-xs text-rose-300 flex items-center gap-2 bg-rose-950/40 p-2 rounded border border-rose-900/40">
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{sc.failing_reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Improvements Section: Failed on A, Passed on B */}
          <div className="bg-slate-800/90 border border-emerald-900/50 rounded-xl overflow-hidden">
            <div className="p-4 bg-emerald-950/30 border-b border-emerald-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Resolved / Fixed Scenarios ({diffData.improvements?.length || 0})
                </h3>
              </div>
              <span className="text-xs text-emerald-300 font-medium">Failed on A, Passed on B</span>
            </div>

            {diffData.improvements?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No newly fixed scenarios detected in this comparison.
              </div>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {diffData.improvements?.map((sc, i) => (
                  <div key={i} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-200 capitalize">
                        {sc.persona.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                        FIXED
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{sc.caller_goal}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
