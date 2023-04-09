import React from 'react';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';

import UserDisplay from '../user/UserDisplay';
import { checkIntegrity } from '../dataStructures';

import StudentModal from '../user/StudentModal';
import GroupModal from '../group/GroupModal';

import * as modalConstants from '../modalConstants';

class ProjectDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.formRef = null;

    this.createChild = this.createChild.bind(this);
    this.clickProject = this.clickProject.bind(this);
    this.removeProject = this.removeProject.bind(this);
    this.displayProject = this.displayProject.bind(this);
    this.getContextMenu = this.getContextMenu.bind(this);
    this.hideModal = this.hideModal.bind(this);

    this.state = {
      adding: false,
      collapsed: true,
      path: `${props.parent}/${props.id}`,
      modal: modalConstants.NO_MODAL,
    };
  }

  getContextMenu() {
    const { id } = this.props;

    return (
      <ContextMenu id={`projectMenu ${id}`}>
        <MenuItem onClick={() => this.viewModal(modalConstants.RENAME_MODAL)}>
          <i className="far fa-edit" />
          {'\t Rename project'}
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={this.removeProject}>
          <i className="far fa-trash-alt" />
          {'\t Remove project'}
        </MenuItem>
      </ContextMenu>
    );
  }

  getModal() {
    const { modal, path } = this.state;
    const {
      id, children, functions, siblings,
    } = this.props;
    if (!modal || modal === modalConstants.NO_MODAL) {
      return null;
    } if (modal === modalConstants.RENAME_MODAL) {
      return (
        <GroupModal
          hide={this.hideModal}
          reserved={siblings}
          path={path}
          {...functions}
          dataType="project"
          initial={id}

        />
      );
    } if (modal === modalConstants.ADD_STUDENT_MODAL) {
      return (
        <StudentModal
          hide={this.hideModal}
          reserved={children.map(c => c.id)}
          path={path}
          {...functions}
        />
      );
    }
    return null;
  }

  displayProject() {
    const { id } = this.props;

    return (
      <ContextMenuTrigger id={`projectMenu ${id}`}>
        <Button variant="outline-danger" size="sm" className="text-left my-1" onClick={this.clickProject} data-id={id} id={`Reveal content project ${id} button`} block>
          <i className="fas fa-code-branch" />
          <span>{`\t ${id}`}</span>
        </Button>
      </ContextMenuTrigger>
    );
  }

  createChild(child) {
    const { functions } = this.props;
    const { path } = this.state;
    return <UserDisplay key={child.id} {...child} parent={path} functions={functions} />;
  }

  hideModal(updated = false) {
    const { collapsed } = this.state;
    this.setState({
      modal: modalConstants.NO_MODAL,
      collapsed: !updated && collapsed,
    });
  }

  viewModal(type) {
    this.setState({
      modal: type,
    });
  }

  removeProject() {
    const {
      functions, id, type, parent,
    } = this.props;
    functions.deleteGroupMember(parent, id, type);
  }

  clickProject() {
    this.setState(prevState => ({
      ...prevState,
      collapsed: !prevState.collapsed,
    }));
  }

  render() {
    const { children } = this.props;
    const { collapsed } = this.state;
    if (!checkIntegrity('project', this.props)) {
      return <div />;
    }

    let childrenContainer = [];
    if (!collapsed) {
      childrenContainer = children.map(key => this.createChild(key));
    }

    return (
      <div className="indent-lg">
        {this.getContextMenu()}
        {this.displayProject()}
        {this.getModal()}
        <div className={collapsed ? 'collapse' : 'collapse-in'}>
          {childrenContainer}
        </div>
      </div>
    );
  }
}

export default ProjectDisplay;

ProjectDisplay.propTypes = {
  parent: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  children: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  siblings: PropTypes.arrayOf(PropTypes.string).isRequired,
  functions: PropTypes.shape({
    renameGroupData: PropTypes.func.isRequired,
    addGroupData: PropTypes.func.isRequired,
    deleteGroupMember: PropTypes.func.isRequired,
    renderInfo: PropTypes.func.isRequired,
  }).isRequired,
};
