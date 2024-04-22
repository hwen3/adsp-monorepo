import React, { useEffect } from 'react';
import { ajv } from '@lib/validation/checkInput';
import { JsonForms } from '@jsonforms/react';
import { ErrorBoundary } from 'react-error-boundary';
import { GoARenderers, GoACells } from '@abgov/jsonforms-components';
import { parseDataSchema, parseUiSchema } from './schemaUtils';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { uiSchemaWrapper } from './schemaWrappers';
import FallbackRender from './FallbackRenderer';

interface JSONFormPreviewerProps {
  schema: string;
  data: unknown;
  uischema: string;
  onChange: (data) => void;
}

export const JSONFormPreviewer = (props: JSONFormPreviewerProps): JSX.Element => {
  const { schema, uischema, data, onChange } = props;
  const [lastGoodUiSchema, setLastGoodUiSchema] = React.useState<UISchemaElement>();
  const [lastGoodSchema, setLastGoodSchema] = React.useState<JsonSchema>({});
  const [dataSchemaError, setDataSchemaError] = React.useState<string>();
  const [uiSchemaError, setUiSchemaError] = React.useState<string>();
  const [isWrapped, setIsWrapped] = React.useState(false);
  const parsedUiSchema = parseUiSchema<UISchemaElement>(uischema);
  const parsedDataSchema = parseDataSchema<UISchemaElement>(schema);

  useEffect(() => {
    if (!parsedUiSchema.hasError()) {
      if (uiSchemaError) {
        setUiSchemaError(undefined);
      }
      setLastGoodUiSchema(parsedUiSchema.get());
    } else if (!uiSchemaError) {
      setUiSchemaError(parsedUiSchema.error());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uischema]);

  useEffect(() => {
    if (!parsedDataSchema.hasError()) {
      setLastGoodSchema(parsedDataSchema.get());
      if (dataSchemaError) {
        setDataSchemaError(undefined);
      }
    } else {
      setDataSchemaError(parsedDataSchema.error());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  useEffect(() => {
    const hasError = dataSchemaError || uiSchemaError;
    if (hasError && !isWrapped) {
      setIsWrapped(true);
      setLastGoodUiSchema(uiSchemaWrapper(lastGoodUiSchema, hasError));
    } else if (!hasError && isWrapped) {
      setLastGoodUiSchema(parsedUiSchema.get());
      setIsWrapped(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSchemaError, uiSchemaError]);

  const JsonFormsWrapper = () => {
    return (
      <JsonForms
        ajv={ajv}
        renderers={GoARenderers}
        cells={GoACells}
        onChange={onChange}
        data={data}
        validationMode={'ValidateAndShow'}
        //need to re-create the schemas here in order to trigger a refresh when passing data back through the context
        schema={{ ...lastGoodSchema }}
        uischema={{ ...lastGoodUiSchema }}
      />
    );
  };

  //must appear to be different to force re-render
  return (
    <ErrorBoundary fallbackRender={FallbackRender}>
      {JSON.stringify(lastGoodUiSchema, null, 2) === uischema ? (
        <JsonFormsWrapper />
      ) : (
        <div>
          <JsonFormsWrapper />
        </div>
      )}
    </ErrorBoundary>
  );
};
