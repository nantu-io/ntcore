import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';

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
    command: {
        backgroundColor: '#eeeeee',
        whiteSpace: 'nowrap',
    },
    tokenForm: {
        width: '100%',
        minWidth: 420,
    },
})

class TokenForm extends Component {
    render() {
        const { onCancel, classes } = this.props;
        const apiToken = window.localStorage.getItem('dspcolumbus_access_token')
        return (
            <div className={classes.root}>
                <h3 id="modal-title">API Token:</h3>
                <FormControl className={classes.tokenForm}>
                    <TextField id="api-token" fullWidth InputProps={{ readOnly: true, style: {fontSize: 14} }} variant="outlined" multiline value={apiToken}/>
                </FormControl>
                <div className={classes.buttonGroup}>
                    <Button variant="contained" onClick={onCancel}>Close</Button>
                </div>
            </div>
        )
    }
}

TokenForm.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    onCancel: PropTypes.func,
}

export default withStyles(useStyles)(TokenForm)