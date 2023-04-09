/* eslint-disable jsx-a11y/label-has-for */
import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactTable from 'react-table';
import Papa from 'papaparse';
import { bindActionCreators } from 'redux';
import 'react-table/react-table.css';
import Button from 'react-bootstrap/Button';
import { LinkContainer } from 'react-router-bootstrap';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PoemPage from './PoemPage';
import { Group, Project, User } from '../../../structure/dataStructures';
import * as fileActions from '../../../../actions/fileActions';
import * as pageActions from '../../../../actions/pageActions';
import * as actions from '../../../../actions/actions';
import config from '../../../../config';
import LoadingModal from '../../../structure/LoadingModal.jsx';

const disabledValue = '--- Disabled ---';
// TODO: Put handling of files in a separate file.

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
    groups: state.groups,
    fileData: state.file,
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
    ...fileActions,
    ...pageActions,
    storeGroups: actions.storeGroups,
  }, dispatch);
}

function validateString(str) {
  return str.match(/^((\d|\w|[- ])*)/);
}


class ImportCSV extends React.Component {
  constructor(props) {
    super(props);

    this.formatGroupNames = this.formatGroupNames.bind(this);
    this.sendGroup = this.sendGroup.bind(this);
    this.toggleProjects = this.toggleProjects.bind(this);
    this.state = {
      showPrepend: true,
      projectPrefix: '',
    };

    this.modal = new LoadingModal(this);
  }

  /**
   * If a different csv file is selected, this function handles it.
   *
   * @param event {Event}
   * @return {undefined}
   */
  onFileChange(event) {
    const { resetFile } = this.props;
    const file = event.target.files[0];
    if (file) {
      resetFile();
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: this.handleParsedData.bind(this),
      });
    }
  }

  onInputChange(event) {
    const { target } = event;
    const { name, value } = target;
    if (name === 'projectPrefix') {
      const match = validateString(value);
      this.setState({
        [name]: match ? match[0] : '',
      });
    } else {
      this.setState({
        [name]: value,
      });
    }
  }


  /**
   * Returns the string that will be prepended to every project.
   */
  getProjectPrefix() {
    const { showPrepend, projectPrefix } = this.state;
    if (showPrepend && projectPrefix) {
      return projectPrefix + (projectPrefix.endsWith('-') ? '' : '-');
    }
    return '';
  }

  /**
   * Stores the parsed data (results) in the state. The file paramater is
   * optional for if one would still like something with the file in this
   * method.
   *
   * @param results {Object}
   * @param file {File} (optional)
   * @return {undefined}
   */
  handleParsedData(results) {
    const { newFile, fileData } = this.props;
    const keys = results.meta.fields;
    const { data } = results;
    newFile({
      ...fileData,
      keys,
      data,
    });
  }

  /**
   * Formats all of the groups in the selected columns.
   * It adds as much trailing zeros,
   *  such that every trailing group number has an equal amount of digits.
   */
  formatGroupNames() {
    const { fileData, newFile } = this.props;
    const { data, selectedKeys } = fileData;
    const groups = new Set(...selectedKeys.map(key => data.map(entry => String(entry[key]))));
    const regex = /^(?<base>.*?)(?<number>\d+)$/i;
    const matches = Array.from(groups).map(group => group.match(regex)).filter(m => m);
    const maxNum = Math.max(...matches.map(match => parseInt(match.groups.number, 10)));
    const numDigits = maxNum.toString().length;
    const groupMap = {};
    matches.forEach((match) => {
      groupMap[match.input] = match.groups.base + match.groups.number.padStart(numDigits, '0');
    });
    const newData = data.map((entry) => {
      const newEntry = {
        ...entry,
      };
      selectedKeys.forEach((key) => {
        if (groupMap[entry[key]]) {
          newEntry[key] = groupMap[entry[key]];
        }
      });
      return newEntry;
    });
    newFile({
      ...fileData,
      data: newData,
    });
  }

  /**
   * Creates group objects from the data stored in the state and updates the
   * store with those groups.
   *
   * @return {undefined}
   */
  createGroups() {
    const { fileData } = this.props;
    const { data, selectedKeys } = fileData;
    const contextColumn = this.formRefs.context.value;
    const createProject = this.formRefs.projects.checked;
    const prependText = this.getProjectPrefix();

    if (contextColumn === disabledValue) {
      const groups = {};
      data.forEach((user) => {
        const groupName = selectedKeys.map(k => user[k]).filter(v => v)[0];
        if (!groups[groupName]) {
          const children = createProject ? [Project.createInstance(prependText + groupName)] : [];
          groups[groupName] = Group.createInstance(groupName, children);
        }
        groups[groupName].children.push(this.createUser(user));
      });
      return Object.values(groups);
    }
    const groups = {};
    data.forEach((user) => {
      const groupName = selectedKeys.map(k => user[k]).filter(v => v)[0];
      const context = user[contextColumn];
      if (!groups[context]) {
        groups[context] = {};
      }
      if (!groups[context][groupName]) {
        const children = createProject ? [Project.createInstance(prependText + groupName)] : [];
        groups[context][groupName] = Group.createInstance(groupName, children);
      }
      groups[context][groupName].children.push(this.createUser(user));
    });
    const entries = Object.entries(groups);
    return entries.map(entry => Group.createInstance(entry[0], Object.values(entry[1])));
  }

  /**
   * Creates a user object using the selections made in the forms on the page.
   *
   * @param userData {Object}
   * @return {User}
   */
  createUser(userData) {
    return User.createInstance(
      userData[this.formRefs.username.value],
      `${userData[this.formRefs.firstName.value]} ${userData[this.formRefs.lastName.value]}`,
      userData[this.formRefs.username.value],
      userData[this.formRefs.email.value],
    );
  }

  /**
   * Adds a headername to the list of selected headers or removes it if it was
   * already selected. After that it checks if in each row of the selected headers
   * is exactly one data element. If that is true, creating groups is possible.
   * For antything else it is not.
   *
   * @param headerName {String}
   * @return {undefined}
   */
  selectHeader(headerName) {
    const { fileData, newFile } = this.props;
    const { selectedKeys } = fileData;

    // Add or remove key.
    const newSelectedKeys = selectedKeys.includes(headerName)
      ? selectedKeys.filter(val => val !== headerName)
      : selectedKeys.concat(headerName);

    newFile({
      ...fileData,
      selectedKeys: newSelectedKeys,
      possible: this.verifyContextCorrect(newSelectedKeys),
    });
  }

  /**
   * Updates the store with a check if the data selected can be converted
   * into groups.
   *
   * @return {undefined}
   */
  verify() {
    const { fileData, newFile } = this.props;
    newFile({
      ...fileData,
      possible: this.verifyContextCorrect(),
    });
  }

  /**
   * Sends the created groups to the store.
   *
   * @return {undefined}
   */
  sendGroup() {
    const { groups, setPage } = this.props;
    const { children } = groups.groups;
    const { modal } = this;
    let edition = Group.createInstance('edition', [], 'edition');
    if (children) {
      [edition] = children;
    }
    const withCourse = {
      ...groups.groups,
      children: [
        {
          ...edition,
          children: this.createGroups(),
        },
      ],
    };
    axios.post(`${config.server}/postCourse`, withCourse)
      .then(() => {
        setPage(4);
        modal.showSuccess('Succesfully stored the data on the server.', () => {
          const { history } = this.props;
          history.push('/tool/ta-form');
        });
      })
      .catch((error) => {
        modal.showError(error.toString());
      });
  }

  /**
   * Handles showing the prepend-text input whenever the 'create projects' is toggled.
   */
  toggleProjects() {
    this.setState({
      showPrepend: this.formRefs.projects.checked,
    });
  }

  /**
   * Verifies if the data selected in the form can be used to correctly
   * create all group objects.
   *
   * @param selectedKeys {Array[String]}
   */
  verifyContextCorrect(selectedKeys = undefined) {
    const { fileData } = this.props;
    const {
      data,
    } = fileData;
    let selected = selectedKeys;
    if (!selectedKeys) {
      selected = fileData.selectedKeys;
    }
    const contextColumn = this.formRefs.context.value;
    if (contextColumn === disabledValue) {
      return data.every((user) => {
        const groupOptions = selected.map(k => user[k]).filter(v => v);
        return groupOptions.length === 1;
      });
    }
    const groups = {};
    return data.every((user) => {
      const groupOptions = selected.map(k => user[k]).filter(v => v);
      if (groupOptions.length !== 1) {
        return false;
      }
      const group = groupOptions[0];
      const context = user[contextColumn];
      if (groups[group] === undefined) {
        groups[group] = context;
      }
      return groups[group] === context;
    });
  }

  render() {
    const { fileData } = this.props;
    const {
      data, keys, possible, selectedKeys,
    } = fileData;

    const headerTags = [];
    const tableHeader = [];
    const tableBody = [];

    keys.forEach((k) => {
      tableHeader.push({ Header: k, accessor: k });
      headerTags.push(k);
    });

    for (let i = 0; i < data.length; i += 1) {
      const tempList = [];
      for (let j = 0; j < keys.length; j += 1) {
        tempList.push({ [headerTags[j]]: data[i][keys[j]] });
      }
      const res = {};
      tempList.forEach(c => Object.keys(c).forEach((k) => { res[k] = c[k]; }));
      tableBody.push(res);
    }
    const toggle = (function handleToggle(event) {
      this.selectHeader(event.target.name);
    }).bind(this);
    const showForm = data.length > 0;
    const groupSelector = keys.map(key => (
      <li key={key}>
        <label htmlFor={`groupSelector${key}`}>
          <input
            id={`groupSelector${key}`}
            name={key}
            type="checkbox"
            checked={selectedKeys.includes(key)}
            onChange={toggle}
          />
          <span>{`\t${key}`}</span>
        </label>
      </li>
    ));
    const { showPrepend, projectPrefix } = this.state;
    const { modal } = this;
    const exampleRow = tableBody.find(row => selectedKeys.find(key => row[key]));
    const exampleGroup = exampleRow ? exampleRow[selectedKeys.find(key => exampleRow[key])] : 'GroupName';
    const exampleProject = `${this.getProjectPrefix()}${exampleGroup}`;

    const colSelector = keys.map(col => <option key={col} value={col}>{col}</option>);

    const { groups, setPage } = this.props;
    const course = groups.groups;
    const edition = course && course.children[0];
    const existing = edition && edition.children.length > 0;

    const { page } = this.props;
    const showTable = showForm
      ? (
        <ReactTable
          columns={tableHeader}
          data={tableBody}
          minRows={0}
          defaultPageSize={10}
        />
      )
      : null;
    this.formRefs = {};
    const form = showForm ? (
      <form className="mt-5">
        {/* eslint-disable-next-line max-len */}
        <div className="row">
          <div className="col-lg-1" />
          <div className="col-lg-10">
            <h5 className="font-weight-light font-italic">Note: You will be prompted to declare some general specifications about the imported CSV. Later on (in part 5. Groups), you will be able to change individual things such as adding students or renaming certain groups.</h5>
          </div>
          <div className="col-lg-1" />
        </div>
        <div className="row mt-5">
          <div className="col-lg-3" />
          <div className="col-lg-6 text-center">
            <div className="my-1">
              <h5>Select a column to use as username</h5>
            </div>
            <select
              defaultValue={keys.find(s => s.toUpperCase() === 'USERNAME')}
              ref={(ref) => { this.formRefs.username = ref; }}
              className="form-control mb-3"
            >
              {colSelector}
            </select>
            <div className="my-1">
              <h5>Select a column to use as first name</h5>
            </div>
            <select
              defaultValue={keys.find(s => s.toUpperCase().replace(' ', '') === 'FIRSTNAME')}
              ref={(ref) => { this.formRefs.firstName = ref; }}
              className="form-control mb-3"
            >
              {colSelector}
            </select>
            <div className="my-1">
              <h5>Select a column to use as last name</h5>
            </div>
            <select
              defaultValue={keys.find(s => s.toUpperCase().replace(' ', '') === 'LASTNAME')}
              ref={(ref) => { this.formRefs.lastName = ref; }}
              className="form-control mb-3"
            >
              {colSelector}
            </select>
            <div className="my-1">
              <h5>Select a column to use as email address</h5>
            </div>
            <select
              defaultValue={keys.find(s => s.toUpperCase() === 'EMAIL')}
              ref={(ref) => { this.formRefs.email = ref; }}
              className="form-control mb-3"
            >
              {colSelector}
            </select>

            <div className="my-1">
              <OverlayTrigger
                trigger="hover"
                placement="right"
                overlay={(
                  <Popover id="popover-basic" title="Group Indication Info">
                    {/* eslint-disable-next-line max-len */}
                    <span>Select one or more columns that indicate in what group students should be placed. Make sure</span>
                    <span className="font-weight-bold"> ALL </span>
                    <span>students are in exactly</span>
                    <span className="font-weight-bold"> ONE </span>
                    {/* eslint-disable-next-line max-len */}
                    <span>group, else you will not be able to create the groups. Note that this means that if the create button at the bottom of this page is greyed out, the current group selection is impossible to create.</span>
                  </Popover>
                )}
              >
                <h5>
                  {/* eslint-disable-next-line max-len */}
                  <span>Select one or more columns that indicate in what group students should be placed </span>
                  <i className="fas fa-question-circle" />
                </h5>
              </OverlayTrigger>
            </div>
            <div className="row">
              <div className="col-lg-3" />
              <div className="col-lg-6 text-left">
                <ul className="list-unstyled mb-3">{groupSelector}</ul>
              </div>
              <div className="col-lg-3" />
            </div>


            <div className="my-1">
              <OverlayTrigger
                trigger="hover"
                placement="right"
                overlay={(
                  <Popover id="popover-basic" title="Category Info">
                    {/* eslint-disable-next-line max-len */}
                    <span>Select a column to use as category. Choose `Disabled` if all groups should be in the root group.</span>
                  </Popover>
                )}
              >
                <h5>
                  <span>Select a column to use as category </span>
                  <i className="fas fa-question-circle" />
                </h5>
              </OverlayTrigger>
            </div>
            <select
              ref={(ref) => { this.formRefs.context = ref; }}
              onChange={this.verify.bind(this)}
              className="form-control mb-3"
            >
              <option key={disabledValue} value={disabledValue}>
                {disabledValue}
              </option>
              {colSelector}
            </select>
            <div className="my-1">
              <OverlayTrigger
                trigger="hover"
                placement="right"
                overlay={(
                  <Popover id="popover-basic" title="Reformat Group Info">
                    {/* eslint-disable-next-line max-len */}
                    <span>Click below to reformat groups, such that their names are expanded with leading zeros.</span>
                    <span> This can be used to facilitate more intuitive sorting.</span>
                  </Popover>
                )}
              >
                <h5>
                  <span>Click below to reformat groups </span>
                  <i className="fas fa-question-circle" />
                </h5>
              </OverlayTrigger>
            </div>
            <Button variant="flat" size="sm" className="mb-3" onClick={this.formatGroupNames}>
              <span>Reformat Group Names</span>
            </Button>
            <div className="my-1">
              <h5>Create a project for every group</h5>
            </div>
            <div className="row">
              <div className="col-lg-4" />
              <div className="col-lg-4 text-left">
                <div className="form-check">
                  <label htmlFor="yesRadio">
                    <input type="radio" id="yesRadio" name="projectRadio" value="option1" ref={(ref) => { this.formRefs.projects = ref; }} onChange={this.toggleProjects} defaultChecked />
                    <span> Yes</span>
                  </label>
                </div>
                <div className="form-check">
                  <label htmlFor="noRadio">
                    <input type="radio" id="noRadio" name="projectRadio" value="option2" onChange={this.toggleProjects} />
                    <span> No</span>
                  </label>
                </div>
              </div>
              <div className="col-lg-4" />
            </div>
            <div hidden={!showPrepend}>
              <label htmlFor="prependText">
                <OverlayTrigger
                  trigger="hover"
                  placement="right"
                  overlay={(
                    <Popover id="popover-basic" title="Context Group Info">
                      <span>By default the project name matches the group name.</span>
                      <span>This text will be prefixed to every project name.</span>
                      <span>It is usefull to add an abbreviation of the course and edition, </span>
                      <span>because this way students who cloned the repository</span>
                      <span>also know which course it belongs to.</span>
                      <br />
                      {`For example: "${exampleGroup}" would become "${exampleProject}"`}
                    </Popover>
                  )}
                >
                  <h5>
                    <span>Enter a text that will be prepended to every project name </span>
                    <i className="fas fa-question-circle" />
                  </h5>
                </OverlayTrigger>
                <input value={projectPrefix} className="form-control mb-3" name="projectPrefix" type="text" id="prependText" ref={(ref) => { this.formRefs.prepend = ref; }} onChange={this.onInputChange.bind(this)} />
              </label>
            </div>
            <Button
              variant="flat"
              onClick={() => {
                this.sendGroup();
                modal.showModal();
              }}
              disabled={!possible}
            >
              <span>Create Groups and go to 4. Add TAs</span>
            </Button>
          </div>
          <div className="col-lg-3" />
        </div>
      </form>
    ) : null;
    if (page < 3) {
      return (
        <PoemPage />
      );
    }
    return (
      <div className="row">
        <div className="col-lg-8 text-center">
          <h1 className="mb-3">Import CSV</h1>
          {modal.render()}
          <div className="my-1 mt-5">
            <h5>Click the button below to add a CSV containing students and groups.</h5>
          </div>
          <input type="file" id="file" className="input-file" accept=".csv" onChange={this.onFileChange.bind(this)} style={{ display: 'none' }} />
          <Button variant="flat" size="sm" className="my-3" onClick={() => document.getElementById('file').click()}>
            <span>Choose CSV</span>
          </Button>
          {
            existing ? (
              <div>
                <LinkContainer to="/tool/ta-form" className={existing ? 'btn btn-primary my-5' : 'btn btn-light disabled my-5'} activeClassName="">
                  <Button variant="flat" onClick={() => setPage(4)}>
                    <span>Use existing groups</span>
                  </Button>
                </LinkContainer>
              </div>
            ) : null
          }

          <div className="row">
            <div className="col-lg-12 text-center">
              {showTable}
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12 text-left">{form}</div>
          </div>
        </div>
        <div className="col-lg-4 text-left">
          <div style={{ position: 'fixed' }} />
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
ImportCSV.propTypes = {
  users: PropTypes.shape({
    data: PropTypes.shape({}),
  }).isRequired,
  groups: PropTypes.shape({}).isRequired,
  fileData: PropTypes.shape({}).isRequired,
  newFile: PropTypes.func.isRequired,
  resetFile: PropTypes.func.isRequired,
  history: PropTypes.shape({}).isRequired,
  page: PropTypes.number.isRequired,
  setPage: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(ImportCSV);
