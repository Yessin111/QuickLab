import React from 'react';
import Button from 'react-bootstrap/Button';
import { LinkContainer } from 'react-router-bootstrap';
import { bindActionCreators } from 'redux';
import axios from 'axios';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import config from '../../../../config';
import * as userActions from '../../../../actions/userActions';
import * as pageActions from '../../../../actions/pageActions';

/**
 * Maps the state of the store to the props of the class.
 *
 * @param state {Store}
 */
function mapStateToProps(state) {
  return {
    users: state.users,
  };
}

/**
 * Maps combines multiple action files and maps it to the props of the class.
 *
 * @param dispatch {Dispatch}
 */
function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    ...userActions,
    ...pageActions,
  }, dispatch);
}

/**
 * Generate the new state for an invalid api key error.
 *
 * @param {Object: {message, bodyMessage, succes, loading, firstLoad}}
 */
function generateApiError() {
  return {
    message: 'Invalid API key.',
    bodyMessage: 'Please enter a correct API key.'
      + ' You can find your API key on your GitLab account.',
    success: false,
    loading: false,
    firstLoad: false,
  };
}

/**
 * Class to display the home page of admin.
 */
class AdminHome extends React.Component {
  constructor(props) {
    super(props);

    this.messageModal = this.messageModal.bind(this);
    this.loadingModal = this.loadingModal.bind(this);
    this.resetDatabase = this.resetDatabase.bind(this);

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.requestApiKeyVerification = this.requestApiKeyVerification.bind(this);

    this.state = {
      message: null,
      bodyMessage: null,
      loading: false,
      success: false,
      apiKeyValue: '',
      firstLoad: false,
    };
  }

  componentDidMount() {
    this.setState({
      loading: true,
      firstLoad: true,
    });
    const checkExist = setInterval(() => {
      const { users } = this.props;
      if (users.currentUser) {
        clearInterval(checkExist);
        this.requestApiKeyVerification();
      }
    }, 100);
  }

  requestApiKeyVerification() {
    const { verifyApiKey } = this.props;
    verifyApiKey();
  }

  /**
   * Sends a request to the server to reset the database.
   * It also sets the state variables to handle the modals.
   *
   * @return {undefined}
   */
  resetDatabase() {
    this.setState({ loading: true });
    axios.post(`${config.server}/resetDatabase`).finally(() => {
      this.setState({ loading: false });
    }).catch((error) => {
      this.setState({
        message: error,
        success: false,
      });
    }).then(() => {
      this.setState({
        message: 'Succesfully reset the database.',
        success: true,
      });
    });
  }

  /**
   * Shows the message modal. The return null is added because the show variable
   * of the modal is slower than the state and otherwise the modal shows null for
   * a small amount of time instead of normally closing.
   *
   * @return {Modal | null}
   */
  messageModal() {
    const { message, success, bodyMessage } = this.state;
    if (!message) return null;

    const title = `${message}`;
    const body = bodyMessage || (success
      ? 'The data send to the server is handled correctly.'
      : 'Could not retrieve data from the server.'
      + ' Please check if your internet is connected.'
      + ' If this error keeps showing, please contact the administrator.');

    return (
      <Modal show={!!message} onHide={() => this.setState({ message: null, bodyMessage: null })}>
        {success
          ? (
            <Modal.Header className="modal-header-success" closeButton>
              <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
          )
          : (
            <Modal.Header className="modal-header-danger" closeButton>
              <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
          )}
        <Modal.Body>
          {body}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={() => this.setState({ message: null, bodyMessage: null })}>
            <span>Close</span>
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  /**
   * Returns the loading modal if loading is true. The return null is added, because
   * the show variable of modal is too slow and tends to still show for a bit with data
   * that is null.
   *
   * @return {Modal | null}
   */
  loadingModal() {
    const { loading } = this.state;
    if (!loading) return null;

    const message = 'Loading...';

    return (
      <Modal show={loading}>
        <Modal.Header className="modal-header-primary">
          <Modal.Title>{message}</Modal.Title>
        </Modal.Header>
        <Modal.Footer>
          <span>Please wait while the application is loading...</span>
        </Modal.Footer>
      </Modal>
    );
  }

  /**
   * Handles the change in the imput form.
   *
   * @param event {Event}
   * @return {undefined}
   */
  handleChange(event) {
    const { value } = event.target;
    this.setState({ apiKeyValue: value });
  }

  /**
   * Handles the submit in the input form.
   *
   * @param event {Event}
   * @return {undefined}
   */
  handleSubmit(event) {
    event.preventDefault();
    const { users, setApiValidation } = this.props;
    const { apiKeyValue } = this.state;

    this.setState({ loading: true });
    axios.post(`${config.server}/postApiKey`, {
      user: users.currentUser,
      key: apiKeyValue,
    }).then((response) => {
      setApiValidation(response.data);
      if (response.data) {
        this.setState({
          message: 'Api Key correctly updated in the server.',
          success: true,
        });
      } else {
        this.setState(generateApiError());
      }
    }).catch((error) => {
      this.setState({
        message: error,
        success: false,
      });
    }).finally(() => {
      this.setState({ loading: false });
    });
  }

  /**
   * The standard render method.
   *
   * @return {React Component | HTML Component}
   */
  render() {
    const { loading, apiKeyValue, firstLoad } = this.state;
    const { setPage, users, handledApiKeyError } = this.props;
    if (users.error) {
      this.setState(generateApiError());
      handledApiKeyError();
    }

    if (firstLoad && users.validApiKey) {
      this.setState({
        loading: false,
        firstLoad: false,
        success: true,
        message: 'API key is verified.',
        bodyMessage: 'The current API key can be used to create the course in GitLab.',
      });
    }
    const modal = loading ? this.loadingModal() : this.messageModal();

    return (
      <div className="row">
        {modal}
        <div className="col-lg-8 text-center">
          <h1 className="mb-3">Home</h1>
          <LinkContainer
            to="/tool/course-setup"
            className="my-5"
            activeClassName=""
            disabled={!users.validApiKey}
          >
            <Button variant="flat" onClick={() => setPage(2)}>
              <span>Go to 2. Course Setup</span>
            </Button>
          </LinkContainer>
        </div>
        <div className="col-lg-4 text-center">
          <form onSubmit={this.handleSubmit}>
            <h2>Enter API Key:</h2>
            <div className="row">
              <div className="col-lg-3" />
              <div className="col-lg-6">
                <input type="text" value={apiKeyValue} onChange={this.handleChange} className="form-control" />
              </div>
              <div className="col-lg-3" />
            </div>
            <br />
            <Button
              variant="flat"
              type="submit"
              className="my-1"
              size="sm"
            >
              <span>Submit API Key</span>
            </Button>
          </form>
        </div>
      </div>
    );
  }
}


AdminHome.propTypes = {
  users: PropTypes.shape({
    currentUser: PropTypes.string.isRequired,
    validApiKey: PropTypes.bool.isRequired,
  }).isRequired,
  setPage: PropTypes.func.isRequired,
  verifyApiKey: PropTypes.func.isRequired,
  handledApiKeyError: PropTypes.func.isRequired,
  setApiValidation: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(AdminHome);
