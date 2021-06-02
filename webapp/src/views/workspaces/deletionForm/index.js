import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Loader from '../../loading';
import { withStyles } from '@material-ui/core/styles';
import { deleteDataV1 } from '../../../global';

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
    console.log(props.selected);
    this.state = {
      loading: false
    };
  }

  _handleSubmit = () => {
    new Promise((resolve) => this.setState({loading: true}, resolve()))
      .then(() => this.deleteWorkspaces(this.props.selected), Promise.reject())
      .then(this.props.callback)
      .catch(this.props.onError)
      .finally(() => { this.setState({loading: false}); this.props.onCancel() });
  }

  deleteWorkspaces = async (workspaceIds) => {
    await workspaceIds.map(id => deleteDataV1(`/dsp/api/v1/workspace/${id}`))
  }

  render() {
    const { selected, onCancel, classes } = this.props;
    const { loading } = this.state;

    return (
      <div className={classes.root}>
        <Loader loading={loading}/>
        <h2 id="modal-title">Delete Workspace</h2>
        <p>Are you sure to delete the below workspace{selected.length > 1 ? "s" : ""}: </p>
        <div style={{ height: 'fit-content' }}>
          {selected.map(name => {
            return <p key={name}>{name}</p>
          })}
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
  selected: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  callback: PropTypes.func.isRequired
}

export default withStyles(useStyles)(DeletionModal)