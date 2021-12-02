import { combineReducers } from 'redux';
import Access from './access/reducers';
import Config from './config/reducers';
import Session from './session/reducers';
import Notifications from './notifications/reducers';
import Subscription from './subscription/reducers';
import Tenant from './tenant/reducers';

export const rootReducer = combineReducers({
  session: Session,
  config: Config,
  access: Access,
  tenant: Tenant,
  subscription: Subscription,
  notifications: Notifications,
});
