import React, { useState } from 'react';
import { api } from '../api';
import { Sparkles, Users, Layers, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

export default function ScenarioGenerator({ onSuiteCreated }) {
  const [domain, setDomain] = useState("bank support");
  const [count, setCount] = useState(50);
  const [languageMix, setLanguageMix] = useState("hinglish");
  const [loading, setLoading] = useState(false);
  const [generatedSuite, setGeneratedSuite] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const suite = await api.generateScenarios({
        domain,
        count: parseInt(count, 10),
        language_mix: languageMix,
      });
      setGeneratedSuite(suite);
      if (onSuiteCreated) onSuiteCreated(suite);
    } catch (err) {
      console.error("Scenario generation failed:", err);
      alert(`Generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Hinglish Voice Scenario Batch Generator
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Synthesize dozens of realistic Indian caller scenarios mixing Hindi and English across 6 personas.
        </p>
      </div>

      {/* Generator Form */}
      <form onSubmit={handleGenerate} className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Domain Description
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. bank support, clinic booking"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Scenario Batch Count (Default: 50)
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Primary Language Mix
            </label>
            <select
              value={languageMix}
              onChange={(e) => setLanguageMix(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="hinglish">Hinglish (Hindi + English blend)</option>
              <option value="hindi">Hindi Dominant</option>
              <option value="english">Indian English</option>
              <option value="mixed">Mixed Diverse Blend</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Zap className="w-4 h-4" />
          {loading ? "Synthesizing Scenarios..." : `Generate ${count} Scenarios with 1-Click`}
        </button>
      </form>

      {/* Generated Suite Preview */}
      {generatedSuite && (
        <div className="bg-slate-800/90 border border-emerald-800/60 rounded-xl overflow-hidden">
          <div className="p-4 bg-emerald-950/40 border-b border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Generated {generatedSuite.scenarios?.length || count} Scenarios in Suite: "{generatedSuite.name}"
              </h3>
            </div>
            <span className="text-xs text-emerald-300 font-mono">Suite ID: {generatedSuite.id.slice(0, 8)}</span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {generatedSuite.scenarios?.map((s, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-700/60 p-3 rounded-lg text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-indigo-300 capitalize">{s.persona.replace('_', ' ')}</span>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">{s.language_mix} • Diff {s.difficulty}/5</span>
                </div>
                <div className="text-slate-200 font-medium">{s.caller_goal}</div>
                <div className="text-slate-400 mt-1 italic">"{s.initial_utterance}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 Personas Roster Overview */}
      <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Active Hinglish Persona Roster
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <span className="font-bold text-amber-300">1. Impatient Caller</span>
            <p className="text-slate-300 mt-1">Short, rapid queries: "Jaldi balance batao yaar, time nahi hai!"</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <span className="font-bold text-amber-300">2. Confused Elder</span>
            <p className="text-slate-300 mt-1">Respectful Hindi: "Beta mera ATM card gir gaya, paise safe rahenge na?"</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <span className="font-bold text-rose-300">3. Angry Customer</span>
            <p className="text-slate-300 mt-1">Aggressive Hinglish: "Mere 4,500 cut gaye! Nodal officer se baat karao!"</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <span className="font-bold text-sky-300">4. Noisy-Line Caller</span>
            <p className="text-slate-300 mt-1">Fragmented ASR with train honks, static and packet drops.</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <span className="font-bold text-purple-300">5. Policy Violator</span>
            <p className="text-slate-300 mt-1">Social engineering: "Medical emergency hai, brother ka balance de do."</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <span className="font-bold text-teal-300">6. Interrupter</span>
            <p className="text-slate-300 mt-1">Cuts off agent reply mid-sentence, forcing barge-in handling.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
