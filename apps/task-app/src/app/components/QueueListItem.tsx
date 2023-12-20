import { GoAContainer, GoAIconButton } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { QueueDefinition, QueueMetrics as QueueMetricsValue } from '../state';
import { QueueMetrics } from './QueueMetrics';

interface QueueListItemProps {
  className?: string;
  queue: QueueDefinition;
  metrics?: QueueMetricsValue;
  metricsLoading: Record<string, boolean>;
}

const QueueListItemComponent: FunctionComponent<QueueListItemProps> = ({
  className,
  queue,
  metrics,
  metricsLoading,
}) => {
  const history = useHistory();
  return (
    <GoAContainer type="interactive" accent="thin">
      <div className={className}>
        <div>
          <h3>
            <span>{queue.namespace}</span>
            <span>:</span>
            <span>{queue.name}</span>
          </h3>
          <div>
            <GoAIconButton
              icon="open"
              size="large"
              onClick={() => history.push(`${history.location.pathname}/${queue.namespace}/${queue.name}`)}
            />
          </div>
        </div>
        <QueueMetrics metrics={metrics} isLoading={metricsLoading[`${queue.namespace}:${queue.name}`]} />
        <div></div>
      </div>
    </GoAContainer>
  );
};

export const QueueListItem = styled(QueueListItemComponent)`
  > div:first-child {
    display: flex;
    *:last-child {
      margin-left: auto;
    }
  }
`;