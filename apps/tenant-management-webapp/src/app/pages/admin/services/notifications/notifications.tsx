import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { NotificationsOverview } from './overview';
import { NotificationTypes } from './notificationTypes';
import { Subscriptions } from './subscription/subscriptions';
import { Subscribers } from './subscribers';
import { subscriberAppUrlSelector } from './selectors';
import LinkCopyComponent from '@components/CopyLink/CopyLink';
import { Gapadjustment, Hyperlinkcolor } from '@pages/admin/dashboard/styled-components';
import { ExternalLink } from '@components/icons/ExternalLink';

export const Notifications: FunctionComponent = () => {
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const tenantName = useSelector((state: RootState) => state.tenant.name);

  const loginUrl = useSelector(subscriberAppUrlSelector);

  const [activateEditState, setActivateEditState] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  useEffect(() => {
    if (activeIndex !== null) {
      setActiveIndex(null);
    }
  }, [activeIndex]);
  function getNotificationDocsLink() {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Notification service`;
  }
  function getNotificationsupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/notification-service';
  }
  return (
    <Page>
      <Main>
        <h1 data-testid="notification-title">Notification service</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview">
            <NotificationsOverview setActiveEdit={activateEdit} />
          </Tab>
          <Tab label="Notification types">
            <NotificationTypes activeEdit={activateEditState} activateEdit={activateEdit} />
          </Tab>
          <Tab label="Subscriptions">
            <Subscriptions />
          </Tab>
          <Tab label="Subscribers">
            <Subscribers />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <Gapadjustment>Helpful links</Gapadjustment>
        <Hyperlinkcolor>
          <ExternalLink link={getNotificationDocsLink()} text="Read the API docs" />
        </Hyperlinkcolor>

        <Hyperlinkcolor>
          <ExternalLink link={getNotificationsupportcodeLink()} text="See the code" />
        </Hyperlinkcolor>

        <SupportLinks />

        <h3>Manage subscriptions</h3>
        <p>Subscribers can manage their subscriptions here:</p>
        <h3>Subscriber app link</h3>
        <LinkCopyComponent text={'Copy link'} link={loginUrl} />
      </Aside>
    </Page>
  );
};
