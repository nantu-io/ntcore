import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import MUIDataTable from "mui-datatables";
import CreationForm from './creationForm';
import DeletionForm from './deletionForm';
import BaseModal from '../baseModal';
import BaseLayout from '../baseLayout';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import Loader from '../loading';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { fetchDataV1 } from '../../global.js';

const SEVERITY = { INFO: 'info', ERROR: 'error', SUCCESS: 'success', WARNING: 'warning'}
const MODAL_MODE = { CREATE: 'Create', DELETE: 'Delete' };
const useStyles = () => ({
    root: { width: '100%' },
    table: { height: 500, marginTop: 20, marginBottom: 20 }
});

class Workspaces extends Component {
    constructor(props) {
        super(props);
        this.state = {
          isModalOpen: false,
          mode: null,
          loading: false,
          snackBarOpen: false, 
          snackBarSeverity: null, 
          snackBarContent: null,
          rowsSelected: [],
          // rows: [['test', 'C123', 'test', 'ntcore', '2021-01-01 10:30:00']],
          rows: []
        };
        this._openModal = this._openModal.bind(this);
        this._closeModal = this._closeModal.bind(this);
        this._fetchWorkspacesData = this._fetchWorkspacesData.bind(this);
        this._createHyperLink = this._createHyperLink.bind(this);
        this._deleteWorkspacesCallback = this._deleteWorkspacesCallback.bind(this);
        this._closeSnackBar = this._closeSnackBar.bind(this);
    }
    
    componentDidMount() {
        this._fetchWorkspacesData();
    }

    _fetchWorkspacesData() {
        return new Promise((resolve) => this.setState({loading: true}, resolve()))
            .then(() => fetchDataV1(`/dsp/api/v1/workspaces`))
            .then((res) => this.setState({ rows: res.data.map((rowInfo) => this._createRowData(rowInfo)) }), () => Promise.reject())
            .catch(this.props.onError)
            .finally(() => this.setState({loading: false}));
    }

    _createRowData(rowInfo) {
        const name = rowInfo["name"];
        const id = rowInfo["id"];
        const type = rowInfo["type"];
        const createdBy = rowInfo["created_by"];
        const createdAt = (new Date(parseInt(rowInfo["created_at"]) * 1000)).toLocaleString();
        return [ name, id, type, createdBy, createdAt ]
    }

    _openSnackBar(severity, message) {
        const snackBarContent = message ? message.toString() : '';
        this.setState({ snackBarOpen: true, snackBarSeverity: severity, snackBarContent: snackBarContent });
    };
    
    _closeSnackBar() {
        this.setState({ snackBarOpen: false });
    };

    _createSnackBar() {
        const { snackBarOpen, snackBarSeverity, snackBarContent } = this.state;
        return (
          <Snackbar open={snackBarOpen} anchorOrigin={{ vertical: 'top', horizontal: 'center'}} autoHideDuration={6000} onClose={this._closeSnackBar}>
            <MuiAlert elevation={6} variant="filled" onClose={this._closeSnackBar} severity={snackBarSeverity}>
              {snackBarContent}
            </MuiAlert>
          </Snackbar>);
    }

    _getColumns() {
        return [
            { 
              name: 'name', 
              label: 'Name', 
              options: { customBodyRenderLite: this._createHyperLink, filter: false, sort: false, viewColumns: false } 
            },
            { name: 'id', label: 'ID' },
            { name: 'type', label: 'Type' },
            { name: 'createdBy', label: 'Created User' },
            { name: 'createdAt', label: 'Created Date' }
        ];
    }

    _openModal(mode) {
        this.setState({mode: mode, isModalOpen: true});
    }
    
    _closeModal() {
        this.setState({isModalOpen: false});
    }

    _deleteWorkspacesCallback() {
        this.setState({rowsSelected: []});
        this._fetchWorkspacesData();
    }

    _createHyperLink(index) {
        const { rows } = this.state;
        const name = rows[index] ? rows[index][0] : null;
        const id = rows[index] ? rows[index][1] : null;
        const href = `/dsp/console/workspaces/${id}`;
        return <Link color="inherit" href={href}>{name}</Link>
    }

    _createActiveForm() {
        const { rowsSelected, mode } = this.state;
        const selectWorkspaces = rowsSelected.map(i => this.state.rows[i][1])
        switch(mode) {
          case MODAL_MODE.CREATE: return <CreationForm callback={this._fetchWorkspacesData} onCancel={this._closeModal} onError={(err) => this._openSnackBar(SEVERITY.ERROR, err)}/>;
          case MODAL_MODE.DELETE: return <DeletionForm selected={selectWorkspaces} callback={this._deleteWorkspacesCallback} onError={(err) => this._openSnackBar(SEVERITY.ERROR, err)}/>;
          default: return null;
        }
    }

    render() {
        const { classes } = this.props;
        const { rows, loading, rowsSelected } = this.state;
        const columns = this._getColumns();
        const options = { 
            filterType: 'checkbox', 
            download: false, 
            print: false,
            rowsSelected: rowsSelected,
            responsive: 'scrollMaxHeight',
            customToolbar: () => (
                <IconButton aria-label="add" onClick={() => this._openModal(MODAL_MODE.CREATE)}>
                    <Add />
                </IconButton>
            ),
            customToolbarSelect: (selectedRows) => (
                <IconButton aria-label="delete">
                    <DeleteIcon onClick={() => {
                        this._openModal(MODAL_MODE.DELETE);
                    }}/>
                </IconButton>
            ),
            onRowSelectionChange: (currentRowsSelected, allRowsSelected, rowsSelected) => {
                this.setState({rowsSelected: rowsSelected});
            },
        };

        return (
            <BaseLayout index={0}>
                <Loader loading={loading}/>
                {this._createSnackBar()}
                <div className={clsx(classes.root, classes.table)}>
                    <MUIDataTable
                        title={"Workspaces"}
                        data={rows}
                        columns={columns}
                        options={options}
                    />
                    <BaseModal open={this.state.isModalOpen} onCancel={this._closeModal}>
                        {this._createActiveForm()}
                    </BaseModal>
                </div>
            </BaseLayout>
        )
    }
}

export default withStyles(useStyles)(Workspaces)