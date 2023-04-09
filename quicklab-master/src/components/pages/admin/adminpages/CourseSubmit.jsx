import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import PoemPage from './PoemPage';
import * as userActions from '../../../../actions/actions';

function mapStateToProps(state) {
  return {
    users: state.server,
    page: state.page,
  };
}

function CourseSubmit(props) {
  const { submitGroups, page, users } = props;

  if (page < 7) {
    return (
      <PoemPage />
    );
  }


  let SubmitButton;
  if (!users.fetching && (!users.viewUrl || users.viewUrl === '')) {
    SubmitButton = (
      <Button variant="flat" size="sm" className="my-3 mb-5" onClick={submitGroups}>
        <span><span className="text">Submit data to GitLab</span></span>
      </Button>
    );
  } else if (users.fetching) {
    SubmitButton = (
      <Button variant="flat" size="sm" className="my-3 mb-5" onClick={submitGroups} disabled>
        <span>
          <span className="spinner-grow spinner-grow-sm" />
          {' '}
          <span className="text">Sending data to GitLab</span>
        </span>
      </Button>
    );
  } else if (users.fetched && (users.viewUrl && users.viewUrl !== '')) {
    SubmitButton = (
      <Button variant="success" size="sm" className="my-3 mb-5" onClick={submitGroups}>
        <span className="text">Groups created on GitLab!</span>
      </Button>
    );
  }
  return (
    <div className="row">
      <div className="col-lg-8 text-center">
        <h1 className="mb-3">Course Submit</h1>
        {SubmitButton}


        {(!users.viewUrl || users.viewUrl === '') && users.fetched && !users.fetching
        && (
        <div className="alert alert-danger" role="alert">
        An error occurred while sending the data to Gitlab, please try again later..
        </div>
        )}

        {users.viewUrl && users.fetched

        && (
        <div className="alert alert-success" role="alert">
 The groups were successfully created on GitLab!
          {' '}
          <a href={users.viewUrl.replace(' ', '_')} className="alert-link">Click here</a>
          {' '}
to view the data in GitLab.
        </div>
        )
}
      </div>
      <div className="col-lg-4 text-left" />
    </div>
  );
}

export default connect(mapStateToProps, userActions)(CourseSubmit);

CourseSubmit.propTypes = {
  submitGroups: PropTypes.func.isRequired,
  users: PropTypes.shape({}).isRequired,
  page: PropTypes.number.isRequired,
};
