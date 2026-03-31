import { Edge, Node } from "@xyflow/react";

export type WorkflowNodeKind = "router" | "method" | "websocket" | "flowgraph";
export type SidebarSection = "api-design" | "websocket" | "flowgraph" | "deployments";
export type RouteMethod = "GET" | "POST";
export type RequestType = "none" | "json" | "form-data" | "text";

export type WorkflowNodeConfig = {
  routerPrefix?: string;
  apiMethod?: RouteMethod;
  path?: string;
  requestType?: RequestType;
  requestBody?: string;
  responseBody?: string;
  websocketChannel?: string;
  flowScript?: string;
};

export type WorkflowNodeData = {
  label: string;
  kind: WorkflowNodeKind;
  config: WorkflowNodeConfig;
};

export type WorkflowNode = Node<WorkflowNodeData, "workflowNode">;
export type WorkflowEdge = Edge;

export type DeployRoute = {
  id: string;
  method: RouteMethod;
  path: string;
  responseBody: Record<string, unknown>;
  responseBodyTemplate?: string; // Raw template string for display
  requestType?: RequestType;
};

export type DeployPayload = {
  routes: DeployRoute[];
};
