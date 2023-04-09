import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import {
  Group, Project,
} from '../dataStructures';

const RENAME = 'RENAME';
const ADD = 'ADD';

function validateName(str) {
  return str.match(/^((\d|\w|[- ])*)/);
}

/**
 * This modal is a popup box to be used to enter the name of a new group.
 */
class GroupModal extends React.Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.state = {
      type: props.initial === '' ? ADD : RENAME,
      value: props.initial,
      status: '',
    };
  }

  /**
   * Whenever this component updates, check whether the name input should be focused.
   */
  componentDidMount() {
    if (this.name) {
      this.name.select();
    }
  }

  onBlur() {
    const { initial, reserved, dataType } = this.props;
    const { value } = this.state;
    if (value === '') {
      this.setState({
        status: `Please enter a ${dataType} name, it cannot be empty`,
      });
    } else if (reserved.includes(value)) {
      this.setState({
        status: `Please enter a different ${dataType} name, a member with this name already exists`,
      });
    } else if (initial === value) {
      this.setState({
        status: 'The specified name is the same as the original',
      });
    } else {
      this.setState({
        status: '',
      });
    }
  }

  onChange(event) {
    const { target } = event;
    const { value } = target;
    this.setState({
      value: validateName(value)[0],
    });
  }

  /**
   * This method process the values of the form and verifies that the data is correct.
   * If not, it displays an error message. Else it creates a new group.
   */
  addGroup() {
    const {
      path, addGroupData, hide,
    } = this.props;
    const { value } = this.state;
    const group = Group.createInstance(value);
    addGroupData(path, group);
    hide(true);
  }

  /**
   * This method process the values of the form and verifies that the data is correct.
   * If not, it displays an error message. Else it renames the.
   */
  rename() {
    const {
      path, renameGroupData, initial, hide, dataType,
    } = this.props;
    const { value } = this.state;
    if (value !== initial) {
      renameGroupData(path, value, dataType);
    }
    hide(true);
  }

  /**
   * This method process the values of the form and verifies that the data is correct.
   * If not, it displays an error message. Else it creates a new project.
   */
  addProject() {
    const {
      path, addGroupData, hide,
    } = this.props;
    const { value: id } = this.state;
    const group = Project.createInstance(id);
    addGroupData(path, group);
    hide(true);
  }


  /**
   * This method is called when the modal is submitted.
   * It calls the correct method depending on the type.
   */
  submit(e) {
    e.preventDefault();
    const { type } = this.state;
    const { dataType } = this.props;
    if (type === ADD) {
      if (dataType === 'project') {
        this.addProject();
      } else if (dataType === 'group') {
        this.addGroup();
      }
    } else if (type === RENAME) {
      this.rename();
    }
  }

  /**
   * Render the modal, which is a more stylized popup box.
   * It will only show when the `show` variable in props is true.
   */
  render() {
    const {
      path, hide, reserved, initial, dataType,
    } = this.props;
    const { type, value, status } = this.state;
    const title = type === ADD ? `Add a new ${dataType} to ${path}` : `Rename the ${dataType} ${path}`;
    const canSubmit = value !== '' && !reserved.includes(value) && initial !== value;
    return (
      <Modal show onHide={() => hide(false)}>
        <Modal.Header className="modal-header-primary" closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={this.submit}>
            <label htmlFor="name">
              {`${dataType} name`}
              <br />
              <input
                value={value}
                type="text"
                id="name"
                ref={(ref) => { this.name = ref; }}
                onChange={this.onChange.bind(this)}
                onBlur={this.onBlur.bind(this)}
              />
            </label>
            <div id="groupStatus">{status}</div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => hide(false)}>
            <span>Cancel</span>
          </Button>
          <Button variant="primary" onClick={this.submit} disabled={!canSubmit}>
            <span>Save Changes</span>
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default GroupModal;

GroupModal.propTypes = {
  path: PropTypes.string.isRequired,
  addGroupData: PropTypes.func.isRequired,
  renameGroupData: PropTypes.func.isRequired,
  hide: PropTypes.func.isRequired,
  reserved: PropTypes.arrayOf(PropTypes.string).isRequired,
  initial: PropTypes.string.isRequired,
  dataType: PropTypes.string.isRequired,
};
