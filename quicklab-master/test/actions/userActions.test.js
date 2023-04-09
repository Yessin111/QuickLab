import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as actions from '../../src/actions/userActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const username = 'username';
let store;

describe('actions', () => {
  beforeEach(() => {
    store = mockStore({});
  });

  it('creates UPDATE_USER when updating the user', () => {
    const expectedActions = [
      {
        type: actions.types.UPDATE_USER,
        payload: username,
      },
    ];

    store.dispatch(actions.updateUser(username));

    expect(store.getActions()).toEqual(expectedActions);
  });
});
