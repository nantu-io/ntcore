import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import BaseLayout from '../baseLayout';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import Registry from './registry';
import Experiments from './experiments';
import Deployments from './deployments';
import MuiAlert from '@material-ui/lab/Alert';
import { useStyles, STEPS, OPTIONAL_STEPS, SEVERITY } from './properties';
import { fetchDataV1 } from '../../global';

class Workspace extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeStep: 0,
      snackBarOpen: false,
      snackBarContent: null,
      snackBarSeverity: SEVERITY.INFO,
      skipped: new Set([]),
      workspaceId: null,
      workspaceType: null
    }
    this._handleNext = this._handleNext.bind(this);
    this._handleBack = this._handleBack.bind(this);
    this._handleSkip = this._handleSkip.bind(this);
    this._handleReset = this._handleReset.bind(this);
    this._handleStep = this._handleStep.bind(this);
    this._closeSnackBar = this._closeSnackBar.bind(this);
  }

  componentDidMount() {
    const { match: {params} } = this.props;
    fetchDataV1(`/dsp/api/v1/workspace/${params.id}`)
      .then((res) => this.setState({ workspaceId: params.id, workspaceType: res.data.type }))
      .catch((err) => this._openSnackBar(SEVERITY.ERROR, err));
  }

  _handleNext() {
    const currActiveStep = this.state.activeStep;
    const newSkipped = this.state.skipped;
    if (newSkipped.has(currActiveStep)) {
      newSkipped.delete(currActiveStep);
    }
    this.setState({ activeStep: currActiveStep + 1, skipped: newSkipped });
  }

  _handleBack() {
    this.setState({ activeStep: this.state.activeStep - 1 });
  }

  _handleSkip() {
    if (!OPTIONAL_STEPS.has(this.state.activeStep)) {
      throw new Error("You can't skip a step that isn't optional.");
    }
    const currActiveStep = this.state.activeStep;
    const newSkipped = this.state.skipped;
    newSkipped.add(currActiveStep);
    this.setState({ activeStep: currActiveStep + 1, skipped: newSkipped });
  }

  _handleReset() {
    this.setState({ activeStep: 0 });
  }

  _handleStep(step) {
    this.setState({ activeStep: step });
  };

  _openSnackBar(severity, message) {
    const snackBarContent = message ? message.toString() : '';
    this.setState({ snackBarOpen: true, snackBarSeverity: severity, snackBarContent: snackBarContent });
  };

  _closeSnackBar() {
    this.setState({ snackBarOpen: false });
  };

  _createStepContent() {
    const { match: {params} } = this.props;
    const { activeStep, workspaceType } = this.state;
    switch(activeStep) {
      // Add key to trigger update on child when workspaceType is changed.
      case 0: return <Experiments key={`exp-${workspaceType}`} workspaceId={params.id} onSuccess={(msg) => this._openSnackBar(SEVERITY.SUCCESS, msg)} onError={(err) => this._openSnackBar(SEVERITY.ERROR, err)}></Experiments>;
      case 1: return <Registry key={`reg-${workspaceType}`} workspaceId={params.id} workspaceType={workspaceType} onSuccess={(msg) => this._openSnackBar(SEVERITY.SUCCESS, msg)} onError={(err) => this._openSnackBar(SEVERITY.ERROR, err)}></Registry>;
      case 2: return <Deployments key={`dep-${workspaceType}`} workspaceId={params.id} onError={(err) => this._openSnackBar(SEVERITY.ERROR, err)}></Deployments>;
      default: return null;
    }
  }

  _createSnackBar() {
    const { snackBarOpen, snackBarSeverity, snackBarContent } = this.state;
    return (
      <Snackbar 
        open={snackBarOpen} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center'}}
        autoHideDuration={6000} 
        onClose={this._closeSnackBar}>
        <MuiAlert elevation={6} variant="filled" onClose={this._closeSnackBar} severity={snackBarSeverity}>
          {snackBarContent}
        </MuiAlert>
      </Snackbar>);
  }

  render() {
    const { classes } = this.props;

    return (
      <BaseLayout index={0}>
        {this._createSnackBar()}
        <div className={classes.root}>
          <Stepper nonLinear className={classes.stepper} activeStep={this.state.activeStep}>
            {Object.values(STEPS).map((label, index) => {
              const stepProps = {};
              const labelProps = {};
              if (OPTIONAL_STEPS.has(index)) {
                labelProps.optional = <Typography variant="caption">Optional</Typography>;
              }
              if (this.state.skipped.has(index)) {
                stepProps.completed = false;
              }
              return (
                <Step key={label} {...stepProps}>
                  <StepButton color="inherit" onClick={() => this._handleStep(index)}>
                      {label}
                  </StepButton>
                </Step>);
            })}
          </Stepper>
          <div>
            {this._createStepContent()}
          </div>
        </div>
      </BaseLayout>
    );
  }
}

export default withStyles(useStyles)(Workspace)