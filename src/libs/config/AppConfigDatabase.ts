import { AWSClientConfig } from "./AWSClientConfig";
/**
 * Database setup in AppConfig.
 */
export class AppConfigDatabase
{
    type: "sqlite" | "postgres" | "dynamodb";
    config: SQLiteClientConfig | PostgresClientConfig | AWSClientConfig;
}
/**
 * Postgres client config
 */
export class PostgresClientConfig
{
    host: string;
    port: number;
    user: string;
    database: string;
    password: string;
}
/**
 * SQLite client config
 */
export class SQLiteClientConfig
{
    path: string;
}