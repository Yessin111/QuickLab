import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { LinkContainer } from 'react-router-bootstrap';
import { bindActionCreators } from 'redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Dropdown from 'react-bootstrap/es/Dropdown';
import PoemPage from './PoemPage';
import * as userActions from '../../../../actions/actions';
import * as pageActions from '../../../../actions/pageActions';
import { Course, Group } from '../../../structure/dataStructures';
import config from '../../../../config';

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

function validateString(str) {
  return str.match(/^((\d|\w|[- ])*)/);
}

/**
 * Based on the year as input (e.g. 2019)
 * this function will return the edition in the correct format (e.g. 2019-2020)
 *
 * @param year { int }
 * @returns {string}
 */
function createEditionString(year, quarter) {
  return `${year}-${year + 1} Q${quarter}`;
}

/**
 * Makes an array of editions in the correct format.
 * @returns {Array}
 */
function createEditionList() {
  const year = new Date().getFullYear() - 1;
  const month = new Date().getMonth();
  const amount = 3;
  const array = [];

  if (month < 2) { // show Q2
    array.push(createEditionString(year, 2));
  }

  if (month < 4) { // show Q3
    array.push(createEditionString(year, 3));
  }

  if (month < 7) { // show Q4
    array.push(createEditionString(year, 4));
  }

  for (let i = 1; i < amount; i += 1) {
    array.push(createEditionString(year + i, 1));
    array.push(createEditionString(year + i, 2));
    array.push(createEditionString(year + i, 3));
    array.push(createEditionString(year + i, 4));
  }

  return array;
}

/**
 * Checks if the input exists, if so, the input is returned.
 * If not, a standard message is returned.
 * @param input { string }
 * @returns {*}
 */
function showDropDownText(input) {
  if (!input) {
    return 'Please choose your edition';
  }
  return input;
}

class CourseSetup extends React.Component {
  constructor(props) {
    super(props);

    this.onSubmit = this.onSubmit.bind(this);
    this.addCourse = this.addCourse.bind(this);
    this.addEdition = this.addEdition.bind(this);
    this.setError = this.setError.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onCourseSelectionChange = this.onCourseSelectionChange.bind(this);
    this.toggleVisibilityAddEdition = this.toggleVisibilityAddEdition.bind(this);
    this.toggleVisibilityCourseEdition = this.toggleVisibilityCourseEdition.bind(this);
    this.state = {
      courseIds: [],
      selected: '',
      error: null,
      modalText: null,
      courseCode: '',
      courseName: '',
      courseEdition: '',
      addEdition: '',
      selectedEdition: '',
      addEditionString: false,
      courseEditionString: false,
    };
  }

  componentDidMount() {
    this.loadCourses();
  }

  onSubmit() {
    const { storeGroups, setPage } = this.props;
    const { selected, selectedEdition } = this.state;
    setPage(3);
    axios.get(`${config.server}/getCourseById`, {
      params: {
        course: selected,
        edition: selectedEdition,
      },
    })
      .then((response) => {
        storeGroups(response.data);
      }).catch((err) => {
        this.setError(err);
        this.setModalText('Could not retrieve data from the server. Please check if your internet is connected. If this error keeps showing, please contact the administrator.');
      });
  }

  onInputChange(event) {
    const { target } = event;
    const { name, value } = target;
    const validateResult = validateString(value);
    const validInput = validateResult ? validateResult[0] : '';
    this.setState({
      [name]: validInput,
    });
  }

  onCourseSelectionChange(event) {
    this.setState({
      selected: event.target.value,
    }, this.selectDefaultEdition);
  }

  setModalText(msg) {
    this.setState({
      modalText: msg,
    });
  }

  setError(msg) {
    this.setState({
      error: msg,
    });
  }

  setAddEdition(edition) {
    this.setState({
      addEdition: edition,
    });
  }

  setEdition(edition) {
    this.setState({
      courseEdition: edition,
    });
  }

  toggleVisibilityAddEdition() {
    const { addEditionString } = this.state;

    this.setState({
      addEditionString: !addEditionString,
    });
  }

  toggleVisibilityCourseEdition() {
    const { courseEditionString } = this.state;

    this.setState({
      courseEditionString: !courseEditionString,
    });
  }

  addEdition() {
    const { selected, addEdition } = this.state;
    const edition = Group.createInstance(addEdition, [], 'edition');

    axios.post(`${config.server}/addEdition`, {
      course: selected,
      edition,
    }).then(() => {
      this.loadCourses();
      this.setState({
        addEdition: '',
        selectedEdition: addEdition,
      });
    }).catch((err) => {
      this.setError(err);
      this.setModalText('The data you entered is not accepted by the server. Please check if the data is correct and does not yet exist.');
    });
  }

  addCourse() {
    const { courseCode, courseName, courseEdition } = this.state;
    const course = Course.createInstance(
      courseCode,
      courseName,
    );
    const edition = Group.createInstance(courseEdition, [], 'edition');
    course.setChildren([edition]);

    axios.post(`${config.server}/postCourse`, course)
      .then(() => {
        this.loadCourses(courseCode);
        this.clearInputs();
      }).catch((err) => {
        this.setError(err);
        this.setModalText('The data you entered is not accepted by the server. Please check if the data is correct and does not yet exist.');
      });
  }

  loadCourses(preferredId) {
    axios.get(`${config.server}/getCourseList`)
      .then((response) => {
        if (response.data.length !== 0) {
          const { selected } = this.state;
          let newSelected;
          if (preferredId && response.data.some(course => course.id === preferredId)) {
            newSelected = preferredId;
          } else if (selected && response.data.some(course => course.id === selected)) {
            newSelected = selected;
          } else {
            newSelected = response.data[0].id;
          }
          this.setState({
            courseIds: response.data,
            selected: newSelected,
          });
          this.selectDefaultEdition();
        }
      }).catch((err) => {
        this.setError(err);
        this.setModalText('Could not retrieve data from the server. Please check if your internet is connected. If this error keeps showing, please contact the administrator.');
      });
  }

  selectDefaultEdition() {
    const { courseIds, selected, selectedEdition } = this.state;
    const course = courseIds.find(c => c.id === selected);
    if (!selectedEdition && course.editions.length > 0) {
      this.setState({
        selectedEdition: course.editions[0],
      });
    } else if (selectedEdition && !course.editions.some(edition => edition === selectedEdition)) {
      this.setState({
        selectedEdition: course.editions.length > 0 ? course.editions[0] : '',
      });
    }
  }

  errorModal() {
    const { error, modalText } = this.state;
    const title = `${error}`;
    return (
      <Modal show={!!error} onHide={() => this.setError(null)}>
        <Modal.Header className="modal-header-danger" closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalText}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.setError(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  clearInputs() {
    this.setState({
      courseCode: '',
      courseName: '',
      courseEdition: '',
    });
  }


  render() {
    const { page } = this.props;
    const {
      courseIds, selected, error,
      courseCode, courseName, courseEdition, addEdition, selectedEdition,
      addEditionString, courseEditionString,
    } = this.state;
    const selection = (
      <select
        onChange={this.onCourseSelectionChange}
        className="form-control"
        value={selected}
      >
        {courseIds.map(c => <option key={c.id} value={c.id}>{`${c.id} - ${c.name}`}</option>)}
      </select>
    );
    let editionSelection = null;
    if (selected) {
      const course = courseIds.find(el => el.id === selected);
      if (course && course.editions.length > 0) {
        editionSelection = (
          <select
            value={selectedEdition}
            onChange={(event) => {
              this.setState({ selectedEdition: event.target.value });
            }}
            className="form-control mb-3"
          >
            {course.editions.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
        );
      }
    }

    if (page < 2) {
      return (
        <PoemPage />
      );
    }
    const selectedCourse = selected && courseIds.find(course => course.id === selected);
    const disableAddCourse = !(courseCode && courseName && courseEdition)
      || courseIds.some(course => course.id === courseCode);
    const canContinue = !!selectedEdition;

    const canAddEdition = addEdition && selectedCourse
      && !selectedCourse.editions.some(edition => edition === addEdition);
    const course = courseIds.find(el => el.id === selected);

    const dropDownLeft = !addEditionString ? (
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
          {showDropDownText(addEdition)}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {
              createEditionList().map(key => (
                <Dropdown.Item key={key} onClick={() => this.setAddEdition(key)}>
                  {key}
                </Dropdown.Item>
              ))
          }
        </Dropdown.Menu>
      </Dropdown>
    ) : null;

    const dropDownRight = !courseEditionString ? (
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
          {showDropDownText(courseEdition)}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {
              createEditionList().map(key => (
                <Dropdown.Item key={key} onClick={() => this.setEdition(key)}>
                  {key}
                </Dropdown.Item>
              ))
          }
        </Dropdown.Menu>
      </Dropdown>
    ) : null;

    const openStringLeft = addEditionString ? (
      <input type="text" name="addEdition" value={addEdition} onChange={this.onInputChange} className="form-control mb-3" placeholder="Your own edition" />
    ) : null;

    const openStringRight = courseEditionString ? (
      <input type="text" name="courseEdition" value={courseEdition} onChange={this.onInputChange} className="form-control mb-3" placeholder="Your own edition" />
    ) : null;

    const toggleLeft = !addEditionString ? 'I want to enter my own edition' : 'I want predefined editions';
    const toggleRight = !courseEditionString ? 'I want to enter my own edition' : 'I want predefined editions';

    const editionPopOver = (
      <Popover id="popover-basic" title="Edition Specification Info">
        <span>
            You can use the button below to choose between predefined editions
            or to choose your own edition name.
            But please remember, the predefined editions were predefined
        </span>
        <span className="font-weight-bold"> for a reason. </span>
      </Popover>
    );

    return (
      <div className="row">
        {error ? this.errorModal() : null}
        <div className="col-lg-8 text-center">
          <form>
            <h1 className="mb-3">Setup the Course</h1>
            <div className="row">
              <div className="col-lg-5">
                <h3 className="mb-5">Select existing course</h3>
                {(course && course.editions.length)
                  ? (
                    <div>
                      <div className="my-1 mt-5">
                        <h5>Select the course you would like to use</h5>
                        {selection}
                      </div>
                      <div className="my-1 mt-3">
                        <h5>Select an edition...</h5>
                        {editionSelection}
                      </div>
                      <div className="my-1">
                        <OverlayTrigger
                          trigger="hover"
                          placement="right"
                          overlay={
                              editionPopOver
                              }
                        >
                          <h5>
                            <span>Or specify a new edition </span>
                            <i className="fas fa-question-circle" />
                          </h5>
                        </OverlayTrigger>

                        { dropDownLeft }
                        { openStringLeft }

                        <div className="my-1" />
                        <Button className="btn-warning" size="sm" onClick={this.toggleVisibilityAddEdition} block>
                          <span>{ toggleLeft }</span>
                        </Button>
                        <div className="my-4" />
                        <Button className="btn-primary" size="lg" onClick={this.addEdition} disabled={!canAddEdition} block>
                          <span>Add Edition</span>
                        </Button>
                        <div className="my-1" />
                      </div>
                    </div>
                  )
                  : (
                    <div>
                      <div className="my-1 mt-5">
                        <h5>There are no courses yet. Please create one to the right.</h5>
                      </div>
                    </div>
                  )}


              </div>
              <div className="col-lg-2">
                <h3 className="mb-5">or</h3>
              </div>
              <div className="col-lg-5">
                <h3 className="mb-5">Create new course</h3>
                <div className="my-1">
                  <h5>Specify course code</h5>
                </div>
                {/* TODO: Show error when a course with this ID already exists */}
                <input type="text" name="courseCode" value={courseCode} onChange={this.onInputChange} className="form-control mb-3" placeholder="e.g. CS0123" />
                <div className="my-3 mt-4">
                  <h5>Specify course name</h5>
                </div>
                <input type="text" name="courseName" value={courseName} onChange={this.onInputChange} className="form-control mb-3" placeholder="e.g. Software Organisation" />
                <div className="my-1 mt-3">
                  <OverlayTrigger
                    trigger="hover"
                    placement="right"
                    overlay={
                      editionPopOver
                          }
                  >
                    <h5>
                      <span>Specify course edition </span>
                      <i className="fas fa-question-circle" />
                    </h5>
                  </OverlayTrigger>
                </div>

                {dropDownRight}
                {openStringRight}

                <div className="my-2" />
                <Button className="btn-warning" size="sm" onClick={this.toggleVisibilityCourseEdition} block>
                  <span>{ toggleRight }</span>
                </Button>
                <div className="my-4" />
                <Button className="btn-primary" size="lg" onClick={this.addCourse} disabled={disableAddCourse} block>
                  <span>Add Course</span>
                </Button>
              </div>
            </div>
            <LinkContainer to="/tool/import-csv" className="my-5" activeClassName="">
              <Button onClick={this.onSubmit} variant="flat" disabled={!canContinue}>
                <span>Save Course and go to 3. Import CSV</span>
              </Button>
            </LinkContainer>
          </form>
        </div>
        <div className="col-lg-4 text-left" />
      </div>
    );
  }
}

CourseSetup.propTypes = {
  storeGroups: PropTypes.func.isRequired,
  setPage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
};


export default connect(mapStateToProps, mapDispatchToProps)(CourseSetup);
