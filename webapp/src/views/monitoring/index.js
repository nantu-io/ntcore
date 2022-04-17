import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import BaseLayout from '../baseLayout';
import MuiAlert from '@material-ui/lab/Alert';

const useStyles = (theme) => ({

});

class Monitoring extends Component {
    render() {
        return (
            <BaseLayout index={2}>
                 <MuiAlert elevation={6} variant="filled" severity="warning" style={{width: '100%', height: '70'}}>
                     Monitoring is only available in enterprise version.
                </MuiAlert> 
            </BaseLayout>
        )
    }
}

export default withStyles(useStyles)(Monitoring)