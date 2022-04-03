import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import Loader from '../../loading';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
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
  buttonGroup: {
    '& > *': {
      marginTop: theme.spacing(5),
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
  },
  formControl: {
    width: '100%',
    marginTop: theme.spacing(3),
    minWidth: 420,
  },
  packageForm: {
    width: '100%',
    minWidth: 420,
  },
});

class CreationModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      type: WorkspaceType.API,
      name: null,
      loading: false,
    };
  }

  _handleInstanceTypeSelect = (e) => this.setState({ type: e.target.value });
  _handleNameChange = (e) => this.setState({ name: e.target.value });
  _handleWorkspaceTypeSelect = (e) => this.setState({ type: e.target.value });

  _handleSubmit = () => {
    const { name, type } = this.state;
    new Promise((resolve) => this.setState({loading: true}, resolve()))
      .then(() => postDataV1('/dsp/api/v1/workspace', { type, name }), Promise.reject())
      .then(this.props.callback)
      .catch(this.props.onError)
      .finally(() => { this.setState({loading: false}); this.props.onCancel() });
  }

  render() {
    const { classes, onCancel } = this.props;
    const { loading, type } = this.state;

    return (
      <div className={classes.root}>
        <Loader loading={loading}/>
        <h2 id="modal-title">Create Workspace</h2>
        <FormControl className={classes.packageForm}>
          <TextField
            required
            id="workspace-name"
            label="Name"
            fullWidth
            size="small"
            className={classes.textField}
            onChange={this._handleNameChange}
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor="workspace-type-select">Type</InputLabel>
          <Select defaultValue="API" id="workspace-type-select"
                  value={type}
                  onChange={this._handleWorkspaceTypeSelect}>
              <MenuItem value={'API'}>API</MenuItem>
              <MenuItem value={'Batch'}>Batch</MenuItem>
          </Select>
        </FormControl>
        <div className={classes.buttonGroup}>
          <Button variant="contained" color="primary" onClick={this._handleSubmit}>Confirm</Button>
          <Button variant="contained" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    )
  }
}

export default withStyles(useStyles)(CreationModal)