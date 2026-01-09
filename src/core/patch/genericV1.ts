import { Workflow } from "../../types";
import { slugify } from "../../utils/slug";

export type GenericNode = {
  id: string;
  type: string;
  data?: Record<string, any>;
  ui?: { x: number; y: number };
};

export type GenericEdge = {
  from: string;
  to: string;
  when: "always" | { expr: string };
};

export type PatchGenericV1 = {
  spec: "autoflow.patch.v1";
  meta: {
    name: string;
    description?: string;
    locale?: string;
  };
  nodes: GenericNode[];
  edges: GenericEdge[];
  assets: {
    intents: any[];
    entities: any[];
  };
};

export function exportGenericPatch(
  workflow: Workflow,
  meta?: Partial<PatchGenericV1["meta"]>
): PatchGenericV1 {
  const name = meta?.name || (workflow as any)?.name || "Untitled";
  const description = meta?.description || "";
  const locale = meta?.locale || "pt-BR";

  const steps = ((workflow as any)?.steps || []) as any[];

  // mapear ids estáveis (stepId -> nodeId)
  const idMap = new Map<string, string>();
  steps.forEach((s, idx) => {
    const stepId = String(s?.id ?? idx);
    const nodeId = `n_${stepId}`;
    idMap.set(stepId, nodeId);
  });

  // nodes usam nodeId
  const nodes: GenericNode[] = steps.map((s, idx) => {
    const stepId = String(s?.id ?? idx);
    const nodeId = idMap.get(stepId)!;

    const type =
      s?.type === "TRIGGER"
        ? "trigger.message"
        : s?.type === "ACTION"
        ? "action.reply"
        : "action.reply";

    const data: Record<string, any> = {};
    if (s?.title) data.title = s.title;
    if (s?.description) data.description = s.description;
    if (s?.params) data.params = s.params;
    if (s?.text) data.text = s.text;

    return {
      id: nodeId,
      type,
      data,
      ui: {
        x: Math.round(s?.position?.x || 0),
        y: Math.round(s?.position?.y || 0),
      },
    };
  });

  // edges usam nodeId também
  const edges: GenericEdge[] = steps.flatMap((s, idx) => {
    const fromStepId = String(s?.id ?? idx);
    const from = idMap.get(fromStepId)!;

    const next = Array.isArray(s?.nextSteps) ? s.nextSteps : [];
    return next
      .map((t: any) => String(t))
      .filter((toStepId: string) => idMap.has(toStepId))
      .map((toStepId: string) => ({
        from,
        to: idMap.get(toStepId)!,
        when: "always" as const,
      }));
  });

  return {
    spec: "autoflow.patch.v1",
    meta: { name, description, locale },
    nodes,
    edges,
    assets: { intents: [], entities: [] },
  };
}

// helper used by adapters (ChatGuru)
export function makeDialogNodeId(title: string, type: string, id: string) {
  const base = slugify(`${title || type || "node"}`);
  const suffix =
    String(id).replace(/[^a-z0-9]/gi, "").slice(-8).toLowerCase() ||
    Math.random().toString(36).slice(2, 10);
  return `${base}_${suffix}`;
}
