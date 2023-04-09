import React from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';

import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import { checkIntegrity } from '../dataStructures';

class UserDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.removeStudentClick = this.removeStudentClick.bind(this);
    this.clickUser = this.clickUser.bind(this);
    this.getContextMenu = this.getContextMenu.bind(this);
    this.displayUser = this.displayUser.bind(this);
  }

  getContextMenu() {
    const { id, parent, subtype } = this.props;
    return (
      <ContextMenu id={`studentMenu ${parent + id}`}>
        <MenuItem onClick={this.removeStudentClick}>
          <i className="far fa-trash-alt" />
          {`\t Remove ${subtype}`}
        </MenuItem>
      </ContextMenu>
    );
  }

  displayUser() {
    const {
      id, name, parent, subtype,
    } = this.props;
    const displayName = name;
    let color = 'secondary';
    if (subtype === 'ta') {
      color = 'primary';
    } else if (subtype === 'head_ta') {
      color = 'success';
    }

    return (
      <ContextMenuTrigger id={`studentMenu ${parent + id}`}>
        <div className="indent-lg">
          <Button variant={`outline-${color}`} size="sm" className="text-left my-1" onClick={this.clickUser} data-id={parent + id} id={`Reveal content project ${id} button`} block>
            <span><i className="fas fa-user" /></span>
            <span>{`\t${displayName}`}</span>
          </Button>
        </div>
      </ContextMenuTrigger>
    );
  }

  clickUser() {
    const { functions } = this.props;
    functions.renderInfo(this.props);
  }

  removeStudentClick() {
    const {
      parent, functions, id, type,
    } = this.props;
    functions.deleteGroupMember(parent, id, type);
  }

  render() {
    if (!checkIntegrity('user', this.props)) {
      return <div />;
    }
    return (
      <div className="">
        {this.getContextMenu()}
        {this.displayUser()}
      </div>
    );
  }
}

export default UserDisplay;

UserDisplay.propTypes = {
  parent: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  subtype: PropTypes.string.isRequired,
  functions: PropTypes.shape({
    renameGroupData: PropTypes.func.isRequired,
    addGroupData: PropTypes.func.isRequired,
    deleteGroupMember: PropTypes.func.isRequired,
    renderInfo: PropTypes.func.isRequired,
  }).isRequired,
};
