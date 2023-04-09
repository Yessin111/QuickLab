import { types } from '../actions/pageActions';

const initialState = 1;

/**
 * Function to reduce all data received from the actions.
 *
 * @param {object} state
 * @param {object} action
 */
export default function reducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_PAGE: {
      return action.payload;
    }
    default: {
      return state;
    }
  }
}
