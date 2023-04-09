import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { connect } from 'react-redux';
import { withAuth } from '@okta/okta-react';
import { bindActionCreators } from 'redux';
import * as userActions from '../../actions/userActions';
import * as actions from '../../actions/actions';
import * as pageActions from '../../actions/pageActions';

import NavigationBar from './navbar/NavigationBar';

/**
 * Selects which variables from the state have to be used as props in the
 * component.
 *
 * @param state {Object}
 * @return {Object}
 */
function mapStateToProps(state) {
  return {
    groups: state.groups,
  };
}

/**
 * Maps combines multiple action files and maps it to the props of the class.
 *
 * @param dispatch {Dispatch}
 */
function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    ...userActions,
    ...actions,
    ...pageActions,
  }, dispatch);
}


/**
 * The variables accessed when importing this class. It calls the withAuth
 * variable from okta for authentication.
 */
class Layout extends React.Component {
  // Current authenticated state
  constructor(props) {
    super(props);
    this.state = {
      authenticated: false,
    };
  }

  componentDidMount() {
    const {
      groups, storeGroups, setPage,
    } = this.props;

    this.checkAuthentication();

    if (sessionStorage.getItem('accessToken')) {
      axios.defaults.headers.common.Authentication = sessionStorage.getItem('accessToken');
    }

    if (!groups || !groups.groups) {
      if (sessionStorage.getItem('course')) {
        storeGroups(JSON.parse(sessionStorage.getItem('course')));
      }
    }

    if (sessionStorage.getItem('page')) {
      setPage(JSON.parse(sessionStorage.getItem('page')));
    }
  }

  componentDidUpdate() {
    this.checkAuthentication();
  }

  /**
   * Checks whether the user is authenticated via Okta.
   */
  async checkAuthentication() {
    const { props, state } = this;
    const authenticated = await props.auth.isAuthenticated();

    if (authenticated) {
      const accessToken = await props.auth.getAccessToken();
      sessionStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common.Authentication = accessToken;

      const user = await props.auth.getUser();
      if (user) props.updateUser(user.preferred_username);
    } else {
      sessionStorage.clear();
    }

    if (authenticated !== state.authenticated) {
      this.setState({ authenticated });
    }
  }

  /**
   * Returns the REACT component for rendering.
   */
  render() {
    const { props, state } = this;
    const { authenticated } = state;
    const { auth } = props;
    const { login, logout } = auth;
    const param = { login, logout, authenticated };

    return (
      <div>
        <NavigationBar {...param} />
        {props.children}
      </div>
    );
  }
}

export default withAuth(connect(mapStateToProps, mapDispatchToProps)(Layout));

Layout.propTypes = {
  auth: PropTypes.shape({
    login: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.func.isRequired,
    getUser: PropTypes.func.isRequired,
  }).isRequired,
  updateUser: PropTypes.func.isRequired,
  storeGroups: PropTypes.func.isRequired,
  setPage: PropTypes.func.isRequired,
  groups: PropTypes.shape({}).isRequired,
};
