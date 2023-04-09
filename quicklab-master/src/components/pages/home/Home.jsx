import React from 'react';

/**
 * The Home page of the website.
 */
export default function Home() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-lg-12 text-center">
          <h1 className="mt-5">Welcome to QuickLab</h1>
          <p className="lead">Creating courses with ease.</p>
          <div>
            <span>Please login if you want to use this application.</span>
          </div>
          <div>
            <span>If you are logged in, a new button named tool should be revealed.</span>
          </div>
          <img src="logoFox.png" className="img-fluid marginLogo mt-3" alt="" width="500" />
        </div>
      </div>
    </div>
  );
}
