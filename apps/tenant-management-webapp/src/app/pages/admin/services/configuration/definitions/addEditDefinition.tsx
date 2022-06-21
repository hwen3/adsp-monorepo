import React, { FunctionComponent, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { ConfigDefinition } from '@store/configuration/model';
import { isValidJSONCheck } from '@lib/checkInput';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { getConfigurationDefinitions } from '@store/configuration/action';
interface AddEditConfigDefinitionProps {
  onSave: (definition: ConfigDefinition) => void;
  initialValue: ConfigDefinition;
  open: boolean;
  isEdit: boolean;
  onClose: () => void;
}

export const selectConfigurationIdentifier = createSelector(
  (state: RootState) => state.configuration?.coreConfigDefinitions?.configuration || {},
  (state: RootState) => state.configuration?.tenantConfigDefinitions?.configuration || {},
  (coreConfig, tenantConfig) => {
    return [...Object.keys(coreConfig), ...Object.keys(tenantConfig)];
  }
);

export const AddEditConfigDefinition: FunctionComponent<AddEditConfigDefinitionProps> = ({
  onSave,
  initialValue,
  open,
  isEdit,
  onClose,
}) => {
  const [definition, setDefinition] = useState<ConfigDefinition>(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const regex = new RegExp(/^[a-zA-Z0-9-]+$/);
  const [payloadSchema, setPayloadSchema] = useState<string>(JSON.stringify(definition.configurationSchema, null, 2));
  const identifiers = useSelector(selectConfigurationIdentifier);
  const hasFormErrors = () => {
    return Object.keys(errors).length !== 0;
  };

  useEffect(() => {
    setDefinition(initialValue);
  }, [initialValue]);

  const dispatch = useDispatch();
  useEffect(() => {
    if (!identifiers) {
      dispatch(getConfigurationDefinitions());
    }
  }, []);

  return (
    <>
      <GoAModal testId="definition-form" isOpen={open}>
        <GoAModalTitle testId="definition-form-title">{isEdit ? 'Edit definition' : 'Add definition'}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['namespace']}>
              <label>Namespace</label>
              <GoAInput
                type="text"
                name="namespace"
                value={definition.namespace}
                disabled={isEdit}
                data-testid="form-namespace"
                aria-label="nameSpace"
                onChange={(name, value) => {
                  if (!regex.test(value)) {
                    setErrors({ ...errors, namespace: 'Allowed characters: a-z, A-Z, 0-9, -' });
                  } else {
                    if (value.toLocaleLowerCase() === 'platform') {
                      setErrors({ ...errors, namespace: 'Cannot use the word platform as namespace' });
                    } else {
                      delete errors['namespace'];
                      setErrors({ ...errors });
                    }
                  }
                  setDefinition({ ...definition, namespace: value });
                }}
              />
            </GoAFormItem>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <GoAInput
                type="text"
                name="name"
                value={definition.name}
                disabled={isEdit}
                data-testid="form-name"
                aria-label="name"
                onChange={(name, value) => {
                  const identifier = `${definition?.namespace}:${value}`;
                  if (!regex.test(value)) {
                    setErrors({ ...errors, name: 'Allowed characters: a-z, A-Z, 0-9, -' });
                  } else {
                    delete errors['name'];
                    setErrors({ ...errors });
                  }
                  if (identifiers.includes(identifier)) {
                    setErrors({ ...errors, name: `Duplication name: ${identifier}` });
                  }
                  setDefinition({ ...definition, name: value });
                }}
              />
            </GoAFormItem>
            <GoAFormItem error={errors?.['payloadSchema']}>
              <label>Payload schema</label>
              <Editor
                data-testid="form-schema"
                height={200}
                value={payloadSchema}
                onChange={(value) => {
                  if ('payloadSchema' in errors) {
                    delete errors['payloadSchema'];
                  }
                  setPayloadSchema(value);
                }}
                language="json"
                options={{
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  minimap: { enabled: false },
                }}
              />
            </GoAFormItem>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton
            data-testid="form-cancel"
            buttonType="secondary"
            type="button"
            onClick={() => {
              setDefinition(initialValue);
              onClose();
              setErrors({});
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="form-save"
            disabled={!definition.name || !definition.namespace || Object.entries(errors).length > 0}
            type="submit"
            onClick={(e) => {
              // if no errors in the form then save the definition
              const payloadSchemaValidationResult = isValidJSONCheck('payloadSchema')(payloadSchema);

              if (payloadSchemaValidationResult !== '') {
                setErrors({ ...errors, payloadSchema: payloadSchemaValidationResult });
                return;
              }
              if (!hasFormErrors()) {
                onSave({ ...definition, configurationSchema: JSON.parse(payloadSchema) });
                setDefinition(initialValue);
                onClose();
              } else {
                return;
              }
            }}
          >
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </>
  );
};
