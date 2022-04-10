import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { Paper } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import dateFormat from "dateformat";
import BaseModal from '../../baseModal';
import DeployForm from './deploy';
import { fetchDataV1 } from '../../../global';

const useStyles = (theme) => ({
    root: {
        width: '100%',
    },
    content: {
        marginTop: 15,
    },
    summary: {
        paddingLeft: theme.spacing(3),
        paddingTop: theme.spacing(2),
        fontSize: '22px'
    },
    container: {
        minHeight: 200
    },
    entry: {
        marginLeft: theme.spacing(3),
        paddingTop: theme.spacing(0.5),
        fontSize: '15px',
    },
    code: {
        marginLeft: theme.spacing(3),
        paddingTop: theme.spacing(0.5),
        fontSize: '15px',
        fontFamily: 'Monospace'
    },
    action: {
        marginLeft: theme.spacing(2),
        paddingTop: theme.spacing(-2),
    }
});

const MODAL_MODE = { DEPLOY: 'Deploy' };

class Registry extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            version: null,
            framework: null,
            createdAt: null,
            createdBy: null,
            runtime: null,
            description: null,
            isModelOpen: false,
            model: null,
        }
        this._createDeployButton = this._createDeployButton.bind(this);
        this._fetchRegistry = this._fetchRegistry.bind(this);
    }

    componentDidMount() {
        this._fetchRegistry();
    }

    _fetchRegistry() {
        fetchDataV1(`/dsp/api/v1/workspace/${this.props.workspaceId}/registry`)
        .then((res) => this.setState({ 
            version: parseInt(res.data.version),
            framework: res.data.framework,
            createdAt: res.data.created_at,
            createdBy: res.data.created_by,
            runtime: res.data.runtime,
            description: res.data.description
        }))
        .catch(this.props.onError);
    }

    _createDeployButton() {
        const { classes } = this.props;
        const { version, runtime, framework } = this.state
        return (
            <Button variant="contained" size="small" color="primary" className={clsx(classes.action)}  onClick={() => 
                this.setState({
                    isModalOpen: true, 
                    selectedVersion: version, 
                    selectedRuntime: runtime,
                    selectedFramework: framework,
                    mode: MODAL_MODE.DEPLOY})}>
                Deploy
            </Button>)
    }

    _createActiveForm(callback, closeModel, errorHandler) {
        const { workspaceId, workspaceType } = this.props;
        const { version, runtime, framework, mode } = this.state;
        switch(mode) {
            case MODAL_MODE.DEPLOY: return (
                <DeployForm 
                    workspaceId={workspaceId}
                    workspaceType={workspaceType}
                    version={version}
                    runtime={runtime}
                    framework={framework}
                    callback={callback} 
                    onCancel={closeModel}
                    errorHandler={errorHandler}/>);
            default: return null;
        }
    }

    render() {
        const { classes, onSuccess, onError } = this.props;
        const { version, framework, createdBy, createdAt, runtime, description } = this.state;

        const closeModel = () => {
            this.setState({isModalOpen: false});
        }
        const callback = (message) => {
            this.setState({isModalOpen: false}, () => onSuccess(message));
        }
        const errorHandler = (error) => {
            this.setState({isModalOpen: false}, () => onError(error));
        }
        // TODO: Change endpoint to `/s/pre-prod/${workspaceId}/predict` after enabling pre-prod deployment;
        const endpoint = "--";
        const formattedCreatedAt = createdAt ? dateFormat((new Date(parseInt(createdAt) * 1000)), "mm/dd/yyyy HH:MM:ss") : null;

        return (
            <div className={clsx(classes.root, classes.content)}>
                <Paper elevation={4}>
                    <p className={clsx(classes.summary)}>Summary</p>
                    <Divider className={classes.divider} />
                    <Grid container className={clsx(classes.container)}>
                        <Grid item xs={2}> 
                            <p className={clsx(classes.entry)}>Version</p>
                            <p className={clsx(classes.entry)}>Framework</p>
                            <p className={clsx(classes.entry)}>Created by</p>
                            <p className={clsx(classes.entry)}>Endpoint</p>
                        </Grid>
                        <Grid item xs={4}>
                            <p className={clsx(classes.entry)}>{version ? version : "--"}</p>
                            <p className={clsx(classes.entry)}>{framework ? framework : "--"}</p>
                            <p className={clsx(classes.entry)}>{createdBy ? createdBy : "--"}</p>
                            <p className={clsx(classes.entry)}>{version? endpoint : "--"}</p>
                        </Grid>
                        <Grid item xs={2}> 
                            <p className={clsx(classes.entry)}>Runtime</p>
                            <p className={clsx(classes.entry)}>Description</p>
                            <p className={clsx(classes.entry)}>Created at</p>
                            <p className={clsx(classes.entry)}>Actions</p>
                        </Grid>
                        <Grid item xs={4}>
                            <p className={clsx(classes.entry)}>{runtime ? runtime : "--"}</p>
                            <p className={clsx(classes.entry)}>{description ? description : "--"}</p>
                            <p className={clsx(classes.entry)}>{formattedCreatedAt ? formattedCreatedAt : "--"}</p>
                            {this._createDeployButton()}
                        </Grid>
                    </Grid>
                </Paper>
                <BaseModal open={this.state.isModalOpen} onCancel={closeModel}>
                    {this._createActiveForm(callback, closeModel, errorHandler)}
                </BaseModal>
            </div>
        );
    }

}

export default withStyles(useStyles)(Registry);