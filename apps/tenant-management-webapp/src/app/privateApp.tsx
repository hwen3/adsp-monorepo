import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

import Header from '@components/AppHeader';
import { RootState } from '@store/index';
import { ApiUptimeFetch } from '@store/api-status/actions';
import { HeaderCtx } from '@lib/headerContext';
import Container from '@components/Container';

export function PrivateApp({ children }) {
  const [title, setTitle] = useState<string>('');
  const dispatch = useDispatch();

  // initiate the get API service status reoccurring request
  useEffect(() => {
    setInterval(async () => dispatch(ApiUptimeFetch()), 10 * 1000);
  }, [dispatch]);

  return (
    <HeaderCtx.Provider value={{ setTitle }}>
      <Header serviceName={title} />
      <Container>{children}</Container>
    </HeaderCtx.Provider>
  );
}

export function PrivateRoute({ component: Component, ...rest }) {
  const isAuthenticated = useSelector((state: RootState) => state.session?.authenticated ?? false);
  const stateSession = useSelector((state: RootState) => state.session);

  console.log(JSON.stringify(isAuthenticated) + '<are we authenticated');
  console.log(JSON.stringify(stateSession) + '<are stateSession');
  console.log(stateSession + '<are stateSession2');

  return (
    <Route
      {...rest}
      render={(props) => {
        // if (Object.keys(stateSession).length === 0) {
        //   return <div></div>;
        // }
        return isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: '/', state: { from: props.location } }} />
        );
      }}
    />
  );
}

export default PrivateApp;
