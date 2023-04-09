import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

/**
 * LoadingModal class. Add the parent or component where it is called in to update the state.
 * How to initialise: const modal = new LoadingModal(this);
 *
 * @param parent {ReactComponent}
 */
export default class LoadingModal {
  constructor(parent) {
    this.resetModal();
    this.parent = parent;
  }

  /**
   * Update the state to cause a re-render.
   */
  updateParent() {
    this.parent.setState({ modalStateUpdate: true });
  }

  /**
   * Shows the modal.
   */
  showModal() {
    this.show = true;
    this.updateParent();
  }

  /**
   * Hides the modal.
   */
  hideModal() {
    this.show = false;
    this.updateParent();
  }

  resetModal() {
    this.show = false;
    this.loading = true;
    this.title = 'Loading...';
    this.text = null;
    this.redirect = null;
    this.color = 'modal-header-primary';
  }

  /**
   * Shows a warning.
   * @param text { String }
   * @param redirect { function }
   */
  showWarning(text, redirect = null) {
    this.color = 'modal-header-warning';
    this.title = 'Warning';
    this.text = text;
    this.redirect = redirect;
    this.loading = false;
    this.updateParent();
  }

  /**
   * Shows a sucess message.
   * @param text { String }
   * @param redirect { function }
   */
  showSuccess(text, redirect = null) {
    this.color = 'modal-header-success';
    this.title = 'Succes';
    this.text = text;
    this.redirect = redirect;
    this.loading = false;
    this.updateParent();
  }

  /**
   * Shows an error.
   * @param text { String }
   * @param redirect { function }
   */
  showError(text, redirect = null) {
    this.color = 'modal-header-danger';
    this.title = 'Error';
    this.text = text;
    this.redirect = redirect;
    this.loading = false;
    this.updateParent();
  }

  /**
   * Renders the modal.
   * @returns { ReactHTML }
   */
  render() {
    return (
      <Modal
        show={this.show}
        onHide={() => {
          if (!this.loading) this.hideModal();
          this.updateParent();
        }}
      >
        <Modal.Header className={this.color} closeButton={!this.loading}>
          <Modal.Title>{this.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.text}
        </Modal.Body>
        {this.loading ? <Modal.Footer /> : (
          <Modal.Footer>
            <Button
              variant="dark"
              onClick={() => {
                this.hideModal();
                if (this.redirect) this.redirect();
                this.updateParent();
              }}
            >
            Continue
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    );
  }
}
