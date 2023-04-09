import * as types from '../actions/actionTypes';

const initialState = {
  keys: [],
  data: [],
  selectedKeys: [],
  possible: false,
};

/**
 * Function to reduce all data received from the actions.
 *
 * @param {object} state
 * @param {object} action
 */
export default function reducer(state = initialState, action) {
  switch (action.type) {
    case types.UPDATE_FILE: {
      return {
        ...action.payload,
      };
    }
    case types.RESET_FILE: {
      return initialState;
    }
    default: {
      return state;
    }
  }
}
