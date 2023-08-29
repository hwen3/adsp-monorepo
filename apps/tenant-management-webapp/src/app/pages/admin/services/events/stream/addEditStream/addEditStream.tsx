import React, { useMemo, useState } from 'react';
import { GoADropdownOption, GoADropdown } from '@abgov/react-components';
import { AnonymousWrapper, ChipsWrapper, IdField, StreamModalStyles } from '../styleComponents';
import { Stream } from '@store/stream/models';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, duplicateNameCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import { toKebabName } from '@lib/kebabName';
import { generateEventOptions, generateSubscriberRolesOptions, mapTenantClientRoles } from '../utils';
import { Role } from '@store/tenant/models';
import { EventDefinition } from '@store/event/models';
import { RolesTable } from './rolesTable';

import { ServiceRoleConfig } from '@store/access/models';
import {
  GoAChip,
  GoACheckbox,
  GoAInput,
  GoATextArea,
  GoAButton,
  GoAButtonGroup,
  GoASkeleton,
  GoAFormItem,
  GoAModal,
} from '@abgov/react-components-new';
interface AddEditStreamProps {
  onSave: (stream: Stream) => void;
  onClose: () => void;
  isEdit: boolean;
  open: boolean;
  initialValue: Stream;
  realmRoles?: Role[];
  tenantClients: ServiceRoleConfig;
  eventDefinitions: Record<string, EventDefinition>;
  streams: Record<string, Stream>;
}
export const AddEditStream = ({
  onSave,
  open,
  isEdit,
  initialValue,
  onClose,
  realmRoles,
  eventDefinitions,
  tenantClients,
  streams,
}: AddEditStreamProps): JSX.Element => {
  const [stream, setStream] = useState<Stream>({ ...initialValue });

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    isNotEmptyCheck('name'),
    wordMaxLengthCheck(32, 'Name')
  )
    .add('duplicate', 'name', duplicateNameCheck(Object.keys(streams), 'Stream'))
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .build();

  const streamEvents = useMemo(() => {
    return stream?.events.map((event) => {
      return `${event.namespace}:${event.name}`;
    });
  }, [stream.events]);

  const subscriberRolesOptions = realmRoles ? generateSubscriberRolesOptions(realmRoles) : undefined;
  const eventOptions = eventDefinitions ? generateEventOptions(eventDefinitions) : undefined;
  const tenantClientsMappedRoles = tenantClients ? mapTenantClientRoles(tenantClients) : undefined;

  const deleteEventChip = (eventChip) => {
    const updatedStreamEvents = streamEvents.filter((event) => event !== eventChip);
    setStream({
      ...stream,
      events: updatedStreamEvents.map((event) => {
        return {
          namespace: event.split(':')[0],
          name: event.split(':')[1],
        };
      }),
    });
  };
  return (
    <StreamModalStyles>
      <GoAModal
        testId="stream-form"
        open={open}
        heading={isEdit ? 'Edit stream' : 'Add stream'}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              testId="form-cancel"
              type="secondary"
              onClick={() => {
                validators.clear();
                onClose();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              testId="form-save"
              disabled={!stream.name || validators.haveErrors()}
              onClick={() => {
                if (!isEdit && validators['duplicate'].check(stream.id)) {
                  return;
                }
                onSave(stream);
                onClose();
              }}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <GoAFormItem error={errors?.['name']} label="Name">
          <GoAInput
            type="text"
            name="stream-name"
            width="100%"
            value={stream.name}
            disabled={isEdit}
            testId="stream-name"
            aria-label="stream-name"
            onChange={(name, value) => {
              validators.remove('name');
              validators['name'].check(value);
              const streamId = toKebabName(value);
              setStream({ ...stream, name: value, id: streamId });
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="Stream ID">
          <IdField>{stream.id}</IdField>
        </GoAFormItem>
        <GoAFormItem label="Description">
          <label></label>
          <GoATextArea
            name="stream-description"
            value={stream.description}
            testId="stream-description"
            aria-label="stream-description"
            width="100%"
            onChange={(name, value) => {
              validators.remove('description');
              validators['description'].check(value);
              setStream({ ...stream, description: value });
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="Select events">
          <GoADropdown
            name="streamEvents"
            selectedValues={streamEvents}
            multiSelect={true}
            onChange={(name, values) => {
              setStream({
                ...stream,
                events: values.map((event) => {
                  return {
                    namespace: event.split(':')[0],
                    name: event.split(':')[1],
                  };
                }),
              });
            }}
          >
            {eventOptions
              .sort((a, b) => (a.name < b.name ? -1 : 1))
              .map((item) => (
                <GoADropdownOption label={item.label} value={item.value} key={item.key} data-testid={item.dataTestId} />
              ))}
          </GoADropdown>
        </GoAFormItem>
        <ChipsWrapper>
          {streamEvents.map((eventChip) => {
            return (
              <GoAChip
                key={eventChip}
                deletable={true}
                content={eventChip}
                onClick={() => deleteEventChip(eventChip)}
              />
            );
          })}
        </ChipsWrapper>

        <AnonymousWrapper>
          <GoACheckbox
            checked={stream.publicSubscribe}
            name="stream-anonymousRead-checkbox"
            testId="stream-anonymousRead-checkbox"
            onChange={() => {
              setStream({
                ...stream,
                publicSubscribe: !stream.publicSubscribe,
              });
            }}
            ariaLabel={`stream-anonymousRead-checkbox`}
          />
          Make stream public
        </AnonymousWrapper>
        {subscriberRolesOptions ? '' : <GoASkeleton type="text" />}
        {!stream.publicSubscribe && subscriberRolesOptions ? (
          <RolesTable
            tableHeading="Roles"
            key={'roles'}
            subscriberRolesOptions={subscriberRolesOptions}
            checkedRoles={stream?.subscriberRoles || []}
            onItemChecked={(value) => {
              if (stream?.subscriberRoles && stream.subscriberRoles.includes(value)) {
                const updatedRoles = stream.subscriberRoles.filter((roleName) => roleName !== value);
                setStream({ ...stream, subscriberRoles: updatedRoles });
              } else {
                if (!stream?.subscriberRoles) {
                  stream.subscriberRoles = [];
                }
                setStream({ ...stream, subscriberRoles: [...stream.subscriberRoles, value] });
              }
            }}
          />
        ) : (
          // some extra white space so the modal height/width stays the same when roles are hidden
          <div
            style={{
              width: '33em',
              height: '6em',
            }}
          ></div>
        )}

        {tenantClientsMappedRoles ? (
          ''
        ) : (
          <>
            <br />
            <GoASkeleton type="text" />
          </>
        )}
        {!stream.publicSubscribe && tenantClientsMappedRoles
          ? tenantClientsMappedRoles.map((tenantRole) => {
              return (
                tenantRole.roles.length > 0 && (
                  <RolesTable
                    tableHeading={tenantRole.name}
                    key={tenantRole.name}
                    subscriberRolesOptions={tenantRole.roles}
                    checkedRoles={stream.subscriberRoles}
                    onItemChecked={(value) => {
                      if (stream?.subscriberRoles && stream.subscriberRoles.includes(value)) {
                        const updatedRoles = stream.subscriberRoles.filter((roleName) => roleName !== value);
                        setStream({ ...stream, subscriberRoles: updatedRoles });
                      } else {
                        setStream({ ...stream, subscriberRoles: [...stream.subscriberRoles, value] });
                      }
                    }}
                  />
                )
              );
            })
          : ''}
        <br />
        <br />
      </GoAModal>
    </StreamModalStyles>
  );
};
