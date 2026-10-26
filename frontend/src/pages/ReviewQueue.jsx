import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ThumbsUp, ThumbsDown, CheckCircle2, MessageSquare, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ReviewQueue() {
  const [stats, setStats] = useState(null);
  const [recentTranscripts, setRecentTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const loadData = async () => {
    try {
      const statsData = await api.getReviewStats();
      setStats(statsData);

      const runs = await api.getRuns();
      if (runs.length > 0) {
        const trans = await api.getRunTranscripts(runs[0].id);
        setRecentTranscripts(trans.slice(0, 8));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = async (evaluationId, decision) => {
    try {
      await api.submitReview({
        evaluation_id: evaluationId,
        reviewer_decision: decision,
        reviewer_notes: `Marked ${decision} by human reviewer.`
      });
      setFeedbackMsg(`Recorded verdict: ${decision.toUpperCase()}`);
      setTimeout(() => setFeedbackMsg(""), 3000);
      await loadData();
    } catch (err) {
      alert(`Review failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agreement Metric Banner */}
      <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Human Review Queue & Judge Alignment
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit LLM judge verdicts (resolution, compliance, hallucinations) and track judge-vs-human agreement rate.
          </p>
        </div>

        <div className="bg-slate-900/80 px-4 py-2.5 rounded-lg border border-slate-700 text-right">
          <div className="text-xs text-slate-400 font-medium">Judge-vs-Human Agreement</div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats?.agreement_rate ?? 100}%
          </div>
          <div className="text-[10px] text-slate-500">{stats?.total_reviews || 0} Human Audits</div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          {feedbackMsg}
        </div>
      )}

      {/* Evaluations to Review */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-white">Pending Judge Verdict Audits</h3>
          <span className="text-xs text-slate-400">Review recent evaluator scores</span>
        </div>

        <div className="divide-y divide-slate-700/60">
          {recentTranscripts.map((t) => (
            <div key={t.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white capitalize mr-2">{t.persona.replace('_', ' ')}</span>
                  <span className="text-slate-400">({t.language_mix})</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  t.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {t.passed ? 'PASSED' : t.failure_tag}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">{t.caller_goal}</p>

              {/* Evaluators Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {t.evaluations?.map((ev) => (
                  <div key={ev.id} className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 text-xs flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <span className="capitalize">{ev.metric_name}:</span>
                        <span className={ev.passed ? "text-emerald-400 uppercase" : "text-rose-400 uppercase"}>
                          {ev.score}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{ev.reason}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleReview(ev.id, 'agree')}
                        title="Agree with Judge"
                        className="p-1.5 bg-slate-800 hover:bg-emerald-950 text-emerald-400 border border-slate-700 hover:border-emerald-600 rounded transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReview(ev.id, 'disagree')}
                        title="Disagree with Judge"
                        className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 hover:border-rose-600 rounded transition-colors"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
