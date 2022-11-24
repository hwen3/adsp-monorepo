import { ActionState } from '@store/session/models';
export interface ScriptItem {
  name?: string;
  id?: string;
  script: string;
  useServiceAccount?: boolean;
  description?: string;
  runnerRoles?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  testInputs: Record<string, any>;
}
export interface ScriptService {
  scripts: Record<string, ScriptItem>;
  indicator?: Indicator;
  scriptResponse?: ScriptResponse[];
}
export const defaultScript: ScriptItem = {
  name: '',
  id: '',
  script: ' ',
  useServiceAccount: false,
  description: '',
  runnerRoles: [],
  testInputs: { inputs: {} },
};
export const SCRIPT_INIT: ScriptService = {
  scripts: null,
  indicator: {
    details: {},
  },
  scriptResponse: null,
};
export interface Indicator {
  details?: Record<string, ActionState>;
}
export interface ScriptResponse {
  timeToRun?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs?: Record<string, any>;
  result: string;
  hasError?: boolean;
}
