import React, { useState, useEffect } from 'react';
import { api } from '../api';
import AudioPlayerToggle from '../components/AudioPlayerToggle';
import { Filter, AlertTriangle, CheckCircle2, ChevronRight, User, Bot, Clock, AlertCircle } from 'lucide-react';

export default function FailureExplorer({ initialRunId, onBack }) {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(initialRunId || "");
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [personaFilter, setPersonaFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("failed"); // "all", "failed", "passed"

  useEffect(() => {
    api.getRuns().then((data) => {
      setRuns(data);
      if (!selectedRunId && data.length > 0) {
        setSelectedRunId(data[0].id);
      }
    });
  }, []);

  const loadTranscripts = async () => {
    if (!selectedRunId) return;
    setLoading(true);
    try {
      const params = {};
      if (personaFilter) params.persona = personaFilter;
      if (languageFilter) params.language = languageFilter;
      if (tagFilter) params.failure_tag = tagFilter;
      if (statusFilter === "failed") params.passed_only = false;
      if (statusFilter === "passed") params.passed_only = true;

      const data = await api.getRunTranscripts(selectedRunId, params);
      setTranscripts(data);
      if (data.length > 0) {
        setSelectedTranscript(data[0]);
      } else {
        setSelectedTranscript(null);
      }
    } catch (e) {
      console.error("Failed to load transcripts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTranscripts();
  }, [selectedRunId, personaFilter, languageFilter, tagFilter, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Run Selection & Filter Toolbar */}
      <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-400" />
              Failure Explorer & Transcript Debugger
            </h2>
            <p className="text-xs text-slate-400">
              Inspect multi-turn voice transcripts with culprit turn highlights and evaluator reasons.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-300 font-medium">Select Run:</label>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  Run {r.id.slice(0, 8)} - Pass: {r.pass_rate}% ({r.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-700/60">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1.5"
            >
              <option value="all">All Scenarios</option>
              <option value="failed">Failures Only</option>
              <option value="passed">Passed Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Persona</label>
            <select
              value={personaFilter}
              onChange={(e) => setPersonaFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1.5"
            >
              <option value="">All Personas</option>
              <option value="impatient">Impatient Caller</option>
              <option value="confused_elder">Confused Elder</option>
              <option value="angry">Angry Customer</option>
              <option value="noisy_line">Noisy-Line Caller</option>
              <option value="policy_violator">Policy Violator</option>
              <option value="interrupter">Interrupter</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Language Mix</label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1.5"
            >
              <option value="">All Languages</option>
              <option value="hinglish">Hinglish</option>
              <option value="hindi">Hindi</option>
              <option value="english">English</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Failure Tag</label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1.5"
            >
              <option value="">All Tags</option>
              <option value="Security & Policy Breach">Security & Policy Breach</option>
              <option value="Factual Hallucination">Factual Hallucination</option>
              <option value="Goal Unresolved">Goal Unresolved</option>
              <option value="Latency SLA Breach">Latency SLA Breach</option>
              <option value="Caller Sentiment Escalation">Caller Sentiment Escalation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Split View: Left List, Right Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[650px]">
        {/* Left List of Scenarios */}
        <div className="lg:col-span-5 bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 bg-slate-900/80 border-b border-slate-700 flex justify-between items-center text-xs text-slate-400">
            <span>{transcripts.length} Conversations Found</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-700/60 flex-1">
            {transcripts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No conversations match the selected filter criteria.
              </div>
            ) : (
              transcripts.map((t) => {
                const isSelected = selectedTranscript?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTranscript(t)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/60 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-200 capitalize">
                        {t.persona.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.passed
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {t.passed ? 'PASSED' : t.failure_tag || 'FAILED'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-1">
                      {t.caller_goal}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="capitalize">{t.language_mix}</span>
                      <span>•</span>
                      <span>Diff: {t.difficulty}/5</span>
                      <span>•</span>
                      <span>{t.turns?.length || 0} turns</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail Transcript Viewer */}
        <div className="lg:col-span-7 bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
          {selectedTranscript ? (
            <>
              {/* Transcript Header */}
              <div className="p-4 bg-slate-900/80 border-b border-slate-700">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-semibold uppercase">
                        {selectedTranscript.persona.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                        selectedTranscript.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {selectedTranscript.passed ? 'PASSED' : selectedTranscript.failure_tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mt-2">
                      Goal: {selectedTranscript.caller_goal}
                    </h3>
                  </div>

                  <AudioPlayerToggle
                    textToSpeak={selectedTranscript.turns?.map(t => `${t.speaker}: ${t.text}`).join(". ")}
                  />
                </div>

                {/* Culprit Evaluator Reason Box */}
                {!selectedTranscript.passed && (
                  <div className="mt-3 p-3 bg-rose-950/40 border border-rose-700/50 rounded-lg text-xs text-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Culprit Reason: </span>
                      {selectedTranscript.evaluations?.find(e => !e.passed)?.reason || "Policy/Resolution failure"}
                    </div>
                  </div>
                )}
              </div>

              {/* Turn-by-turn chat transcript */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-900/40">
                {selectedTranscript.turns?.map((turn) => {
                  const isAgent = turn.speaker === 'agent';
                  const failingEval = selectedTranscript.evaluations?.find(e => !e.passed && e.culprit_turn === turn.turn);
                  const isCulpritTurn = Boolean(failingEval);

                  return (
                    <div
                      key={turn.turn}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        isCulpritTurn
                          ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500'
                          : isAgent
                          ? 'border-indigo-900/50 bg-indigo-950/30 ml-6'
                          : 'border-slate-700 bg-slate-800/80 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          {isAgent ? (
                            <Bot className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>{isAgent ? "Agent" : "Caller"} (Turn {turn.turn})</span>
                          {turn.interrupted && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                              Cut off (Interrupted)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {turn.latency_ms && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3" />
                              {turn.latency_ms} ms
                            </span>
                          )}
                          <AudioPlayerToggle textToSpeak={turn.text} />
                        </div>
                      </div>

                      <div className="text-slate-100 text-sm whitespace-pre-wrap leading-relaxed">
                        {turn.text}
                      </div>

                      {/* Culprit Banner on failing turn */}
                      {isCulpritTurn && (
                        <div className="mt-2.5 pt-2 border-t border-rose-800/60 flex items-center gap-2 text-rose-300 text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Flagged by Judge: {failingEval.reason}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Evaluators Checklist Footer */}
              <div className="p-3 bg-slate-900/90 border-t border-slate-700 flex flex-wrap gap-2 text-xs">
                {selectedTranscript.evaluations?.map((ev) => (
                  <div
                    key={ev.id}
                    title={ev.reason}
                    className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                      ev.passed
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    {ev.passed ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                    )}
                    <span className="capitalize font-medium">{ev.metric_name}:</span>
                    <span className="uppercase font-bold">{ev.score}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a conversation from the left to inspect turns.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
