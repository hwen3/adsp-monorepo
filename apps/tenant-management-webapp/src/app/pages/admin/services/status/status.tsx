import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import {
  deleteApplication,
  fetchServiceStatusApps,
  fetchStatusMetrics,
  toggleApplicationStatus,
} from '@store/status/actions';
import { RootState } from '@store/index';
import ReactTooltip from 'react-tooltip';
import { useDispatch, useSelector } from 'react-redux';
import {
  ServiceStatusType,
  PublicServiceStatusTypes,
  ServiceStatusApplication,
  ServiceStatusEndpoint,
  EndpointStatusEntry,
} from '@store/status/models';
import styled, { CSSProperties } from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { GoAButton, GoARadio, GoARadioGroup, GoACheckbox } from '@abgov/react-components';
import {
  GoABadge,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
  GoAForm,
  GoAFormItem,
} from '@abgov/react-components/experimental';
import type { GoABadgeType } from '@abgov/react-components/experimental';
import ApplicationFormModal from './form';
import NoticeModal from './noticeModal';
import { setApplicationStatus } from '@store/status/actions/setApplicationStatus';
import { GetMySubscriber, Subscribe, Unsubscribe } from '@store/subscription/actions';
import { Tab, Tabs } from '@components/Tabs';
import { getNotices } from '@store/notice/actions';
import { NoticeList } from './noticeList';
import SupportLinks from '@components/SupportLinks';
import { EditIconButton } from '@components/icons/EditIcon';
import { renderNoItem } from '@components/NoItem';
import { StatusMetrics } from './metrics';
import { DeleteModal } from '@components/DeleteModal';
import { createSelector } from 'reselect';

const userHealthSubscriptionSelector = createSelector(
  (state: RootState) => state.session.userInfo?.sub,
  (state: RootState) => state.subscription.subscribers,
  (state: RootState) => state.subscription.subscriptions,
  (userId, subscribers, subscriptions) => {
    const userSubscriber = userId && Object.values(subscribers).find(({ userId: subUserId }) => subUserId === userId);
    const userSubscription = subscriptions[`status-application-health-change:${userSubscriber?.id}`];

    return userSubscription
      ? {
          ...userSubscription,
          subscriber: userSubscriber,
        }
      : null;
  }
);

function Status(): JSX.Element {
  const dispatch = useDispatch();
  const { applications, serviceStatusAppUrl, tenantName } = useSelector((state: RootState) => ({
    applications: state.serviceStatus.applications,
    serviceStatusAppUrl: state.config.serviceUrls.serviceStatusAppUrl,
    tenantName: state.tenant.name,
  }));
  const subscription = useSelector(userHealthSubscriptionSelector);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState<boolean>(false);
  const [showAddNoticeModal, setShowAddNoticeModal] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchServiceStatusApps());
    dispatch(fetchStatusMetrics());
  }, []);

  useEffect(() => {
    if (applications && applications.length > 0) {
      const intervalId = setInterval(() => dispatch(fetchServiceStatusApps()), 30000);
      return () => clearInterval(intervalId);
    }
  }, [applications]);

  const publicStatusUrl = `${serviceStatusAppUrl}/${tenantName.replace(/\s/g, '-').toLowerCase()}`;

  const _afterShow = (copyText) => {
    navigator.clipboard.writeText(copyText);
  };

  useEffect(() => {
    dispatch(getNotices());
    dispatch(GetMySubscriber());
  }, []);

  const subscribeToggle = () => {
    if (subscription) {
      dispatch(Unsubscribe({ data: { type: 'status-application-health-change', data: subscription.subscriber } }));
    } else {
      dispatch(Subscribe({ data: { type: 'status-application-health-change' } }));
    }
  };

  const addApplication = () => {
    setShowAddApplicationModal(true);
  };

  return (
    <Page>
      <Main>
        {showAddApplicationModal && (
          <ApplicationFormModal
            isOpen={true}
            title="Add application"
            onCancel={() => {
              setShowAddApplicationModal(false);
            }}
            onSave={() => {
              if (activeIndex !== 1) {
                setActiveIndex(1);
              }
              setShowAddApplicationModal(false);
            }}
            defaultApplication={{
              name: '',
              tenantId: '',
              enabled: false,
              description: '',
              endpoint: { url: '', status: 'offline' },
            }}
          />
        )}
        <h1>Service status</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview">
            <div>
              <section>
                This service allows for easy monitoring of application downtime.
                <p>
                  Each application should represent a service that is useful to the end user by itself, such as child
                  care subsidy and child care certification
                </p>
                <GoAButton data-testid="add-application" onClick={addApplication} buttonType="primary">
                  Add application
                </GoAButton>
              </section>
              <StatusMetrics />
            </div>
          </Tab>
          <Tab label="Applications">
            <p>
              You can use multiple endpoint URLs for a single application, including internal services you depend on, in
              order to assess which components within an application may be down or malfunctioning (ie. web server,
              database, storage servers, etc)
            </p>
            <p>
              Each application should represent a service that is useful to the end user by itself, such as child care
              subsidy and child care certification
            </p>
            <p>
              <GoAButton data-testid="add-application" onClick={addApplication} buttonType="primary">
                Add application
              </GoAButton>
            </p>
            <p>
              <b>Do you want to subscribe and receive notifications for application health changes?</b>
            </p>
            <GoACheckbox
              name="subscribe"
              checked={!!subscription}
              onChange={() => {
                subscribeToggle();
              }}
              value="subscribed"
            >
              I want to subscribe and receive notifications
            </GoACheckbox>
            {applications.length === 0 && renderNoItem('application')}
            <ApplicationList>
              {applications.map((app) => (
                <Application key={app._id} {...app} />
              ))}
            </ApplicationList>
          </Tab>
          <Tab label="Notices">
            {showAddNoticeModal && (
              <NoticeModal
                isOpen={true}
                title="Add notice"
                onCancel={() => {
                  setShowAddNoticeModal(false);
                }}
                onSave={() => {
                  setShowAddNoticeModal(false);
                }}
              />
            )}
            <p>
              This service allows for posting of application notices. This allows you to communicate with your customers
              about upcoming maintenance windows or other events
            </p>
            <GoAButton
              data-testid="add-notice"
              onClick={() => {
                setShowAddNoticeModal(true);
              }}
              buttonType="primary"
            >
              Add notice
            </GoAButton>
            <NoticeList />
          </Tab>
          <Tab label="Guidelines">
            <p>Guidelines for choosing a health check endpoint:</p>
            <ol>
              <li>A Health check endpoint needs to be publicly accessible over the internet</li>
              <li>
                A Health check endpoint needs to return
                <ul>
                  <li>A 200 level status code to indicate good health</li>
                  <li>A non-200 level status code to indicate bad health.</li>
                </ul>
              </li>
              <li>
                To be most accurate, the health check endpoint should reference a URL that makes comprehensive use of
                your app, and checks connectivity to any databases, for instance.
              </li>
            </ol>
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <h3>Helpful links</h3>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://gitlab.gov.ab.ca/dio/core/core-services/-/tree/master/apps/status-service"
        >
          See the code
        </a>
        <SupportLinks />

        <h3>Public status page</h3>

        <p>Url of the current tenant's public status page:</p>

        <div className="copy-url">
          <a target="_blank" href={publicStatusUrl} rel="noreferrer">
            {publicStatusUrl}
          </a>
        </div>
        <GoAButton data-tip="Copied!" data-for="registerTipUrl">
          Click to copy
        </GoAButton>
        <ReactTooltip
          id="registerTipUrl"
          place="top"
          event="click"
          eventOff="blur"
          effect="solid"
          afterShow={() => _afterShow(publicStatusUrl)}
        />
      </Aside>
    </Page>
  );
}

function Application(app: ServiceStatusApplication) {
  const dispatch = useDispatch();
  const entries = useSelector((state: RootState) =>
    state.serviceStatus.endpointHealth[app._id] && state.serviceStatus.endpointHealth[app._id].url === app.endpoint?.url
      ? state.serviceStatus.endpointHealth[app._id].entries
      : []
  );

  if (app.endpoint) {
    app.endpoint.statusEntries = entries;
  }

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [showStatusForm, setShowStatusForm] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [status, setStatus] = useState<ServiceStatusType>(app.status);

  function doDelete() {
    dispatch(deleteApplication({ tenantId: app.tenantId, applicationId: app._id }));
    setShowDeleteConfirmation(false);
  }

  function cancelDelete() {
    setShowDeleteConfirmation(false);
  }

  function doManualStatusChange() {
    dispatch(setApplicationStatus({ tenantId: app.tenantId, applicationId: app._id, status }));
    setShowStatusForm(false);
  }

  function cancelManualStatusChange() {
    setShowStatusForm(false);
  }

  function humanizeText(value: string): string {
    value = value.replace(/[\W]/, ' ');
    return value.substr(0, 1).toUpperCase() + value.substr(1);
  }

  function formatStatus(statusType: string): string {
    return statusType.slice(0, 1).toUpperCase() + statusType.slice(1).replace(/\W/, ' ');
  }

  const publicStatusMap: { [key: string]: GoABadgeType } = {
    operational: 'success',
    maintenance: 'warning',
    'reported-issues': 'emergency',
    outage: 'emergency',
    pending: 'light',
    disabled: 'light',
  };

  return (
    <App data-testid="application">
      {/* Main component content */}
      <AppHeader>
        <div>
          <AppStatus>
            {app.status && <GoABadge type={publicStatusMap[app.status]} content={humanizeText(app.status)} />}
            <GoAButton buttonType="tertiary" buttonSize="small" onClick={() => setShowStatusForm(true)}>
              Change status
            </GoAButton>
          </AppStatus>
        </div>

        <GoAContextMenu>
          <EditIconButton iconSize="small" onClick={() => setShowEditModal(true)} data-testid="status-edit-button" />
          <GoAContextMenuIcon type="trash" onClick={() => setShowDeleteConfirmation(true)} />
        </GoAContextMenu>
      </AppHeader>

      {/* Endpoint List for watched service */}
      <AppName>{app.name}</AppName>
      <AppHealth>
        <HealthBar data-testid="endpoint" displayCount={30} app={app}></HealthBar>
        <GoAButton
          buttonType="tertiary"
          buttonSize="small"
          style={{ flex: '0 0 160px' }}
          onClick={() => {
            dispatch(
              toggleApplicationStatus({
                tenantId: app.tenantId,
                applicationId: app._id,
                enabled: !app.enabled,
              })
            );
          }}
        >
          {app.enabled ? 'Stop health check' : 'Start health check'}
        </GoAButton>
      </AppHealth>

      {/* GoAModals */}

      {/* Delete confirmation dialog */}
      {showDeleteConfirmation && (
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete application"
          content={`Delete the ${app.name} service status checks?`}
          onCancel={cancelDelete}
          onDelete={doDelete}
        />
      )}

      {/* Manual status change dialog */}
      <GoAModal isOpen={showStatusForm}>
        <GoAModalTitle>Manual status change</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem>
              <GoARadioGroup
                name="status"
                value={status}
                onChange={(_name, value) => setStatus(value as ServiceStatusType)}
                orientation="vertical"
              >
                {PublicServiceStatusTypes.map((statusType) => (
                  <GoARadio key={statusType} value={statusType}>
                    {formatStatus(statusType)}
                  </GoARadio>
                ))}
              </GoARadioGroup>
            </GoAFormItem>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton buttonType="tertiary" onClick={cancelManualStatusChange}>
            Cancel
          </GoAButton>

          <GoAButton buttonType="primary" onClick={doManualStatusChange}>
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>

      <ApplicationFormModal
        isOpen={showEditModal}
        title="Edit application"
        onCancel={() => {
          setShowEditModal(false);
        }}
        onSave={() => {
          setShowEditModal(false);
        }}
        defaultApplication={{ ...app }}
      />
    </App>
  );
}

export default Status;

// ==================
// Private Components
// ==================

interface AppEndpointProps {
  app: ServiceStatusApplication;
  displayCount: number;
}

function HealthBar({ app, displayCount }: AppEndpointProps) {
  const css: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
  };

  function getTimestamp(timestamp: number): string {
    const d = new Date(timestamp);
    const hours = d.getHours();
    const minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    return `${hours > 12 ? hours - 12 : hours}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
  }

  /**
   * Generate a list of health checks for the given endpoint and fills in the blank time slots with emtpy entries.
   * @param endpoint The service endpoint
   * @returns
   */
  function getStatusEntries(endpoint: ServiceStatusEndpoint): EndpointStatusEntry[] {
    const timePeriodEntries =
      endpoint.statusEntries
        ?.filter((entry) => entry.timestamp > Date.now() - 1000 * 60 * 30)
        .sort((a, b) => a.timestamp - b.timestamp) || [];

    if (timePeriodEntries.length >= displayCount) {
      return timePeriodEntries;
    }

    const makeEntry = (timestamp: number): EndpointStatusEntry => ({
      ok: false,
      timestamp,
      status: 'n/a',
      url: endpoint.url,
      responseTime: -1,
    });
    const minute = 60 * 1000;

    // must define time boundaries to allow for the insertion of filler entries and prevent gaps in time from not showing up
    const entries = [makeEntry(Date.now() - 30 * minute), ...timePeriodEntries, makeEntry(Date.now() + minute)];
    const filledEntries = [];

    for (let i = 1; i < entries.length; i++) {
      const prevEntry = entries[i - 1];
      const entry = entries[i];
      const diff = (entry.timestamp - prevEntry.timestamp) / minute;
      filledEntries.push(prevEntry);
      if (diff > 1) {
        for (let j = 1; j < diff - 1; j++) {
          filledEntries.push(makeEntry(prevEntry.timestamp + j * minute));
        }
      }
    }

    // remove the boundary entries that were inserted previously
    return filledEntries.slice(1);
  }

  const statusEntries = app.endpoint ? getStatusEntries(app.endpoint) : null;
  const getStatus = (app: ServiceStatusApplication): string => {
    if (!app.enabled) {
      return 'stopped';
    }

    return app.internalStatus;
  };

  const status = getStatus(app);

  return (
    <div style={css}>
      <StatusBarDetails>
        <span></span>
        <small style={{ textTransform: 'capitalize' }} className={status === 'pending' ? 'blink-text' : ''}>
          {status}
        </small>
      </StatusBarDetails>

      <EndpointStatusEntries data-testid="endpoint-url">
        {statusEntries?.map((entry) => (
          <EndpointStatusTick
            key={entry.timestamp}
            style={{
              backgroundColor: entry.ok
                ? entry.responseTime > 1000
                  ? 'var(--color-orange)'
                  : 'var(--color-green)'
                : entry.status === 'n/a'
                ? 'var(--color-gray-300)'
                : 'var(--color-red)',
            }}
            title={`${entry.status}${entry.responseTime > 1000 ? ' (> 1 sec)' : ''}: ${moment(entry.timestamp).format(
              'HH:mm A'
            )}`}
          />
        ))}
      </EndpointStatusEntries>
      <StatusBarDetails>
        <small>{statusEntries && getTimestamp(statusEntries[0]?.timestamp)}</small>
        <small>Now</small>
      </StatusBarDetails>
    </div>
  );
}

const StatusBarDetails = styled.div`
  display: flex;
  justify-content: space-between;
  .blink-text {
    color: var(--color-black);
    animation: blinkingText 1.5s infinite;
  }
  @keyframes blinkingText {
    0% {
      color: var(--color-black);
    }
    50% {
      color: var(--color-black);
    }
    100% {
      color: var(--color-white);
    }
  }
`;

const EndpointStatusEntries = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1px;
`;

const EndpointStatusTick = styled.div`
  flex: 1 1 auto;
  height: 20px;
  &:first-child {
    border-top-left-radius: 0.25rem;
    border-bottom-left-radius: 0.25rem;
  }
  &:last-child {
    border-top-right-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
  }
`;

// =================
// Styled Components
// =================

const App = styled.div`
  padding: 2rem 0;
  position: relative;
  border-bottom: 1px solid var(--color-gray-400);

  &:last-child {
    border-bottom: none;
  }

  &.disabled {
    filter: grayscale(100%);
    opacity: 0.5;
  }

  .context-menu {
    position: absolute;
    right: 0;
  }
`;

const AppHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  a {
    font-size: var(--fs-sm);
    margin-left: 0.5rem;
  }
`;

const AppHealth = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const AppStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ApplicationList = styled.section`
  margin-top: 2rem;
`;

const AppName = styled.div`
  font-size: var(--fs-lg);
  font-weight: var(--fw-bold);
  text-transform: capitalize;
  margin-top: 1rem;
`;
