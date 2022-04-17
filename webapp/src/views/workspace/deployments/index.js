import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { fetchDataV1 } from '../../../global.js';
import clsx from 'clsx';
import InfoIcon from '@material-ui/icons/Info';
import IconButton from '@material-ui/core/IconButton';
import MUIDataTable from "mui-datatables";
import BaseModal from '../../baseModal';
import Button from '@material-ui/core/Button';
import InfoForm from './info';
import LogsForm from './events';

const useStyles = (theme) => ({
    root: {
        width: '100%'
    },
    table: {
        height: 500,
        marginTop: 15,
    },
    log: {
        marginLeft: theme.spacing(-1),
    }
});

const MODAL_MODE = { INFO: 'Info', LOG: 'Log' };

class Deployments extends Component {
    constructor(props) {
        super(props);
        this.state = {
            page: 0,
            rowsPerPage: 25,
            isModalOpen: false,
            selectedDeployment: null,
            mode: MODAL_MODE.INFO,
            // rows: [['dfsafs', 1, 'ntcore', '2021-01-01 10:30:00', 'SUCCEED', 'RUNNING']]
            rows: []
        }
        this._closeModel = this._closeModel.bind(this);
        this._createViewLogButton = this._createViewLogButton.bind(this);
    }

    componentDidMount() {
        fetchDataV1(`/dsp/api/v1/workspace/${this.props.workspaceId}/deployments`) 
            .then((res) => this._createRowDataWithState(res.data))
            .catch(this.props.onError);
    }

    _createRowDataWithState(rows) {
        const rowData = rows.map((row, index) => this._createRowData(row, index));
        this.setState({ rows: rowData });
    }

    _createViewLogButton(index) {
        const { classes } = this.props;
        const { rows } = this.state;
        const deploymentId = rows[index] ? rows[index][0] : null;
        return (
            <Button color="primary" className={clsx(classes.log)} disable={true}
                onClick={() => this.setState({
                    isModalOpen: true, 
                    selectedDeployment: deploymentId,
                    mode: MODAL_MODE.LOG})}>
                View
            </Button>)
    }

    _getColumns() {
        return [
            { name: 'id', label: 'Deployment ID' },
            { name: 'version', label: 'Version' },
            { name: 'createdBy', label: 'Created User' },
            { name: 'createdAt', label: 'Created Date' },
            { name: 'status', label: 'Status' },
            { name: 'logs', label: 'Logs', options: { customBodyRenderLite: this._createViewLogButton, filter: false, sort: false, viewColumns: false }},
        ];
    }

    _createRowData(row, index) {
        const id = row["id"];
        const version = row["version"];
        const status = row["status"];
        const createdBy = row["created_by"];
        const createdAt = (new Date(parseInt(row["created_at"]) * 1000)).toLocaleString();
        return [
            id,
            version,
            createdBy,
            createdAt,
            status,
        ]
    }

    _openModal(mode) {
        this.setState({mode: mode, isModalOpen: true});
    }

    _closeModel() {
        this.setState({isModalOpen: false});
    }

    _createActiveForm() {
        const { workspaceId } = this.props;
        const { mode, selectedDeployment } = this.state;
        return mode === "Info" ? 
            <InfoForm workspaceId={workspaceId}/> :
            <LogsForm workspaceId={workspaceId} deploymentId={selectedDeployment}/>
    }

    render() {
        const { classes } = this.props;
        const { rows } = this.state;
        const columns = this._getColumns();
        const options = { 
            filterType: 'checkbox', 
            download: false, 
            print: false, 
            selectableRows: false, 
            responsive: 'scrollMaxHeight',
            customToolbar: () => (
                <IconButton aria-label="add" onClick={() => this._openModal(MODAL_MODE.INFO)}>
                    <InfoIcon />
                </IconButton>
            ),
        };
        return (
            <div className={clsx(classes.root, classes.table)}>
                <MUIDataTable
                    title={"Deployments"}
                    data={rows}
                    columns={columns}
                    options={options}
                />
                <BaseModal open={this.state.isModalOpen} onCancel={this._closeModel}>
                    {this._createActiveForm()}
                </BaseModal>
            </div>
        );
    }
}
export default withStyles(useStyles)(Deployments)