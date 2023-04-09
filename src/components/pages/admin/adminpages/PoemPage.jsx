import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as pageActions from '../../../../actions/pageActions';

/**
 * Selects which variables from the state have to be used as props in the
 * component.
 *
 * @param state {Object}
 * @return {Object}
 */
function mapStateToProps(state) {
  return {
    page: state.page,
  };
}

/**
 * The Admin Crumbs show the breadcrumbs on the top of the admin page.
 * They allow for a fluid workflow through the process of creating a course.
 */
function PoemPage(props) {
  const { setPage } = props;

  return (
    <div className="row">
      <div className="col-lg-8 text-center">
        <h1 className="mb-5">Error</h1>
        <div className="row">
          <div className="col-lg-2" />
          <div className="col-lg-8 text-center">
            <h2 className="font-weight-light font-italic">
              <span className="my-1">“Well it looks like some things went kaboom</span>
              <br />
              <span className="my-1">Was not your fault is what we assume</span>
              <br />
              <span className="my-1">But the admins are smart</span>
              <br />
              <span className="my-1">Also programmed this part</span>
              <br />
              <span className="my-1">Click below, skip this error of doom”</span>
              <br />
            </h2>
            <div className="mt-5">
              {/* eslint-disable-next-line max-len */}
              <h4>It looks like you are currently at a page that should not be unlocked yet. Click the button below to go back to Home.</h4>
              <LinkContainer to="/tool" className="my-3" activeClassName="">
                <Button variant="flat" onClick={() => setPage(1)}>
                  <span>Go to 1. Home</span>
                </Button>
              </LinkContainer>
            </div>
          </div>
          <div className="col-lg-2" />
        </div>
        <div className="col-lg-4 text-left" />
      </div>
    </div>
  );
}

export default connect(mapStateToProps, pageActions)(PoemPage);

PoemPage.propTypes = {
  setPage: PropTypes.func.isRequired,
};
