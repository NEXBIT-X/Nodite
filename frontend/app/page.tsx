"use client";

import { FormEvent, useMemo, useState } from "react";

type RouteMethod = "GET" | "POST";

type RouteItem = {
  id: string;
  method: RouteMethod;
  path: string;
  responseBody: Record<string, unknown>;
};

type DeployPayload = {
  routes: RouteItem[];
};

const INITIAL_ROUTES: RouteItem[] = [
  {
    id: "route_1",
    method: "GET",
    path: "/api/test",
    responseBody: {
      message: "Hello from Nodite",
      status: "ok"
    }
  }
];

export default function Home() {
  const [routes, setRoutes] = useState<RouteItem[]>(INITIAL_ROUTES);
  const [method, setMethod] = useState<RouteMethod>("GET");
  const [path, setPath] = useState("/api/new-route");
  const [responseJson, setResponseJson] = useState('{\n  "message": "New route response"\n}');
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);

  const routePreview = useMemo(() => JSON.stringify({ routes }, null, 2), [routes]);

  const addRoute = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!path.trim().startsWith("/")) {
      setStatusMessage("Path must start with '/'.");
      return;
    }

    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = JSON.parse(responseJson);
      if (typeof parsedBody !== "object" || parsedBody === null || Array.isArray(parsedBody)) {
        throw new Error("Response body must be a JSON object.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON.";
      setStatusMessage(`Cannot add route: ${message}`);
      return;
    }

    const newRoute: RouteItem = {
      id: `route_${Date.now()}`,
      method,
      path: path.trim(),
      responseBody: parsedBody
    };

    setRoutes((prev) => [...prev, newRoute]);
    setStatusMessage(`Added ${method} ${newRoute.path}`);
  };

  const deployApi = async () => {
    setIsDeploying(true);
    setStatusMessage("Deploying...");

    const payload: DeployPayload = { routes };

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        setStatusMessage(result.message ?? "Deployment failed.");
        return;
      }

      setStatusMessage(result.message ?? "Deployment successful.");
    } catch {
      setStatusMessage("Deployment failed due to a network/server error.");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-green-400">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="mb-8 rounded-xl border border-green-500/40 bg-zinc-900/70 p-6 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
          <p className="text-xs uppercase tracking-[0.4em] text-green-500">Nodite Control Plane</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-green-300 md:text-5xl">
            Build APIs Like a Synthwave Operator
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-green-200/80">
            Compose routes visually, push configuration, and let your Data Plane mount endpoints from
            shared metadata.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-green-500/40 bg-black/60 p-6">
            <h2 className="mb-4 text-xl font-semibold text-green-300">Add Route</h2>
            <form onSubmit={addRoute} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-green-500">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as RouteMethod)}
                  className="w-full rounded border border-green-500/50 bg-zinc-900 px-3 py-2 font-mono text-green-300 outline-none focus:border-green-400"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-green-500">Path</label>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/api/your-route"
                  className="w-full rounded border border-green-500/50 bg-zinc-900 px-3 py-2 font-mono text-green-300 placeholder:text-green-700 outline-none focus:border-green-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-green-500">JSON Response Body</label>
                <textarea
                  value={responseJson}
                  onChange={(e) => setResponseJson(e.target.value)}
                  rows={8}
                  className="w-full rounded border border-green-500/50 bg-zinc-900 px-3 py-2 font-mono text-green-300 outline-none focus:border-green-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded border border-green-400 bg-green-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-green-300 transition hover:bg-green-500/20"
              >
                Add Route
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-green-500/40 bg-black/60 p-6">
            <h2 className="mb-4 text-xl font-semibold text-green-300">Configured Routes</h2>
            <div className="space-y-3">
              {routes.map((route) => (
                <div key={route.id} className="rounded border border-green-500/40 bg-zinc-900/70 p-3">
                  <p className="font-mono text-sm text-green-300">
                    <span className="text-green-500">[{route.method}]</span> {route.path}
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded bg-black/50 p-2 text-xs text-green-200">
                    {JSON.stringify(route.responseBody, null, 2)}
                  </pre>
                </div>
              ))}
            </div>

            <button
              onClick={deployApi}
              disabled={isDeploying}
              className="mt-6 w-full rounded border border-green-400 bg-green-400/20 px-4 py-3 text-base font-bold uppercase tracking-[0.2em] text-green-200 transition hover:bg-green-400/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeploying ? "Deploying..." : "Deploy API"}
            </button>

            {statusMessage && (
              <p className="mt-3 rounded border border-green-500/30 bg-zinc-900 p-2 text-sm text-green-300">
                {statusMessage}
              </p>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-green-500/40 bg-black/70 p-4">
          <p className="mb-2 text-sm uppercase tracking-widest text-green-500">Current Payload Preview</p>
          <pre className="max-h-72 overflow-auto rounded bg-zinc-900 p-3 font-mono text-xs text-green-300">
            {routePreview}
          </pre>
        </section>
      </div>
    </main>
  );
}
