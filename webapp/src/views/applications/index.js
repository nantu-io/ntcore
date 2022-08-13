import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import BaseLayout from '../baseLayout';
import { fetchDataV1 } from '../../global.js';
import Loader from '../loading';
import MUIDataTable from "mui-datatables";

const useStyles = () => ({
    root: {
        width: '100%'
    },
    table: {
        height: 500,
        marginTop: 20,
    }
});

class Applications extends Component {
    constructor(props) {
        super(props);
        this.state = {
            page: 0,
            rowsPerPage: 25,
            loading: false,
            // rows: [['uuid', 'C123', 1, 'ntcore', '2021-01-01 10:30:00']]
            rows: []
        }
    }

    componentDidMount() {
        return new Promise((resolve) => this.setState({loading: true}, resolve()))
            .then(() => fetchDataV1(`/dsp/api/v1/deployments/active`))
            .then((res) => this._createRowDataWithState(res.data))
            .catch(this.props.onError)
            .finally(() => this.setState({loading: false}));
    }

    _createRowDataWithState(rows) {
        const rowData = rows.map((row) => this._createRowData(row));
        this.setState({ rows: rowData });
    }

    _getColumns() {
        return [
            { name: 'id', label: 'Deployment ID' },
            { name: 'workspaceId', label: 'Workspace ID' },
            { name: 'version', label: 'Version' },
            { name: 'createdBy', label: 'Created User' },
            { name: 'createdAt', label: 'Created Date' },
        ];
    }

    _createRowData(row) {
        const id = row["id"];
        const workspaceId = row["workspace_id"];
        const version = row["version"];
        const createdBy = row["created_by"];
        const createdAt = (new Date(parseInt(row["created_at"]) * 1000)).toLocaleString();
        return [
            id,
            workspaceId,
            version,
            createdBy,
            createdAt,
        ]
    }

    render() {
        const { classes } = this.props;
        const { rows, loading } = this.state;
        const columns = this._getColumns();
        const options = { 
            filterType: 'checkbox', 
            download: false, 
            print: false, 
            selectableRows: false, 
            responsive: 'scrollMaxHeight',
            setTableProps: () => ({ size: 'small' }),
        };
        return (
            <BaseLayout index={1}>
                <Loader loading={loading}/> 
                <div className={clsx(classes.root, classes.table)}>
                    <MUIDataTable
                        title={"Deployments"}
                        data={rows}
                        columns={columns}
                        options={options}
                    />
                </div>
            </BaseLayout>
        );
    }
}
export default withStyles(useStyles)(Applications)