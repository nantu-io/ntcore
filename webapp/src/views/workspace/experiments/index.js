import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { fetchDataV1 } from '../../../global.js';
import clsx from 'clsx';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import RegisterForm from './register';
import DeleteForm from './delete';
import BaseModal from '../../baseModal';
import MUIDataTable from "mui-datatables";
import Loader from '../../loading';

const useStyles = (theme) => ({
    root: {
        width: '100%'
    },
    table: {
        height: 500,
        marginTop: 15,
    },
    action: {
        marginLeft: theme.spacing(-1),
    }
});

const MODAL_MODE = { REGISTER: 'Register', DELETE: 'Delete' };

class Experiments extends Component {
    constructor(props) {
        super(props);
        this.state = {
            page: 0,
            rowsPerPage: 25,
            isModelOpen: false,
            selectedVersion: 0,
            selectedRuntime: null,
            selectedFramework: null,
            rowsSelected: [],
            model: null,
            loading: false,
            // rows: [{id: 1, version: '1', createdBy: 'ntcore', createdAt: 1660423948, runtime: 'python-3.8', framework: 'sklearn', metrics: {"auc":0.9}, parameters: {"penalty": "l1"}, description: 'Logistic Regression'}]
            rows: []
        }
        this._createRegisterButton = this._createRegisterButton.bind(this);
        this._fetchExperiments = this._fetchExperiments.bind(this);
        this._deleteCallback = this._deleteCallback.bind(this);
    }

    componentDidMount() {
        this._fetchExperiments();
    }

    _fetchExperiments() {
        return new Promise((resolve) => this.setState({loading: true}, resolve()))
            .then(() => fetchDataV1(`/dsp/api/v1/workspace/${this.props.workspaceId}/experiments`))
            .then((res) => this.setState({ rows: res.data.map((rowInfo) => this._createRowData(rowInfo)) }), (err) => Promise.reject(err))
            .catch(this.props.onError)
            .finally(() => this.setState({loading: false}));
    }

    _createRowData(row) {
        const version = parseInt(row["version"]);
        const runtime = row["runtime"];
        const framework = row["framework"];
        const createdBy = row["createdBy"];
        const createdAt = row["createdAt"];
        const description = row["description"];
        const parameters = row["parameters"];
        const metrics = row["metrics"];
        return {
            id: version,
            runtime,
            framework,
            version,
            description,
            createdBy,
            createdAt,
            parameters,
            metrics,
        }
    }

    _createRegisterButton(index) {
        const { classes } = this.props
        const { rows } = this.state
        const version = rows[index] ? rows[index].version : 0;
        const runtime = rows[index] ? rows[index].runtime : null;
        const framework = rows[index] ? rows[index].framework : null;
        return (
            <Button color="primary" className={clsx(classes.action)}
                onClick={() => this.setState({
                    isModalOpen: true, 
                    selectedVersion: version, 
                    selectedRuntime: runtime,
                    selectedFramework: framework,
                    mode: MODAL_MODE.REGISTER})}>
                Register
            </Button>)
    }

    _getStaticColumns() {
        return [
            { name: 'actions', 
              label: "Actions", 
              options: { customBodyRenderLite: this._createRegisterButton, filter: false, sort: false, viewColumns: false }},
            { name: 'id', label: 'Version' },
            { name: 'owner', label: 'Owner' },
            { name: 'date', label: 'Date', options: { filter: false, sort: true } },
            { name: 'time', label: 'Time', options: { filter: false, sort: true } },
            { name: 'runtime', label: 'Runtime' },
            { name: 'framework', label: 'Framework' },
        ];
    }

    _extendColumns() {
        const { rows } = this.state;

        const parameterColSet = new Set(rows.filter((row) => row.parameters)
            .flatMap(row => Object.keys(row.parameters)));
        const metricsColumnSet = new Set(rows.filter((row) => row.metrics)
            .flatMap(row => Object.keys(row.metrics)));
        const parameterColumns = [...parameterColSet].map(col => {
            return {name: col, label: col, options: { filter: false, sort: true }}
        });
        const metricsColumns = [...metricsColumnSet].map(col => {
            return {name: col, label: col, options: { filter: false, sort: true }}
        });
        const columns = this._getStaticColumns();
        return [...columns, ...parameterColumns, ...metricsColumns]
    }

    _getRowData(row, columns) {
        return columns.map(column => row[column])
    }

    _deleteCallback() {
        this.setState({rowsSelected: []});
        this._fetchExperiments();
    }

    _createActiveForm(callback, closeModel, errorHandler) {
        const { workspaceId } = this.props;
        const { selectedVersion, rowsSelected, mode } = this.state;
        const selectedExperiments = rowsSelected ? rowsSelected.map(i => this.state.rows[i].version) : [];
        switch(mode) {
            case MODAL_MODE.DELETE: return (
                <DeleteForm workspaceId={workspaceId}
                    versions={selectedExperiments}
                    callback={this._deleteCallback} 
                    onCancel={closeModel}
                    errorHandler={errorHandler}/>);
            case MODAL_MODE.REGISTER: return (
                <RegisterForm workspaceId={workspaceId}
                    version={selectedVersion}
                    callback={callback} 
                    onCancel={closeModel}
                    errorHandler={errorHandler}/>);
            default: return null;
        }
    }

    render() {
        const { classes, onSuccess, onError } = this.props;
        const { rows, rowsSelected, loading } = this.state;
        const extendedColumns = this._extendColumns();
        const expandedRows = rows.map(row => {
            const datetime = new Date(row.createdAt * 1000);
            return {
                id: row.id,
                runtime: row.runtime, 
                framework: row.framework,
                description: (row.description) ? row.description : "", 
                owner: row.createdBy, 
                date: datetime.toLocaleDateString(),
                time: datetime.toLocaleTimeString('en-GB'),
                ...row.parameters,
                ...row.metrics
            }
        })

        const closeModel = () => {
            this.setState({isModalOpen: false});
        }
        const callback = (message) => {
            this.setState({isModalOpen: false}, () => onSuccess(message));
        }
        const errorHandler = (error) => {
            this.setState({isModalOpen: false}, () => onError(error));
        }
        const columns = extendedColumns.map(column => column.name);
        const data = expandedRows.map(row => this._getRowData(row, columns))
        const options = { 
            filterType: 'checkbox', 
            download: false, 
            print: false, 
            responsive: 'scrollMaxHeight',
            rowsSelected: rowsSelected,
            setTableProps: () => ({ size: 'small' }),
            customToolbarSelect: (selectedRows) => (
                <IconButton aria-label="delete">
                    <DeleteIcon onClick={() => this.setState({isModalOpen: true, mode: MODAL_MODE.DELETE })}/>
                </IconButton>
            ),
            onRowSelectionChange: (currentRowsSelected, allRowsSelected, rowsSelected) => {
                this.setState({rowsSelected: rowsSelected});
            },
        };

        return (
            <div className={clsx(classes.root, classes.table)}>
                <Loader loading={loading}/>
                <MUIDataTable
                    title={"Experiments"}
                    data={data}
                    columns={extendedColumns}
                    options={options}
                />
                <BaseModal open={this.state.isModalOpen} onCancel={closeModel}>
                    {this._createActiveForm(callback, closeModel, errorHandler)}
                </BaseModal>
            </div>
        );
    }
}
export default withStyles(useStyles)(Experiments)