import { PatchGenericV1 } from '../../core/patch/genericV1';

export type ChatIAAutomationDoc = {
  name: string;
  status: 'draft' | 'published';
  engine: 'autoflow.patch.v1';
  definition: PatchGenericV1;
  createdAt: string;
};

export function compileToChatIA(patch: PatchGenericV1, status: 'draft'|'published' = 'draft'): ChatIAAutomationDoc {
  return {
    name: patch.meta.name,
    status,
    engine: 'autoflow.patch.v1',
    definition: patch,
    createdAt: new Date().toISOString()
  };
}
