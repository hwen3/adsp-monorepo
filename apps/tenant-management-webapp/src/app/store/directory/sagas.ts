import { put, select, call } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import {
  FetchDirectoryAction,
  fetchDirectorySuccess,
  createEntrySuccess,
  updateEntrySuccess,
  deleteEntrySuccess,
  CreateEntryAction,
  UpdateEntryAction,
  DeleteEntryAction,
  FetchEntryDetailAction,
  fetchEntryDetailSuccess,
} from './actions';
import { DirectoryApi } from './api';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';

export function* fetchDirectory(action: FetchDirectoryAction): SagaIterator {
  const core = 'platform';
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);
  const tenantName: string = yield select((state: RootState) => state.tenant.name);

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  try {
    let tenantDirectory = [];
    const coreDirectory = yield call([api, api.fetchDirectoryTenant], core);

    if (tenantName.toLowerCase() !== core) {
      tenantDirectory = yield call([api, api.fetchDirectoryTenant], tenantName);

      yield put(fetchDirectorySuccess({ directory: [...tenantDirectory, ...coreDirectory] }));
    } else {
      yield put(fetchDirectorySuccess({ directory: coreDirectory }));
    }
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  } catch (e) {
    yield put(ErrorNotification({ message: 'failed to fetch directory' }));
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  }
}

export function* createEntryDirectory(action: CreateEntryAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);

  try {
    const result = yield call([api, api.createEntry], action.data);
    if (result) {
      yield put(createEntrySuccess(action.data));
    }
  } catch (err) {
    yield put(ErrorNotification({ message: 'failed to create directory' }));
  }
}

export function* updateEntryDirectory(action: UpdateEntryAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);

  try {
    const result = yield call([api, api.updateEntry], action.data);
    if (result) {
      yield put(updateEntrySuccess(action.data));
    }
  } catch (err) {
    yield put(ErrorNotification({ message: 'failed to create directory' }));
  }
}

export function* deleteEntryDirectory(action: DeleteEntryAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);

  try {
    const result = yield call([api, api.deleteEntry], action.data);
    if (result) {
      yield put(deleteEntrySuccess(action.data));
    }
  } catch (err) {
    yield put(ErrorNotification({ message: 'failed to delete directory' }));
  }
}

export function* fetchEntryDetail(action: FetchEntryDetailAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);

  try {
    const result = yield call([api, api.fetchEntryDetail], action.data);
    if (result) {
      const service = action.data;
      if (result._links) {
        service._links = result._links;
      } else {
        service._links = null;
      }

      yield put(fetchEntryDetailSuccess(service));
    }
  } catch (err) {
    const service = action.data;
    service._links = null;
    yield put(fetchEntryDetailSuccess(service));
  }
}
