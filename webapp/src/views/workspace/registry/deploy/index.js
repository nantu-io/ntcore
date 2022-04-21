import React, { Component } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Loader from '../../../loading';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import { postDataV1 } from '../../../../global';

const useStyles = (theme) => ({
  root: {
    flexWrap: 'wrap',
    padding: '10px 20px'
  },
  buttonGroup: {
    '& > *': {
      marginTop: theme.spacing(4),
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
  },
  title: {
    fontSize: '22px'
  },
  info: {
    fontSize: '16px'
  },
  command: {
    marginTop: theme.spacing(3),
    minWidth: 550,
  },
  workflow: {
    marginTop: theme.spacing(1),
    minWidth: 550,
  },
})

class DeployForm extends Component {
  constructor(props) {
      super(props);
      this.state = {
          loading: false,
          command: null,
          workflow: null,
      };
  }

  _deployModel = (workspaceId, workflow, command) => {
    return postDataV1('/dsp/api/v1/deployments', { workspaceId, workflow, command });
  }

  _handleSubmit = () => {
    const { workspaceId, callback, errorHandler} = this.props;
    const { workflow, command } = this.state;
    this.setState({ loading: true }, () => this._deployModel(workspaceId, workflow, command)
      .then((res) => this.setState({ loading: false }, () => callback(res.data.info)))
      .catch((err) => this.setState({ loading: false }, () => errorHandler(err.response.data.error))));
  }

  _handleCommandChange = (e) => this.setState({ command: e.target.value });
  _handleWorkflowChange = (e) => this.setState({ workflow: e.target.value });

  _renderAPIDeploymentForm = () => {
    const { onCancel, classes, version } = this.props;
    const { loading } = this.state;

    return (
      <div className={classes.root}>
        <Loader loading={loading}/>
        <h2>Deploy Model</h2>
        <p className={clsx(classes.info)}>Are you sure to deloy version {version}</p>
        <div className={classes.buttonGroup}>
            <Button variant="contained" color="primary" onClick={this._handleSubmit}>Confirm</Button>
            <Button variant="contained" onClick={onCancel}>Cancel</Button>
        </div>
      </div>)
  }

  _renderBatchDeploymentForm = () => {
    const { onCancel, classes } = this.props;
    const { loading, command } = this.state;

    return (
      <div className={classes.root}>
        <Loader loading={loading}/>
        <h2>Deploy Model</h2>
        <FormControl className={classes.workflow}>
          <TextField
            required
            id="workflow"
            label="Workflow Repo"
            fullWidth
            variant="outlined"
            size="small"
            className={classes.textField}
            onChange={this._handleWorkflowChange}
          />
        </FormControl>
        <FormControl className={classes.command}>
          <TextField
              id="command-line-entrypoint"
              label="Command to execute script (e.g., python script.py)"
              required
              value={command}
              multiline
              rows={5}
              placeholder=''
              variant="outlined"
              onChange={this._handleCommandChange}
          />
        </FormControl>
        <div className={classes.buttonGroup}>
            <Button variant="contained" color="primary" onClick={this._handleSubmit}>Confirm</Button>
            <Button variant="contained" onClick={onCancel}>Cancel</Button>
        </div>
      </div>)
  }

  render() {
    const { workspaceType } = this.props;
    return workspaceType === 'Batch' ? this._renderBatchDeploymentForm() : this._renderAPIDeploymentForm();
  }
}

DeployForm.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    workspaceType: PropTypes.string.isRequired,
    version: PropTypes.number.isRequired,
    runtime: PropTypes.string.isRequired,
    framework: PropTypes.string.isRequired,
    onCancel: PropTypes.func,
    callback: PropTypes.func,
    errorHandler: PropTypes.func
}

export default withStyles(useStyles)(DeployForm)