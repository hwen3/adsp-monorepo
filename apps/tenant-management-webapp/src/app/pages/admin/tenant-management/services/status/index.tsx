import Dialog from '@components/Dialog';
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import StatusPage from './status';

function index(): JSX.Element {
  return (
    <Switch>
      <Route path="/admin/tenant-admin/services/service-status">
        <StatusPage />
      </Route>
    </Switch>
  );
}

export default index;
