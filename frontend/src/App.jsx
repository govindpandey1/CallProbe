import React, { useState, useEffect } from 'react';
import { api } from './api';
import Dashboard from './pages/Dashboard';
import FailureExplorer from './pages/FailureExplorer';
import RegressionDiff from './pages/RegressionDiff';
import ScenarioGenerator from './pages/ScenarioGenerator';
import AgentManager from './pages/AgentManager';
import ReviewQueue from './pages/ReviewQueue';
import {
  BarChart3,
  Filter,
  GitCompare,
  Sparkles,
  Bot,
  ShieldCheck,
  Play,
  X,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [explorerRunId, setExplorerRunId] = useState('');
  const [showRunModal, setShowRunModal] = useState(false);

  // Run launch state
  const [agents, setAgents] = useState([]);
  const [suites, setSuites] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedSuiteId, setSelectedSuiteId] = useState('');
  const [concurrency, setConcurrency] = useState(5);
  const [maxTurns, setMaxTurns] = useState(8);
  const [isLaunching, setIsLaunching] = useState(false);

  const loadLaunchOptions = async () => {
    try {
      const [ag, st] = await Promise.all([api.getAgents(), api.getSuites()]);
      setAgents(ag);
      setSuites(st);
      if (ag.length > 0) setSelectedAgentId(ag[0].id);
      if (st.length > 0) setSelectedSuiteId(st[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadLaunchOptions();
  }, []);

  const handleStartRun = async (e) => {
    e.preventDefault();
    if (!selectedAgentId || !selectedSuiteId) {
      alert("Please select both an agent and a scenario suite.");
      return;
    }
    setIsLaunching(true);
    try {
      await api.startRun({
        agent_id: selectedAgentId,
        suite_id: selectedSuiteId,
        concurrency: parseInt(concurrency, 10),
        max_turns: parseInt(maxTurns, 10),
      });
      setShowRunModal(false);
      setActiveTab('dashboard');
    } catch (err) {
      alert(`Could not start run: ${err.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  const navigateToRunTranscripts = (runId) => {
    setExplorerRunId(runId);
    setActiveTab('explorer');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-md shadow-indigo-600/30">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">CallProbe</span>
              <span className="ml-2 text-[11px] font-semibold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                Hinglish Voice QA
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'explorer' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Failure Explorer
            </button>
            <button
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'diff' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Regression Diff
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'generator' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Scenarios
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'agents' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Agents
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'review' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Review Queue
            </button>
          </nav>

          <button
            onClick={() => {
              loadLaunchOptions();
              setShowRunModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
          >
            <Play className="w-3.5 h-3.5" />
            <span>New Run</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigateToRun={navigateToRunTranscripts}
            onStartNewRun={() => {
              loadLaunchOptions();
              setShowRunModal(true);
            }}
          />
        )}
        {activeTab === 'explorer' && (
          <FailureExplorer initialRunId={explorerRunId} />
        )}
        {activeTab === 'diff' && <RegressionDiff />}
        {activeTab === 'generator' && <ScenarioGenerator />}
        {activeTab === 'agents' && <AgentManager />}
        {activeTab === 'review' && <ReviewQueue />}
      </main>

      {/* Run Simulation Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowRunModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-400" />
              Configure & Launch Simulation Run
            </h3>

            <form onSubmit={handleStartRun} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Voice Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5"
                  required
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.version}) [{a.connector_type}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Scenario Suite</label>
                <select
                  value={selectedSuiteId}
                  onChange={(e) => setSelectedSuiteId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5"
                  required
                >
                  {suites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.domain})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Concurrency (Simultaneous Callers)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={concurrency}
                    onChange={(e) => setConcurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Turns per Conversation</label>
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={maxTurns}
                    onChange={(e) => setMaxTurns(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLaunching}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                >
                  {isLaunching ? "Launching..." : "Start Simulation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
