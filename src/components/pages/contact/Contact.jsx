import React from 'react';
import * as style from './StyleContact.css';

/**
 * The Contact page of the website.
 */
export default function Contact() {
  return (
    <div className="container" style={style}>
      <div>
        <div className="col-lg-12 text-center">
          <div className="header">
            <h1 className="mt-5">Contact</h1>
            <h2 className="mt-5">Please contact the following people for help.</h2>
          </div>
        </div>
        <div className="col-lg-12 text-center">
          <div className="detailsOtto">
            <h4>Otto Visser</h4>
            <h5>o.w.visser@tudelft.nl</h5>
          </div>
          <div className="detailsSander">
            <h4>Sander van den Oever</h4>
            <h5>s.y.vandenoever@tudelft.nl</h5>
          </div>
        </div>
      </div>
    </div>
  );
}
