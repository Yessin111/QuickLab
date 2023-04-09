import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

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
function AdminCrumbs(props) {
  const { page } = props;
  const color = (
    <style type="text/css">
      {`
    .btn-flat {
      background-color: #38ACFF;
      color: white;
    }
    `}
    </style>
  );

  return (
    <div>
      { color }
      <ButtonGroup aria-label="Breadcrumbs" className="mt-5">
        <LinkContainer to="/tool" activeClassName="" disabled={page < 1}>
          <Button variant="flat">
            <span>1. Home</span>
          </Button>
        </LinkContainer>
        <LinkContainer to="/tool/course-setup" activeClassName="" disabled={page < 2}>
          <Button variant="flat">
            <span>2. Course Setup</span>
          </Button>
        </LinkContainer>
        <LinkContainer to="/tool/import-csv" activeClassName="" disabled={page < 3}>
          <Button variant="flat">
            <span>3. Import CSV</span>
          </Button>
        </LinkContainer>
        <LinkContainer to="/tool/ta-form" activeClassName="" disabled={page < 4}>
          <Button variant="flat">
            <span>4. Add TAs</span>
          </Button>
        </LinkContainer>
        <LinkContainer to="/tool/course-data" activeClassName="" disabled={page < 5}>
          <Button variant="flat">
            <span>5. Groups</span>
          </Button>
        </LinkContainer>
        <LinkContainer to="/tool/project-settings" activeClassName="" disabled={page < 6}>
          <Button variant="flat">
            <span>6. Project Settings</span>
          </Button>
        </LinkContainer>
        <LinkContainer to="/tool/course-submit" activeClassName="" disabled={page < 7}>
          <Button variant="flat">
            <span>7. Course Submit</span>
          </Button>
        </LinkContainer>
      </ButtonGroup>
    </div>
  );
}

export default connect(mapStateToProps, null)(AdminCrumbs);

AdminCrumbs.propTypes = {
  page: PropTypes.number.isRequired,
};
