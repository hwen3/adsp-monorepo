import { put, select, call, takeEvery, takeLatest } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import { v4 as uuidv4 } from 'uuid';
import {
  FetchNotificationTypeSucceededService,
  FetchCoreNotificationTypeSucceededService,
  FetchNotificationTypeService,
  DeleteNotificationTypeAction,
  UpdateNotificationTypeAction,
  UpdateContactInformationAction,
  DELETE_NOTIFICATION_TYPE,
  FETCH_NOTIFICATION_TYPE,
  FETCH_CORE_NOTIFICATION_TYPE,
  UPDATE_NOTIFICATION_TYPE,
  UPDATE_CONTACT_INFORMATION,
  FETCH_NOTIFICATION_METRICS,
  FetchNotificationMetricsSucceeded,
  FetchNotificationSlackInstallationSucceeded,
  FETCH_NOTIFICATION_SLACK_INSTALLATION,
} from './actions';

import { RootState } from '../index';
import axios from 'axios';
import moment from 'moment';
import { EventItem, InstalledSlackTeam } from './models';

export function* fetchNotificationTypes(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const { data: configuration } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const notificationTypeInfo = configuration.latest && configuration.latest.configuration;
      yield put(FetchNotificationTypeSucceededService({ data: notificationTypeInfo }));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationTypes` }));
    }
  }
}

export function* fetchCoreNotificationTypes(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const { data: configuration } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service?core`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const notificationTypeInfo = configuration.latest && configuration.latest.configuration;
      yield put(FetchCoreNotificationTypeSucceededService({ data: notificationTypeInfo }));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchCoreNotificationTypes` }));
    }
  }
}

export function* deleteNotificationTypes(action: DeleteNotificationTypeAction): SagaIterator {
  const notificationType = action.payload;

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service`,
        { operation: 'DELETE', property: notificationType.id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(FetchNotificationTypeService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.response.data} - deleteNotificationTypes` }));
    }
  }
}

export function* updateNotificationType({ payload }: UpdateNotificationTypeAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      const payloadId = payload.id || uuidv4();

      const sanitizedEvents = payload.events.map((eve) => {
        const eventBuilder: EventItem = {
          namespace: eve.namespace,
          name: eve.name,
          templates: eve.templates,
          channels: eve.channels,
        };
        return eventBuilder;
      });

      payload.events = sanitizedEvents;

      console.log(JSON.stringify(payload) + '<payload');

      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service`,
        {
          operation: 'UPDATE',
          update: {
            [payloadId]: {
              id: payloadId,
              name: payload.name,
              description: payload.description,
              subscriberRoles: payload.subscriberRoles,
              events: payload.events,
              publicSubscribe: payload.publicSubscribe,
              manageSubscribe: payload.manageSubscribe,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(FetchNotificationTypeService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - updateNotificationType` }));
    }
  }
}

export function* updateContactInformation({ payload }: UpdateContactInformationAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/notification-service`,
        {
          operation: 'UPDATE',
          update: {
            contact: {
              contactEmail: payload.contactEmail,
              phoneNumber: payload.phoneNumber,
              supportInstructions: payload.supportInstructions,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(FetchNotificationTypeService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - updateNotificationType` }));
    }
  }
}

interface MetricResponse {
  values: { sum: string }[];
}

export function* fetchNotificationMetrics(): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const criteria = JSON.stringify({
        intervalMax: moment().toISOString(),
        intervalMin: moment().subtract(7, 'day').toISOString(),
        metricLike: 'notification-service',
      });

      const { data: metrics }: { data: Record<string, MetricResponse> } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event/metrics?interval=weekly&criteria=${criteria}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sentMetric = 'notification-service:notification-sent:count';
      const failedMetric = 'notification-service:notification-send-failed:count';
      yield put(
        FetchNotificationMetricsSucceeded({
          notificationsSent: parseInt(metrics[sentMetric]?.values[0]?.sum || '0'),
          notificationsFailed: parseInt(metrics[failedMetric]?.values[0]?.sum || '0'),
        })
      );
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationMetrics` }));
    }
  }
}

export function* fetchNotificationSlackInstallation(): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.notificationServiceUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const { data: authorizationUrl }: { data: string } = yield call(
        axios.get,
        `${baseUrl}/provider/v1/slack/install?from=${window.location}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(FetchNotificationSlackInstallationSucceeded([], authorizationUrl));

      const { data: teams }: { data: { id: string }[] } = yield call(axios.get, `${baseUrl}/provider/v1/slack/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const installedTeams: InstalledSlackTeam[] = [];
      for (const team of teams) {
        const {
          data: { team: teamInfo },
        }: { data: { team: { id: string; name: string; url: string; icon: { image_44: string } } } } = yield call(
          axios.get,
          `${baseUrl}/provider/v1/slack/teams/${team.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        installedTeams.push({
          id: teamInfo.id,
          name: teamInfo.name,
          url: teamInfo.url,
          icon: teamInfo.icon.image_44,
        });
      }

      yield put(FetchNotificationSlackInstallationSucceeded(installedTeams, authorizationUrl));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - Slack installations` }));
    }
  }
}

export function* watchNotificationSagas(): Generator {
  yield takeEvery(FETCH_NOTIFICATION_TYPE, fetchNotificationTypes);
  yield takeEvery(FETCH_CORE_NOTIFICATION_TYPE, fetchCoreNotificationTypes);
  yield takeEvery(DELETE_NOTIFICATION_TYPE, deleteNotificationTypes);
  yield takeEvery(UPDATE_NOTIFICATION_TYPE, updateNotificationType);
  yield takeEvery(UPDATE_CONTACT_INFORMATION, updateContactInformation);
  yield takeLatest(FETCH_NOTIFICATION_METRICS, fetchNotificationMetrics);
  yield takeLatest(FETCH_NOTIFICATION_SLACK_INSTALLATION, fetchNotificationSlackInstallation);
}
