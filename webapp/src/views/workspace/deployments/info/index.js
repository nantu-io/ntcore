import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import { withStyles } from '@material-ui/core/styles';

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
    }
})

class InfoForm extends Component {
    render() {
        const { onCancel, classes, workspaceId } = this.props; 
        const jsonBody = '{"data": [[1,1 ...]]}';
        return (
        <div className={classes.root}>
            <h2 id="modal-title">Sample Usage:</h2>
            <h3 id="curl-title">CURL: </h3>
            <Box component="p" overflow='scroll' className={classes.command}>
                <p className={classes.command}>curl -H "Content-Type: application/json" -X POST --data '{jsonBody}' http://localhost:8000/s/{workspaceId}/predict </p>
            </Box>
            <h3 id="python-title">PYTHON: </h3>
            <Box component="div" overflow="auto" className={classes.command}>
                <p>import requests</p>
                <p>requests.post('http://localhost:8000/s/{workspaceId}/predict', data={jsonBody})</p>
            </Box>
            <div className={classes.buttonGroup}>
                <Button variant="contained" onClick={onCancel}>Close</Button>
            </div>
        </div>
    )
  }
}

InfoForm.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    onCancel: PropTypes.func,
}

export default withStyles(useStyles)(InfoForm)