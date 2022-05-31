import { ServiceConfigurationTypes, ConfigDefinition, ServiceSchemas, ServiceConfiguration } from './model';

export const DELETE_CONFIGURATION_ACTION = 'configuration/DELETE_CONFIGURATION_ACTION';
export const DELETE_CONFIGURATION_ACTION_SUCCESS = 'configuration/DELETE_CONFIGURATION_ACTION_SUCCESS';

export const UPDATE_CONFIGURATION_DEFINITION_ACTION = 'configuration/UPDATE_CONFIGURATION_DEFINITION_ACTION';
export const UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION =
  'configuration/UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION';

export const FETCH_CONFIGURATION_DEFINITIONS_ACTION = 'configuration/FETCH_CONFIGURATION_DEFINITIONS_ACTION';
export const FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION =
  'configuration/FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION';
export interface DeleteConfigurationDefinitionAction {
  type: typeof DELETE_CONFIGURATION_ACTION;
  definitionName: string;
}

export interface DeleteConfigurationDefinitionSuccessAction {
  type: typeof DELETE_CONFIGURATION_ACTION_SUCCESS;
  payload: ServiceSchemas;
}
export interface FetchConfigurationDefinitionsAction {
  type: typeof FETCH_CONFIGURATION_DEFINITIONS_ACTION;
}

export interface FetchConfigurationDefinitionsSuccessAction {
  type: typeof FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION;
  payload: ServiceConfigurationTypes;
}

export interface UpdateConfigurationDefinitionAction {
  type: typeof UPDATE_CONFIGURATION_DEFINITION_ACTION;
  definition: ConfigDefinition;
  isAddedFromOverviewPage: boolean;
}

export interface UpdateConfigurationDefinitionSuccessAction {
  type: typeof UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION;
  payload: ServiceSchemas;
  isAddedFromOverviewPage: boolean;
}

export type ConfigurationDefinitionActionTypes =
  | FetchConfigurationDefinitionsAction
  | FetchConfigurationDefinitionsSuccessAction
  | UpdateConfigurationDefinitionAction
  | UpdateConfigurationDefinitionSuccessAction
  | DeleteConfigurationDefinitionAction
  | DeleteConfigurationDefinitionSuccessAction;

export const FETCH_CONFIGURATION_ACTION = 'configuration/FETCH_CONFIGURATION_ACTION';
export const FETCH_CONFIGURATION_SUCCESS_ACTION = 'configuration/FETCH_CONFIGURATION_SUCCESS_ACTION';
export const CLEAR_CONFIGURATION_ACTION = 'configuration/CLEAR_CONFIGURATION_EXPORT_ACTION';

export interface FetchConfigurationAction {
  type: typeof FETCH_CONFIGURATION_ACTION;
  namespace: string;
  serviceName: string;
}

export interface FetchConfigurationSuccessAction {
  type: typeof FETCH_CONFIGURATION_SUCCESS_ACTION;
  payload: ServiceConfiguration;
}

export interface ClearConfigurationAction {
  type: typeof CLEAR_CONFIGURATION_ACTION;
  payload: string;
}

export type ConfigurationExportActionTypes =
  | FetchConfigurationAction
  | FetchConfigurationSuccessAction
  | ClearConfigurationAction;

export const deleteConfigurationDefinition = (definitionName: string): DeleteConfigurationDefinitionAction => ({
  type: DELETE_CONFIGURATION_ACTION,
  definitionName,
});

export const deleteConfigurationDefinitionSuccess = (
  definition: ServiceSchemas
): DeleteConfigurationDefinitionSuccessAction => ({
  type: DELETE_CONFIGURATION_ACTION_SUCCESS,
  payload: definition,
});

export const updateConfigurationDefinition = (
  definition: ConfigDefinition,
  isAddedFromOverviewPage: boolean
): UpdateConfigurationDefinitionAction => ({
  type: UPDATE_CONFIGURATION_DEFINITION_ACTION,
  definition,
  isAddedFromOverviewPage,
});
export const updateConfigurationDefinitionSuccess = (
  definition: ServiceSchemas,
  isAddedFromOverviewPage: boolean
): UpdateConfigurationDefinitionSuccessAction => ({
  type: UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION,
  payload: definition,
  isAddedFromOverviewPage,
});
export const getConfigurationDefinitions = (): FetchConfigurationDefinitionsAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_ACTION,
});

export const getConfigurationDefinitionsSuccess = (
  results: ServiceConfigurationTypes
): FetchConfigurationDefinitionsSuccessAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
});

export const getConfiguration = (namespace: string, serviceName: string): FetchConfigurationAction => ({
  type: FETCH_CONFIGURATION_ACTION,
  namespace: namespace,
  serviceName: serviceName,
});

export const getConfigurationSuccess = (results: ServiceConfiguration): FetchConfigurationSuccessAction => ({
  type: FETCH_CONFIGURATION_SUCCESS_ACTION,
  payload: results,
});

export const clearConfigurationAction = (key: string): ClearConfigurationAction => ({
  type: CLEAR_CONFIGURATION_ACTION,
  payload: key,
});
