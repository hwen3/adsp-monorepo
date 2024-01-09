import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Switch, useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  assignTask,
  busySelector,
  filterSelector,
  liveSelector,
  modalSelector,
  openTaskSelector,
  queueUserSelector,
  queueWorkersSelector,
  metricsSelector,
  tasksSelector,
  initializeQueue,
  setTaskPriority,
  taskActions,
  metricsLoadingSelector,
  openTask,
  loadQueueMetrics,
} from '../state';
import { TaskAssignmentModal } from '../components/TaskAssignmentModal';
import { TaskPriorityModal } from '../components/TaskPriorityModal';
import { TaskHeader } from '../components/TaskHeader';
import { TaskList } from '../components/TaskList';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { TaskDetailsHost } from './details/TaskDetailsHost';

interface TaskQueueComponentProps {
  className?: string;
}

const TaskQueueComponent: FunctionComponent<TaskQueueComponentProps> = ({ className }) => {
  const user = useSelector(queueUserSelector);
  const live = useSelector(liveSelector);
  const metrics = useSelector(metricsSelector);
  const metricsLoading = useSelector(metricsLoadingSelector);
  const filter = useSelector(filterSelector);
  const busy = useSelector(busySelector);
  const modal = useSelector(modalSelector);
  const tasks = useSelector(tasksSelector);
  const open = useSelector(openTaskSelector);
  const workers = useSelector(queueWorkersSelector);

  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ tenantName: string; namespace: string; name: string }>();

  useEffect(() => {
    dispatch(initializeQueue({ namespace: params.namespace, name: params.name }));
    dispatch(loadQueueMetrics({ namespace: params.namespace, name: params.name }));
    dispatch(openTask({ namespace: params.namespace, name: params.name }));
  }, [dispatch, params]);

  const history = useHistory();

  return (
    <div className={className}>
      <LoadingIndicator isLoading={busy.initializing || busy.loading} />
      <TaskHeader
        open={open}
        isLive={live}
        onClickTasks={() => history.push(`/${params.tenantName}/${params.namespace}/${params.name}`)}
      />
      <Switch>
        <Route exact path={`/:tenantName/:namespace/:name/:taskId`}>
          <TaskDetailsHost />
        </Route>
        <Route path={`/${params.tenantName}/${params.namespace}/${params.name}`}>
          <TaskList
            metrics={metrics}
            metricsLoading={metricsLoading[`${params.namespace}:${params.name}`]}
            filter={filter}
            tasks={tasks}
            open={open}
            selected={null}
            user={user}
            onSetFilter={(filter) => dispatch(taskActions.setFilter(filter))}
            onSelect={() => {
              // not used
            }}
            onAssign={(task) => dispatch(taskActions.setTaskToAssign(task))}
            onSetPriority={(task) => dispatch(taskActions.setTaskToPrioritize(task))}
            onOpen={(task) => history.push(`/${params.tenantName}/${params.namespace}/${params.name}/${task.id}`)}
          />
        </Route>
      </Switch>
      <TaskAssignmentModal
        user={user}
        task={modal.taskToAssign}
        workers={workers}
        open={!!modal.taskToAssign}
        executing={busy.executing}
        onAssign={(assignTo) => dispatch(assignTask({ taskId: modal.taskToAssign.id, assignTo }))}
        onClose={() => dispatch(taskActions.setTaskToAssign(null))}
      />
      <TaskPriorityModal
        task={modal.taskToPrioritize}
        open={!!modal.taskToPrioritize}
        executing={busy.executing}
        onSetPriority={(priority) =>
          dispatch(
            setTaskPriority({
              taskId: modal.taskToPrioritize.id,
              priority,
            })
          )
        }
        onClose={() => dispatch(taskActions.setTaskToPrioritize(null))}
      />
    </div>
  );
};

const TaskQueue = styled(TaskQueueComponent)`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

export default TaskQueue;
