import { IContainerGroupStateProvider, IContainerGroup, ContainerGroupState } from "../ContainerGroupProvider";
import { INSTANCES_INITIALIZATION, INSTANCES_LIST, INSTANCES_READ, INSTANCE_STATE_UPSERT } from "./KubeContainerGroupStateQueries";
import { Runtime } from "../../../commons/Runtime";
import { Pool } from 'pg';

export class PostgresServiceStateProvider implements IContainerGroupStateProvider 
{
    private _pgPool: Pool;
    /**
     * Initialize the experiments table.
     */
    constructor(pool: Pool) 
    {
        this._pgPool = pool;
    }

    /**
     * Initialize service states table.
     */
    public async initialize()
    {
        this._pgPool.query(INSTANCES_INITIALIZATION);
        console.log("Initialized instance states table.");
    }

    /**
     * Records the service state into database.
     * @param config Service config.
     * @param username Username that update the service.
     * @param state State of the service.
     * @returns Promise of the service config.
     */
    public async record(config: IContainerGroup, username: string, state: ContainerGroupState, runtime?: Runtime, cpus?: number, memory?: number, packages?: string[]): Promise<IContainerGroup> 
    {
        await this._pgPool.query(INSTANCE_STATE_UPSERT, [
            config.name, 
            username,
            config.type,
            state,
            runtime,
            cpus,
            memory,
            packages ? packages.join(',') : null,
            Math.floor(new Date().getTime()/1000)]);
        return config;
    }
    
    /**
     * Retrieves the service state based on the given username and service name.
     * @param name Service name
     * @param username Username the service is associated with.
     * @returns Promise of the service state.
     */
    public async get(name: string, username: string): Promise<{}> 
    {
        const res = await this._pgPool.query(INSTANCES_READ, [name, username]);
        if (res.rows && res.rowCount > 0) {
            const row = res.rows[0];
            return { name, state: row.state, runtime: row.runtime, cpus: row.cpus, memory: row.memory, packages: row.packages };
        }
        return { name, state: ContainerGroupState.UNKNOWN };
    }

    /**
     * Lists all services based on the given username.
     * @param username Username the service is associated with.
     * @returns Promise of the service config.
     */
    public async list(username: string): Promise<IContainerGroup[]> 
    {
        const res = await this._pgPool.query(INSTANCES_LIST, [username]);
        if (res.rows && res.rowCount > 0) {
            return res.rows.map((i: any) => ({type: i.type, name: i.name, state: i.state}));
        }
        return [];
    }
}