import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';
import AdminCrumbs from './AdminCrumbs';

/**
 * Selects which variables from the state have to be used as props in the
 * component.
 *
 * @param state {Object}
 * @return {Object}
 */
function mapStateToProps(state) {
  const { groups } = state.groups;

  if (!groups) {
    return {
      groups,
      name: '-',
      course: '-',
      edition: '-',
      normalTas: [],
      headTas: [],
    };
  }

  // Safety mechanism for if we allow TAS to be added to a course.
  const [edition] = groups.children.filter(el => el.type === 'group');

  return {
    groups,
    name: groups.name,
    course: groups.id,
    edition: edition.id,
    normalTas: state.groups.tas,
    headTas: state.groups.headTas,
  };
}

function getCourseNumbers(group) {
  switch (group.type) {
    case 'group': {
      const ret = {
        groups: group.subtype === 'group' ? 1 : 0,
        students: 0,
        projects: 0,
      };
      group.children.forEach((el) => {
        const result = getCourseNumbers(el);
        ret.groups += result.groups;
        ret.students += result.students;
        ret.projects += result.projects;
      });
      return ret;
    }
    case 'user': {
      return {
        groups: 0,
        students: group.subtype === 'student' ? 1 : 0,
        projects: 0,
      };
    }
    case 'project': {
      return {
        groups: 0,
        students: 0,
        projects: 1,
      };
    }
    default: {
      return {
        groups: 0,
        students: 0,
        projects: 0,
      };
    }
  }
}

/**
 * Show info of current session. The user can use said info to keep track of their progress.
 * It renders information including but not limited to courseID and courseEdition.
 *
 * @param info
 * @returns {HTML Component}
 */
function renderSession(info) {
  const {
    groups, name, course, edition, normalTas, headTas,
  } = info;

  const courseNumbers = groups ? getCourseNumbers(groups) : {
    groups: 0,
    students: 0,
    projects: 0,
  };

  return (
    <div>
      <h1 className="mb-3">Current Session</h1>
      <h4>
        <div className="row my-2">
          <div className="col-lg-6 text-right">
            <span className="font-weight-light">Course:</span>
          </div>
          <div className="col-lg-6 text-left">
            <span>{course}</span>
          </div>
        </div>
        <div className="row my-2">
          <div className="col-lg-6 text-right">
            <span className="font-weight-light">Name:</span>
          </div>
          <div className="col-lg-6 text-left">
            <span>{name}</span>
          </div>
        </div>
        <div className="row my-2">
          <div className="col-lg-6 text-right">
            <span className="font-weight-light">Edition:</span>
          </div>
          <div className="col-lg-6 text-left">
            <span>{edition}</span>
          </div>
        </div>
        <div className="row my-2">
          <div className="col-lg-6 text-right">
            <span className="font-weight-light">Head TAs:</span>
          </div>
          <div className="col-lg-6 text-left">
            <span>{headTas.length}</span>
          </div>
        </div>
        <div className="row my-2">
          <div className="col-lg-6 text-right">
            <span className="font-weight-light">Regular TAs:</span>
          </div>
          <div className="col-lg-6 text-left">
            <span>{normalTas.length}</span>
          </div>
        </div>
        <div className="row my-2">
          <div className="col-lg-6 text-right">
            <span className="font-weight-light">Groups:</span>
          </div>
          <div className="col-lg-6 text-left">
            <span>{courseNumbers.groups}</span>
          </div>
        </div>
        <div className="row my-2">
          <div className="col-lg-6 text-right">
            <span className="font-weight-light">Students:</span>
          </div>
          <div className="col-lg-6 text-left">
            <span>{courseNumbers.students}</span>
          </div>
        </div>
        <div className="row my-2">
          <div className="col-lg-6 text-right">
            <span className="font-weight-light">Projects:</span>
          </div>
          <div className="col-lg-6 text-left">
            <span>{courseNumbers.projects}</span>
          </div>
        </div>
      </h4>
    </div>
  );
}

/**
 * The variables accessed when importing this class. It calls the withAuth
 * variable from okta for authentication.
 */
function AdminLayout(props) {
  /**
   * Returns the REACT component for rendering.
   */
  const { children } = props;
  return (
    <div className="container-fluid">
      <div className="row mx-3">
        <div className="col-lg-1" />
        <div className="col-lg-10 text-center">
          <AdminCrumbs />
        </div>
        <div className="col-lg-1" />
      </div>
      <div className="row mt-5 mx-3">
        <div className="col-lg-3 text-left">
          <div className="row">
            <div className="col-lg-12 text-center">{renderSession(props)}</div>
          </div>
        </div>
        <div className="col-lg-9 text-center">
          {children}
        </div>
      </div>
    </div>
  );
}

export default connect(mapStateToProps, null)(AdminLayout);

AdminLayout.propTypes = {
  children: PropTypes.shape({}).isRequired,
};
