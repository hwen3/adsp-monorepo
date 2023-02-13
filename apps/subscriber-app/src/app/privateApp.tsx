import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom-6';
import Header from '@components/AppHeader';
import { HeaderCtx } from '@lib/headerContext';
import { KeycloakCheckSSOWithLogout, KeycloakRefreshToken } from '@store/tenant/actions';
import { NotificationBanner } from './notificationBanner';
import { UpdateConfigRealm } from '@store/config/actions';
import GoaLogo from '../assets/goa-logo.svg';
import Footer from '@components/Footer';
import Subscriptions from '@pages/private/Subscriptions/Subscriptions';

export function PrivateApp(): JSX.Element {
  const [title, setTitle] = useState<string>('Alberta Digital Service Platform - Subscription management');
  const dispatch = useDispatch();
  const { realm } = useParams();

  useEffect(() => {
    dispatch(UpdateConfigRealm(realm));
    setInterval(async () => {
      dispatch(KeycloakRefreshToken(realm));
    }, 120 * 1000);
    dispatch(KeycloakCheckSSOWithLogout(realm));
  }, []);

  return (
    <HeaderCtx.Provider value={{ setTitle }}>
      <Header serviceName={title} />
      <NotificationBanner />
      <Subscriptions realm={realm} />
      <Footer logoSrc={GoaLogo} />
    </HeaderCtx.Provider>
  );
}

export default PrivateApp;
