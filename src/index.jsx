import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';

import store from './stores/store';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'popper.js';

import './index.css';
import App from './components/App';

/*
The render of the application.
*/
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>, document.getElementById('root'),
);
