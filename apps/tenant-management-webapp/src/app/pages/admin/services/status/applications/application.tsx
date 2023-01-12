import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { ServiceStatusType, PublicServiceStatusTypes, ApplicationStatus } from '@store/status/models';
import { deleteApplication, toggleApplicationStatus } from '@store/status/actions';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { GoAButton, GoARadio, GoARadioGroup } from '@abgov/react-components';
import {
  GoABadge,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
  GoAForm,
  GoAFormItem,
} from '@abgov/react-components/experimental';
import ApplicationFormModal from '../form';
import type { GoABadgeType } from '@abgov/react-components/experimental';
import { setApplicationStatus } from '@store/status/actions/setApplicationStatus';
import { DeleteModal } from '@components/DeleteModal';
import { HealthBar } from './healthBar';
import { App, AppHeader, AppHealth, AppStatus, AppName } from './styled-components';

export const Application = (app: ApplicationStatus): JSX.Element => {
  const dispatch = useDispatch();
  const entries = useSelector((state: RootState) =>
    state.serviceStatus.endpointHealth[app.appKey] &&
    state.serviceStatus.endpointHealth[app.appKey].url === app.endpoint?.url
      ? state.serviceStatus.endpointHealth[app.appKey].entries
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
    dispatch(deleteApplication({ tenantId: app.tenantId, appKey: app.appKey }));
    setShowDeleteConfirmation(false);
  }

  function cancelDelete() {
    setShowDeleteConfirmation(false);
  }

  function doManualStatusChange() {
    dispatch(setApplicationStatus({ tenantId: app.tenantId, appKey: app.appKey, status }));
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
          <GoAContextMenuIcon type="create" onClick={() => setShowEditModal(true)} data-testid="status-edit-button" />
          <GoAContextMenuIcon type="trash" onClick={() => setShowDeleteConfirmation(true)} />
        </GoAContextMenu>
      </AppHeader>
      {/* Endpoint List for watched service */}
      <AppName>{app.name}</AppName>
      <div>key: {app.appKey}</div>
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
                appKey: app.appKey,
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
          <GoAButton buttonType="secondary" onClick={cancelManualStatusChange}>
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
        isEdit={true}
        testId={'edit-application'}
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
};
