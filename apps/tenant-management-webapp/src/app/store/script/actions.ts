import { ScriptItem, Indicator } from './models';
export const UPDATE_INDICATOR = 'calendar/indicator';

export const UPDATE_SCRIPT_ACTION = 'script/UPDATE_SCRIPT_ACTION';
export const UPDATE_SCRIPT_SUCCESS_ACTION = 'script/UPDATE_SCRIPT_SUCCESS_ACTION';

export const FETCH_SCRIPTS_ACTION = 'script/FETCH_SCRIPTS_ACTION';
export const FETCH_SCRIPTS_SUCCESS_ACTION = 'script/FETCH_SCRIPTS_SUCCESS_ACTION';

export interface UpdateScriptAction {
  type: typeof UPDATE_SCRIPT_ACTION;
  payload: ScriptItem;
}
export interface UpdateScriptSuccessAction {
  type: typeof UPDATE_SCRIPT_SUCCESS_ACTION;
  payload: Record<string, ScriptItem>;
}
export interface FetchScriptsAction {
  type: typeof FETCH_SCRIPTS_ACTION;
}
export interface FetchScriptsSuccessAction {
  type: typeof FETCH_SCRIPTS_SUCCESS_ACTION;
  payload: Record<string, ScriptItem>;
}

export interface UpdateIndicatorAction {
  type: typeof UPDATE_INDICATOR;
  payload: Indicator;
}
export type ActionTypes =
  | UpdateScriptAction
  | UpdateScriptSuccessAction
  | FetchScriptsAction
  | FetchScriptsSuccessAction
  | UpdateIndicatorAction;

export const UpdateScript = (payload: ScriptItem): UpdateScriptAction => ({
  type: UPDATE_SCRIPT_ACTION,
  payload,
});

export const UpdateScriptSuccess = (script: Record<string, ScriptItem>): UpdateScriptSuccessAction => ({
  type: UPDATE_SCRIPT_SUCCESS_ACTION,
  payload: script,
});
export const fetchScripts = (): FetchScriptsAction => ({
  type: FETCH_SCRIPTS_ACTION,
});

export const fetchScriptsSuccess = (scrips: Record<string, ScriptItem>): FetchScriptsSuccessAction => ({
  type: FETCH_SCRIPTS_SUCCESS_ACTION,
  payload: scrips,
});

export const UpdateIndicator = (indicator: Indicator): UpdateIndicatorAction => ({
  type: UPDATE_INDICATOR,
  payload: indicator,
});