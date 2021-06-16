import React, { useContext, useEffect } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import styled from 'styled-components';
import { HeaderCtx } from '@lib/headerContext';
import { useSelector } from 'react-redux';

import Sidebar from './sidebar';
import Dashboard from './dashboard';
import Adminstration from './administration';
import File from './services/file';
import AccessPage from './services/access/access';
import Container from '@components/Container';
import Status from './services/status';
import { EventLog } from './event-log';
import { RootState } from '@store/index';
import { Events } from './services/events';

const TenantManagement = (): JSX.Element => {
  const { setTitle } = useContext(HeaderCtx);
  const isAuthenticated = useSelector((state: RootState) => state.session?.authenticated ?? false);

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant Management');
  }, [setTitle]);

  return (
    <AdminLayout ready={isAuthenticated}>
      <SidebarWrapper>
        <Sidebar type="desktop" />
      </SidebarWrapper>
      <Container hs={1}>
        <Switch>
          <Route exact path="/admin/tenant-admin/">
            <Dashboard />
          </Route>
          <Route exact path="/admin/tenant-admin/admin">
            <Adminstration />
          </Route>
          <Route exact path="/admin/tenant-admin/event-log">
            <EventLog />
          </Route>
          <Route path="/admin/tenant-admin/access">
            <AccessPage />
          </Route>
          <Route exact path="/admin/tenant-admin/admin">
            <Adminstration />
          </Route>
          <Route exact path="/admin/tenant-admin/services/file">
            <File />
          </Route>
          <Route path="/admin/tenant-admin/services/service-status">
            <Status />
          </Route>
          <Route path="/admin/tenant-admin/services/event-service">
            <Events />
          </Route>

          <Route path="*">
            <Redirect to="/404" />
          </Route>
        </Switch>
      </Container>
    </AdminLayout>
  );
};

export default TenantManagement;

interface AdminLayoutProps {
  ready: boolean;
}
const AdminLayout = styled.div`
  display: ${(p: AdminLayoutProps) => (p.ready ? 'flex' : 'none')};
  min-height: 100vh;
`;

const SidebarWrapper = styled.nav`
  flex: 0 0 0;
  transition: flex-basis 200ms;
  overflow-x: hidden;

  @media (min-width: 768px) {
    flex-basis: 12rem;
  }
`;
