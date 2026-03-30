import { SidebarSection, WorkflowNodeKind } from "./types";
import { DragEvent } from "react";
import { useWorkflowStore } from "./store";
import Link from "next/link";

type PaletteItem = {
  label: string;
  kind: WorkflowNodeKind;
  description: string;
};

type PaletteSection = { title: string; items: PaletteItem[] };

const sectionDefinitions: Record<SidebarSection, PaletteSection[]> = {
  "api-design": [
    {
      title: "API Nodes",
      items: [
        { label: "Router", kind: "router", description: "Define base path for grouped endpoints (e.g., /api)" },
        { label: "REST Method", kind: "method", description: "HTTP endpoint (GET/POST) with path and response" }
      ]
    }
  ],
  websocket: [
    {
      title: "WebSocket Nodes",
      items: [{ label: "Channel", kind: "websocket", description: "Real-time event channel for WebSocket connections" }]
    }
  ],
  flowgraph: [
    {
      title: "Flowgraph Nodes",
      items: [{ label: "Transform", kind: "flowgraph", description: "Transform or process data in the workflow" }]
    }
  ],
  deployments: []
};

const navItems: Array<{ id: SidebarSection; label: string }> = [
  { id: "api-design", label: "API Design" },
  { id: "websocket", label: "WebSocket" },
  { id: "flowgraph", label: "Flowgraph" },
  { id: "deployments", label: "Deployments" }
];

export default function SidebarLeft() {
  const activeSidebarSection = useWorkflowStore((state) => state.activeSidebarSection);
  const setActiveSidebarSection = useWorkflowStore((state) => state.setActiveSidebarSection);

  const onDragStart = (event: DragEvent<HTMLButtonElement>, kind: WorkflowNodeKind) => {
    event.dataTransfer.setData("application/nodite-node-kind", kind);
    event.dataTransfer.effectAllowed = "move";
  };

  const paletteSections = sectionDefinitions[activeSidebarSection];

  return (
    <aside className="h-full overflow-auto border-r border-zinc-800 bg-zinc-950/75 px-4 py-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)]">
      <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Nodite</p>

      <nav className="mt-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSidebarSection(item.id)}
            className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition ${
              item.id === activeSidebarSection
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {activeSidebarSection === "deployments" ? (
        <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-sm text-zinc-200">Deployment Center</p>
          <p className="mt-1 text-xs text-zinc-500">Open deployment status and run publish from a dedicated route.</p>
          <Link
            href="/api-deploy"
            className="mt-3 inline-flex rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500"
          >
            Open Deployments
          </Link>
        </section>
      ) : (
        <div className="mt-6 space-y-4">
          {paletteSections.map((section) => (
            <section key={section.title}>
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500">{section.title}</p>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    draggable
                    onDragStart={(event) => onDragStart(event, item.kind)}
                    className="group w-full rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 text-left transition hover:border-emerald-500/50 hover:bg-zinc-800 active:cursor-grabbing"
                    title="Drag to canvas to create"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-lg">⊕</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-zinc-200">{item.label}</p>
                        <p className="mt-1 text-xs text-zinc-400 leading-tight">{item.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}
