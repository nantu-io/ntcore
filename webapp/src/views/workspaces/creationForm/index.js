import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import Loader from '../../loading';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import { postDataV1 } from '../../../global';
import { WorkspaceType } from '../../constants';

const useStyles = (theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '10px 20px'
  },
  textField: {
    marginTop: theme.spacing(1),
    width: '100%',
  },
  formControl: {
    width: '100%',
    margin: '20px 0',
  },
  buttonGroup: {
    '& > *': {
      marginTop: theme.spacing(4),
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
  },
});

class CreationModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      type: null,
      name: null,
      loading: false,
    };
  }

  _handleInstanceTypeSelect = (e) => {
    this.setState({ type: e.target.value });
  }

  _handleNameChange = (e) => {
    this.setState({ name: e.target.value });
  }

  _handleSubmit = () => {
    const { name } = this.state;
    new Promise((resolve) => this.setState({loading: true}, resolve()))
      .then(() => postDataV1('/dsp/api/v1/workspace', { type: WorkspaceType.API, name }), Promise.reject())
      .then(this.props.callback)
      .catch(this.props.onError)
      .finally(() => { this.setState({loading: false}); this.props.onCancel() });
  }

  render() {
    const { classes, onCancel } = this.props;
    const { loading } = this.state;

    return (
      <div className={classes.root}>
        <Loader loading={loading}/>
        <h2 id="modal-title">Create Workspace</h2>
        <TextField
          required
          id="workspace-name"
          label="Name"
          variant="outlined"
          fullWidth
          size="small"
          className={classes.textField}
          onChange={this._handleNameChange}
        />
        <div className={classes.buttonGroup}>
          <Button variant="contained" color="primary" onClick={this._handleSubmit}>Confirm</Button>
          <Button variant="contained" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    )
  }
}

export default withStyles(useStyles)(CreationModal)