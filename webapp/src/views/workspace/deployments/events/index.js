import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Loader from '../../../loading';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import { fetchDataV1 } from '../../../../global'

const useStyles = (theme) => ({
    root: {
        flexWrap: 'wrap',
        padding: '10px 20px',
    },
    buttonGroup: {
        '& > *': {
            marginTop: theme.spacing(3),
            marginRight: theme.spacing(2),
            marginBottom: theme.spacing(1),
        },
    },
    logs: {
        backgroundColor: '#eeeeee',
        whiteSpace: 'nowrap',
    }
})

class LogsForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            logEvents: null,
            loading: false,   
        }
    }

    componentDidMount() {
        this._fetchLogEvents();
    }

    _fetchLogEvents() {
        const { workspaceId, deploymentId } = this.props;
        // this.setState({ logEvents: "test\ndata"});
        new Promise((resolve) => this.setState({loading: true}, resolve()))
            .then(() => fetchDataV1(`/dsp/api/v1/${workspaceId}/logs/${deploymentId}`))
            .then((res) => this.setState({ logEvents: res.data['events'], loading: false })
            .catch(this.props.onError)
            .finally(() => this.setState({loading: false})));
    }

    _renderLogEvents(logEvents) {
        const { classes } = this.props;
        if (logEvents !== null) {
            return logEvents.map(e => <p className={classes.logs}>{e}</p>)
        } else {
            return <p className={classes.logs}>{""}</p>
        }
    }

    render() {
        const { onCancel, classes } = this.props; 
        const { logEvents, loading } = this.state;
        return (
        <div className={classes.root}>
            <Loader loading={loading}/>
            <h2 id="modal-title">Log Events:</h2>
            <TextField
                inputProps={{ readOnly: true, disabled: true, style:{fontSize: 15} }}
                id="logEvents"
                multiline
                fullWidth
                rows={15}
                value={logEvents}
                variant="outlined"
                className={classes.textField}/>
            <div className={classes.buttonGroup}>
                <Button variant="contained" onClick={onCancel}>Close</Button>
            </div>
        </div>
    )
  }
}

LogsForm.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    deploymentId: PropTypes.string.isRequired,
    onCancel: PropTypes.func,
}

export default withStyles(useStyles)(LogsForm)