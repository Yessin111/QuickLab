import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import Button from 'react-bootstrap/Button';

/**
 * The Home page of the website.
 */
export default function NotFound() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-lg-1 text-center" />
        <div className="col-lg-10 text-center">
          <h1 className="my-5">Error 404</h1>
          <div className="row">
            <div className="col-lg-2" />
            <div className="col-lg-8 text-center">
              <h2 className="font-weight-light font-italic">
                <span className="my-1">“A user got lost on this site</span>
                <br />
                <span className="my-1">All alone, no escape in their sight</span>
                <br />
                <span className="my-1">But the admins were cool</span>
                <br />
                <span className="my-1">Left behind this one tool</span>
                <br />
                <span className="my-1">Leading them to a path that was right”</span>
                <br />
              </h2>
              <div className="mt-5">
                {/* eslint-disable-next-line max-len */}
                <h4>It looks like you are currently at a page that does not exist. Click the button below to go back to the main page.</h4>
                <LinkContainer to="/" className="my-3" activeClassName="">
                  <Button variant="flat">
                    <span>Go back to the main page</span>
                  </Button>
                </LinkContainer>
              </div>
            </div>
            <div className="col-lg-2" />
          </div>
        </div>
        <div className="col-lg-1 text-center" />
      </div>
    </div>
  );
}
