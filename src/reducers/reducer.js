import { combineReducers } from 'redux';

import users from './user/userReducer';
import server from './serverReducer';
import groups from './user/groupReducer';
import file from './fileReducer';
import page from './pageReducer';

/**
 * Combines different reducers into the store.
 */
export default combineReducers({
  users,
  server,
  groups,
  file,
  page,
});
