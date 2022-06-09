import React, { Component } from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import './App.css';

const loading = () => <div></div>;

const Workspaces = React.lazy(() => import('./views/workspaces'));
const Workspace = React.lazy(() => import('./views/workspace'));
const Applications = React.lazy(() => import('./views/applications'));
const Monitoring = React.lazy(() => import('./views/monitoring'));
// const Instances = React.lazy(() => import('./views/instances'));

class App extends Component {

  render() {
    return (
      <BrowserRouter>
          <React.Suspense fallback={loading()}>
            <Switch>
              <Route exact path="/dsp/console/workspaces/:id" name="Workspace" render={props => <Workspace {...props}/>} />
              <Route exact path="/dsp/console/workspaces" name="Workspaces" render={props => <Workspaces {...props}/>} />
              <Route exact path="/dsp/console/deployments" name='Deployments' render={props => <Applications {...props} />} />
              <Route exact path="/dsp/console/monitoring" name='Monitoring' render={props => <Monitoring {...props} />} />
              {/* <Route exact path=/instances" name='Instances' render={props => <Instances {...props} />} /> */}
              <Route exact path="/" render={() => <Redirect to="/dsp/console/workspaces"/>} />
            </Switch>
          </React.Suspense>
      </BrowserRouter>
    );
  }
}

export default App;
