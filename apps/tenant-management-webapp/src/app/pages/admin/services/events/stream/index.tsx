import React, { useEffect } from 'react';
import { RootState } from '@store/index';
import { fetchCoreStreams, fetchTenantStreams } from '@store/stream/actions';
import { useDispatch, useSelector } from 'react-redux';
import { StreamTable } from './streamTable';
import { CORE_TENANT } from '@store/tenant/models';
import { NameDiv } from './styleComponents';
import { PageIndicator } from '@components/Indicator';

export const EventStreams = (): JSX.Element => {
  const dispatch = useDispatch();

  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const tenantStreams = useSelector((state: RootState) => state.stream?.tenant);
  const coreStreams = useSelector((state: RootState) => state.stream?.core);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    dispatch(fetchCoreStreams());
    dispatch(fetchTenantStreams());
  }, []);

  return (
    <>
      <PageIndicator />
      {!indicator.show && (
        <>
          <div>
            <StreamTable streams={tenantStreams} namespace={tenantName} isCore={false} />
          </div>
          <div>
            <NameDiv>Core streams</NameDiv>
            <StreamTable streams={coreStreams} namespace={CORE_TENANT} isCore={true} />
          </div>
        </>
      )}
    </>
  );
};
