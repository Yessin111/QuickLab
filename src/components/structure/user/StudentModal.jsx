import React from 'react';
// import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import {
  User,
} from '../dataStructures';

class StudentModal extends React.Component {
  constructor(props) {
    super(props);
    this.addStudent = this.addStudent.bind(this);
  }

  componentDidMount() {
    if (this.studentUsername) {
      this.studentUsername.focus();
    }
  }

  addStudent() {
    const {
      addGroupData, reserved, path, hide,
    } = this.props;
    const username = this.studentId.value;
    if (reserved.includes(username)) {
      this.studentStatus.innerHTML = 'Please enter a different student username, a member with this username already exists';
    } else {
      const user = User.createInstance(
        username, this.studentName.value, username, this.studentMail.value,
      );
      addGroupData(path, user);
      hide(true);
    }
  }

  render() {
    const { path, hide } = this.props;
    const title = `Add a new student to ${path}`;
    return (
      <Modal show onHide={() => hide(false)}>
        <Modal.Header className="modal-header-primary" closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <label htmlFor="studentId">
              Student id
              {' '}
              <br />
              {/* TODO: Verify input characters */}
              {/* TODO: Verify student doesn't exist yet */}
              <input type="text" id="studentId" ref={(ref) => { this.studentId = ref; }} />
            </label>
            <br />
            <label htmlFor="studentName">
              Student name
              {' '}
              <br />
              {/* TODO: Verify input characters */}
              <input type="text" id="studentName" ref={(ref) => { this.studentName = ref; }} />
            </label>
            <br />
            <label htmlFor="studentMail">
              <span>Student mail</span>
              <br />
              {/* TODO: Verify input characters */}
              <input type="text" id="studentMail" ref={(ref) => { this.studentMail = ref; }} />
            </label>
            <br />
            <div id="studentStatus" ref={(ref) => { this.studentStatus = ref; }} />
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={() => hide(false)}>
            <span>Cancel</span>
          </Button>
          {/* TODO: Disable button if input is invalid */}
          <Button variant="primary" onClick={this.addStudent}>
            <span>Save Changes</span>
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
export default StudentModal;

StudentModal.propTypes = {
  path: PropTypes.string.isRequired,
  reserved: PropTypes.arrayOf(PropTypes.string).isRequired,
  hide: PropTypes.func.isRequired,
  addGroupData: PropTypes.func.isRequired,
};
