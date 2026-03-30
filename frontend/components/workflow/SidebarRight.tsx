import { routeMethods, requestTypes, useWorkflowStore } from "./store";

export default function SidebarRight() {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const selectedNode = useWorkflowStore((state) =>
    state.nodes.find((node) => node.id === state.selectedNodeId)
  );
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);
  const deleteSelectedNode = useWorkflowStore((state) => state.deleteSelectedNode);

  if (!selectedNodeId || !selectedNode) {
    return (
      <aside className="h-full border-l border-zinc-800 bg-zinc-950/85 px-4 py-4 shadow-[inset_1px_0_0_rgba(255,255,255,0.03)]">
        <div className="mt-8 flex flex-col items-center gap-3 text-center py-12">
          <p className="text-3xl">👆</p>
          <p className="text-sm text-zinc-400">Select a node on the canvas to inspect and edit.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full overflow-auto border-l border-zinc-800 bg-zinc-950/85 px-4 py-4 shadow-[inset_1px_0_0_rgba(255,255,255,0.03)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-100">{selectedNode.data.label}</p>
        </div>
        <button
          onClick={deleteSelectedNode}
          className="mt-1 rounded-md border border-rose-400/40 bg-rose-900/20 px-2 py-1 text-[11px] text-rose-200 transition hover:border-rose-300 hover:bg-rose-900/30 flex-shrink-0"
        >
          Delete
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-zinc-500">Node Name</label>
          <input
            value={selectedNode.data.label}
            onChange={(event) => updateNode(selectedNode.id, { label: event.target.value })}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          />
        </div>

        {selectedNode.data.kind === "router" && (
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-zinc-500">
              Route Prefix
            </label>
            <input
              value={selectedNode.data.config.routerPrefix ?? ""}
              onChange={(event) => updateNodeConfig(selectedNode.id, { routerPrefix: event.target.value })}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
            />
          </div>
        )}

        {selectedNode.data.kind === "method" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-zinc-500">
                  Method
                </label>
                <select
                  value={selectedNode.data.config.apiMethod ?? "GET"}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      apiMethod: event.target.value as "GET" | "POST"
                    })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                >
                  {routeMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-zinc-500">
                  Request Type
                </label>
                <select
                  value={selectedNode.data.config.requestType ?? "json"}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      requestType: event.target.value as (typeof requestTypes)[number]
                    })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                >
                  {requestTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-zinc-500">Path</label>
              <input
                value={selectedNode.data.config.path ?? ""}
                onChange={(event) => updateNodeConfig(selectedNode.id, { path: event.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-zinc-500">
                Request Body
              </label>
              <textarea
                rows={5}
                value={selectedNode.data.config.requestBody ?? "{}"}
                onChange={(event) => updateNodeConfig(selectedNode.id, { requestBody: event.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-zinc-500">
                Response Body
              </label>
              <textarea
                rows={8}
                value={selectedNode.data.config.responseBody ?? "{}"}
                onChange={(event) => updateNodeConfig(selectedNode.id, { responseBody: event.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-zinc-500"
              />
            </div>
          </>
        )}

        {selectedNode.data.kind === "websocket" && (
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-zinc-500">Channel</label>
            <input
              value={selectedNode.data.config.websocketChannel ?? ""}
              onChange={(event) =>
                updateNodeConfig(selectedNode.id, { websocketChannel: event.target.value })
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
            />
          </div>
        )}

        {selectedNode.data.kind === "flowgraph" && (
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-zinc-500">
              Transform Script
            </label>
            <textarea
              rows={6}
              value={selectedNode.data.config.flowScript ?? ""}
              onChange={(event) => updateNodeConfig(selectedNode.id, { flowScript: event.target.value })}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-zinc-500"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
