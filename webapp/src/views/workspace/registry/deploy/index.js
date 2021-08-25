import React, { Component } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Loader from '../../../loading';
import { postDataV1 } from '../../../../global';

const useStyles = (theme) => ({
  root: {
    flexWrap: 'wrap',
    padding: '10px 20px'
  },
  buttonGroup: {
    '& > *': {
      marginTop: theme.spacing(3),
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
  },
  title: {
    fontSize: '22px'
  },
  info: {
    fontSize: '15px'
  }
})

class DeployForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false
        };
    }

    _deployModel = (workspaceId, version, runtime, framework) => {
        const versionInt = parseInt(version);
        const url = `/dsp/api/v1/workspace/${workspaceId}/model/${versionInt}/deploy`;
        return postDataV1(url, { runtime, framework });
    }

    _handleSubmit = () => {
      const { workspaceId, version, runtime, framework, callback, errorHandler } = this.props;
      this.setState({ loading: true }, () => this._deployModel(workspaceId, version, runtime, framework)
        .then((res) => this.setState({ loading: false }, () => callback(res.data.info)))
        .catch((err) => this.setState({ loading: false }, () => errorHandler(err.response.data.error))));
    }

  render() {
    const { onCancel, classes, version } = this.props;
    const { loading } = this.state;

    return (
        <div className={classes.root}>
            <Loader loading={loading}/>
            <p className={clsx(classes.title)} id="modal-title">Deploy Model</p>
            <p className={clsx(classes.info)}>Are you sure to deloy version {version}</p>
            <div className={classes.buttonGroup}>
                <Button variant="contained" color="primary" onClick={this._handleSubmit}>Confirm</Button>
                <Button variant="contained" onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    )
  }
}

DeployForm.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    version: PropTypes.number.isRequired,
    runtime: PropTypes.string.isRequired,
    framework: PropTypes.string.isRequired,
    onCancel: PropTypes.func,
    callback: PropTypes.func,
    errorHandler: PropTypes.func
}

export default withStyles(useStyles)(DeployForm)