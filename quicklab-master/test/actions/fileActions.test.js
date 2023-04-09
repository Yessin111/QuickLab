import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as actions from '../../src/actions/fileActions';
import * as types from '../../src/actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const file = 'file';
let store;

describe('actions', () => {
  beforeEach(() => {
    store = mockStore({});
  });

  it('creates UPDATE_FILE when adding a new file', () => {
    const expectedActions = [
      {
        type: types.UPDATE_FILE,
        payload: file,
      },
    ];

    store.dispatch(actions.newFile(file));

    expect(store.getActions()).toEqual(expectedActions);
  });

  it('creates UPDATE_FILE when adding a new file', () => {
    const expectedActions = [
      {
        type: types.RESET_FILE,
      },
    ];

    store.dispatch(actions.resetFile());

    expect(store.getActions()).toEqual(expectedActions);
  });
});
