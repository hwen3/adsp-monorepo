import React from 'react';
import { isBooleanControl, RankedTester, rankWith, ControlProps, optionIs, and } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Hidden } from '@mui/material';
import { GoARadioGroup, GoARadioItem } from '@abgov/react-components-new';
import { GoAInputBaseControl } from './InputBaseControl';

export const BooleanRadioComponent = ({
  data,
  visible,
  enabled,
  uischema,
  handleChange,
  path,
  config,
  label,
  description,
}: ControlProps) => {
  const appliedUiSchemaOptions = { ...config, ...uischema.options };
  const TrueValue = appliedUiSchemaOptions?.textForTrue || 'Yes';
  const FalseValue = appliedUiSchemaOptions?.textForFalse || 'No';
  const EnableDescription = appliedUiSchemaOptions?.enableDescription === true;
  const TrueDescription = description || appliedUiSchemaOptions?.descriptionForTrue;
  const FalseDescription = description || appliedUiSchemaOptions?.descriptionForFalse;
  const BaseTestId = appliedUiSchemaOptions?.testId || `${path}-boolean-radio-jsonform`;

  return (
    <Hidden xsUp={!visible}>
      <GoARadioGroup
        name={`${label}`}
        value={data === true ? TrueValue : data === false ? FalseValue : null}
        disabled={!enabled}
        testId={BaseTestId}
        onChange={(_name, value) => {
          if (value === TrueValue) {
            handleChange(path, true);
          }

          if (value === FalseValue) {
            handleChange(path, false);
          }
        }}
      >
        <GoARadioItem
          value={TrueValue}
          testId={`${BaseTestId}-yes-option`}
          description={EnableDescription ? TrueDescription : null}
        />
        <GoARadioItem
          value={FalseValue}
          testId={`${BaseTestId}-no-option`}
          description={EnableDescription ? FalseDescription : null}
        />
      </GoARadioGroup>
    </Hidden>
  );
};
export const BooleanRadioControl = (props: ControlProps) => (
  <GoAInputBaseControl {...{ ...props }} input={BooleanRadioComponent} />
);

export const GoABooleanRadioControlTester: RankedTester = rankWith(3, and(isBooleanControl, optionIs('radio', true)));
export const GoABooleanRadioControl = withJsonFormsControlProps(BooleanRadioControl);
