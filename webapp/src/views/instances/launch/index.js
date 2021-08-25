import React, { Component } from 'react';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Loader from '../../loading';
import { withStyles } from '@material-ui/core/styles';
import { postDataV1, fetchDataV1 } from '../../../global';

const useStyles = (theme) => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
        padding: '10px 20px'
    },
    textField: {
        width: '100%',
    },
    buttonGroup: {
        '& > *': {
        marginTop: theme.spacing(5),
        marginRight: theme.spacing(3),
        marginBottom: theme.spacing(1),
        },
    },
    formControl: {
        marginTop: theme.spacing(1),
        marginRight: theme.spacing(2),
        minWidth: 200,
    },
    runtimeForm: {
        marginRight: theme.spacing(2),
        marginTop: theme.spacing(3),
        minWidth: 420,
    },
    packageForm: {
        marginTop: theme.spacing(5),
        minWidth: 420,
    },
});

class CreationModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            instanceType: null,
            name: null,
            loading: false,
            cpus: 1,
            memory: 2,
            runtime: 'python-3.8',
            packages: null,
        };
    }

    componentDidMount() {
        if (!this.props.name) return;
        new Promise((resolve) => this.setState({loading: true}, resolve()))
            .then(() => fetchDataV1(`/dsp/api/v1/service/${this.props.name}`), Promise.reject())
            .then((instance) => this._setInstanceProperties(instance), Promise.reject())
            .catch(this.props.onError)
            .finally(() => this.setState({loading: false}));
    }

    _setInstanceProperties(instance) {
        if (!instance || !instance.data) return Promise.resolve();
        const { runtime, cpus, memory, packages } = instance.data;
        const newlineSeparatedPackages = packages.replaceAll(',', '\n');
        return new Promise((resolve) => { 
            this.setState({runtime, cpus: parseInt(cpus), memory: parseInt(memory), packages: newlineSeparatedPackages}, resolve());
        });
    }
    _handleCpusSelect = (e) => this.setState({ cpus: e.target.value });
    _handleMemorySelect = (e) => this.setState({ memory: e.target.value });
    _handleRuntimeSelect = (e) => this.setState({ runtime: e.target.value });
    _handlePackagesSelect = (e) => this.setState({ packages: e.target.value });

    _handleSubmit = () => {
        const { cpus, memory, runtime, packages } = this.state;
        const { type, onComplete } = this.props;
        const packageList = packages ? packages.split('\n').map(p => p.trim()) : [];
        return new Promise((resolve) => this.setState({loading: true}, resolve()))
            .then(() => postDataV1('/dsp/api/v1/service', { type, runtime, cpus, memory, packages: packageList }))
            .then(onComplete)
            .catch(this.props.onError)
            .finally(() => this.setState({loading: false}));
    } 

    render() {
        const { classes, onCancel } = this.props;
        const { loading, cpus, memory, runtime, packages } = this.state;

        return (
            <div className={classes.root}>
                <Loader loading={loading}/>
                <h2 id="modal-title">Select instance configurations</h2>
                <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="cpus-select">CPUs</InputLabel>
                    <Select defaultValue="1" 
                            id="cpus-select"
                            value={cpus}
                            onChange={this._handleCpusSelect}>
                        <MenuItem value={1}>1</MenuItem>
                        <MenuItem value={2}>2</MenuItem>
                        <MenuItem value={3}>3</MenuItem>
                        <MenuItem value={4}>4</MenuItem>
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={6}>6</MenuItem>
                        <MenuItem value={7}>7</MenuItem>
                        <MenuItem value={8}>8</MenuItem>
                    </Select>
                </FormControl>
                <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="memory-select">Memory in GB</InputLabel>
                    <Select defaultValue="2" 
                            id="memory-select"
                            value={memory}
                            onChange={this._handleMemorySelect}>
                        <MenuItem value={1}>1</MenuItem>
                        <MenuItem value={2}>2</MenuItem>
                        <MenuItem value={3}>3</MenuItem>
                        <MenuItem value={4}>4</MenuItem>
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={6}>6</MenuItem>
                        <MenuItem value={7}>7</MenuItem>
                        <MenuItem value={8}>8</MenuItem>
                    </Select>
                </FormControl>
                <FormControl className={classes.runtimeForm}>
                    <InputLabel htmlFor="runtime-select">Runtime Environment</InputLabel>
                    <Select defaultValue="python-3.8" 
                            id="runtime-select"
                            value={runtime}
                            onChange={this._handleRuntimeSelect}>
                        <MenuItem value={'python-3.8'}>Python 3.8</MenuItem>
                    </Select>
                </FormControl>
                <FormControl className={classes.packageForm}>
                    <TextField
                        id="packages-multiline-static"
                        label="Packages (one package per line)"
                        value={packages}
                        multiline
                        rows={10}
                        placeholder='pandas'
                        variant="outlined"
                        onChange={this._handlePackagesSelect}
                    />
                </FormControl>
                <div className={classes.buttonGroup}>
                    <Button variant="contained" color="primary" onClick={this._handleSubmit}>Confirm</Button>
                    <Button variant="contained" onClick={onCancel}>Cancel</Button>
                </div>
            </div>
        )
    }
}

export default withStyles(useStyles)(CreationModal);