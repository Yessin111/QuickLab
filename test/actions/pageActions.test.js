import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as actions from '../../src/actions/pageActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const page = 'page';
let store;

describe('actions', () => {
  beforeEach(() => {
    store = mockStore({});
  });

  it('creates SET_PAGE when setting a page', () => {
    const expectedActions = [
      {
        type: actions.types.SET_PAGE,
        payload: page,
      },
    ];

    store.dispatch(actions.setPage(page));

    expect(store.getActions()).toEqual(expectedActions);
  });
});
