import { put, select, call, fork, take } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { StatusApi } from './api';
import {
  SaveApplicationAction,
  saveApplicationSuccess,
  fetchServiceStatusAppsSuccess,
  fetchServiceStatusApps as refreshServiceStatusApps,
  DeleteApplicationAction,
  deleteApplicationSuccess,
  ToggleApplicationStatusAction,
  fetchServiceStatusAppHealthSuccess,
  fetchServiceStatusAppHealth,
  fetchStatusMetricsSucceeded,
  FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION,
  UpdateStatusContactInformationAction,
  FetchStatusConfigurationService,
  FetchStatusConfigurationSucceededService,
  toggleApplicationStatusSuccess,
} from './actions';
import { ConfigState } from '@store/config/models';
import { SetApplicationStatusAction, setApplicationStatusSuccess } from './actions/setApplicationStatus';
import { EndpointStatusEntry, ApplicationStatus } from './models';
import { SagaIterator } from '@redux-saga/core';
import moment from 'moment';
import axios from 'axios';
import { getAccessToken } from '@store/tenant/sagas';

export function* fetchServiceStatusAppHealthEffect(api: StatusApi, application: ApplicationStatus): SagaIterator {
  // This is so application state knows there is an incremental load.
  yield put(fetchServiceStatusAppHealth(application._id));

  const entryMap: EndpointStatusEntry[] = yield call([api, api.getEndpointStatusEntries], application._id);
  application.endpoint.statusEntries = entryMap;

  yield put(fetchServiceStatusAppHealthSuccess(application._id, application.endpoint.url, entryMap));
}

export function* fetchServiceStatusApps(): SagaIterator {
  const currentState: RootState = yield select();

  const statusServiceUrl = getServiceStatusUrl(currentState.config);

  const configServiceBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token = yield call(getAccessToken);

  try {
    const api = new StatusApi(statusServiceUrl, token);
    /*
     * The applications var stores the data from the status service database.
     * When we update the status service configuration in the configuration service,
     * the new configuration can be fetched from the configuration service immediately.
     * However, the data in the status service database might not be out of date.
     * In this case, we need to find a way of sync the data from the two resources in the frontend to avoid confusion.
     * Here, we remove the applications which its id in the application, but not in the most recent configuration.
     */
    let applications: ApplicationStatus[] = yield call([api, api.getApplications]);

    const { data: configuration } = yield call(
      axios.get,
      `${configServiceBaseUrl}/configuration/v2/configuration/platform/status-service`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const statusInfo = configuration.latest && configuration.latest.configuration;

    for (const name of ['contact', 'applications']) {
      if (name in statusInfo) {
        delete statusInfo[name];
      }
    }

    applications = applications.filter((application) => {
      return Object.keys(statusInfo).includes(application?._id);
    });

    for (const application of applications) {
      if (application.endpoint?.url) {
        yield fork(fetchServiceStatusAppHealthEffect, api, application);
      }
    }

    yield put(fetchServiceStatusAppsSuccess(applications));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* saveApplication(action: SaveApplicationAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);
  try {
    const api = new StatusApi(baseUrl, token);
    const data = yield call([api, api.saveApplication], action.payload);
    yield put(saveApplicationSuccess(data));
    yield put(refreshServiceStatusApps());
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* deleteApplication(action: DeleteApplicationAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);

  try {
    const api = new StatusApi(baseUrl, token);
    yield call([api, api.deleteApplication], action.payload.applicationId);

    yield put(deleteApplicationSuccess(action.payload.applicationId));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* setApplicationStatus(action: SetApplicationStatusAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);

  try {
    const api = new StatusApi(baseUrl, token);
    const data: ApplicationStatus = yield call(
      [api, api.setStatus],
      action.payload.applicationId,
      action.payload.status
    );

    // status entries
    const entryMap: EndpointStatusEntry[] = yield call(
      [api, api.getEndpointStatusEntries],
      action.payload.applicationId
    );
    data.endpoint.statusEntries = entryMap;

    yield put(setApplicationStatusSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* toggleApplicationStatus(action: ToggleApplicationStatusAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);

  try {
    const api = new StatusApi(baseUrl, token);
    const data: ApplicationStatus = yield call(
      [api, api.toggleApplication],
      action.payload.applicationId,
      action.payload.enabled
    );

    data.enabled = action.payload.enabled;
    // set as pending after toggling
    data.internalStatus = 'pending';
    yield put(toggleApplicationStatusSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

interface MetricValue {
  app: string;
  sum: number;
  max: number;
}
interface MetricResponse {
  values: { sum: string; max: string }[];
}

export function* fetchStatusMetrics(): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  yield take(FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION);
  const apps: Record<string, ApplicationStatus> = (yield select(
    (state: RootState) => state.serviceStatus.applications
  )).reduce((apps: Record<string, ApplicationStatus>, app: ApplicationStatus) => ({ ...apps, [app._id]: app }), {});

  if (baseUrl && token) {
    try {
      const criteria = JSON.stringify({
        intervalMax: moment().toISOString(),
        intervalMin: moment().subtract(7, 'day').toISOString(),
        metricLike: 'status-service',
      });

      const unhealthyMetric = 'status-service:application-unhealthy:count';
      const { data: metrics }: { data: Record<string, MetricResponse> } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event/metrics?interval=weekly&criteria=${criteria}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const downtimeDurations: MetricValue[] = [];
      Object.entries(metrics).forEach(([metric, durationMetric]) => {
        if (metric.endsWith('downtime:duration')) {
          const appId = metric.split(':')[1];
          const app = apps[appId]?.name;
          if (app) {
            downtimeDurations.push({
              app,
              sum: parseInt(durationMetric.values[0]?.sum || '0'),
              max: parseInt(durationMetric.values[0]?.max || '0'),
            });
          }
        }
      });

      const maxDuration = downtimeDurations.reduce((max, duration) => Math.max(duration.max, max), 0);
      const totalDuration = downtimeDurations.reduce((total, duration) => total + duration.sum, 0);
      const unhealthyApp = downtimeDurations.sort((a, b) => b.sum - a.sum)[0];

      yield put(
        fetchStatusMetricsSucceeded({
          unhealthyCount: parseInt(metrics[unhealthyMetric]?.values[0]?.sum || '0'),
          maxUnhealthyDuration: maxDuration / 60,
          totalUnhealthyDuration: totalDuration / 60,
          leastHealthyApp: unhealthyApp?.sum
            ? { name: unhealthyApp.app, totalUnhealthyDuration: unhealthyApp.sum / 60 }
            : null,
        })
      );
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchStatusMetrics` }));
    }
  }
}

export function* updateStatusContactInformation({ payload }: UpdateStatusContactInformationAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/status-service`,
        {
          operation: 'UPDATE',
          update: {
            contact: {
              contactEmail: payload.contactEmail,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(FetchStatusConfigurationService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - updateNotificationType` }));
    }
  }
}

export function* fetchStatusConfiguration(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      const { data: configuration } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/status-service`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const statusInfo = configuration.latest && configuration.latest.configuration;

      yield put(FetchStatusConfigurationSucceededService(statusInfo));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchStatusConfiguration` }));
    }
  }
}

function getServiceStatusUrl(config: ConfigState): string {
  return config.serviceUrls.serviceStatusApiUrl;
}
