import React, { useEffect } from 'react';
import { OverviewLayout } from '@components/Overview';
import { GoAButton } from '@abgov/react-components-new';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getValueDefinitions } from '@store/value/actions';

export const ValueOverview = (): JSX.Element => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getValueDefinitions());
  }, [dispatch]);

  return (
    <OverviewLayout
      description={
        <section>
          <p>
            The value service provides an append-only data store for time-series data, and supports storing json
            documents as values. Configure optional value definitions to specify the json schema for value writes.
          </p>
        </section>
      }
    />
  );
};
