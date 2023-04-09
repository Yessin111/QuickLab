import axios from 'axios';
import { server } from '../config';

export const types = {
  UPDATE_USER: 'UPDATE_USER',
  API_KEY: 'API_KEY',
  HANDLED_ERROR: 'HANDLED_ERROR',
  SET_API_KEY: 'SET_API_KEY',
};

/**
 * Username to pass to store in the store. Can be used to send to the server
 * for basic authentication.
 *
 * Note: This is not real or safe authentication, this is just for sending a username
 * with calls to the server.
 *
 * @param username {String}
 */
export function updateUser(username) {
  return (dispatch) => {
    dispatch({
      type: types.UPDATE_USER,
      payload: username,
    });
  };
}

/**
 * Loads the current users from the store and sends it to the server to verify
 * if the current user has a valid API key. On result it sets the validApiKey variable
 * to true or false and displays information accordingly.
 *
 * @return {Dispatch}
 */
export function verifyApiKey() {
  return (dispatch, getState) => {
    const { currentUser } = getState().users;

    return axios.get(`${server}/verifyApiKey`, {
      params: {
        user: currentUser,
      },
    }).then((response) => {
      dispatch({
        type: types.API_KEY,
        payload: response.data,
      });
    })
      .catch((err) => {
        dispatch({
          type: 'SERVER_ERROR',
          payload: err,
        });
        dispatch({
          type: types.API_KEY,
          payload: false,
        });
      });
  };
}

export function setApiValidation(valid) {
  return (dispatch) => {
    dispatch({
      type: types.SET_API_KEY,
      payload: valid,
    });
  };
}

export function handledApiKeyError() {
  return (dispatch) => {
    dispatch({ type: types.HANDLED_ERROR });
  };
}
