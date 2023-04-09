import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import axios from 'axios';

import * as actions from '../../src/actions/actions';
import * as types from '../../src/actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
jest.mock('axios');
jest.mock('../../src/config', () => ({
  verbose: false,
  server: 'http://localhost:4000',
  debug: true,
}), { virtual: true });
let store;

describe('actions', () => {
  beforeEach(() => {
    store = mockStore({});
  });

  afterEach(() => {
    axios.get.mockRestore();
    axios.post.mockRestore();
  });

  describe('postCourse', () => {
    it('does SERVER_CONNECTION_START and SERVER_SEND on succes.', () => {
      axios.post.mockImplementationOnce(() => Promise.resolve({}));

      const expectedActions = [
        {
          type: types.SERVER_CONNECTION_START,
        },
        {
          type: types.SERVER_SEND,
        },
      ];

      return store.dispatch(actions.postCourse({})).then(() => {
        expect(store.getActions()).toEqual(expectedActions);
        expect(axios.post).toHaveBeenCalledTimes(1);
      });
    });

    it('does SERVER_CONNECTION_START and SERVER_ERROR on error.', () => {
      axios.post.mockImplementationOnce(() => Promise.reject({ status: 404 }));

      const expectedActions = [
        {
          type: types.SERVER_CONNECTION_START,
        },
        {
          type: types.SERVER_ERROR,
          payload: { status: 404 },
        },
      ];

      return store.dispatch(actions.postCourse({})).then(() => {
        expect(store.getActions()).toEqual(expectedActions);
        expect(axios.post).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('logToServer', () => {
    it('does debug error on succes.', () => {
      axios.post.mockImplementationOnce(() => Promise.resolve({}));

      const expectedActions = [];

      const msg = new Error('This went wrong!');

      return actions.logToServer(msg).then(() => {
        expect(store.getActions()).toEqual(expectedActions);
        expect(axios.post).toHaveBeenCalledTimes(1);
      });
    });

    it('does debug info on succes.', () => {
      axios.post.mockImplementationOnce(() => Promise.resolve({}));

      const expectedActions = [];

      const msg = 'Just information';

      return actions.logToServer(msg).then(() => {
        expect(store.getActions()).toEqual(expectedActions);
        expect(axios.post).toHaveBeenCalledTimes(1);
      });
    });
  });
});
