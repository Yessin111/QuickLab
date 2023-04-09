import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * Component that handles the navigation of our web-app.
 */
class NavigationBar extends Component {
  /**
   * Determines whether a page is active.
   *
   * @param {string} pageName
   */
  static isCurrentPage(pageName) {
    return window.location.pathname.match(`^${pageName}`) ? 'active' : '';
  }

  // Allow the nav items to be shown when the navbar is collapsed
  constructor(props) {
    super(props);
    this.toggleCollapse = this.toggleCollapse.bind(this);
    this.state = {
      collapsed: true,
    };
  }

  /**
   * Flips the collapsion state of the navbar.
   */
  toggleCollapse() {
    const { state } = this;
    const status = !state.collapsed;
    this.setState({ collapsed: status });
  }

  render() {
    const { collapsed } = this.state;
    const navClass = collapsed ? 'collapse' : '';
    const location = window.location.pathname;
    const homeClass = location === '/' ? 'active' : '';
    const { logout, login, authenticated } = this.props;

    // Make the loginbutton dynamic (e.g. make it able to change between login and logout)
    const loginButton = authenticated
      ? (
        <Link
          to="/"
          className="nav-link"
          onClick={() => {
            logout('/');
            this.toggleCollapse();
          }}
        >
          <i className="fas fa-sign-out-alt fa-lg" />
          <span> Logout</span>
        </Link>
      )
      : (
        <Link
          to={location}
          className="nav-link"
          onClick={() => {
            login(location);
            this.toggleCollapse();
          }}
        >
          <i className="fas fa-sign-in-alt fa-lg" />
          <span> Login</span>
        </Link>
      );

    // Make admin hideable when user is not logged in
    const adminHide = authenticated
      ? (
        <li className={`nav-item ${NavigationBar.isCurrentPage('/tool')}`}>
          <Link className="nav-link" to="/tool" onClick={this.toggleCollapse}>
            <i className="fas fa-tools fa-lg" />
            <span> Tool</span>
          </Link>
        </li>
      ) : (<div />);

    const navbar = { backgroundColor: '#38ACFF' };

    return (
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top" style={navbar} role="navigation">
        <div className="container">

          {/*
                Allow the navbar to collapse into a toggler that shows the options
                */}
          <Link className="navbar-brand" to="/">
            <img src="/logo.png" className="img-fluid float-left" alt="" style={{ height: '30px' }} />
            <span className="ml-3">QuickLab</span>
          </Link>
          <button type="button" className="navbar-toggler" onClick={this.toggleCollapse}>
            <span className="navbar-toggler-icon" />
            <span className="icon-bar" />
            <span className="icon-bar" />
            <span className="icon-bar" />
          </button>

          <div className={`navbar-collapse ${navClass}`}>
            <ul className="navbar-nav ml-auto">

              {/*
                Give the option to go to the "Home"-page
                */}
              <li className={`nav-item ${homeClass}`}>
                <Link className="nav-link" to="/" onClick={this.toggleCollapse}>
                  <i className="fas fa-home fa-lg" />
                  <span> Home</span>
                </Link>
              </li>

              {/*
                Give the option to go to the "Admin"-page
                */}
              {adminHide}

              {/*
                Give the option to go to the "Contact"-page
                */}
              <li className={`nav-item ${NavigationBar.isCurrentPage('/contact')}`}>
                <Link className="nav-link" to="/contact" onClick={this.toggleCollapse}>
                  <i className="fas fa-envelope fa-lg" />
                  <span> Contact</span>
                </Link>
              </li>

            </ul>
            <ul className="nav navbar-nav navbar-right">

              {/*
                Show the login-/logout-button
                */}
              <li className={`nav-item ${NavigationBar.isCurrentPage('/login')}`}>
                {loginButton}
              </li>

            </ul>
          </div>
        </div>
      </nav>
    );
  }
}

export default NavigationBar;

NavigationBar.propTypes = {
  login: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  authenticated: PropTypes.bool.isRequired,
};
