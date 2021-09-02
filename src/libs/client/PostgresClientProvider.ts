import { appConfig } from "../config/AppConfigProvider";
import { Pool } from "pg";

export default class DatabaseClientProvider {
    /**
     * Database client instance;
     */
    private static _client: Pool;

    public static get(): Pool {
        // TODO: relevant Postgres info
        return this._client || (this._client = new Pool({  }));
    }
}
