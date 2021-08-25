import React, { Component } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
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

class RegisterForm extends Component {
    constructor(props) {
        super(props);
        this.state = { loading: false };
    }

    _registerModel = (workspaceId, version) => {
        const versionInt = parseInt(version);
        const url = `/dsp/api/v1/workspace/${workspaceId}/registry`;
        return postDataV1(url, { version: versionInt });
    }

    _handleSubmit = () => {
      const { workspaceId, version, callback, errorHandler } = this.props;
      this.setState({ loading: true }, () => this._registerModel(workspaceId, version)
        .then((res) => this.setState({ loading: false }, () => callback(res.data.info)))
        .catch((err) => this.setState({ loading: false }, () => errorHandler(err.response.data.error))));
    }

  render() {
    const { onCancel, classes, version } = this.props;
    const { loading } = this.state;

    return (
        <div className={classes.root}>
            <Loader loading={loading}/>
            <p id="modal-title" className={clsx(classes.title)}>Register Model</p>
            <p className={clsx(classes.info)}>Are you sure to register version {version}</p>
            <div className={classes.buttonGroup}>
                <Button variant="contained" color="primary" onClick={this._handleSubmit}>Confirm</Button>
                <Button variant="contained" onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    )
  }
}

RegisterForm.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    version: PropTypes.number.isRequired,
    runtime: PropTypes.string.isRequired,
    framework: PropTypes.string.isRequired,
    onCancel: PropTypes.func,
    callback: PropTypes.func,
    errorHandler: PropTypes.func
}

export default withStyles(useStyles)(RegisterForm)