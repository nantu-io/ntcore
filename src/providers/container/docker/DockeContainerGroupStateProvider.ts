import { IContainerGroupStateProvider, IContainerGroup, ContainerGroupState  } from "../ContainerGroupProvider";
import { INSTANCES_INITIALIZATION, INSTANCES_LIST, INSTANCES_READ, INSTANCE_STATE_UPSERT } from "./DockerContainerGroupStateQueries";
import { Runtime } from "../../../commons/Runtime";
import Database = require("better-sqlite3");

export class DockerContainerGroupStateProvider implements IContainerGroupStateProvider 
{
    private _databaseClient: Database.Database;
    /**
     * Initialize the experiments table.
     */
    constructor(databaseClient: Database.Database) 
    {
        this._databaseClient = databaseClient;
    }

    /**
     * Initialize service states table.
     */
    public async initialize()
    {
        this._databaseClient.exec(INSTANCES_INITIALIZATION);
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
        this._databaseClient.prepare(INSTANCE_STATE_UPSERT).run({
            name: config.name,
            createdBy: username,
            type: config.type,
            state: state,
            runtime: runtime,
            cpus: cpus,
            memory: memory,
            packages: packages ? packages.join(',') : null,
            lastUpdatedAt: Math.floor(new Date().getTime()/1000)
        });
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
        const res = this._databaseClient.prepare(INSTANCES_READ).get({name: name, createdBy: username});
        if (res) {
            return { name, state: res.state, runtime: res.runtime, cpus: res.cpus, memory: res.memory, packages: res.packages };
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
        const response = this._databaseClient.prepare(INSTANCES_LIST).all({createdBy: username});
        if (response) {
            return response.map((i: any) => ({type: i.type, name: i.name, state: i.state}));
        }
        return [];
    }
}