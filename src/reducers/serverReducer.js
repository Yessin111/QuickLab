import * as types from '../actions/actionTypes';
import { types as pageTypes } from '../actions/pageActions';
import { types as userTypes } from '../actions/userActions';


const initialState = {
  fetching: false,
  fetched: false,
  data: [],
  viewUrl: null,
  error: null,
};

/**
 * Function to reduce all data received from the actions.
 *
 * @param {object} state
 * @param {object} action
 */
export default function reducer(state = initialState, action) {
  switch (action.type) {
    case types.SERVER_CONNECTION_START: {
      return {
        ...state,
        fetching: true,
        viewUrl: null,
      };
    }
    case types.SERVER_ERROR: {
      return {
        ...state,
        fetching: false,
        error: action.payload,
      };
    }
    case types.SERVER_GET: {
      return {
        ...state,
        fetching: false,
        fetched: true,
        data: action.payload,
      };
    }
    case types.SERVER_SEND: {
      return {
        ...state,
        fetching: false,
        fetched: true,
        viewUrl: action.payload,
      };
    }
    case pageTypes.SET_PAGE: {
      return {
        ...state,
        fetched: false,
      };
    }
    case userTypes.UPDATE_USER: {
      return {
        ...state,
        fetched: false,
      };
    }
    default: {
      return state;
    }
  }
}
