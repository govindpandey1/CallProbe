const API_BASE = "/api";

export async function fetchJson(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = "API Error";
    try {
      const err = await response.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  getHealth: () => fetchJson("/health"),
  getAgents: () => fetchJson("/agents"),
  createAgent: (data) => fetchJson("/agents", { method: "POST", body: JSON.stringify(data) }),
  initDemoAgents: () => fetchJson("/agents/init-demo", { method: "POST" }),
  
  getSuites: () => fetchJson("/suites"),
  getSuite: (id) => fetchJson(`/suites/${id}`),
  generateScenarios: (data) => fetchJson("/scenarios/generate", { method: "POST", body: JSON.stringify(data) }),
  
  getRuns: () => fetchJson("/runs"),
  getRun: (id) => fetchJson(`/runs/${id}`),
  startRun: (data) => fetchJson("/runs/start", { method: "POST", body: JSON.stringify(data) }),
  saveAsRegressionSuite: (runId) => fetchJson(`/runs/${runId}/save-as-regression-suite`, { method: "POST" }),

  getRunTranscripts: (runId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/runs/${runId}/transcripts${query ? `?${query}` : ""}`);
  },
  getFailureClusters: (runId) => fetchJson(`/runs/${runId}/failure-clusters`),
  getRegressionDiff: (runA, runB) => fetchJson(`/runs/diff?run_a=${runA}&run_b=${runB}`),

  submitReview: (data) => fetchJson("/reviews", { method: "POST", body: JSON.stringify(data) }),
  getReviewStats: () => fetchJson("/reviews/stats"),
};
