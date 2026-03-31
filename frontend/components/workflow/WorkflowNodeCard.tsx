import { Handle, NodeProps, Position } from "@xyflow/react";
import { WorkflowNode, WorkflowNodeData } from "./types";

const kindLabel: Record<WorkflowNodeData["kind"], string> = {
  router: "API Design",
  method: "API Design",
  websocket: "WebSocket",
  flowgraph: "Flowgraph"
};

export default function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowNode>) {
  const subtitle =
    data.kind === "router"
      ? `Prefix ${data.config.routerPrefix ?? "/api"}`
      : data.kind === "method"
        ? `${data.config.apiMethod ?? "GET"} ${data.config.path ?? "/route"}`
        : data.kind === "websocket"
          ? data.config.websocketChannel ?? "channel"
          : "Flow transform";

  return (
    <div
      className={`group relative min-w-[220px] rounded-xl border bg-zinc-900/95 px-4 py-3 transition ${
        selected
          ? "border-emerald-300/90 shadow-[0_0_0_2px_rgba(110,231,183,0.22),0_14px_34px_rgba(0,0,0,0.45),0_0_24px_rgba(255,255,255,0.08)]"
          : "border-zinc-700/90 shadow-[0_10px_24px_rgba(0,0,0,0.38),0_0_0_1px_rgba(255,255,255,0.02)] hover:border-zinc-500"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!h-3 !w-3 !border !border-zinc-300 !bg-zinc-900"
      />

      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">{kindLabel[data.kind]}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-100">{data.label}</p>
      <p className="mt-1 font-mono text-[11px] text-zinc-400">{subtitle}</p>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!h-4 !w-4 !border !border-zinc-300 !bg-zinc-900"
      />
      <span className="pointer-events-none absolute right-[-8px] top-1/2 -translate-y-1/2 text-xs text-zinc-200">
        +
      </span>
    </div>
  );
}
