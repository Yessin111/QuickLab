import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AutoSuggest from 'react-autosuggest';
import { Link } from 'react-router-dom';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { LinkContainer } from 'react-router-bootstrap';
import { bindActionCreators } from 'redux';
import PoemPage from './PoemPage';
import * as taStyle from './taStyle.css';
import * as actions from '../../../../actions/actions';
import config from '../../../../config';
import { User } from '../../../structure/dataStructures';
import * as pageActions from '../../../../actions/pageActions';

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
    ...actions,
    ...pageActions,
  }, dispatch);
}

/**
 * Selects which variables from the state have to be used as props in the
 * component.
 *
 * @param state {Object}
 * @return {Object}
 */
function mapStateToProps(state) {
  return {
    page: state.page,
    groups: state.groups,
  };
}

/**
 * Gets the username of a suggestion.
 *
 * @param { data element } the suggestion where we want to have the username.
 * @return { string } the username of the suggestion.
  */
function getSuggestionValue(suggestion) {
  return suggestion.username;
}

/**
 * Render the username and name of a suggestion.
 *
 * @param { data element } the suggestion to be rendered.
 * @return { HTML element } a div containing the necessary data.
 */
function renderSuggestion(suggestion) {
  return <div>{`${suggestion.name} : @${suggestion.username}`}</div>;
}

/**
 * Find the edition path of a course.
 *
 * @param groups { Object } the course where we need the path of the edition.
 *
 * @returns { String } the path of the edition.
 */
function getEditionPath(groups) {
  const [edition] = groups.children;

  return `./${groups.id}/${edition.id}`;
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
      const filteredArray = group.children.filter(el => el.type === 'user' && el.id === ta);
      return filteredArray.length === 1;
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
      const filteredChildren = group.children.filter(el => el.id === steps[0]);

      if (filteredChildren.length === 1) {
        steps.shift();
        return doesGroupHaveTa(filteredChildren[0], steps, ta);
      }

      return false;
    }
    default: {
      return false;
    }
  }
}

class TaForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      suggestions: [],
      value: '',
      normalTas: [],
      headTas: [],
      toNextPage: false,
      addProcess: false,
      warningPassed: false,
    };
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
    this.submitToServer = this.submitToServer.bind(this);
    this.onChange = this.onChange.bind(this);
    this.addTaClick = this.addTaClick.bind(this);
    this.submitToServer = this.submitToServer.bind(this);
    this.onSuggestionKeyPress = this.onSuggestionKeyPress.bind(this);
  }

  componentDidMount() {
    axios.get(`${config.server}/getTas`, {
      params: this.getCourseAndEdition(),
    }).then((response) => {
      this.setState(response.data);
    }).catch((err) => {
      alert(err);
    });
  }

  /**
   * Makes axios call to request to get user list according to the URI encoded value.
   * These values get put in the suggestions array.
   *
   * @param { string } the value where suggestions need to be based on.
     */
  onSuggestionsFetchRequested({ value }) {
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.timeout = null;
      axios.get(`${config.server}/getUserList`, {
        params: {
          value: encodeURIComponent(value),
        },
      }).then((response) => {
        this.setState({ suggestions: response.data });
      })
        .catch(() => {
          this.setState({ suggestions: [] });
        });
    }, 400);
  }

  /**
    * Clears the suggestions array.
     */
  onSuggestionsClearRequested() {
    this.setState({
      suggestions: [],
    });
  }

  onSuggestionKeyPress(event) {
    const { suggestions, value } = this.state;
    if (event.key === 'Enter') {
      const match = suggestions.find(suggestion => getSuggestionValue(suggestion) === value);
      if (match) {
        this.addTaClick();
      } else if (suggestions.length > 0) {
        this.setState({
          value: getSuggestionValue(suggestions[0]),
        });
      }
    }
  }

  /**
   * Updates the value of the input box on change,
   * to make sure the following processes use the correct value.
   *
   * @param { event } the event of change in the input box that triggers this function.
   * @param { string } the new value after change of the input box.
     */
  onChange(event, { newValue }) {
    this.setState({
      value: newValue,
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

  /**
   * Changes modal error message.
   *
   * @param { string } the new message that should be displayed.
     */
  setModalText(msg) {
    this.setState({
      modalText: msg,
    });
  }

  /**
   * Closes warning modal.
   *
   * @param { string, state } the new message that should be displayed, the state of adding a TA.
   */
  closeWarningModal(msg, state) {
    this.setState({
      modalText: msg,
      addProcess: state,
      warningPassed: false,
      toNextPage: false,
    });
  }

  /**
   * Sets whether or not the warning was passed
   */
  passWarning() {
    this.setState({
      warningPassed: true,
      toNextPage: true,
    }, this.submitToServer);
  }

  /**
   * Returns a modal with the currently set error message.
   *
   * @return { HTML element } the html creation of a modal with the modal text.
     */
  showModal() {
    const {
      modalText, toNextPage, normalTas, headTas, addProcess, warningPassed,
    } = this.state;

    const func = toNextPage ? (() => this.closeWarningModal(null, false)) : null;
    const allowContinue = normalTas.length > 0 && headTas.length > 0;

    if (addProcess) {
      return (
        <Modal show={!!modalText} onHide={func}>
          <Modal.Header className="modal-header-warning" closeButton>
            <Modal.Title>Warning</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalText}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="dark" onClick={() => this.closeWarningModal(null, false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      );
    }

    if (allowContinue || warningPassed) {
      return (
        <Modal show={!!modalText} onHide={func}>
          {!toNextPage
            ? (
              <Modal.Header className="modal-header-danger" closeButton>
                <Modal.Title>Error</Modal.Title>
              </Modal.Header>
            )
            : (
              <Modal.Header className="modal-header-success" closeButton>
                <Modal.Title>Success</Modal.Title>
              </Modal.Header>
            )}
          <Modal.Body>
            {modalText}
          </Modal.Body>
          <Modal.Footer>
            {!toNextPage
              ? <Button variant="dark" onClick={() => this.setModalText(null)}>Close</Button>
              : (
                <Link to="/tool/course-data">
                  <Button variant="dark">
                    <span>Continue</span>
                  </Button>
                </Link>
              )
            }
          </Modal.Footer>
        </Modal>
      );
    }
    return (
      <Modal show={!!modalText} onHide={func}>
        <Modal.Header className="modal-header-warning" closeButton>
          <Modal.Title>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalText}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.setModalText(null)}>Go back</Button>
          <Button variant="dark" onClick={() => this.passWarning()}>Continue</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  /**
   * Makes sure the input is not the empty string.
   *
   * @return { boolean }
     */
  isValueEmpty() {
    const { value } = this.state;
    if (value === '') {
      this.setModalText('This field cannot be empty.');
      return false;
    }
    return true;
  }

  /**
   * Checks if a TA with the same name as input already exists,
   * and if so shows a modal with error message.
   *
   * @param { string } the TA that should not be in the list already.
   * @return { boolean }
     */
  containsTA(entry) {
    const { normalTas } = this.state;
    if (normalTas.includes(entry)) {
      this.setModalText('There already exists a TA with this name.');
      return false;
    }
    return true;
  }

  /**
   * Checks if a Head TA with the same name as input already exists,
   * and if so shows a modal with error message.
   *
   * @param { string } the Head TA that should not be in the list already.
   * @return { boolean }
     */
  containsHeadTA(entry) {
    const { headTas } = this.state;
    if (headTas.includes(entry)) {
      this.setModalText('There already exists a Head TA with this name.');
      return false;
    }
    return true;
  }

  /**
   * Adds a ( Head ) Ta.
   * The value of the checkbox is checked to determine what type of TA should be added.
   * The input, list of TAs and list of Head TAs is checked to filter out edge cases.
   * All input is converted to lowercase since Gitlab usernames do not have capital case letters.
     */
  addTaClick() {
    const {
      value, normalTas, headTas,
    } = this.state;
    const checkValue = document.getElementById('headTA').checked;

    this.setState({
      addProcess: true,
    });

    const entry = value.toLowerCase();

    if (!this.isValueEmpty() || !this.containsHeadTA(entry) || !this.containsTA(entry)) {
      return;
    }

    if (checkValue === true) {
      this.setState({
        headTas: [...headTas, entry].sort(),
      });
    } else {
      this.setState({
        normalTas: [...normalTas, entry].sort(
          (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()),
        ),
      });
    }

    this.setState({
      addProcess: false,
    });
  }

  /**
   * Removes the TA in question from the list by filtering all regular TAs with the same name.
   *
   * @param { string } the TA to be removed from the list.
     */
  removeTaClick(target) {
    const { normalTas } = this.state;

    this.setState({
      normalTas: normalTas.filter(ta => target !== ta),
    });
  }

  /**
   * Removes the Head TA in question from the list by filtering all Head TAs with the same name.
   *
   * @param { string } the Head TA to be removed from the list.
     */
  removeHeadTaClick(target) {
    const { headTas } = this.state;

    this.setState({
      headTas: headTas.filter(ta => target !== ta),
    });
  }

  addHeadTas(path) {
    const { headTas } = this.state;
    const { addGroupData, groups } = this.props;

    let tas = headTas;

    tas.forEach((el) => {
      if (doesGroupHaveTa(groups.groups, StepsInPath(path), el)) {
        tas = tas.filter(ta => ta !== el);
      }
    });

    tas.forEach((el) => {
      const user = User.createInstance(
        el, el, el, `${el}@tudelft.nl`, 'head_ta',
      );

      addGroupData(path, user);
    });
  }

  submitToServer(event) {
    if (event != null) {
      event.preventDefault();
    }

    const { addTAsToStore, groups, setPage } = this.props;
    const {
      normalTas, headTas, warningPassed,
    } = this.state;

    const data = {
      ...this.getCourseAndEdition(),
      normalTas,
      headTas,
    };

    const enoughTas = normalTas.length > 0 && headTas.length > 0;

    if (enoughTas || warningPassed) {
      addTAsToStore(normalTas, headTas);
      this.addHeadTas(getEditionPath(groups.groups));

      axios.post(`${config.server}/postTas`, data)
        .then(() => {
          setPage(5);
          this.setModalText('The TAs were sent to the server.');
          this.setState({ toNextPage: true });
        })
        .catch(() => {
          this.setModalText('The submitted data was not accepted by the server. Please check if the data is correct and try again.');
        });
    } else {
      this.setModalText('You have not submitted at least one Head TA & one Regular TA. Are you sure you want to continue?');
      this.setState({ toNextPage: true });
    }
  }

  render() {
    const {
      suggestions, value, normalTas, headTas, modalText,
    } = this.state;
    const { page } = this.props;

    const inputProps = {
      placeholder: 'Enter TA username',
      value,
      onChange: this.onChange,
      className: 'form-control',
      onKeyPress: this.onSuggestionKeyPress,
    };

    const autoSuggest = (
      <AutoSuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}

      />
    );

    if (page < 4) {
      return (
        <PoemPage />
      );
    }
    return (
      <div className="row">
        {modalText ? this.showModal() : null}
        <div className="col-lg-8 text-center">
          <form onSubmit={e => e.preventDefault()}>
            <h1 className="mb-3">Add Teaching Assistants</h1>
            <div className="row">
              <div className="col-lg-4 text-center">
                <div className="mt-3 mb-1">
                  <h5>Add a new TA from GitLab</h5>
                </div>

                <div style={taStyle} className="d-flex justify-content-center form-con my-1">
                  {/* TODO: verify the entered TA matches a username or an emailaddress */}
                  {/* TODO: select the first TA in the list when pressing enter */}
                  {autoSuggest}
                </div>
                <div className="mt-3 mb-1">
                  <h6>This TA is a...</h6>
                </div>
                <div className="row">
                  <div className="col-lg-3" />
                  <div className="col-lg-6 text-left">
                    <div className="form-check">
                      <label htmlFor="headTA">
                        <input type="radio" id="headTA" name="taRadio" value="option1" defaultChecked />
                        <span> Head TA</span>
                      </label>
                    </div>
                    <div className="form-check">
                      <label htmlFor="regTA">
                        <input type="radio" id="regTA" name="taRadio" value="option2" />
                        <span> Regular TA</span>
                      </label>
                    </div>
                  </div>
                  <div className="col-lg-3" />
                </div>
                {/* TODO: disable if there isn't a matching TA with that username or email */}
                <Button variant="flat" className="my-3" size="sm" onClick={this.addTaClick}>
                  <span>Add new TA</span>
                </Button>
              </div>
              <div className="col-lg-8 text-center">
                <ul className="list-unstyled list-group text-left text-truncate my-3">
                  <li className="list-group-item list-group-item-primary clearfix text-center align-middle">
                    <h4>TA List</h4>
                  </li>
                  {headTas.map(key => (
                    <li className="list-group-item clearfix" key={key}>
                      <OverlayTrigger
                        trigger="hover"
                        placement="left"
                        overlay={(
                          <Popover id="popover-basic" title="Head TA Info">
                            <span>Full name: </span>
                            <span>{key}</span>
                          </Popover>
                        )}
                      >
                        <div className="d-inline-block text-truncate align-middle" style={{ width: '45%' }}>
                          <span><i className="fas fa-user-graduate fa-2x text-success" /></span>
                          <span className="ml-3">{key}</span>
                        </div>
                      </OverlayTrigger>
                      <Button onClick={() => this.removeHeadTaClick(key)} variant="flat" className="float-right" style={{ width: '45%' }}>
                        <span>Remove this Head TA</span>
                      </Button>
                    </li>
                  ))}
                  {normalTas.map(key => (
                    <li className="list-group-item clearfix" key={key}>
                      {/* TODO: show full name as well as username */}
                      <OverlayTrigger
                        trigger="hover"
                        placement="left"
                        overlay={(
                          <Popover id="popover-basic" title="TA Info">
                            <span>Full name: </span>
                            <span>{key}</span>
                          </Popover>
                        )}
                      >
                        <div className="d-inline-block text-truncate align-middle" style={{ width: '45%' }}>
                          <span><i className="fas fa-user-tie fa-2x text-primary" /></span>
                          <span className="ml-3">{key}</span>
                        </div>
                      </OverlayTrigger>
                      <Button onClick={() => this.removeTaClick(key)} variant="flat" className="float-right" style={{ width: '45%' }}>
                        <span>Remove this TA</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <LinkContainer to="/tool/course-data" className="my-5" activeClassName="">
              <Button onClick={this.submitToServer} variant="flat">
                <span>Save TAs and go to 5. Groups</span>
              </Button>
            </LinkContainer>
          </form>
        </div>
        <div className="col-lg-4 text-left" />
      </div>
    );
  }
}

TaForm.propTypes = {
  groups: PropTypes.shape({}).isRequired,
  addTAsToStore: PropTypes.func.isRequired,
  addGroupData: PropTypes.func.isRequired,
  setPage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(TaForm);
