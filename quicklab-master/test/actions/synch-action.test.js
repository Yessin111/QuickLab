import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as actions from '../../src/actions/actions';
import * as types from '../../src/actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const data = {
  id: 'thisId',
  data: 'data',
  type: 'group',
};
let store;

describe('actions', () => {
  beforeEach(() => {
    store = mockStore({});
  });

  it('creates GROUP_DATA when storing group data', () => {
    const expectedActions = [
      {
        type: types.GROUP_DATA,
        payload: data,
      },
    ];

    store.dispatch(actions.storeGroups(data));

    expect(store.getActions()).toEqual(expectedActions);
  });

  it('creates DELETE when deleting groups', () => {
    const expectedActions = [
      {
        type: 'DELETE_MEMBER',
        payload: {
          parent: data.data,
          id: data.id,
          type: data.type,
        },
      },
    ];

    store.dispatch(actions.deleteGroupMember(data.data, data.id, data.type));

    expect(store.getActions()).toEqual(expectedActions);
  });

  it('creates ADD when adding group data groups', () => {
    const path = 'path/to/object';
    const expectedActions = [
      {
        type: 'ADD',
        payload: {
          path,
          data,
        },
      },
    ];

    store.dispatch(actions.addGroupData(path, data));

    expect(store.getActions()).toEqual(expectedActions);
  });

  it('creates EDIT_DEFAULT_REPO when editing repo settings', () => {
    const expectedActions = [
      {
        type: types.EDIT_DEFAULT_REPO,
        payload: data,
      },
    ];

    store.dispatch(actions.editDefaultRepo(data));

    expect(store.getActions()).toEqual(expectedActions);
  });

  it('creates UPDATE_TAS when adding tas', () => {
    const tas = [];
    const headTas = [];
    const expectedActions = [
      {
        type: types.UPDATE_TAS,
        payload: {
          tas,
          headTas,
        },
      },
    ];

    store.dispatch(actions.addTAsToStore(tas, headTas));

    expect(store.getActions()).toEqual(expectedActions);
  });

  it('creates RENAME when deleting groups', () => {
    const expectedActions = [
      {
        type: types.RENAME,
        payload: {
          path: data.id,
          name: data.data,
        },
      },
    ];

    store.dispatch(actions.renameGroupData(data.id, data.data));

    expect(store.getActions()).toEqual(expectedActions);
  });
});
