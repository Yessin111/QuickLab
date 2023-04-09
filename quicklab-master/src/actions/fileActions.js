import * as types from './actionTypes';

/**
  * Function that creates a dispatch to update the store with file
  * information. The parameter object contains the fields: keys, data,
  * selectedKeys, possible.
  *
  * @param file {Object}
  * @return {Dispatch}
  */
export function newFile(file) {
  return (dispatch) => {
    dispatch({
      type: types.UPDATE_FILE,
      payload: file,
    });
  };
}

/**
  * Function that creates a dispatch to reset the file information in the store.
  *
  * @return {Dispatch}
  */
export function resetFile() {
  return (dispatch) => {
    dispatch({
      type: types.RESET_FILE,
    });
  };
}
