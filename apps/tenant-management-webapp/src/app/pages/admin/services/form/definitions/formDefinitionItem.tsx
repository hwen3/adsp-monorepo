import React, { useState } from 'react';
import { FormDefinition } from '@store/form/model';
import { OverflowWrap, EntryDetail } from '../styled-components';

import { useRouteMatch } from 'react-router';
import { GoABadge } from '@abgov/react-components-new';
import { useHistory } from 'react-router-dom';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface PdfTemplateItemProps {
  formDefinition: FormDefinition;
  onDelete?: (FormDefinition) => void;
}

export const FormDefinitionItem = ({ formDefinition, onDelete }: PdfTemplateItemProps): JSX.Element => {
  const { url } = useRouteMatch();
  const [showSchema, setShowSchema] = useState(false);
  const formDescription =
    formDefinition.description?.length > 80
      ? formDefinition.description?.substring(0, 80) + '...'
      : formDefinition.description;
  const history = useHistory();
  return (
    <>
      <tr>
        <td data-testid="form-definitions-name">{formDefinition.name}</td>
        <td data-testid="form-definitions-template-id">{formDefinition.id}</td>
        <td data-testid="form-definitions-description">
          <OverflowWrap>{formDescription}</OverflowWrap>
        </td>
        <td data-testid="form-definitions-applicant">
          <OverflowWrap>
            {formDefinition.applicantRoles?.map((role): JSX.Element => {
              return (
                <div key={`applicant-roles-${role}`}>
                  <GoABadge key={`applicant-roles-${role}`} type="information" content={role} />
                </div>
              );
            })}
          </OverflowWrap>
        </td>
        <td data-testid="form-definitions-clerk">
          <OverflowWrap>
            {formDefinition.clerkRoles?.map((role): JSX.Element => {
              return (
                <div key={`applicant-roles-${role}`}>
                  <GoABadge key={`applicant-roles-${role}`} type="information" content={role} />
                </div>
              );
            })}
          </OverflowWrap>
        </td>
        <td data-testid="form-definitions-assessor">
          <OverflowWrap>
            {formDefinition.assessorRoles?.map((role): JSX.Element => {
              return (
                <div key={`applicant-roles-${role}`}>
                  <GoABadge key={`applicant-roles-${role}`} type="information" content={role} />
                </div>
              );
            })}
          </OverflowWrap>
        </td>
        <td data-testid="form-definitions-action">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showSchema ? 'eye-off' : 'eye'}
              onClick={() => setShowSchema(!showSchema)}
              testId="configuration-toggle-details-visibility"
            />
            <GoAContextMenuIcon
              testId="form-definition-edit"
              title="Edit"
              type="create"
              onClick={() => history.push(`${url}/edit/${formDefinition.id}`)}
            />
            <GoAContextMenuIcon
              testId={`form-definition-delete`}
              title="Delete"
              type="trash"
              onClick={() => onDelete(formDefinition)}
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showSchema && (
        <tr>
          <td
            colSpan={7}
            style={{
              padding: '0px',
            }}
          >
            <EntryDetail data-testid="configuration-details">
              {JSON.stringify(formDefinition.dataSchema, null, 2)}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};
