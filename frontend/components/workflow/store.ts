import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  EdgeChange,
  MarkerType,
  NodeChange,
  XYPosition
} from "@xyflow/react";
import { create } from "zustand";
import {
  DeployPayload,
  DeployRoute,
  RequestType,
  RouteMethod,
  SidebarSection,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowNodeData,
  WorkflowNodeKind
} from "./types";

const ensureLeadingSlash = (value: string) => {
  const clean = value.trim();
  if (!clean) return "/";
  return clean.startsWith("/") ? clean : `/${clean}`;
};

const normalizePath = (value: string) => value.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

const parseJsonObject = (raw: string, label: string) => {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON object.`);
    }
    return { parsed, error: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    return { parsed: null, error: `${label}: ${message}` };
  }
};

const defaultConfigFor = (kind: WorkflowNodeKind): WorkflowNodeConfig => {
  if (kind === "router") {
    return { routerPrefix: "/api" };
  }

  if (kind === "method") {
    return {
      apiMethod: "GET",
      path: "/route",
      requestType: "json",
      requestBody: "{\n  \"input\": true\n}",
      responseBody: "{\n  \"message\": \"ok\"\n}"
    };
  }

  if (kind === "websocket") {
    return {
      websocketChannel: "events/orders",
      responseBody: "{\n  \"event\": \"created\"\n}"
    };
  }

  return {
    flowScript: "return input;"
  };
};

const nodeLabelFor = (kind: WorkflowNodeKind, count: number) => {
  if (kind === "router") return `Router ${count}`;
  if (kind === "method") return `Method ${count}`;
  if (kind === "websocket") return `WebSocket ${count}`;
  return `Flow ${count}`;
};

const initialNodes: WorkflowNode[] = [];
const initialEdges: WorkflowEdge[] = [];

type WorkflowStore = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  activeSidebarSection: SidebarSection;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setActiveSidebarSection: (section: SidebarSection) => void;
  addNode: (kind: WorkflowNodeKind, position: XYPosition) => void;
  updateNode: (id: string, updates: Partial<WorkflowNodeData>) => void;
  updateNodeConfig: (id: string, updates: Partial<WorkflowNodeConfig>) => void;
  deleteSelectedNode: () => void;
  deleteEdge: (edgeId: string) => void;
  deleteSelectedEdge: () => void;
  buildDeployPayload: () => { payload: DeployPayload; error: string };
};

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  selectedEdgeId: null,
  activeSidebarSection: "api-design",

  onNodesChange: (changes) => {
    const nextNodes = applyNodeChanges(changes, get().nodes);
    const nodeIds = new Set(nextNodes.map((node) => node.id));
    const nextEdges = get().edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    const selectedNodeId = get().selectedNodeId;
    const selectedEdgeId = get().selectedEdgeId;

    set({
      nodes: nextNodes,
      edges: nextEdges,
      selectedNodeId: selectedNodeId && nodeIds.has(selectedNodeId) ? selectedNodeId : null,
      selectedEdgeId: selectedEdgeId && nextEdges.some((edge) => edge.id === selectedEdgeId) ? selectedEdgeId : null
    });
  },

  onEdgesChange: (changes) => {
    const nextEdges = applyEdgeChanges(changes, get().edges);
    const selectedEdgeId = get().selectedEdgeId;

    set({
      edges: nextEdges,
      selectedEdgeId: selectedEdgeId && nextEdges.some((edge) => edge.id === selectedEdgeId) ? selectedEdgeId : null
    });
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;

    const withoutTarget = get().edges.filter((edge) => edge.target !== connection.target);
    const next = addEdge(
      {
        ...connection,
        id: `edge_${connection.source}_${connection.target}`,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed }
      },
      withoutTarget
    );

    set({ edges: next, selectedEdgeId: null });
  },

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),

  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  setActiveSidebarSection: (section) => {
    set({ activeSidebarSection: section, selectedNodeId: null, selectedEdgeId: null });
  },

  addNode: (kind, position) => {
    const current = get().nodes;
    const count = current.filter((node) => node.data.kind === kind).length + 1;
    const id = `node_${kind}_${Date.now()}`;

    const nextNode: WorkflowNode = {
      id,
      type: "workflowNode",
      position,
      data: {
        label: nodeLabelFor(kind, count),
        kind,
        config: defaultConfigFor(kind)
      }
    };

    set({ nodes: [...current, nextNode], selectedNodeId: id });
  },

  updateNode: (id, updates) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                ...updates,
                config: {
                  ...node.data.config,
                  ...(updates.config ?? {})
                }
              }
            }
          : node
      )
    });
  },

  updateNodeConfig: (id, updates) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  ...updates
                }
              }
            }
          : node
      )
    });
  },

  deleteSelectedNode: () => {
    const selectedNodeId = get().selectedNodeId;
    if (!selectedNodeId) return;

    set({
      nodes: get().nodes.filter((node) => node.id !== selectedNodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
      ),
      selectedNodeId: null,
      selectedEdgeId: null
    });
  },

  deleteEdge: (edgeId) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== edgeId),
      selectedEdgeId: get().selectedEdgeId === edgeId ? null : get().selectedEdgeId
    });
  },

  deleteSelectedEdge: () => {
    const selectedEdgeId = get().selectedEdgeId;
    if (!selectedEdgeId) return;

    set({
      edges: get().edges.filter((edge) => edge.id !== selectedEdgeId),
      selectedEdgeId: null
    });
  },

  buildDeployPayload: () => {
    const { nodes, edges } = get();
    const byId = new Map(nodes.map((node) => [node.id, node]));

    const resolveRouterPrefix = (nodeId: string) => {
      let currentId = nodeId;
      let depth = 0;

      while (depth < 30) {
        const incoming = edges.find((edge) => edge.target === currentId);
        if (!incoming) return "";

        const prev = byId.get(incoming.source);
        if (!prev) return "";

        if (prev.data.kind === "router") {
          return ensureLeadingSlash(prev.data.config.routerPrefix ?? "/api");
        }

        currentId = prev.id;
        depth += 1;
      }

      return "";
    };

    const routes: DeployRoute[] = [];

    for (const node of nodes) {
      if (node.data.kind !== "method") continue;

      const responseRaw = node.data.config.responseBody ?? "{}";
      const parsed = parseJsonObject(responseRaw, `${node.data.label} response body`);
      if (!parsed.parsed || parsed.error) {
        return {
          payload: { routes: [] },
          error: parsed.error
        };
      }

      const prefix = resolveRouterPrefix(node.id);
      const methodPath = ensureLeadingSlash(node.data.config.path ?? "/route");
      const fullPath = normalizePath(`${prefix}${methodPath}`);

      routes.push({
        id: node.id,
        method: (node.data.config.apiMethod ?? "GET") as RouteMethod,
        path: fullPath,
        responseBody: parsed.parsed,
        responseBodyTemplate: responseRaw,
        requestType: node.data.config.requestType
      });
    }

    return {
      payload: { routes },
      error: ""
    };
  }
}));

export const requestTypes: RequestType[] = ["none", "json", "form-data", "text"];
export const routeMethods: RouteMethod[] = ["GET", "POST"];