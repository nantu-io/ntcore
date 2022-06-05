import { appConfig } from "../config/AppConfigProvider";
import { PostgresClientConfig } from "../config/AppConfigDatabase";
import { Pool } from "pg";

export default class DatabaseClientProvider 
{
    /**
     * Database client instance;
     */
    private static _client: Pool;

    public static get(): Pool 
    {
        const config = appConfig.database.config as PostgresClientConfig
        return this._client || (this._client = new Pool(config));
    }
}
