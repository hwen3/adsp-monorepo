import { GoADropdown, GoADropdownOption } from '@abgov/react-components-new';
import { GoAForm, GoAFormItem, GoAFormActions, GoAFlexRow, GoAButton } from '@abgov/react-components/experimental';
import { RootState } from '@store/index';
import { setIntervalCriteria, setServiceCriteria } from '@store/metrics/actions';
import { ChartInterval } from '@store/metrics/models';
import React, { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface MetricsSearchFormProps {
  onSearch: () => void;
  onReset: () => void;
}
export const MetricsSearchForm: FunctionComponent<MetricsSearchFormProps> = ({ onSearch, onReset }) => {
  const services = useSelector((state: RootState) => state.serviceMetrics.services);
  const { service, chartInterval } = useSelector((state: RootState) => state.serviceMetrics.criteria);
  const dispatch = useDispatch();
  return (
    <GoAForm>
      <GoAFlexRow gap="small">
        <GoAFormItem>
          <label>Service</label>
          <GoADropdown
            name="Service"
            value={[service]}
            width="100%"
            onChange={(_n, [value]) => dispatch(setServiceCriteria(value))}
          >
            {services
              .sort((a, b) => a.localeCompare(b))
              .map((service) => (
                <GoADropdownOption key={service} value={service} label={service} />
              ))}
          </GoADropdown>
        </GoAFormItem>
        <GoAFormItem>
          <label>Time period</label>
          <GoADropdown
            name="Time period"
            value={[chartInterval]}
            onChange={(_n, [value]) => dispatch(setIntervalCriteria(value as ChartInterval))}
            width="100%"
          >
            <GoADropdownOption value="15 mins" label="Last 15 minutes" />
            <GoADropdownOption value="1 hour" label="Last hour" />
            <GoADropdownOption value="5 hours" label="Last 5 hours" />
          </GoADropdown>
        </GoAFormItem>
      </GoAFlexRow>
      <GoAFormActions alignment="right">
        <GoAButton type="secondary" title="Reset" onClick={onReset}>
          Reset
        </GoAButton>
        <GoAButton disabled={!chartInterval || !service} title="Search" onClick={onSearch}>
          Search
        </GoAButton>
      </GoAFormActions>
    </GoAForm>
  );
};
