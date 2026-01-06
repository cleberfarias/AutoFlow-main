import { PatchGenericV1, GenericEdge, makeDialogNodeId } from "../../core/patch/genericV1";

export type ChatGuruDialog = {
  temp_id: string;
  title: string;
  dialog_node: string;
  node_type: "DIALOG";
  conditions_list: string[];
  conditions_entry_contexts: string[];
  context: Record<string, any>;
  actions: Array<{ type: string; params: any }>;
};

export type ChatGuruLayout = {
  dialog_node: string;
  left: number;
  top: number;
};

export type ChatGuruLink = {
  source_node: string;
  target_node: string;
};

export type ChatGuruPatch = {
  version: number;
  bot_id: string;
  dialogs: ChatGuruDialog[];
  layout: ChatGuruLayout[];
  links: ChatGuruLink[];
};

function pickReplyText(node: any): string {
  return (
    node?.data?.text ||
    node?.data?.params?.text ||
    node?.data?.params?.message ||
    node?.data?.params?.content ||
    ""
  );
}

export function compileToChatGuru(patch: PatchGenericV1, botId: string): ChatGuruPatch {
  const dialogs: ChatGuruDialog[] = [];
  const layout: ChatGuruLayout[] = [];

  const nodeMap: Record<string, string> = {};

  for (const n of patch.nodes || []) {
    const title = n?.data?.title || n?.type || "node";
    const dialog_node = makeDialogNodeId(String(title), String(n.type), String(n.id));
    nodeMap[n.id] = dialog_node;

    const actions: Array<{ type: string; params: any }> = [];
    if (n.type === "action.reply") {
      const text = pickReplyText(n);
      if (text) actions.push({ type: "RESPONDER", params: { text } });
    }

    dialogs.push({
      temp_id: n.id,
      title: String(title),
      dialog_node,
      node_type: "DIALOG",
      conditions_list: [],
      conditions_entry_contexts: [],
      context: { autoflow: { node_id: n.id, type: n.type } },
      actions,
    });

    layout.push({
      dialog_node,
      left: Math.round(n?.ui?.x || 0),
      top: Math.round(n?.ui?.y || 0),
    });
  }

  const links = (patch.edges || [])
    .map((e: GenericEdge) => {
      const source_node = nodeMap[e.from];
      const target_node = nodeMap[e.to];
      if (!source_node || !target_node) return null;
      return { source_node, target_node };
    })
    .filter(Boolean) as ChatGuruLink[];

  return {
    version: 1,
    bot_id: botId || "",
    dialogs,
    layout,
    links,
  };
}
