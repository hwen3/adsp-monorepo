import React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '@store/index';

import { GoANotification } from '@abgov/react-components';

export function NotificationBanner(): JSX.Element {
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const successMessages = useSelector((state: RootState) => state.subscription.successMessage);

  const filteredNotification =
    notifications[notifications.length - 1]?.message.includes('401') &&
    notifications[notifications.length - 1]?.message.includes('Subscriptions')
      ? []
      : notifications;

  return (
    <div style={{ marginBottom: '10px' }}>
      {filteredNotification.length > 0 && (
        <GoANotification key={new Date().getTime()} type="emergency" isDismissable={true}>
          {filteredNotification[filteredNotification.length - 1].message}
        </GoANotification>
      )}
      {successMessages && (
        <GoANotification key={new Date().getTime()} type="information" isDismissable={true}>
          {successMessages}
        </GoANotification>
      )}
    </div>
  );
}
