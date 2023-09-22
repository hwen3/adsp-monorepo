import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { FetchFileTypeService } from '@store/file/actions';
import { FetchRealmRoles } from '@store/tenant/actions';
import { RootState } from '@store/index';
import { FileTypeTable } from './fileTypesTable';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { AddFileType } from './fileTypeNew';
import styled from 'styled-components';
import { createSelector } from 'reselect';
import { fetchServiceRoles, fetchKeycloakServiceRoles } from '@store/access/actions';
import { Role } from '@store/tenant/models';
import { BodyGlobalStyles } from '../styled-components';

const NoContentContainer = styled.div`
  margin-bottom: 2em;
`;

interface AddFileTypeProps {
  activeEdit: boolean;
  openAddFileType: boolean;
}

export const FileTypes = ({ activeEdit }: AddFileTypeProps): JSX.Element => {
  const selectServiceCoreRoles = createSelector(
    (state: RootState) => state.serviceRoles,
    (serviceRoles) => {
      return serviceRoles?.core || {};
    }
  );

  const dispatch = useDispatch();
  const roles = useSelector((state: RootState) => state.tenant.realmRoles);

  useEffect(() => {
    dispatch(FetchRealmRoles());
  }, []);

  const coreRoles = useSelector(selectServiceCoreRoles);
  useEffect(() => {
    dispatch(fetchServiceRoles());
  }, []);

  useEffect(() => {
    // Fetch keycloak service roles after the roles from configuration service are fetched
    if (Object.entries(coreRoles).length) {
      dispatch(fetchKeycloakServiceRoles());
    }
  }, [coreRoles]);

  return (
    <div>
      {roles && <AddFileType roles={roles} activeEdit={activeEdit} />}
      <FileTypesTableContainer roles={roles} />
    </div>
  );
};

interface FileTypesTableContainerProps {
  roles: Role[];
}

const FileTypesTableContainer = ({ roles }: FileTypesTableContainerProps): JSX.Element => {
  const dispatch = useDispatch();
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const coreFileTypes = useSelector((state: RootState) => state.fileService.coreFileTypes);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    dispatch(FetchFileTypeService());
  }, []);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  return (
    <>
      <BodyGlobalStyles hideOverflow={false} />
      {!indicator.show && fileTypes && fileTypes.length === 0 && (
        <NoContentContainer>{renderNoItem('file type')}</NoContentContainer>
      )}
      {indicator.show && <PageIndicator />}
      {!indicator.show && fileTypes && (
        <FileTypeTable
          roles={roles}
          fileTypes={fileTypes}
          coreFileTypes={coreFileTypes}
          data-testid="file-type-table"
        />
      )}
    </>
  );
};
