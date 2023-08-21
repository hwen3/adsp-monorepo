import React, { useState } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAButton, GoAButtonGroup, GoAInput } from '@abgov/react-components-new';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { Service } from '@store/directory/models';
import { useDispatch, useSelector } from 'react-redux';
import { createEntry, updateEntry, fetchEntryDetail } from '@store/directory/actions';
import { RootState } from '@store/index';
import {
  characterCheck,
  validationPattern,
  Validator,
  isNotEmptyCheck,
  wordMaxLengthCheck,
} from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';

interface DirectoryModalProps {
  entry?: Service;
  type: string;
  onCancel?: () => void;
  open: boolean;
}
const duplicateServiceCheck = (directory: Service[], tenantName: string, isNew: boolean): Validator => {
  return (input: Service) => {
    // If we don't have an API, check that the service is not duplicated.
    if (!input.api) {
      // If we're editing then the service name will already be in the directory; remove it for duplicate check.
      const dir = isNew ? directory : directory.slice(0).filter((e) => e.service === input.service);
      const duplicate = dir.find((s) => !s.api && s.namespace === tenantName && s.service === input.service);
      return duplicate ? 'Service duplicate, please use another' : '';
    }
  };
};

const duplicateApiCheck = (directory: Service[], tenantName: string, isNew: boolean): Validator => {
  return (input: Service) => {
    // If we have an API check that it is not a duplicate for the service.
    if (input.api) {
      // If we're editing then the api name will already be in the directory; remove it for duplicate check.
      const dir = isNew
        ? directory
        : directory.slice(0).filter((e) => e.api !== input.api && e.service === input.service);
      const duplicate = dir.find(
        (s) => s.namespace === tenantName && s.service === input.service && s.api === input.api
      );
      return duplicate ? 'Api duplicate, please use another' : '';
    }
  };
};

const lowerCaseCheck = characterCheck(validationPattern.lowerKebabCase);
const checkForBadUrl = characterCheck(validationPattern.validURL);
const checkServiceExists = isNotEmptyCheck('service');
const checkUrlExists = isNotEmptyCheck('URL');
const wordLengthCheck = wordMaxLengthCheck(32, 'name');

export const DirectoryModal = (props: DirectoryModalProps): JSX.Element => {
  const isNew = props.type === 'new';
  const isQuickAdd = props.type === 'quickAdd';
  const isEdit = props.type === 'edit';
  const [entry, setEntry] = useState(props.entry);

  const title = isNew || isQuickAdd ? 'Add entry' : 'Edit entry';
  const { directory } = useSelector((state: RootState) => state.directory);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const dispatch = useDispatch();
  const { errors, validators } = useValidators(
    'service',
    'service',
    lowerCaseCheck,
    checkServiceExists,
    wordLengthCheck
  )
    .add('api', 'api', lowerCaseCheck)
    .add('url', 'url', checkForBadUrl, checkUrlExists)
    .add('apiDuplicate', 'api', duplicateApiCheck(directory, tenantName, isNew))
    .add('serviceDuplicate', 'service', duplicateServiceCheck(directory, tenantName, isNew))
    .build();

  return (
    <GoAModal testId="directory-modal" isOpen={props.open}>
      <GoAModalTitle>{title}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem error={errors?.['service']}>
            <label>Service</label>
            <GoAInput
              type="text"
              name="service"
              value={entry.service}
              testId={`directory-modal-service-input`}
              aria-label="service"
              width="100%"
              disabled={!isNew || isQuickAdd}
              onChange={(name, value) => {
                validators['service'].check(value);
                setEntry({ ...entry, service: value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['api']}>
            <label>API</label>
            <GoAInput
              type="text"
              name="api"
              value={entry.api}
              width="100%"
              testId={`directory-modal-api-input`}
              aria-label="api"
              disabled={!isNew || isQuickAdd}
              onChange={(name, value) => {
                validators['api'].check(value);
                setEntry({ ...entry, api: value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['url']}>
            <label>URL</label>
            <GoAInput
              type="url"
              name="url"
              width="100%"
              value={entry.url}
              testId={`directory-modal-url-input`}
              aria-label="name"
              disabled={isQuickAdd}
              onChange={(name, value) => {
                validators['url'].check(value);
                setEntry({ ...entry, url: value });
              }}
            />
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="directory-modal-cancel"
            onClick={() => {
              props.onCancel();
              validators.clear();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            disabled={!entry.service || !entry.url || validators.haveErrors()}
            testId="directory-modal-save"
            onClick={() => {
              const validations = {
                serviceDuplicate: entry,
                apiDuplicate: entry,
              };

              if (!isEdit && !validators.checkAll(validations)) {
                return;
              }

              if (isNew) {
                dispatch(createEntry(entry));
                if (!entry.api) {
                  const fetchTime = setInterval(() => dispatch(fetchEntryDetail(entry)), 1000);
                  setTimeout(() => {
                    clearInterval(fetchTime);
                  }, 1000);
                }
              }
              if (isQuickAdd) {
                dispatch(createEntry(entry));
              }
              if (props.type === 'edit') {
                dispatch(updateEntry(entry));
              }

              props.onCancel();
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      </GoAModalActions>
    </GoAModal>
  );
};
