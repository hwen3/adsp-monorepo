import React, { FunctionComponent, useState, useEffect } from 'react';
import { FormDefinition } from '@store/form/model';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { SpinnerModalPadding, FormFormItem, HelpText, DescriptionItem, ErrorMsg } from '../styled-components';
import { GoAPageLoader } from '@abgov/react-components';

import { RootState } from '@store/index';
import { useSelector } from 'react-redux';

import {
  GoATextArea,
  GoAInput,
  GoAModal,
  GoAButtonGroup,
  GoAFormItem,
  GoAButton,
  GoAIcon,
} from '@abgov/react-components-new';
interface AddEditFormDefinitionProps {
  open: boolean;
  isEdit: boolean;
  initialValue?: FormDefinition;
  onClose: () => void;
  onSave: (definition: FormDefinition) => void;
}

export const AddEditFormDefinition: FunctionComponent<AddEditFormDefinitionProps> = ({
  initialValue,
  isEdit,
  onClose,
  open,
  onSave,
}) => {
  const [definition, setDefinition] = useState<FormDefinition>(initialValue);
  const [spinner, setSpinner] = useState<boolean>(false);

  const definitions = useSelector((state: RootState) => {
    return state?.form?.definitions;
  });
  const definitionIds = Object.keys(definitions);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const descErrMessage = 'Description can not be over 180 characters';

  useEffect(() => {
    if (spinner && Object.keys(definitions).length > 0) {
      if (validators['duplicate'].check(definition.id)) {
        setSpinner(false);
        return;
      }
      onSave(definition);
      onClose();
      setSpinner(false);
    }
  }, [definitions]);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  useEffect(() => {
    setDefinition(initialValue);
  }, [open]);

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'name', duplicateNameCheck(definitionIds, 'definition'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();
  return (
    <GoAModal
      testId="definition-form"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} definition`}
      width="640px"
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
            disabled={!definition.name || validators.haveErrors()}
            onClick={() => {
              if (indicator.show === true) {
                setSpinner(true);
              } else {
                if (!isEdit) {
                  const validations = {
                    duplicate: definition.name,
                  };
                  if (!validators.checkAll(validations)) {
                    return;
                  }
                }
                setSpinner(true);
                onSave(definition);
                onClose();
              }
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
          <FormFormItem>
            <GoAFormItem error={errors?.['name']} label="Name">
              <GoAInput
                type="text"
                name="form-definition-name"
                value={definition.name}
                testId="form-definition-name"
                aria-label="form-definition-name"
                width="100%"
                onChange={(name, value) => {
                  const validations = {
                    name: value,
                    duplicate: definition.name,
                  };
                  validators.remove('name');

                  validators.checkAll(validations);

                  setDefinition(
                    isEdit ? { ...definition, name: value } : { ...definition, name: value, id: toKebabName(value) }
                  );
                }}
              />
            </GoAFormItem>
          </FormFormItem>
          <GoAFormItem label="Definition ID">
            <FormFormItem>
              <GoAInput
                name="form-definition-id"
                value={definition.id}
                testId="form-definition-id"
                disabled={true}
                width="100%"
                // eslint-disable-next-line
                onChange={() => {}}
              />
            </FormFormItem>
          </GoAFormItem>

          <GoAFormItem label="Description">
            <DescriptionItem>
              <GoATextArea
                name="form-definition-description"
                value={definition.description}
                width="100%"
                testId="form-definition-description"
                aria-label="form-definition-description"
                onChange={(name, value) => {
                  validators.remove('description');
                  validators['description'].check(value);
                  setDefinition({ ...definition, description: value });
                }}
              />

              <HelpText>
                {definition.description.length <= 180 ? (
                  <div> {descErrMessage} </div>
                ) : (
                  <ErrorMsg>
                    <GoAIcon type="warning" size="small" theme="filled" />
                    {`  ${errors?.['description']}`}
                  </ErrorMsg>
                )}
                <div>{`${definition.description.length}/180`}</div>
              </HelpText>
            </DescriptionItem>
          </GoAFormItem>
        </>
      )}
    </GoAModal>
  );
};
