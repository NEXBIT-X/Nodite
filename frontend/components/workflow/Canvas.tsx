import {
  Background,
  Connection,
  Edge,
  EdgeMouseHandler,
  MarkerType,
  NodeTypes,
  ReactFlow,
  useReactFlow
} from "@xyflow/react";
import { DragEvent, useCallback } from "react";
import { useWorkflowStore } from "./store";
import WorkflowNodeCard from "./WorkflowNodeCard";
import { SidebarSection, WorkflowEdge, WorkflowNode, WorkflowNodeKind } from "./types";

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNodeCard
};

export default function Canvas() {
  const { screenToFlowPosition } = useReactFlow();
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const activeSidebarSection = useWorkflowStore((state) => state.activeSidebarSection);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowStore((state) => state.onConnect);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const deleteEdge = useWorkflowStore((state) => state.deleteEdge);
  const addNode = useWorkflowStore((state) => state.addNode);

  const allowedKindsForSection = (section: SidebarSection): WorkflowNodeKind[] => {
    if (section === "api-design") return ["router", "method"];
    if (section === "websocket") return ["websocket"];
    if (section === "flowgraph") return ["flowgraph"];
    return [];
  };

  const allowedKinds = new Set<WorkflowNodeKind>(allowedKindsForSection(activeSidebarSection));
  const visibleNodes = nodes.filter((node) => allowedKinds.has(node.data.kind));
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = edges
    .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
    .map((edge) => ({
      ...edge,
      selected: false,
      style: { stroke: "#71717a", strokeWidth: 1.7 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#71717a"
      }
    }));

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const kind = event.dataTransfer.getData("application/nodite-node-kind") as WorkflowNodeKind;
      if (!kind) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(kind, position);
    },
    [addNode, screenToFlowPosition]
  );

  const onEdgeClick: EdgeMouseHandler<Edge> = useCallback(
    (event, edge) => {
      event.preventDefault();
      event.stopPropagation();
      deleteEdge(edge.id);
    },
    [deleteEdge]
  );

  return (
    <div className="h-full w-full relative">
      <ReactFlow<WorkflowNode, WorkflowEdge>
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(params: Connection) => onConnect(params)}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        onEdgeClick={onEdgeClick}
        panOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        fitView
        minZoom={0.3}
        maxZoom={1.8}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="bg-zinc-950"
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background gap={22} size={1} color="#35363d" />
      </ReactFlow>

      {/* Empty State Overlay */}
      {visibleNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-zinc-950/50 to-zinc-950/80 pointer-events-none">
          <div className="text-center">
            <p className="text-4xl mb-3">🎨</p>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Start Building Your Workflow</h3>
            <p className="text-sm text-zinc-400">Drag nodes from the left panel, or select a type below</p>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex gap-2 pointer-events-auto">
            {activeSidebarSection === "api-design" && (
              <>
                <button
                  onClick={() => addNode("router", { x: 100, y: 150 })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition"
                >
                  <span>⊕</span>
                  <span className="text-sm font-medium">Add Router</span>
                </button>
                <button
                  onClick={() => addNode("method", { x: 350, y: 150 })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition"
                >
                  <span>⊕</span>
                  <span className="text-sm font-medium">Add Method</span>
                </button>
              </>
            )}
            {activeSidebarSection === "websocket" && (
              <button
                onClick={() => addNode("websocket", { x: 200, y: 150 })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <span>⊕</span>
                <span className="text-sm font-medium">Add Channel</span>
              </button>
            )}
            {activeSidebarSection === "flowgraph" && (
              <button
                onClick={() => addNode("flowgraph", { x: 200, y: 150 })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <span>⊕</span>
                <span className="text-sm font-medium">Add Transform</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
