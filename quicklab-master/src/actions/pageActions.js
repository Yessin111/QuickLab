export const types = {
  SET_PAGE: 'SET_PAGE',
};

/**
 * This functions allows the breadcrumbs to work. It is able to set the current page,
 * which other functions can use to keep track of the progress of the user.
 * The buttons on the topside of the admin page use this functionality to
 * enable/disable buttons when the user has passed certain stages of the application.
 *
 * @param newPage
 * @returns {Function}
 */
export function setPage(newPage) {
  sessionStorage.setItem('page', newPage);
  return (dispatch) => {
    dispatch({
      type: types.SET_PAGE,
      payload: newPage,
    });
  };
}
