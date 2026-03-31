"use client";

import "@xyflow/react/dist/style.css";
import { ReactFlowProvider } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Canvas from "../../components/workflow/Canvas";
import SidebarLeft from "../../components/workflow/SidebarLeft";
import SidebarRight from "../../components/workflow/SidebarRight";
import { useWorkflowStore } from "../../components/workflow/store";

export default function DashboardPage() {
  const router = useRouter();

  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const selectedEdgeId = useWorkflowStore((state) => state.selectedEdgeId);
  const activeSidebarSection = useWorkflowStore((state) => state.activeSidebarSection);
  const deleteSelectedNode = useWorkflowStore((state) => state.deleteSelectedNode);
  const deleteSelectedEdge = useWorkflowStore((state) => state.deleteSelectedEdge);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isInputLike = tag === "input" || tag === "textarea" || tag === "select";
      const isEditable = Boolean(target?.isContentEditable);
      if (isInputLike || isEditable) return;

      if (selectedNodeId) {
        event.preventDefault();
        deleteSelectedNode();
        return;
      }

      if (selectedEdgeId) {
        event.preventDefault();
        deleteSelectedEdge();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelectedEdge, deleteSelectedNode, selectedEdgeId, selectedNodeId]);

  const goDeploy = () => {
    router.push("/api-deploy");
  };

  return (
    <main className="h-screen w-full bg-zinc-950 text-zinc-100">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Nodite Control Plane</p>
            <p className="mt-1 text-xs text-zinc-400">
              {activeSidebarSection === "api-design" && "📡 API Design"}
              {activeSidebarSection === "websocket" && "🔌 WebSocket"}
              {activeSidebarSection === "flowgraph" && "⚙️ Flowgraph"}
              {activeSidebarSection === "deployments" && "🚀 Deployments"}
            </p>
          </div>

          <button
            onClick={goDeploy}
            className="rounded-md border border-emerald-600 bg-emerald-600/10 px-3 py-1.5 text-sm text-emerald-400 transition hover:bg-emerald-600/20"
          >
            Deploy API
          </button>
        </header>

        <div
          className="grid h-full min-h-0 transition-[grid-template-columns] duration-300"
          style={{
            gridTemplateColumns: selectedNodeId ? "260px minmax(0,1fr) 340px" : "260px minmax(0,1fr)"
          }}
        >
          <SidebarLeft />

          <section className="relative h-full min-h-0 border-x border-zinc-900/70">
            <ReactFlowProvider>
              <Canvas />
            </ReactFlowProvider>
          </section>

          {selectedNodeId && <SidebarRight />}
        </div>
      </div>
    </main>
  );
}
