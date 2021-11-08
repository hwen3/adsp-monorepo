import { all, takeEvery } from 'redux-saga/effects';

// Sagas
import { fetchAccess } from './access/sagas';
import { fetchConfig } from './config/sagas';
import {
  fetchTenant,
  createTenant,
  isTenantAdmin,
  tenantAdminLogin,
  tenantCreationInitLogin,
  keycloakCheckSSO,
  tenantLogin,
  keycloakCheckSSOWithLogout,
  keycloakRefreshToken,
  tenantLogout,
  fetchRealmRoles,
} from './tenant/sagas';
import { fetchTenantConfig, createTenantConfig, updateTenantConfig } from './tenantConfig/sagas';
import {
  deleteApplication,
  fetchServiceStatusApps,
  saveApplication,
  setApplicationStatus,
  toggleApplicationStatus,
} from './status/sagas';
import { watchEventSagas } from './event/sagas';
import { watchFileSagas } from './file/sagas';
import { watchNotificationSagas } from './notification/sagas';
import { watchSubscriptionSagas } from './subscription/sagas';

// Actions
import { FETCH_ACCESS_ACTION } from './access/actions';
import { FETCH_CONFIG_ACTION } from './config/actions';
import {
  FETCH_TENANT,
  CREATE_TENANT,
  CHECK_IS_TENANT_ADMIN,
  TENANT_ADMIN_LOGIN,
  TENANT_CREATION_LOGIN_INIT,
  KEYCLOAK_CHECK_SSO,
  TENANT_LOGIN,
  KEYCLOAK_CHECK_SSO_WITH_LOGOUT,
  KEYCLOAK_REFRESH_TOKEN,
  TENANT_LOGOUT,
  FETCH_REALM_ROLES,
} from './tenant/actions';
import { FETCH_TENANT_CONFIG, CREATE_TENANT_CONFIG, UPDATE_TENANT_CONFIG } from './tenantConfig/actions';
import { DELETE_APPLICATION_ACTION, FETCH_SERVICE_STATUS_APPS_ACTION, SAVE_APPLICATION_ACTION } from './status/actions';
import { SAVE_NOTICE_ACTION, GET_NOTICES_ACTION, DELETE_NOTICE_ACTION } from './notice/actions';
import { saveNotice, getNotices, deleteNotice } from './notice/sagas';
import { SET_APPLICATION_STATUS_ACTION } from './status/actions/setApplicationStatus';
import { TOGGLE_APPLICATION_STATUS_ACTION } from './status/actions/toggleApplication';

// eslint-disable-next-line  @typescript-eslint/explicit-module-boundary-types
export function* watchSagas() {
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);
  yield takeEvery(FETCH_ACCESS_ACTION, fetchAccess);

  // tenant and keycloak
  yield takeEvery(CHECK_IS_TENANT_ADMIN, isTenantAdmin);

  //tenant config
  yield takeEvery(FETCH_TENANT_CONFIG, fetchTenantConfig);
  yield takeEvery(CREATE_TENANT_CONFIG, createTenantConfig);
  yield takeEvery(UPDATE_TENANT_CONFIG, updateTenantConfig);
  yield takeEvery(KEYCLOAK_CHECK_SSO, keycloakCheckSSO);
  yield takeEvery(TENANT_LOGIN, tenantLogin);
  yield takeEvery(KEYCLOAK_CHECK_SSO_WITH_LOGOUT, keycloakCheckSSOWithLogout);
  yield takeEvery(KEYCLOAK_REFRESH_TOKEN, keycloakRefreshToken);
  yield takeEvery(TENANT_LOGOUT, tenantLogout);

  //tenant config
  yield takeEvery(CREATE_TENANT, createTenant);
  yield takeEvery(FETCH_TENANT, fetchTenant);
  yield takeEvery(FETCH_REALM_ROLES, fetchRealmRoles);
  yield takeEvery(TENANT_ADMIN_LOGIN, tenantAdminLogin);
  yield takeEvery(TENANT_CREATION_LOGIN_INIT, tenantCreationInitLogin);

  // service status
  yield takeEvery(FETCH_SERVICE_STATUS_APPS_ACTION, fetchServiceStatusApps);
  yield takeEvery(SAVE_APPLICATION_ACTION, saveApplication);
  yield takeEvery(DELETE_APPLICATION_ACTION, deleteApplication);
  yield takeEvery(SET_APPLICATION_STATUS_ACTION, setApplicationStatus);
  yield takeEvery(TOGGLE_APPLICATION_STATUS_ACTION, toggleApplicationStatus);

  // notices
  yield takeEvery(SAVE_NOTICE_ACTION, saveNotice);
  yield takeEvery(GET_NOTICES_ACTION, getNotices);
  yield takeEvery(DELETE_NOTICE_ACTION, deleteNotice);

  yield all([
    // file service
    watchFileSagas(),
    // event
    watchEventSagas(),
    // notification
    watchNotificationSagas(),
    // subscription

    watchSubscriptionSagas(),
  ]);
}
