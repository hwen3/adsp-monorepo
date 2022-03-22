import * as fetch from './fetchApplications';
import * as get from './getApplication';
import * as save from './saveApplication';
import * as destroy from './deleteApplication';
import * as status from './setApplicationStatus';
import * as toggle from './toggleApplication';
import * as form from './updateFormData';
import * as metrics from './metrics';
import * as statusSupportInstructions from './statusSupportInstructions';

export * from './fetchApplications';
export * from './getApplication';
export * from './saveApplication';
export * from './deleteApplication';
export * from './setApplicationStatus';
export * from './toggleApplication';
export * from './updateFormData';
export * from './metrics';
export * from './statusSupportInstructions';

export type ActionTypes =
  | toggle.ToggleApplicationStatusSuccessAction
  | fetch.FetchServiceStatusAppsSuccessAction
  | fetch.FetchServiceStatusAppHealthAction
  | fetch.FetchServiceStatusAppHealthSuccessAction
  | save.SaveApplicationSuccessAction
  | get.GetApplicationSuccessAction
  | destroy.DeleteApplicationSuccessAction
  | status.SetApplicationStatusSuccessAction
  | form.UpdateFormDataAction
  | metrics.FetchStatusMetricsAction
  | metrics.FetchStatusMetricsSuccessAction
  | statusSupportInstructions.FetchNotificationConfigurationSucceededAction
  | statusSupportInstructions.UpdateStatusContactInformationAction;
