import { ActionState } from '@store/session/models';
export interface ScriptItem {
  name: string;
  id?: string;
  useServiceAccount: boolean;
  description?: string;
  runnerRoles: string[];
}
export interface ScriptService {
  scripts: Record<string, ScriptItem>;
  indicator?: Indicator;
}
export const defaultScript: ScriptItem = {
  name: '',
  id: '',
  useServiceAccount: false,
  description: '',
  runnerRoles: [],
};
export const SCRIPT_INIT: ScriptService = {
  scripts: null,
  indicator: {
    details: {},
  },
};
export interface Indicator {
  details?: Record<string, ActionState>;
}