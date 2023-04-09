import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import 'react-table/react-table.css';
import Button from 'react-bootstrap/Button';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { bindActionCreators } from 'redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PoemPage from './PoemPage';
import * as userActions from '../../../../actions/actions';
import * as pageActions from '../../../../actions/pageActions';
import * as projectTypes from '../../../structure/project/projectTypes';
import config from '../../../../config';
import LoadingModal from '../../../structure/LoadingModal.jsx';

function mapStateToProps(state) {
  return {
    users: state.users,
    groups: state.groups,
    page: state.page,
    server: state.server,
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
    ...userActions,
    ...pageActions,
  }, dispatch);
}

function defaultState() {
  return {
    repo: projectTypes.createEmptyProject(),
    importType: projectTypes.EMPTY,
    possible: false,
    repoSettings: projectTypes.getDefaultSettings(),
    showAdvanced: false,
  };
}

function parseRepoToClient(repo) {
  switch (repo.importType) {
    case 'url':
      return {
        type: projectTypes.IMPORT_FROM_URL,
        url: repo.importUrl,
      };
    case 'zip':
      return {
        type: projectTypes.IMPORT_FROM_FILE,
        file: '',
      };
    case 'empty': default:
      return {
        type: projectTypes.EMPTY,
      };
  }
}

function parseRepoToServer(repo) {
  switch (repo.type) {
    case projectTypes.IMPORT_FROM_URL:
      return {
        importType: 'url',
        importUrl: repo.url,
      };
    case projectTypes.IMPORT_FROM_FILE:
      return {
        importType: 'zip',
        importUrl: '',
      };
    case projectTypes.EMPTY: default:
      return {
        importType: 'empty',
        importUrl: '',
      };
  }
}

function parseSettingsToClient(settings) {
  return {
    allowDeleteTag: !!settings.deleteTags,
    memberCheck: !!settings.commitGitlabUserOnly,
    preventSecrets: !!settings.rejectSecrets,
    commitMessageRegex: settings.commitRegex,
    branchNameRegex: settings.branchRegex,
    authorEmailRegex: settings.mailRegex,
    fileNameRegex: settings.filenameRegex,
  };
}

function parseSettingsToServer(settings) {
  return {
    deleteTags: settings.allowDeleteTag,
    commitGitlabUserOnly: settings.memberCheck,
    rejectSecrets: settings.preventSecrets,
    commitRegex: settings.commitMessageRegex,
    branchRegex: settings.branchNameRegex,
    mailRegex: settings.authorEmailRegex,
    filenameRegex: settings.fileNameRegex,
  };
}

class ProjectSettings extends React.Component {
  constructor() {
    super();

    this.state = defaultState();
    this.sendRepo = this.sendRepo.bind(this);
    this.onCheckboxChange = this.onCheckboxChange.bind(this);
    this.selectRepoType = this.selectRepoType.bind(this);
    this.getCourseAndEdition = this.getCourseAndEdition.bind(this);

    this.modal = new LoadingModal(this);
  }

  componentDidMount() {
    const { modal } = this;

    modal.showModal();
    axios.get(`${config.server}/projectSettings`, {
      params: this.getCourseAndEdition(),
    }).then((res) => {
      if (res.data && res.data.length > 0) {
        modal.showSuccess('Succesfully loaded the previously stored data from the server.');
        const repo = parseRepoToClient(res.data[0]);
        this.setState({
          importType: repo.type,
          repo,
          repoSettings: parseSettingsToClient(res.data[0]),
        });
      } else {
        modal.showWarning('No previously stored settings found. Please specify your settings here.');
      }
    }).catch((error) => {
      modal.showError(error.toString());
    });
  }

  /**
   * Update the selected file in the state.
   */
  onFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      this.setState({ repo: projectTypes.createProjectFromFile(file) });
    }
  }

  /**
   * Update the selected checboxes in the state.
   */
  onCheckboxChange(event) {
    const { repoSettings } = this.state;
    repoSettings[event.target.name] = !repoSettings[event.target.name];
    this.setState({
      repoSettings,
    });
  }

  /**
   * Checks whether the Regex is a valid regex.
   */
  onChangeRegex(event) {
    const { target } = event;
    try {
      target.style = '';
      RegExp(event.target.value);
      const { repoSettings } = this.state;
      repoSettings[event.target.name] = event.target.value;
      this.setState({
        repoSettings,
      });
    } catch (e) {
      target.style = 'border-color:red';
    }
  }

  /**
   * Handler that is used to change the url of a project.
   * @param {event} event the event that was created when changing the url.
   */
  onChangeUrl(event) {
    event.persist();
    this.setState(prevState => ({
      ...prevState,
      repo: {
        ...prevState.repo,
        url: event.target.value,
      },
    }));
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

  /**
   * Updates the project settings in the store.
   */
  sendRepo() {
    const { editDefaultRepo, setPage } = this.props;
    const { modal } = this;
    const { repo, repoSettings } = this.state;

    editDefaultRepo({
      ...repo,
      settings: repoSettings,
    });

    modal.showModal();

    const data = {
      ...this.getCourseAndEdition(),
      ...parseRepoToServer(repo),
      ...parseSettingsToServer(repoSettings),
    };

    axios.post(`${config.server}/projectSettings`, data)
      .then(() => {
        modal.showSuccess('Succesfully stored the settings to the database.', () => {
          setPage(7);
          const { history } = this.props;
          history.push('/tool/course-submit');
        });
      })
      .catch((error) => {
        modal.showError(`${error.toString()}`);
      });
  }

  /**
   * Handler that is used to change the type of the project.
   * @param {event} event the event that was created when switching the type.
   */
  selectRepoType(event) {
    let { importType, repo } = this.state;
    if (event === importType) {
      return;
    }
    importType = event;
    if (importType === projectTypes.EMPTY) {
      repo = projectTypes.createEmptyProject();
    } else if (importType === projectTypes.IMPORT_FROM_URL) {
      repo = projectTypes.createProjectFromUrl('');
    } else if (importType === projectTypes.FORK_FROM_URL) {
      repo = projectTypes.createForkedProject('');
    } else if (importType === projectTypes.IMPORT_FROM_FILE) {
      repo = projectTypes.createProjectFromFile('');
    } else {
      return;
    }
    this.setState({
      importType,
      repo,
    });
  }

  showHideAdvanced(val) {
    this.setState({
      showAdvanced: val,
    });
  }

  /**
   * Returns the form for entering a file to use as starting template for the projects.
   */
  renderGitLabImport() {
    const { repo } = this.state;
    return (
      <div className="my-1">
        <h5>Import Repository from Zip</h5>
        <ul className="list-unstyled">
          <li>
            <input type="file" id="file" className="input-file" accept=".gz" onChange={this.onFileChange.bind(this)} style={{ display: 'none' }} />
            <Button variant="flat" className="my-1" size="sm" onClick={() => document.getElementById('file').click()}>
              <span>Choose Export...</span>
            </Button>
          </li>
          <li>
            <p>
              <span>file:</span>
              {repo.file ? ` ${repo.file.name}` : ' Please select a file first'}
            </p>
          </li>
        </ul>
      </div>
    );
  }

  renderAdvancedSettings() {
    const { repoSettings, showAdvanced } = this.state;
    return (
      showAdvanced
        ? (
          <div>
            <div className="my-1">
              <h5>Only allow commit messages that match the following regex</h5>
            </div>
            <input type="text" value={repoSettings.commitMessageRegex} id="commitMessageRegex" name="commitMessageRegex" placeholder="e.g. Fixed \d+\..*" onChange={this.onChangeRegex.bind(this)} className="form-control mb-3" />
            <div className="my-1">
              <h5>Only allow branch names that match the following regex</h5>
            </div>
            <input type="text" value={repoSettings.branchNameRegex} id="branchNameRegex" name="branchNameRegex" placeholder="e.g. (feature|hotfix)\/*" onChange={this.onChangeRegex.bind(this)} className="form-control mb-3" />
            <div className="my-1">
              <h5>Only allow author emails that match the following regex</h5>
            </div>
            <input type="text" value={repoSettings.authorEmailRegex} id="authorEmailRegex" name="authorEmailRegex" placeholder="e.g. @my-company.com$" onChange={this.onChangeRegex.bind(this)} className="form-control mb-3" />
            <div className="my-1">
              <h5>Only allow commited filenames that match the following regex</h5>
            </div>
            <input type="text" value={repoSettings.fileNameRegex} id="fileNameRegex" name="fileNameRegex" placeholder="e.g. (jar|exe)$" onChange={this.onChangeRegex.bind(this)} className="form-control mb-3" />
          </div>
        )
        : null
    );
  }

  /**
   * Returns the form which contains all the inputs for settings that apply to all import types.
   */
  renderSettings() {
    const { repoSettings, showAdvanced } = this.state;
    return (
      <div className="mt-5">
        <h3 className="mb-3">General Project Settings</h3>
        <form>
          <div className="row">
            <div className="col-lg-3" />
            <div className="col-lg-6">
              <div className="my-1 mb-3">
                <h5>Developers are allowed to delete tags</h5>
                <div className="row">
                  <div className="col-lg-4" />
                  <div className="col-lg-4 text-left mb-3">
                    <div className="form-check">
                      <label htmlFor="allowDeleteTag">
                        <input type="radio" id="allowDeleteTag" name="allowDeleteTag" value="option1" onChange={this.onCheckboxChange} checked={repoSettings.allowDeleteTag} />
                        <span> Yes</span>
                      </label>
                    </div>
                    <div className="form-check">
                      <label htmlFor="allowDeleteTagCounter">
                        <input type="radio" id="allowDeleteTagCounter" name="allowDeleteTag" value="option2" onChange={this.onCheckboxChange} checked={!repoSettings.allowDeleteTag} />
                        <span> No</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4" />
                </div>
                <div className="my-1">
                  <h5>All commits need to be made by GitLab users</h5>
                </div>
                <div className="row">
                  <div className="col-lg-4" />
                  <div className="col-lg-4 text-left mb-3">
                    <div className="form-check">
                      <label htmlFor="memberCheck">
                        <input type="radio" id="memberCheck" name="memberCheck" value="option1" onChange={this.onCheckboxChange} checked={repoSettings.memberCheck} />
                        <span> Yes</span>
                      </label>
                    </div>
                    <div className="form-check">
                      <label htmlFor="memberCheckCounter">
                        <input type="radio" id="memberCheckCounter" name="memberCheck" value="option2" onChange={this.onCheckboxChange} checked={!repoSettings.memberCheck} />
                        <span> No</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4" />
                </div>
                <div className="my-1">
                  <h5>Make GitLab reject any files that are likely to contain a secret</h5>
                </div>
                <div className="row">
                  <div className="col-lg-4" />
                  <div className="col-lg-4 text-left mb-3">
                    <div className="form-check">
                      <label htmlFor="preventSecrets">
                        <input type="radio" id="preventSecrets" name="preventSecrets" value="option1" onChange={this.onCheckboxChange} checked={repoSettings.preventSecrets} />
                        <span> Yes</span>
                      </label>
                    </div>
                    <div className="form-check">
                      <label htmlFor="preventSecretsCounter">
                        <input type="radio" id="preventSecretsCounter" name="preventSecrets" value="option2" onChange={this.onCheckboxChange} checked={!repoSettings.preventSecrets} />
                        <span> No</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-4" />
                </div>
              </div>
            </div>
            <div className="col-lg-3" />
          </div>
          <OverlayTrigger
            trigger="hover"
            placement="right"
            overlay={(
              <Popover id="popover-basic" title="Advanced Settings Info">
                {/* eslint-disable-next-line max-len */}
                <span>The settings below are considered advanced and should only be used by experienced users. Inexperienced users can simply leave the inputs empty, since this will disable them.</span>
              </Popover>
            )}
          >
            <h3 className="mb-3">
              <span>Advanced Project Settings </span>
              <i className="fas fa-question-circle" />
            </h3>
          </OverlayTrigger>
          <div className="form-check">
            <label htmlFor="showAdvanced">
              <input className="form-check-input" type="checkbox" id="showAdvanced" onChange={() => this.showHideAdvanced(!showAdvanced)} checked={showAdvanced} />
              <span>Show Advanced Settings</span>
            </label>
          </div>
          <div className="row">
            <div className="col-lg-3" />
            <div className="col-lg-6">
              {this.renderAdvancedSettings()}
            </div>
            <div className="col-lg-3" />
          </div>
        </form>
      </div>
    );
  }

  /**
   * Renders a form to enter the url to use for project creation.
   *  It also provies a checkbox whether to keep the link to the original fork.
   */
  renderForkImport() {
    const { repo } = this.state;
    return (
      <div className="row">
        <div className="col-lg-12 text-center">
          <h5>Fork a repository from a URL</h5>
          <div className="alert alert-danger" role="alert">
            <span>Warning! Forking a project is not supported in the backend.</span>
            <span> Please use another method to create a project.</span>
          </div>
          <label htmlFor="repo-url-input">
            <span>URL</span>
            <input onChange={this.onChangeUrl.bind(this)} value={repo.url} size="50" id="repo-url-input" type="url" className="form-control" />
          </label>
          <label htmlFor="remove-link-url">
            <input type="checkbox" id="remove-link-url" name="removeLink" onChange={this.onCheckboxChange} />
            <span> Remove the link to the repository that was forked.</span>
          </label>
        </div>
      </div>
    );
  }

  /**
   * Renders a form to enter the url to use for project creation.
   */
  renderUrlImport() {
    const { repo } = this.state;
    return (
      <div className="my-1">
        <h5>Import from URL</h5>
        <p>
          <label htmlFor="repo-url-input">
            <div className="my-1">
              <span>URL</span>
            </div>
            <input onChange={this.onChangeUrl.bind(this)} value={repo.url} size="50" id="repo-url-input" type="url" className="form-control" />
          </label>
        </p>
      </div>
    );
  }

  /**
   * This function renders the correct form depending on which project type is selected.
   */
  renderImport() {
    const { importType } = this.state;
    if (importType === projectTypes.IMPORT_FROM_FILE) {
      return this.renderGitLabImport();
    } if (importType === projectTypes.IMPORT_FROM_URL) {
      return this.renderUrlImport();
    } if (importType === projectTypes.EMPTY) {
      return (
        <div className="my-1">
          <h5>Empty Project</h5>
          <p>This will create an empty project where users can commit their own files.</p>
        </div>
      );
    } if (importType === projectTypes.FORK_FROM_URL) {
      return this.renderForkImport();
    }
    return <p>Please select an initial repository type</p>;
  }

  render() {
    const { modal } = this;
    const { importType } = this.state;
    const { page, server } = this.props;
    if (page < 6) {
      return (
        <PoemPage />
      );
    }

    const SubmitButton = !server.fetching
      ? (
        <Button variant="flat" onClick={this.sendRepo}>
          <span>Save settings and go to 7. Course Submit</span>
        </Button>
      )

      : (

        <Button variant="flat" onClick={this.sendRepo} disabled>
          <span>
            <span className="spinner-grow spinner-grow-sm" />
            {' '}
            <span className="text">Still sending group data to database</span>
          </span>
        </Button>
      );
    return (
      <div>
        {modal.render()}
        <div className="row">
          <div className="col-lg-8 text-center">
            <h1 className="mb-3">Project Settings</h1>
            <div className="row">
              <div className="col-lg-3" />
              <div className="col-lg-6">
                <div className="my-1">
                  <h5>Specify import type</h5>
                </div>
                <Tabs activeKey={importType} id="uncontrolled-tab-example" onSelect={this.selectRepoType} className="tabStyle">
                  <Tab eventKey={projectTypes.IMPORT_FROM_FILE} title="From Zip">
                    {this.renderImport()}
                  </Tab>
                  <Tab eventKey={projectTypes.IMPORT_FROM_URL} title="From URL">
                    {this.renderImport()}
                  </Tab>
                  <Tab eventKey={projectTypes.EMPTY} title="Empty">
                    {this.renderImport()}
                  </Tab>
                  <Tab eventKey={projectTypes.FORK_FROM_URL} title="Fork URL">
                    {this.renderImport()}
                  </Tab>
                </Tabs>
                <div className="col-lg-3" />
              </div>
            </div>
            {this.renderSettings()}
            {SubmitButton}
          </div>
          <div className="col-lg-2 text-left">
            <ul className="list-unstyled">
              <li />
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
ProjectSettings.propTypes = {
  users: PropTypes.shape({
    data: PropTypes.shape({}),
  }).isRequired,
  groups: PropTypes.shape({}).isRequired,
  server: PropTypes.shape({}).isRequired,
  editDefaultRepo: PropTypes.func.isRequired,
  setPage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  history: PropTypes.shape({}).isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(ProjectSettings);
