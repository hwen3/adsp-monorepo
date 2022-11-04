import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { Revision } from '@store/configuration/model';
import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { PageIndicator } from '@components/Indicator';
import { GoAButton, GoABadge } from '@abgov/react-components-new';
import { getConfigurationRevisions, getConfigurationActive } from '@store/configuration/action';
interface VisibleProps {
  visible: boolean;
}

const Visible = styled.div<VisibleProps>`
  visibility: ${(props) => `${props.visible ? 'visible' : 'hide'}`};
`;

interface RevisionComponentProps {
  revision: Revision;
  isLatest?: boolean;
  isActive?: boolean;
}

const RevisionComponent: FunctionComponent<RevisionComponentProps> = ({
  revision,
  isLatest,
  isActive,
}: RevisionComponentProps) => {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <>
      <tr>
        <td headers="revision">
          {revision.revision}
          {isLatest && <GoABadge type="information" content="latest" />}
          {isActive && <GoABadge type="information" content="active" />}
        </td>
        <td headers="date">{revision.lastUpdated}</td>
        <td headers="action">
          <GoAContextMenu>
            <GoAContextMenuIcon
              title="Toggle details"
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={() => setShowDetails(!showDetails)}
              testId="toggle-details-visibility"
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td headers="Revision details" colSpan={3} className="revision-details">
            <div>{JSON.stringify(revision.configuration, null, 2)}</div>
          </td>
        </tr>
      )}
    </>
  );
};

interface RevisionTableComponentProps {
  className?: string;
  service: string;
}

const RevisionTableComponent: FunctionComponent<RevisionTableComponentProps> = ({ className, service }) => {
  const configurationRevisions = useSelector((state: RootState) => state.configuration.configurationRevisions);
  const revisions = configurationRevisions[service]?.revisions?.result;

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const next = configurationRevisions[service]?.revisions?.next;

  const dispatch = useDispatch();
  const onNext = () => {
    dispatch(getConfigurationRevisions(service, next));
  };
  // eslint-disable-next-line
  useEffect(() => {
    dispatch(getConfigurationActive(service));
  }, [indicator, revisions]);
  const latest = configurationRevisions[service]?.revisions?.latest;
  const active = configurationRevisions[service]?.revisions?.active;
  return (
    <>
      <Visible visible={!indicator.show && revisions !== null && revisions && revisions?.length > 0}>
        <div className={className}>
          <DataTable>
            <colgroup>
              <col className="data-col" />
              <col className="data-col" />
              <col className="action-col" />
            </colgroup>
            <thead>
              <tr>
                <th id="revision number">Revision number</th>
                <th id="revision date">Revision date</th>
                <th id="action">Action</th>
              </tr>
            </thead>
            <tbody>
              {revisions !== null &&
                revisions &&
                revisions.map((revision) => (
                  <RevisionComponent
                    key={`${revision.created}-${service}`}
                    revision={revision}
                    isLatest={revision.revision === latest}
                    isActive={revision.revision === active}
                  />
                ))}
            </tbody>
          </DataTable>
        </div>
      </Visible>
      {indicator.show && <PageIndicator />}
      {next && (
        <GoAButton disabled={next === ''} onClick={onNext}>
          Load more...
        </GoAButton>
      )}
    </>
  );
};

export const RevisionTable = styled(RevisionTableComponent)`
  padding-top: 1rem;
  & table {
    table-layout: fixed;
  }
  & .correlation-col {
    width: 5%;
  }
  & .data-col {
    width: 28%;
  }
  & .action-col {
    width: 10%;
  }
  & .revision-details {
    div {
      background: #f3f3f3;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      line-height: 16px;
      padding: 16px;
      overflow-wrap: break-word;
    }
    padding: 0;
  }
  & span {
    margin-right: 8px;
  }
`;
