import React from 'react';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';

import GroupModal from './GroupModal';
import UserDisplay from '../user/UserDisplay';
import ProjectDisplay from '../project/ProjectDisplay';
import {
  checkIntegrity,
} from '../dataStructures';
import StudentModal from '../user/StudentModal';

import * as modalConstants from '../modalConstants';

class GroupDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.formRef = null;

    this.createChild = this.createChild.bind(this);
    this.clickGroup = this.clickGroup.bind(this);
    this.removeGroup = this.removeGroup.bind(this);
    this.displayGroup = this.displayGroup.bind(this);
    this.displayGroupContents = this.displayGroupContents.bind(this);
    this.getContextMenu = this.getContextMenu.bind(this);
    this.hideModal = this.hideModal.bind(this);

    this.state = {
      adding: false,
      collapsed: !props.data.children.some(g => g.type === 'group'),
      path: `${props.parent}/${props.data.id}`,
      modal: modalConstants.NO_MODAL,
    };
  }

  getContextMenu() {
    const { path } = this.state;
    const { functions } = this.props;

    return (
      <ContextMenu id={`groupMenu ${path}`}>
        <MenuItem onClick={() => functions.addTas(path)}>
          <i className="far fa-plus-square" />
          {'\t Add TAs'}
        </MenuItem>
        <MenuItem onClick={() => this.viewModal(modalConstants.ADD_GROUP_MODAL)}>
          <i className="far fa-plus-square" />
          {'\t Add group'}
        </MenuItem>
        <MenuItem onClick={() => this.viewModal(modalConstants.ADD_STUDENT_MODAL)}>
          <i className="far fa-plus-square" />
          {'\t Add student'}
        </MenuItem>
        <MenuItem onClick={() => this.viewModal(modalConstants.ADD_PROJECT_MODAL)}>
          <i className="far fa-plus-square" />
          {'\t Add project'}
        </MenuItem>
        <MenuItem onClick={() => this.viewModal(modalConstants.RENAME_MODAL)}>
          <i className="far fa-edit" />
          {'\t Rename group'}
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={this.removeGroup}>
          <i className="far fa-trash-alt" />
          {'\t Remove group'}
        </MenuItem>
      </ContextMenu>
    );
  }


  getModal() {
    const { modal, path } = this.state;
    const { data, functions } = this.props;
    if (!modal || modal === modalConstants.NO_MODAL) {
      return null;
    } if (modal === modalConstants.RENAME_MODAL) {
      return (
        <GroupModal
          hide={this.hideModal}
          reserved={data.siblings}
          path={path}
          dataType="group"
          {...functions}
          initial={data.id}
        />
      );
    } if (modal === modalConstants.ADD_GROUP_MODAL || modal === modalConstants.ADD_PROJECT_MODAL) {
      const addType = modal === modalConstants.ADD_GROUP_MODAL ? 'group' : 'project';
      return (
        <GroupModal
          hide={this.hideModal}
          reserved={data.children.filter(c => c.type === addType).map(c => c.id)}
          path={path}
          dataType={addType}
          {...functions}
          initial=""
        />
      );
    } if (modal === modalConstants.ADD_STUDENT_MODAL) {
      return (
        <StudentModal
          hide={this.hideModal}
          reserved={data.children.map(c => c.id)}
          path={path}
          {...functions}
        />
      );
    }
    return null;
  }

  /**
   * Display the button and contents of the group.
   */
  displayGroupContents() {
    const { collapsed } = this.state;
    const { data } = this.props;
    const group = data.id;

    return (
      <Button variant="outline-dark" size="sm" className="text-left my-1" onClick={this.clickGroup} data-id={group} id={`Reveal content group ${group} button`} block>
        <span>{(collapsed ? <i className="fas fa-folder" /> : <i className="fas fa-folder-open" />)}</span>
        <span>{`\t ${group}`}</span>
      </Button>
    );
  }

  /**
   * The logic of a group object with the contents rendered in it.
   */
  displayGroup() {
    const { path } = this.state;
    const { data, functions } = this.props;

    return (
      <ContextMenuTrigger id={`groupMenu ${path}`}>
        {
          data.subtype === 'course' ? <div>{this.displayGroupContents()}</div>
            : (
              <div onDrop={(event) => { event.preventDefault(); functions.addTas(path, event.dataTransfer.getData('text')); }} onDragOver={event => event.preventDefault()}>
                {this.displayGroupContents()}
              </div>
            )
        }

      </ContextMenuTrigger>
    );
  }

  createChild(child) {
    const { functions } = this.props;
    const { path } = this.state;
    if (child.type === 'user') {
      return (
        <UserDisplay
          key={child.id}
          {...child}
          parent={path}
          functions={functions}
        />
      );
    }
    const { data } = this.props;
    const siblings = data.children.filter(
      c => c.type === child.type && c.id !== child.id,
    ).map(c => c.id);
    const newData = {
      ...child,
      siblings,
    };
    if (child.type === 'project') {
      return <ProjectDisplay key={`project-${child.id}`} {...newData} parent={path} functions={functions} />;
    }
    return <GroupDisplay key={`group-${child.id}`} data={newData} parent={path} functions={functions} />;
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

  removeGroup() {
    // TODO: Show confirmation modal
    const { parent, functions, data } = this.props;
    functions.deleteGroupMember(parent, data.id, data.type);
  }

  clickGroup() {
    this.setState(prevState => ({
      ...prevState,
      collapsed: !prevState.collapsed,
    }));
    const { functions } = this.props;
    const { data } = this.props;
    functions.renderInfo(data);
  }

  render() {
    const { data } = this.props;
    const { collapsed } = this.state;
    if (!checkIntegrity('group', data)) {
      return <div />;
    }
    let childrenContainer = [];
    const noUserContainer = data.children.filter(child => child.type !== 'user');
    const userContainer = data.children.filter(child => child.type === 'user');
    userContainer.sort((a, b) => {
      if (a.subtype === b.subtype) {
        return 0;
      } if (a.subtype === 'student') {
        return 1;
      }
      return -1;
    });

    if (!collapsed) {
      childrenContainer = noUserContainer.map(group => this.createChild(group));
      childrenContainer = [...childrenContainer,
        userContainer.map(group => this.createChild(group))];
    }
    return (
      <div className="indent-lg">
        {this.getContextMenu()}
        {this.displayGroup()}
        {this.getModal()}
        <div className={collapsed ? 'collapse' : 'collapse-in'}>
          {childrenContainer}
        </div>
      </div>
    );
  }
}

export default GroupDisplay;

GroupDisplay.propTypes = {
  parent: PropTypes.string.isRequired,
  data: PropTypes.shape({
    type: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    children: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    siblings: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  functions: PropTypes.shape({
    renameGroupData: PropTypes.func.isRequired,
    addGroupData: PropTypes.func.isRequired,
    deleteGroupMember: PropTypes.func.isRequired,
    renderInfo: PropTypes.func.isRequired,
    addTas: PropTypes.func.isRequired,
  }).isRequired,
};
