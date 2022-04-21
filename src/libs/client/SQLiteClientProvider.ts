import { appConfig } from "../config/AppConfigProvider";
import Database = require("better-sqlite3");

export default class DatabaseClientProvider 
{
    /**
     * Database client instance;
     */
    private static _client: Database.Database;

    public static get(): Database.Database 
    {
        return this._client || (this._client = Database(appConfig.database.path, {}));
    }
}