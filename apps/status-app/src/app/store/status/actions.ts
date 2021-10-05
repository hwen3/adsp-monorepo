import { Notice, ServiceStatusApplication } from './models'
export const FETCH_NOTICES_ACTION = 'status/notices/fetch';
export const FETCH_NOTICES_SUCCESS_ACTION = 'status/notices/fetch/success';
export const FETCH_APPLICATIONS_ACTION = 'status/applications/fetch';
export const FETCH_APPLICATIONS_SUCCESS_ACTION = 'status/applications/fetch/success';
export const FETCH_CROSS_TENANTS_NOTICES_ACTION = 'status/applications/cross-tenants/fetch';
export const FETCH_CROSS_TENANTS_NOTICES_SUCCESS_ACTION = 'status/notices/cross-tenants/fetch/success';


export type ActionTypes =
  | FetchNoticesAction
  | FetchNoticesSuccessAction
  | FetchApplicationsAction
  | FetchApplicationsSuccessAction
  | FetchNoticesCrossTenantsAction
  | FetchNoticesCrossTenantsSuccessAction

export interface FetchNoticesSuccessAction {
  type: typeof FETCH_NOTICES_SUCCESS_ACTION;
  payload: Notice[]
}

export interface FetchApplicationsAction {
  type: typeof FETCH_APPLICATIONS_ACTION
  payload: string;
}

export interface FetchApplicationsSuccessAction {
  type: typeof FETCH_APPLICATIONS_SUCCESS_ACTION
  payload: ServiceStatusApplication[]
}

export interface FetchNoticesAction {
  type: typeof FETCH_NOTICES_ACTION;
  payload?: string
}

export interface FetchNoticesCrossTenantsAction {
  type: typeof FETCH_CROSS_TENANTS_NOTICES_ACTION
}

export interface FetchNoticesCrossTenantsSuccessAction {
  type: typeof FETCH_CROSS_TENANTS_NOTICES_SUCCESS_ACTION
  payload: Notice[]
}

export const fetchNotices = (realm: string): FetchNoticesAction => ({
  type: 'status/notices/fetch',
  payload: realm,
});

export const fetchNoticesSuccess = (payload: Notice[]): FetchNoticesSuccessAction => ({
  type: 'status/notices/fetch/success',
  payload,
});

export const fetchApplications = (realm: string): FetchApplicationsAction => ({
  type: 'status/applications/fetch',
  payload: realm
});

export const fetchApplicationsSuccess = (payload: ServiceStatusApplication[]): FetchApplicationsSuccessAction => ({
  type: 'status/applications/fetch/success',
  payload
});

export const fetchCrossTenantsNotices = (): FetchNoticesCrossTenantsAction => ({
  type: 'status/applications/cross-tenants/fetch'
});

export const fetchCrossTenantsNoticesSuccess = (notices: Notice[]): FetchNoticesCrossTenantsSuccessAction => ({
  type: 'status/notices/cross-tenants/fetch/success',
  payload: notices
});
