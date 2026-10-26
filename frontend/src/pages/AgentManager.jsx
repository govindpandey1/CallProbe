import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Bot, Plus, CheckCircle2, Globe, FileCode2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AgentManager() {
  const [agents, setAgents] = useState([]);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("v1.0.0");
  const [connectorType, setConnectorType] = useState("prompt");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoMessage, setDemoMessage] = useState("");

  const loadAgents = async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createAgent({
        name,
        version,
        connector_type: connectorType,
        webhook_url: connectorType === "webhook" ? webhookUrl : null,
        system_prompt: connectorType === "prompt" ? systemPrompt : null,
        knowledge_base: knowledgeBase,
      });
      setName("");
      setWebhookUrl("");
      setSystemPrompt("");
      setKnowledgeBase("");
      await loadAgents();
    } catch (err) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitDemoAgents = async () => {
    try {
      const res = await api.initDemoAgents();
      setDemoMessage(res.message);
      await loadAgents();
      setTimeout(() => setDemoMessage(""), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Demo loader */}
      <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            Agent Connector & Version Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect your voice agent via Webhook URL or System Prompt with Knowledge Base rules.
          </p>
        </div>

        <button
          onClick={handleInitDemoAgents}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-600"
        >
          <Bot className="w-4 h-4 text-amber-400" />
          Load Built-in Demo Bank Agents
        </button>
      </div>

      {demoMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {demoMessage}
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleRegister} className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-indigo-400" />
          Register New Voice Agent
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Agent Name</label>
            <input
              type="text"
              placeholder="e.g. ApnaBank Voice Bot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Version Tag</label>
            <input
              type="text"
              placeholder="e.g. v1.2.0-candidate"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Connector Mode</label>
            <select
              value={connectorType}
              onChange={(e) => setConnectorType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="prompt">Pasted System Prompt (LLM Client)</option>
              <option value="webhook">Webhook HTTP Endpoint</option>
            </select>
          </div>
        </div>

        {connectorType === "webhook" ? (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Webhook URL</label>
            <input
              type="url"
              placeholder="https://your-agent.com/chat or http://localhost:8000/api/demo/webhook-agent"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              CallProbe will POST <code>{`{ "messages": [...] }`}</code> and expects <code>{`{ "reply": "..." }`}</code>.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">System Prompt</label>
            <textarea
              rows="3"
              placeholder="You are a helpful customer support agent for ApnaBank, speaking polite Hinglish..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Official Knowledge Base & Safety Policies (Evaluator Ground Truth)
          </label>
          <textarea
            rows="3"
            placeholder="Official rules, approved FAQs, permitted disclosures, loan interest rates..."
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
        >
          {loading ? "Registering..." : "Register Agent"}
        </button>
      </form>

      {/* Agents List */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Registered Agents</h3>
        </div>

        <div className="divide-y divide-slate-700/60">
          {agents.map((a) => (
            <div key={a.id} className="p-4 hover:bg-slate-700/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{a.name}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-700 text-indigo-300">
                    {a.version}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-900 text-slate-400">
                    {a.connector_type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {a.system_prompt || a.webhook_url}
                </p>
              </div>

              <span className="text-[11px] text-slate-500 font-mono shrink-0">
                ID: {a.id.slice(0, 8)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
