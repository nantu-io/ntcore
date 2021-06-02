import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Loader from '../../../loading';
import { withStyles } from '@material-ui/core/styles';
import { deleteDataV1 } from '../../../../global';

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
})

class DeletionModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
  }

  _handleSubmit = () => {
    new Promise((resolve) => this.setState({loading: true}, resolve()))
      .then(this.deleteExperiments, () => Promise.reject())
      .then(this.props.callback, () => Promise.reject())
      .catch(this.props.onError)
      .finally(() => { this.setState({loading: false}); this.props.onCancel() });
  }

  deleteExperiments = async () => {
    const { workspaceId, versions } = this.props;
    await versions.map(version => deleteDataV1(`/dsp/api/v1/workspace/${workspaceId}/experiment/${version}`))
  }

  render() {
    const { versions, onCancel, classes } = this.props;
    const { loading } = this.state;
    return (
        <div className={classes.root}>
            <Loader loading={loading}/>
            <h2 id="modal-title">Delete Experiments</h2>
            <p>Are you sure to delete the below experiment{versions.length > 1 ? "s" : ""}: </p>
            <div style={{ height: 'fit-content' }}>
                {versions.join(', ')}
            </div>
            <div className={classes.buttonGroup}>
                <Button variant="contained" color="primary" onClick={this._handleSubmit}>Confirm</Button>
                <Button variant="contained" onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    )
  }
}

DeletionModal.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    versions: PropTypes.array.isRequired,
    onCancel: PropTypes.func,
    callback: PropTypes.func,
    errorHandler: PropTypes.func,
}

export default withStyles(useStyles)(DeletionModal)