import { types } from '../../actions/userActions';

const initialState = {
  currentUser: '',
  validApiKey: false,
  error: false,
};

/**
 * Function to reduce all data received from the actions.
 *
 * @param {object} state
 * @param {object} action
 */
export default function reducer(state = initialState, action) {
  switch (action.type) {
    case types.UPDATE_USER: {
      return {
        ...state,
        currentUser: action.payload,
      };
    }
    case types.API_KEY: {
      return {
        ...state,
        validApiKey: action.payload,
        error: !action.payload,
      };
    }
    case types.HANDLED_ERROR: {
      return {
        ...state,
        error: false,
      };
    }
    case types.SET_API_KEY: {
      return {
        ...state,
        validApiKey: action.payload,
      };
    }
    default: {
      return state;
    }
  }
}
