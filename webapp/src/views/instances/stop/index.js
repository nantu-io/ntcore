import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Loader from '../../loading';
import { deleteDataV1 } from '../../../global';

const useStyles = (theme) => ({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
      padding: '10px 20px'
    },
    textField: {
      width: '100%',
    },
    formControl: {
      width: '100%',
      margin: '20px 0',
    },
    buttonGroup: {
      '& > *': {
        marginTop: theme.spacing(3),
        marginRight: theme.spacing(2),
        marginBottom: theme.spacing(1),
      },
    },
});

class StopModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
        };
    }

    _handleSubmit = () => {
        const { name, onComplete } = this.props;
        new Promise((resolve) => this.setState({ loading: true }, resolve))
            .then(() => deleteDataV1(`/dsp/api/v1/service/${name}`, () => Promise.reject())
            .then(onComplete)
            .catch()
            .finally(() => this.setState({ loading: false })))
    } 

    render() {
        const { classes, onCancel , type } = this.props;
        const { loading } = this.state;

        return (
        <div className={classes.root}>
            <Loader loading={loading}/>
            <h2 id="modal-title">Stop {type} Instance?</h2>
            <div className={classes.buttonGroup}>
                <Button variant="contained" color="primary" onClick={this._handleSubmit}>Confirm</Button>
                <Button variant="contained" onClick={onCancel}>Cancel</Button>
            </div>
        </div>
        )
    }
}

export default withStyles(useStyles)(StopModal);