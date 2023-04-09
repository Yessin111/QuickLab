import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ImplicitCallback, SecureRoute, Security } from '@okta/okta-react';

import Home from './pages/home/Home';
import Admin from './pages/admin/Admin';
import Contact from './pages/contact/Contact';
import NotFound from './pages/error/NotFound';
import Layout from './layout/Layout';

/**
 * App class that is the actual app being rendered.
 */
function App() {
  // TODO: remove these settings to a separate config file for easy access.
  // Okta configuration settings.
  const oktaConfig = {
    issuer: 'https://dev-935937.okta.com/oauth2/aus15mfw9lCjo4S0v357',
    redirect_uri: `${window.location.origin}/implicit/callback`,
    client_id: '0oaiqp70tyjzCiUxT356',
  };

  return (
    <Router>
      <Security {...oktaConfig}>
        <Layout>
          <Switch>
            <Route path="/" exact component={Home} />
            <SecureRoute path="/tool" component={Admin} />
            <Route path="/contact/*" component={NotFound} />
            <Route path="/contact" component={Contact} />
            <Route path="/implicit/callback" component={ImplicitCallback} />
            <Route path="*" component={NotFound} />
          </Switch>
        </Layout>
      </Security>
    </Router>
  );
}

export default App;
