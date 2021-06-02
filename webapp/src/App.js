import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import BaseLayout from './views/baseLayout';
import './App.css';

const loading = () => <BaseLayout></BaseLayout>;

const Workspaces = React.lazy(() => import('./views/workspaces'));
const Workspace = React.lazy(() => import('./views/workspace'));
const Applications = React.lazy(() => import('./views/applications'));

class App extends Component {

  render() {
    return (
      <BrowserRouter>
          <React.Suspense fallback={loading()}>
            <Switch>
              <Route exact path="/dsp/console/workspaces/:id" name="Workspace" render={props => <Workspace {...props}/>} />
              <Route exact path="/dsp/console/workspaces" name="Workspaces" render={props => <Workspaces {...props}/>} />
              <Route exact path="/dsp/console/applications" name='Deployments' render={props => <Applications {...props} />} />
            </Switch>
          </React.Suspense>
      </BrowserRouter>
    );
  }
}

export default App;
