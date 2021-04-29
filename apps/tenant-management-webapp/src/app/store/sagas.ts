import { takeEvery } from 'redux-saga/effects';

// Sagas
import { fetchAccess } from './access/sagas';
import { uptimeFetch } from './api-status/sagas';
import { fetchConfig } from './config/sagas';
import { fetchSpace, uploadFile, fileEnable, fetchFiles, deleteFile, downloadFile } from './file/sagas';
import { fetchFileTypes, deleteFileTypes, createFileType, updateFileType } from './file/sagas';
import { fetchTenant, createTenant, isTenantAdmin } from './tenant/sagas';
import { fetchHealth } from './health/sagas';

// Actions
import { FETCH_ACCESS_ACTION } from './access/actions';
import { API_UPTIME_FETCH_ACTION } from './api-status/actions';
import { FETCH_CONFIG_ACTION } from './config/actions';
import { FETCH_FILE_SPACE, UPLOAD_FILE, FETCH_FILE_LIST, DELETE_FILE, DOWNLOAD_FILE } from './file/actions';
import {
  ENABLE_FILE_SERVICE,
  FETCH_FILE_TYPE,
  DELETE_FILE_TYPE,
  CREATE_FILE_TYPE,
  UPDATE_FILE_TYPE,
} from './file/actions';
import { FETCH_TENANT, CREATE_TENANT, CHECK_IS_TENANT_ADMIN } from './tenant/actions';
import { FETCH_HEALTH_ACTION } from './health/actions';

export function* watchSagas() {
  yield takeEvery(API_UPTIME_FETCH_ACTION, uptimeFetch);
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);
  yield takeEvery(FETCH_ACCESS_ACTION, fetchAccess);
  yield takeEvery(FETCH_FILE_SPACE, fetchSpace);
  yield takeEvery(UPLOAD_FILE, uploadFile);
  yield takeEvery(DOWNLOAD_FILE, downloadFile);
  yield takeEvery(DELETE_FILE, deleteFile);
  yield takeEvery(FETCH_FILE_LIST, fetchFiles);
  yield takeEvery(FETCH_TENANT, fetchTenant);
  yield takeEvery(ENABLE_FILE_SERVICE, fileEnable);
  yield takeEvery(FETCH_FILE_TYPE, fetchFileTypes);
  yield takeEvery(DELETE_FILE_TYPE, deleteFileTypes);
  yield takeEvery(CREATE_FILE_TYPE, createFileType);
  yield takeEvery(UPDATE_FILE_TYPE, updateFileType);
  yield takeEvery(CREATE_TENANT, createTenant);
  yield takeEvery(CHECK_IS_TENANT_ADMIN, isTenantAdmin);

  // health
  yield takeEvery(FETCH_HEALTH_ACTION, fetchHealth);
}
