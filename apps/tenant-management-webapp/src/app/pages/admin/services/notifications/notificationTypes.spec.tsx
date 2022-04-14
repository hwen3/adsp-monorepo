import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { NotificationTypes } from './notificationTypes';
import { DELETE_NOTIFICATION_TYPE, UPDATE_NOTIFICATION_TYPE } from '@store/notification/actions';

describe('NotificationTypes Page', () => {
  const mockStore = configureStore([]);

  const store = mockStore({
    notification: {
      notificationTypes: {
        notificationId: {
          name: 'Child care subsidy application',
          description: 'Lorem ipsum dolor sit amet',
          channels: ['email', 'bot'],
          sortedChannels: ['email', 'bot'],
          events: [
            {
              namespace: 'file-service',
              name: 'file-uploaded',
              templates: {
                email: {
                  subject: 'hi',
                  body: 'this is a triumph',
                },
                bot: {
                  subject: 'hello',
                  body: 'huge success',
                },
              },
            },
          ],
          subscriberRoles: [],
          id: 'notificationId',
          publicSubscribe: false,
        },
        anotherNotificationId: {
          name: 'Some other subsidy application',
          description: 'Lorem ipsum dolor sit amet',
          channels: ['email', 'bot'],
          sortedChannels: ['email', 'bot'],
          events: [
            {
              namespace: 'file-service',
              name: 'file-deleted',
              templates: {
                email: {
                  subject: 'diggles',
                  body: 'Lorem ipsum dolorLorem ipsum dolorLorem ipsum dolorLorem ipsum dolor',
                },
                bot: {
                  subject: '',
                  body: '',
                },
              },
            },
          ],
          subscriberRoles: [],
          id: 'anotherNotificationId',
          publicSubscribe: false,
          manageSubscribe: true,
        },
      },
      core: {
        superCoreNotificationStuff: {
          name: 'Some other subsidy application',
          description: 'Lorem ipsum dolor sit amet',
          events: [
            {
              namespace: 'file-service',
              name: 'file-deleted',
              templates: {
                email: { subject: 'sdd', body: 'sds' },
              },
            },
          ],
          subscriberRoles: [],
          channels: ['email'],
          sortedChannels: ['email'],
          id: 'superCoreNotificationStuff',
          publicSubscribe: false,
          manageSubscribe: true,
        },
      },
    },
    event: {
      definitions: {
        'foo:bar': {
          namespace: 'foo',
          name: 'bar',
          description: 'foobar',
          isCore: false,
          payloadSchema: {},
        },
      },
    },
    user: { jwt: { token: '' } },
    session: { realm: 'core' },
    tenant: {
      realmRoles: [
        {
          id: '5ef67c57',
          name: 'uma_authorization',
          description: 'role_uma_authorization',
          composite: false,
          clientRole: false,
          containerId: '4cc89eed',
        },
        {
          id: 'c85d9bdd',
          name: 'offline_access',
          description: 'role_offline-access',
          composite: false,
          clientRole: false,
          containerId: '4cc89eed',
        },
      ],
    },
    config: {
      serviceUrls: {
        subscriberWebApp: 'https://subscription',
      },
    },
  });

  it('renders', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const addDefButton = queryByTestId('add-notification');
    expect(addDefButton).not.toBeNull();
  });

  it('allows for the NotificationTypes to be added', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const addDefButton = queryByTestId('add-notification');
    fireEvent.click(addDefButton);
    const dialog = queryByTestId('notification-types-form');
    await waitFor(() => {
      expect(dialog).not.toBeNull();
    });
  });

  it('deletes a notification type', async () => {
    const { getAllByTestId, queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );

    const deleteBtn = getAllByTestId('delete-notification-type')[0];
    fireEvent.click(deleteBtn);

    const confirmation = queryByTestId('delete-confirmation');
    expect(confirmation).not.toBeNull();

    const deleteConfirm = queryByTestId('delete-confirm');
    fireEvent.click(deleteConfirm);

    const actions = store.getActions();

    const deleteAction = actions.find((action) => action.type === DELETE_NOTIFICATION_TYPE);
    expect(deleteAction).toBeTruthy();
  });

  it('cancels deleting a notification type', async () => {
    const { getAllByTestId, queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );

    const deleteBtn = getAllByTestId('delete-notification-type')[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(queryByTestId('delete-cancel')).toBeVisible();
    });
  });

  it('edits the notification types', async () => {
    const { getAllByTestId, queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const editBtn = getAllByTestId('edit-notification-type')[0];
    await waitFor(() => {
      fireEvent.click(editBtn);
    });

    // fields
    const name = queryByTestId('form-name');
    const description = queryByTestId('form-description');
    const cancelBtn = queryByTestId('form-cancel');
    const saveBtn = queryByTestId('form-save');

    expect(name).not.toBeNull();
    expect(description).not.toBeNull();
    expect(cancelBtn).not.toBeNull();
    expect(saveBtn).not.toBeNull();

    // fill
    fireEvent.change(description, { target: { value: 'the updated description' } });
    fireEvent.click(saveBtn);

    const actions = store.getActions();

    const saveAction = actions.find((action) => action.type === UPDATE_NOTIFICATION_TYPE);

    expect(saveAction).toBeTruthy();
  });

  it('cancels editing the notification type', async () => {
    const { getAllByTestId, queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );

    await waitFor(() => {
      const editBtn = getAllByTestId('edit-notification-type')[0];
      fireEvent.click(editBtn);
    });

    const cancelButton = queryByTestId('form-cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      const form = queryByTestId('notification-types-form');
      expect(form).not.toBeVisible();
    });
  });

  it('creates a new notification type', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const addBtn = queryByTestId('add-notification');
    fireEvent.click(addBtn);

    // fields
    const name = queryByTestId('form-name');
    const description = queryByTestId('form-description');
    const cancelBtn = queryByTestId('form-cancel');
    const saveBtn = queryByTestId('form-save');

    expect(name).toBeTruthy();
    expect(description).toBeTruthy();
    expect(cancelBtn).toBeTruthy();
    expect(saveBtn).toBeTruthy();

    // fill
    fireEvent.change(name, { target: { value: 'name' } });
    fireEvent.change(description, { target: { value: 'description' } });
    fireEvent.click(saveBtn);

    const actions = store.getActions();

    const saveAction = actions.find((action) => action.type === UPDATE_NOTIFICATION_TYPE);

    expect(saveAction).toBeTruthy();
  });

  it('add an event', async () => {
    const { getAllByTestId, queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const addBtn = getAllByTestId('add-event')[1];
    await waitFor(() => {
      fireEvent.click(addBtn);
    });

    // fields
    const eventDropDown = queryByTestId('event-dropdown');
    const cancelBtn = queryByTestId('event-form-cancel');
    const saveBtn = queryByTestId('event-form-save');

    expect(eventDropDown).toBeTruthy();
    expect(cancelBtn).toBeTruthy();
    expect(saveBtn).toBeTruthy();

    // fill
    fireEvent.click(queryByTestId('event-dropdown'));
    fireEvent.click(queryByTestId('event-dropdown-option--foo:bar'));

    fireEvent.click(saveBtn);

    const actions = store.getActions();
    const saveAction = actions.find((action) => action.type === UPDATE_NOTIFICATION_TYPE);

    expect(saveAction).toBeTruthy();
  });

  it('edit an event', async () => {
    const { getAllByTestId, queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const editBtn = getAllByTestId('edit-event-file-service:file-uploaded')[0];
    await waitFor(() => {
      fireEvent.click(editBtn);
    });

    // fields
    const cancelBtn = queryByTestId('template-form-cancel');
    const saveBtn = queryByTestId('template-form-save');

    expect(cancelBtn).toBeTruthy();
    expect(saveBtn).toBeTruthy();

    // fill

    fireEvent.click(saveBtn);

    const actions = store.getActions();
    const saveAction = actions.find((action) => action.type === UPDATE_NOTIFICATION_TYPE);

    expect(saveAction).toBeTruthy();
  });

  it('deletes an event', async () => {
    const { getAllByTestId, queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const deleteBtn = getAllByTestId('delete-event')[0];

    fireEvent.click(deleteBtn);

    const confirmation = queryByTestId('delete-confirmation');
    expect(confirmation).not.toBeNull();

    const deleteConfirm = queryByTestId('delete-confirm');
    fireEvent.click(deleteConfirm);

    const actions = store.getActions();

    const deleteAction = actions.find((action) => action.type === UPDATE_NOTIFICATION_TYPE);
    expect(deleteAction).toBeTruthy();
  });

  it('shows badge where required as expected', async () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );

    expect(getByTestId('Some other subsidy application:bot:badge').textContent).toBe('!');
    expect(queryByTestId('Child care subsidy application:bot:badge')).not.toBeInTheDocument();
  });
});
