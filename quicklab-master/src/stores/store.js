import { applyMiddleware, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';

import config from '../config';
import reducers from '../reducers/reducer';

const logger = createLogger({
  predicate: () => config.debug,
});

const middleware = applyMiddleware(thunk, logger);

const store = createStore(
  reducers,
  undefined,
  middleware,
);

export default store;
