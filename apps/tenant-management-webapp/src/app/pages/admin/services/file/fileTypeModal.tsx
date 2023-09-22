import React, { useState, useEffect } from 'react';
import { Role } from '@store/tenant/models';
import { GoAButton, GoAButtonGroup, GoAInput, GoAFormItem, GoAModal } from '@abgov/react-components-new';
import { FileIdItem, ModalOverwrite, SpinnerModalPadding } from './styled-components';
import { CreateFileTypeService } from '@store/file/actions';
import { FileTypeItem, RetentionPolicy } from '@store/file/models';
import { useDispatch } from 'react-redux';
import { toKebabName } from '@lib/kebabName';

import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { useValidators } from '@lib/validation/useValidators';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { cloneDeep } from 'lodash';
import { useHistory } from 'react-router-dom';
import { GoAPageLoader } from '@abgov/react-components';

interface FileTypeModalProps {
  isOpen: boolean;
  fileType?: FileTypeItem;
  onCancel: () => void;
  fileTypeNames?: string[];
  type: 'new' | 'edit';
  roles: Role[];
  onSwitch?: () => void;
}

const validateRetentionPolicy = (type: FileTypeItem): boolean => {
  if (type?.rules?.retention?.active) {
    return type?.rules?.retention?.deleteInDays !== undefined;
  }
  return true;
};

export const FileTypeModal = (props: FileTypeModalProps): JSX.Element => {
  const isNew = props.type === 'new';
  const [fileType, setFileType] = useState({} as FileTypeItem);
  const [spinner, setSpinner] = useState(false);

  const title = isNew ? 'Add file type' : 'Edit file type';
  const cloneFileType = cloneDeep(props.fileType);

  const history = useHistory();
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', duplicateNameCheck(props.fileTypeNames, 'File type'))
    .build();

  const dispatch = useDispatch();

  const { fetchKeycloakRolesState } = useSelector((state: RootState) => ({
    fetchKeycloakRolesState: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] || '',
  }));

  //eslint-disable-next-line
  useEffect(() => {}, [fetchKeycloakRolesState]);

  useEffect(() => {
    setFileType(props.fileType);
  }, [props.fileType]);

  const handleCancelClick = () => {
    if (isNew) {
      const defaultRetention: RetentionPolicy = {
        ...fileType.rules?.retention,
        active: false,
        deleteInDays: '',
      };
      setFileType({
        ...fileType,
        name: '',
        id: '',
        readRoles: [],
        updateRoles: [],
        anonymousRead: false,
        rules: {
          ...fileType?.rules,
          retention: defaultRetention,
        },
      });
    } else {
      setFileType(cloneFileType);
    }
    validators.clear();
    props.onCancel();
  };

  return (
    <ModalOverwrite>
      <GoAModal
        testId="file-type-modal"
        open={props.isOpen}
        heading={title}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              testId="file-type-modal-cancel"
              onClick={() => {
                handleCancelClick();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              disabled={!fileType?.name || validators.haveErrors() || !validateRetentionPolicy(fileType)}
              testId="file-type-modal-save"
              onClick={() => {
                setSpinner(true);
                const validations = {
                  name: fileType.name,
                };

                if (props.type === 'new') {
                  validations['duplicated'] = fileType.name;
                }

                if (!validators.checkAll(validations)) {
                  return;
                }

                dispatch(CreateFileTypeService(fileType));

                history.push({
                  pathname: `/admin/services/file/edit/${fileType.id}`,
                  search: '?fileTypes=true',
                });
              }}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        {spinner ? (
          <SpinnerModalPadding>
            <GoAPageLoader visible={true} type="infinite" message={'Loading...'} pagelock={false} />
          </SpinnerModalPadding>
        ) : (
          <>
            <GoAFormItem error={errors?.['name']} label="Name">
              <GoAInput
                type="text"
                name="name"
                disabled={props.type === 'edit'}
                value={fileType?.name}
                width="100%"
                testId={`file-type-modal-name-input`}
                onChange={(name, value) => {
                  const newFileType = {
                    ...fileType,
                    name: value,
                    id: isNew ? toKebabName(value) : fileType.id,
                  };

                  const validations = {
                    name: value,
                  };
                  validators.remove('name');
                  if (isNew) {
                    validations['duplicated'] = value;
                  }
                  validators.checkAll(validations);
                  setFileType(newFileType);
                }}
                aria-label="name"
              />
            </GoAFormItem>
            <GoAFormItem label="Type ID">
              <FileIdItem>
                <GoAInput
                  testId={`file-type-modal-id`}
                  value={fileType?.id}
                  disabled={true}
                  width="100%"
                  name="file-type-id"
                  type="text"
                  aria-label="goa-input-file-type-id"
                  //eslint-disable-next-line
                  onChange={() => {}}
                />
              </FileIdItem>
            </GoAFormItem>
          </>
        )}
      </GoAModal>
    </ModalOverwrite>
  );
};
