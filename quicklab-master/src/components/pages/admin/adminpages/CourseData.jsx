import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import 'react-table/react-table.css';
import Button from 'react-bootstrap/Button';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { bindActionCreators } from 'redux';
import PoemPage from './PoemPage';
import GroupContainer from '../../../structure/group/GroupContainer';
import * as userActions from '../../../../actions/actions';
import * as pageActions from '../../../../actions/pageActions';
import config from '../../../../config';
import { User } from '../../../structure/dataStructures';
import LoadingModal from '../../../structure/LoadingModal.jsx';

/**
 * Selects which variables from the state have to be used as props in the
 * component.
 *
 * @param state {Object}
 * @return {Object}
 */
function mapStateToProps(state) {
  return {
    users: state.users,
    server: state.server,
    groups: state.groups,
    page: state.page,
  };
}

/**
 * Selects the used actions from multiple action files, combines them and
 * binds them to the dispatch. Just putting an action files in the connect
 * does the binding automatically, but since we need multiple action files
 * here, the binding needs to be explicitly stated.
 *
 * @param dispatch {Dispatch}
 * @return {Object}
 */
function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    ...pageActions,
    ...userActions,
  }, dispatch);
}

function defaultState() {
  return {
    shownData: null,
    amountUsed: [],
  };
}

/**
 * Checks through an entire group to count how many of each TA is assigned.
 *
 * @param group { Object } a group which will be recursively looked through to count all TAs
 * @param tas { Array } an array with objects
 *                   which have a ta name and the amount that ta has been found.
 *
 * @returns { Array } the finalised array with objects with updated counters.
 */
function getTaCount(group, tas) {
  switch (group.type) {
    case 'user': {
      if (group.subtype === 'ta') {
        const current = tas[group.name];
        return {
          ...tas,
          [group.name]: current ? current + 1 : 1,
        };
      }
      return tas;
    }
    case 'group': {
      return group.children.reduce(
        (previousValue, currentGroup) => getTaCount(currentGroup, previousValue), tas,
      );
    }
    default: {
      return tas;
    }
  }
}

/**
 * Changes the first letter of a string to a capital letter (e.g. word => Word).
 *
 * @param string { String } the string that has to be adjusted.
 *
 * @returns { String } the string starting with a capital letter.
 */
function firstUppercase(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Converts a path into an array containing all the steps of the path.
 *
 * @param path { String }
 *
 * @returns { Array } an array of strings.
 */
function StepsInPath(path) {
  let string = path;

  if (path.charAt(0) === '.') {
    string = string.slice(2);
  }

  const ret = string.split('/');
  if (ret.length > 1) {
    ret.splice(0, 1);
  }
  return ret;
}

/**
 * Checks the children of a group if a certain TA has been assigned.
 *
 * @param group { Object } the group that needs to be checked.
 * @param ta { String } the TA that needs to be found.
 *
 * @returns { Boolean } whether or not the TA has been found.
 */
function findTa(group, ta) {
  switch (group.type) {
    case 'group': {
      return group.children.some(el => el.type === 'user' && el.id === ta);
    }
    default: {
      return false;
    }
  }
}

/**
 * The parent method of findTA() where a group gets searched for recursively
 *                                          to see if it contains a certain TA.
 *
 * @param group { Object } the group that needs to be searched.
 * @param steps { Array } the array with steps that needs to be followed.
 * @param ta { String } the TA that needs to be found.
 *
 * @returns { Boolean } whether the TA has been found.
 */
function doesGroupHaveTa(group, steps, ta) {
  if (steps.length === 0) {
    return findTa(group, ta);
  }

  switch (group.type) {
    case 'group': {
      const nextGroup = group.children.find(el => el.id === steps[0]);
      if (nextGroup) {
        steps.shift();
        return doesGroupHaveTa(nextGroup, steps, ta);
      }
      return false;
    }
    default: {
      return false;
    }
  }
}

class CourseData extends React.Component {
  constructor() {
    super();

    this.checkboxes = {};
    this.renderInfo = this.renderInfo.bind(this);
    this.getSelectedTAs = this.getSelectedTAs.bind(this);
    this.addTas = this.addTas.bind(this);
    this.state = defaultState();
    this.processGroups = this.processGroups.bind(this);
    this.getCourseAndEdition = this.getCourseAndEdition.bind(this);
    this.saveToServer = this.saveToServer.bind(this);

    this.modal = new LoadingModal(this);
  }

  componentDidMount() {
    const { storeGroups, addTAsToStore } = this.props;
    const { modal } = this;
    const courseAndEdition = this.getCourseAndEdition();

    modal.showModal();
    axios.get(`${config.server}/getCourseById`, {
      params: courseAndEdition,
    }).then((response) => {
      axios.get(`${config.server}/getTas`, {
        params: courseAndEdition,
      }).then((res) => {
        const { normalTas, headTas } = res.data;
        storeGroups(response.data);
        addTAsToStore(normalTas, headTas);
        modal.showSuccess('Succesfully loaded the groups and teaching assitants from the server.');
      }).catch((err) => {
        modal.showError(err.toString());
      });
    }).catch((err) => {
      modal.showError(err.toString());
    });
  }

  getCourseAndEdition() {
    const { groups } = this.props;
    if (!groups.groups) {
      return {
        course: null,
        edition: null,
      };
    }
    const { children, id } = groups.groups;
    return {
      course: id,
      edition: children.find(el => el.type === 'group').id,
    };
  }

  getSelectedTAs() {
    const { groups } = this.props;
    const { tas } = groups;

    return tas.filter((el) => {
      const html = this.checkboxes[el];
      if (!html) return false;
      return html.checked;
    });
  }

  saveToServer(event, redirect = null) {
    const { props, modal } = this;
    const { log, groups } = props.groups;
    const { storeGroups } = props;
    modal.resetModal();
    modal.showModal();
    axios.post('http://localhost:4000/saveTransactions', {
      log,
      course: groups.id,
      edition: groups.children[0].id,
    })
      .then((response) => {
        modal.showSuccess('Succesfully stored the data to the server.', redirect);
        storeGroups(response.data);
      })
      .catch((err) => {
        const { data } = err.response;
        if (data.result) {
          modal.showWarning(`Something went wrong when storing to the server. We updated the groups to the current server state. ${data.error.toString()}`, redirect);
          storeGroups(data.result);
        } else {
          modal.showError(data.error);
        }
      });
  }

  addTas(path, entry = null) {
    const entries = entry ? [entry] : this.getSelectedTAs();
    const { addGroupData, groups } = this.props;

    const tas = entries.filter(el => !doesGroupHaveTa(groups.groups, StepsInPath(path), el));

    tas.forEach((el) => {
      const user = User.createInstance(
        el, el, el, `${el}@tudelft.nl`, 'ta',
      );

      addGroupData(path, user);
    });
  }

  /**
     * This function is required because the onClick that calls this function
     * can only handle one function at the time. This function was created
     * to ensure that both saveToServer() and setPage() could be called
     * without too much trouble.
     */
  processGroups(event) {
    const { setPage } = this.props;
    this.saveToServer(event, () => {
      const { history } = this.props;
      history.push('/tool/project-settings');
    });
    setPage(6);
  }

  renderInfo(shownData) {
    this.setState(prevState => ({
      ...prevState,
      shownData,
    }));
  }

  render() {
    const {
      groups, server, renameGroupData, page,
      addGroupData, deleteGroupMember,
    } = this.props;
    const { renderInfo, addTas, modal } = this;
    const { shownData } = this.state;
    const { tas } = groups;
    const root = groups.groups;

    const taObject = tas.reduce((previous, ta) => ({
      ...previous,
      [ta]: 0,
    }), {});
    const taCount = root ? getTaCount(root, taObject) : taObject;

    const functions = {
      renameGroupData,
      addGroupData,
      deleteGroupMember,
      renderInfo,
      addTas,
    };

    const showAll = <GroupContainer groups={root} functions={functions} />;
    const shownInfo = shownData === null ? null
      : (
        <div style={{
          borderStyle: 'solid', borderWidth: '1px', padding: '25px', backgroundColor: 'rgba(0,0,0,0.1)',
        }}
        >
          <h1>Selected</h1>
          <h3 className="">{`${firstUppercase(shownData.type)}:`}</h3>
          {shownData.type === 'user'
            ? (
              <div>
                <p className="lead">
                  {`Name: \t${shownData.name}`}
                </p>
                <p className="lead">
                  {`Student username: \t${shownData.username}`}
                </p>
                <p className="lead">
                  {`Email: \t${shownData.email}`}
                </p>
              </div>
            )
            : (
              <div>
                <p className="lead">
                  {`Group ID: \t${shownData.id}`}
                </p>
              </div>
            )
          }
        </div>
      );

    if (page < 5) {
      return (
        <PoemPage />
      );
    }

    let SubmitButton;

    if (!server.fetching && !server.fetched) {
      SubmitButton = (
        <Button variant="flat" size="sm" onClick={this.saveToServer}>
          <span>Save to Server</span>
        </Button>
      );
    } else if (server.fetching) {
      SubmitButton = (
        <Button variant="flat" size="sm" onClick={this.saveToServer} disabled>
          <span>
            <span className="spinner-grow spinner-grow-sm" />
            {' '}
            <span className="text">Sending data to database</span>
          </span>
        </Button>
      );
    } else {
      SubmitButton = (
        <Button variant="success" size="sm" onClick={this.saveToServer}>
          <span>Data was stored in the database!</span>
        </Button>
      );
    }
    return (
      <div className="row">
        {modal.render()}
        <div className="col-lg-8 text-center">
          <h1 className="mb-3">Groups</h1>
          <div className="row">
            <div className="col-lg-12 text-center">
              <div className="row my-3 mb-4">
                <div className="col-lg-4 text-center" />
                <div className="col-lg-4 text-center">
                  <OverlayTrigger
                    trigger="hover"
                    placement="right"
                    overlay={(
                      <Popover id="popover-basic" title="Group Info">
                        <ul>
                          <li>
                            {/* eslint-disable-next-line max-len */}
                            <span>Expand groups by pressing on them, revealing their subgroups, users and repositories.</span>
                          </li>
                          <li>
                            {/* eslint-disable-next-line max-len */}
                            <span>Right click one of these items to reveal a menu that allows you to change certain aspects.</span>
                          </li>
                          <li>
                            {/* eslint-disable-next-line max-len */}
                            <span>All available TAs are shown on the right side of this page. Click the `Add` button below one and afterwards, right click a group and press `Add TAs` to add all selected TAs.</span>
                          </li>
                          <li>
                            {/* eslint-disable-next-line max-len */}
                            <span>You can also drag and drop TAs into groups by holding the left-mouse button on the TA icon and dragging them onto a group.</span>
                          </li>
                        </ul>
                      </Popover>
                    )}
                  >
                    <h4>
                      <span>Insert, adjust or delete data if necessary </span>
                      <i className="fas fa-question-circle" />
                    </h4>
                  </OverlayTrigger>
                </div>
                <div className="col-lg-4 text-center" />
              </div>
              <div className="my-3">
                {SubmitButton}
              </div>
              <Button variant="flat" size="sm" onClick={this.processGroups}>
                <span>Save to Server and go to 6. Project Settings</span>
              </Button>
              <div className="row mb-5">
                <div className="col-lg-3 text-center" />
                <div className="col-lg-6 text-center neg-indent-lg">
                  {showAll}
                </div>
                <div className="col-lg-3 text-center" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 text-left">
          <div className="sticky-top" style={{ top: '103px' }}>
            {shownInfo}
            <ul className="list-unstyled text-left text-truncate mt-5 block" style={{ overflowY: 'auto', height: '500px' }}>
              <li className="list-group-item active clearfix" style={{ position: 'sticky', top: '0' }}>
                <h5>
                  <span>Assign available TAs </span>
                </h5>
              </li>
              { tas.map(key => (
                <li key={key} className="list-group-item clearfix">
                  <div className="row">
                    <div className="col-lg-3 text-center align-self-center">
                      <i className="fas fa-user-tie fa-3x text-primary drag-icon" draggable="true" onDragStart={event => event.dataTransfer.setData('text', key)} />
                    </div>
                    <div className="col-lg-9 text-left align-self-center">
                      {key}
                      <div>
                        <span>Assigned to </span>
                        {taCount[key]}
                        <span> groups</span>
                      </div>
                      <label htmlFor={`checkbox${key}`}>
                        <input ref={(b) => { this.checkboxes[key] = b; }} type="checkbox" id={`checkbox${key}`} />
                        <span> Add</span>

                      </label>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * The users type is defined to be an object containing an array of user-data.
 * Since the user-data might still change a lot, it is now only defined to be
 * an undefined object instead of a further and neatly defined one.
 */
CourseData.propTypes = {
  users: PropTypes.shape({
    data: PropTypes.shape({}),
  }).isRequired,
  groups: PropTypes.shape({
    log: PropTypes.array.isRequired,
    groups: PropTypes.shape({}).isRequired,
  }).isRequired,
  server: PropTypes.shape({}).isRequired,
  renameGroupData: PropTypes.func.isRequired,
  addGroupData: PropTypes.func.isRequired,
  deleteGroupMember: PropTypes.func.isRequired,
  storeGroups: PropTypes.func.isRequired,
  addTAsToStore: PropTypes.func.isRequired,
  setPage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  history: PropTypes.shape({}).isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(CourseData);
