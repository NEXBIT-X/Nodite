"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useWorkflowStore } from "../../components/workflow/store";
import type { DeployRoute } from "../../components/workflow/types";

type DeployState = "idle" | "deploying" | "success" | "error";

export default function ApiDeployPage() {
  const buildDeployPayload = useWorkflowStore((state) => state.buildDeployPayload);

  const [deployState, setDeployState] = useState<DeployState>("idle");
  const [message, setMessage] = useState("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<DeployRoute | null>(null);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<{ status: number; body: unknown } | null>(null);

  const payloadState = useMemo(() => buildDeployPayload(), [buildDeployPayload]);

  const runDeploy = async () => {
    if (payloadState.error) {
      setDeployState("error");
      setMessage(payloadState.error);
      return;
    }

    setDeployState("deploying");
    setMessage("Deploying configuration...");

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadState.payload)
      });

      const result = await response.json();
      if (!response.ok) {
        setDeployState("error");
        setMessage(result.message ?? "Deployment failed.");
        return;
      }

      setDeployState("success");
      setMessage(result.message ?? "Deployment successful. APIs are live at http://localhost:4000");
    } catch {
      setDeployState("error");
      setMessage("Deployment failed due to a network/server error.");
    }
  };

  const generateCurlCommand = (endpoint: DeployRoute) => {
    const url = `http://localhost:4000${endpoint.path}`;
    const method = endpoint.method;
    let curl = `curl -X ${method} "${url}"`;

    if (method === "POST" || endpoint.requestType === "json") {
      curl += ` \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(endpoint.responseBody)}'`;
    }

    return curl;
  };

  const testEndpoint = async (endpoint: DeployRoute) => {
    setTestLoading(true);
    setTestResponse(null);

    try {
      let url = `http://localhost:4000${endpoint.path}`;
      const options: RequestInit = {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" }
      };

      if (endpoint.method === "POST") {
        try {
          options.body = testInput || JSON.stringify(endpoint.responseBody);
        } catch {
          options.body = JSON.stringify(endpoint.responseBody);
        }
      } else if (testInput) {
        const params = new URLSearchParams();
        try {
          const obj = JSON.parse(testInput);
          Object.entries(obj).forEach(([key, value]) => {
            params.append(key, String(value));
          });
          url += `?${params.toString()}`;
        } catch {
          // Fall back to plain text
        }
      }

      const response = await fetch(url);
      const body = await response.json();

      setTestResponse({
        status: response.status,
        body
      });
    } catch (error) {
      setTestResponse({
        status: 0,
        body: {
          error: error instanceof Error ? error.message : "Request failed"
        }
      });
    } finally {
      setTestLoading(false);
    }
  };

  const routes = payloadState.payload.routes;
  const hasError = Boolean(payloadState.error);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-[0_10px_30px_rgba(255,255,255,0.04),0_16px_44px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Deployments</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-100">API Deployment Console</h1>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => void runDeploy()}
              disabled={deployState === "deploying" || hasError}
              className="rounded-md border border-emerald-600 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-400 transition hover:bg-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deployState === "deploying" ? "Deploying..." : "Deploy APIs"}
            </button>

            <Link
              href="/dashboard"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-500"
            >
              Back to Dashboard
            </Link>
          </div>

          {message && (
            <div
              className={`mt-4 rounded-lg border p-3 text-sm ${
                deployState === "success"
                  ? "border-emerald-800/50 bg-emerald-950/40 text-emerald-300"
                  : deployState === "error"
                    ? "border-rose-800/50 bg-rose-950/40 text-rose-300"
                    : "border-zinc-800 bg-zinc-950/80 text-zinc-300"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {hasError ? (
          <div className="rounded-xl border border-rose-800/50 bg-rose-950/40 p-6">
            <p className="text-rose-300">{payloadState.error}</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-12 text-center">
            <p className="text-zinc-400">No endpoints configured. Create method nodes in the dashboard.</p>
          </div>
        ) : (
          <>
            {/* Endpoints List */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 mb-4">Endpoints ({routes.length})</p>
              <div className="space-y-2">
                {routes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => setSelectedEndpoint(route)}
                    className={`w-full p-3 rounded-lg border transition text-left ${
                      selectedEndpoint?.id === route.id
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                        : "border-zinc-700 bg-zinc-800/40 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-zinc-700 text-xs font-mono font-bold">{route.method}</span>
                      <span className="font-mono text-sm">{route.path}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Endpoint Details & Tester */}
            {selectedEndpoint && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Details */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 mb-4">Endpoint Details</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2">Method</label>
                      <span className="inline-block px-2 py-1 rounded bg-zinc-700 font-mono text-sm font-bold">
                        {selectedEndpoint.method}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2">Path</label>
                      <code className="block p-2 rounded bg-zinc-950 border border-zinc-800 font-mono text-sm text-emerald-300">
                        {selectedEndpoint.path}
                      </code>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2">Curl Command</label>
                      <code className="block p-2 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-auto max-h-28">
                        {generateCurlCommand(selectedEndpoint)}
                      </code>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2">Response Preview</label>
                      <pre className="p-2 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-auto max-h-40">
                        {JSON.stringify(selectedEndpoint.responseBody, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Live Tester */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 mb-4">Live Tester</p>

                  <div className="space-y-3">
                    {(selectedEndpoint.method === "POST" || selectedEndpoint.requestType === "json") && (
                      <div>
                        <label className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2">Request Body</label>
                        <textarea
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          placeholder={JSON.stringify(selectedEndpoint.responseBody, null, 2)}
                          className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none resize-none h-24"
                        />
                      </div>
                    )}

                    <button
                      onClick={() => void testEndpoint(selectedEndpoint)}
                      disabled={testLoading}
                      className="w-full px-3 py-2 rounded-md border border-emerald-600 bg-emerald-600/10 text-sm text-emerald-400 transition hover:bg-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testLoading ? "Testing..." : "Send Request"}
                    </button>

                    {testResponse && (
                      <div>
                        <label className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2">
                          Response ({testResponse.status})
                        </label>
                        <pre className="p-2 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-auto max-h-40">
                          {JSON.stringify(testResponse.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Full Payload */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Full Deployment Payload</p>
              <pre className="max-h-[300px] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
                {JSON.stringify(payloadState.payload, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
