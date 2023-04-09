import axios from 'axios';
import store from '../stores/store';
import * as types from './actionTypes';
import { server, debug } from '../config';
import * as projectTypes from '../components/structure/project/projectTypes';

/**
 * Function that logs all errors to the server. The input can be either an Error or
 * a string. The advantage of error is that the type of error is displayed in front
 * of the error string due to the toString() method. E.g. calling:
 *  logToServer(new TypeError('This is an error'));
 * Results in:
 * 'TypeError: This is an error'
 *
 * Passing a String as paramter will log it as info on the server.
 *
 * @param msg {Error | string},
 */
export function logToServer(msg) {
  const type = (msg instanceof Error) ? 'error' : 'info';
  if (debug) {
    switch (type) {
      case 'error': {
        console.error(msg);
        break;
      }
      case 'info': default: {
        console.info(msg);
      }
    }
  }
  return axios.post(`${server}/logToServer`, {
    type,
    msg: msg.toString(),
  });
}

/**
  * Exports the courses to the server.
  */
export function postCourse(data) {
  return (dispatch) => {
    dispatch({ type: 'SERVER_CONNECTION_START' });
    return axios.post('http://localhost:4000/postCourse', data)
      .then(() => {
        dispatch({
          type: 'SERVER_SEND',
        });
      })
      .catch((err) => {
        dispatch({
          type: 'SERVER_ERROR',
          payload: err,
        });
      });
  };
}

/**
 * Stores the data as the current list of groups in the store.
 */
export function storeGroups(data) {
  sessionStorage.setItem('course', JSON.stringify(data));
  return (dispatch) => {
    dispatch({
      type: types.GROUP_DATA,
      payload: data,
    });
  };
}

/**
 * Renames a group from the store with the given id.
 */
export function renameGroupData(path, name, type) {
  return (dispatch) => {
    dispatch({
      type: types.RENAME,
      payload: {
        path,
        name,
        type,
      },
    });
  };
}

/**
 * Adds a group from the store with the given id.
 */
export function addGroupData(path, data) {
  return (dispatch) => {
    dispatch({
      type: types.ADD,
      payload: {
        path,
        data,
      },
    });
  };
}

/**
 * Delete a group member from the store.
 */
export function deleteGroupMember(parent, id, type) {
  return (dispatch) => {
    dispatch({
      type: types.DELETE_MEMBER,
      payload: {
        parent,
        id,
        type,
      },
    });
  };
}

/**
 * This method sends the group object to the server. It will
 * send the file to the server in a multipart/form-data request.
 */
export function submitGroups() {
  return (dispatch) => {
    dispatch({ type: types.SERVER_CONNECTION_START });
    const formData = new FormData();
    const storeData = store.getState();
    const { defaultProjectSettings } = storeData.groups;
    if (defaultProjectSettings.type === projectTypes.IMPORT_FROM_FILE) {
      formData.append('file', defaultProjectSettings.file);
      defaultProjectSettings.file = defaultProjectSettings.file.name;
    }
    formData.append('project', JSON.stringify(defaultProjectSettings));
    formData.append('groups', JSON.stringify(storeData.groups));
    formData.append('user', storeData.users.currentUser);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    axios.post('http://localhost:4000/submit', formData, config)
      .then((sendPath) => {
        dispatch({
          type: types.SERVER_SEND,
          payload: sendPath.data,
        });
      })
      .catch((err) => {
        dispatch({
          type: types.SERVER_ERROR,
          payload: err,
        });
      });
  };
}

/**
 * Edits the defaultProject settings in the groups object.
 */
export function editDefaultRepo(data) {
  return (dispatch) => {
    dispatch({
      type: types.EDIT_DEFAULT_REPO,
      payload: data,
    });
  };
}

/**
  * Sends the current log to the server. Makes an axios request.
  * on .then() clear log and show updates. on .error display error.
  *
  * @return {dispatch}
  */
export function saveToServer() {
  return (dispatch) => {
    dispatch({ type: types.SERVER_CONNECTION_START });
    const { log, groups } = store.getState().groups;
    axios.post('http://localhost:4000/saveTransactions', {
      log,
      course: groups.id,
      edition: groups.children[0].id,
    })
      .then((response) => {
        alert('Database updated succesfully!');
        dispatch({
          type: types.RECEIVE_GROUPS,
          payload: response.data,
        });
        dispatch({
          type: types.SERVER_SEND,
        });
      })
      .catch((err) => {
        const { data } = err.response;
        alert(data.error);
        if (data.result) {
          dispatch({
            type: types.RECEIVE_GROUPS,
            payload: data.result,
          });
        }
        dispatch({
          type: types.SERVER_ERROR,
          payload: data.error,
        });
      });
  };
}

/**
 * Add TAs and Head TAs to store.
 *
 * @param tas
 * @param headTas
 *
 * @returns { dispatch }
 */
export function addTAsToStore(tas, headTas) {
  return (dispatch) => {
    dispatch({
      type: types.UPDATE_TAS,
      payload: {
        tas,
        headTas,
      },
    });
  };
}
