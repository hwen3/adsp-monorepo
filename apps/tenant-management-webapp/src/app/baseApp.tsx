import React, { createContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from './header';
import { RootState } from './store';
import { fetchConfig } from './store/config/actions';
import { init as initTenantApi } from './api/tenant-management';
import { ApiUptimeFetch } from './store/api-status/actions';

export interface HeaderContext {
  setTitle: (title: string) => void;
}
export const HeaderCtx = createContext<HeaderContext>(null);

function BaseApp({ children }) {
  const [ title, setTitle ] = useState<string>('');
  const [ isLoading, setIsLoading ] = useState<boolean>(true)

  const config = useSelector((state: RootState) => state.config)

  const dispatch = useDispatch();

  // fetch config urls
  useEffect(() => {
    dispatch(fetchConfig())
  }, [dispatch])

  // inform user when loading is complete
  useEffect(() => {
    setIsLoading(false);
  }, [config])

  // fetch tenant config
  useEffect(() => {
    initTenantApi({baseUrl: config.tenantApi.host});
  }, [config.tenantApi.host])

  // initiate the get API health reoccuring request
  useEffect(() => {
    setInterval(async () => {
      dispatch(ApiUptimeFetch())
    }, 10 * 1000)
  }, [config.tenantApi.host, dispatch])

  return (
    isLoading
    ? <div>Loading...</div>
    : <HeaderCtx.Provider value={{ setTitle }}>
        <Header serviceName={title} />
        <div>{children}</div>
      </HeaderCtx.Provider>
  );
}

export default BaseApp;
